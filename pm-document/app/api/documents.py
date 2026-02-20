import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.models.schemas import DocumentResponse
from app.services import document_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents")


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user),
):
    try:
        doc = await document_service.upload_document(user_id, file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Upload failed: %s", e)
        raise HTTPException(status_code=500, detail="Upload failed")

    # 백그라운드로 파싱 + 청킹
    background_tasks.add_task(
        document_service.process_document,
        document_id=doc.id,
        user_id=user_id,
        storage_path=doc.storagePath,
    )

    return doc
