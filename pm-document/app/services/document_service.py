import logging
import os

import httpx
from fastapi import UploadFile

from app.config import settings
from app.kafka.producer import publish_event
from app.models.schemas import DocumentRegisterRequest, DocumentResponse
from app.services import chunker_service, parser_service, storage_service

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx", ".xls", ".hwp"}
DOCUMENT_EVENTS_TOPIC = "pm.document.events"


async def upload_document(user_id: int, file: UploadFile, project_id: int | None = None) -> DocumentResponse:
    """파일 업로드 → pm-workflow 등록 → Kafka 이벤트 발행."""
    original_filename = file.filename or "unknown"
    ext = os.path.splitext(original_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

    # 1. 로컬 저장
    storage_path, unique_name, file_size = await storage_service.save_file(user_id, file)

    # 2. pm-workflow 내부 API 호출 → documentId 획득
    register_request = DocumentRegisterRequest(
        userId=user_id,
        projectId=project_id,
        filename=unique_name,
        originalFilename=original_filename,
        fileType=ext.lstrip("."),
        fileSize=file_size,
        storagePath=storage_path,
    )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{settings.pm_workflow_url}/api/documents/internal/register",
            json=register_request.model_dump(),
        )
        resp.raise_for_status()
        doc_response = DocumentResponse(**resp.json())

    document_id = doc_response.id
    logger.info("Document registered: id=%d, file=%s", document_id, original_filename)

    # 3. pm-resource에 project_document 등록 (project_id가 있을 때만)
    if project_id is not None:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    f"{settings.pm_resource_url}/api/project-document/internal/register",
                    json={
                        "projectId": project_id,
                        "documentId": document_id,
                        "originalFilename": original_filename,
                        "fileType": ext.lstrip("."),
                        "fileSize": file_size,
                    },
                )
            logger.info("ProjectDocument registered: projectId=%s, documentId=%d", project_id, document_id)
        except Exception as e:
            logger.warning("Failed to register project_document (non-fatal): %s", e)

    # 4. document.uploaded 이벤트 발행
    publish_event(DOCUMENT_EVENTS_TOPIC, {
        "type": "document.uploaded",
        "documentId": document_id,
        "userId": user_id,
        "fileType": ext.lstrip("."),
        "storagePath": storage_path,
    })

    return doc_response


async def process_document(document_id: int, user_id: int, storage_path: str, project_id: int | None = None) -> None:
    """백그라운드: 파싱 → 청킹 → Kafka 이벤트 발행."""
    try:
        # 1. 텍스트 추출
        text = parser_service.extract_text(storage_path)

        if not text.strip():
            raise ValueError("No text extracted from document")

        # 2. 청킹
        chunks = chunker_service.chunk_text(text)

        # 3. document.chunked 이벤트 발행
        event = {
            "type": "document.chunked",
            "documentId": document_id,
            "userId": user_id,
            "chunks": [c.model_dump() for c in chunks],
        }
        if project_id is not None:
            event["projectId"] = project_id
        publish_event(DOCUMENT_EVENTS_TOPIC, event)

        logger.info("Document processed: id=%d, chunks=%d", document_id, len(chunks))

    except Exception as e:
        logger.error("Document processing failed: id=%d, error=%s", document_id, e)
        publish_event(DOCUMENT_EVENTS_TOPIC, {
            "type": "document.failed",
            "documentId": document_id,
            "error": str(e),
            "stage": "parsing",
        })
