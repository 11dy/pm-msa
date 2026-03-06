import logging
from typing import Any

from langchain_core.documents import Document

from app.config import settings

logger = logging.getLogger(__name__)


def search_documents(
    query_embedding: list[float],
    user_id: int,
    match_threshold: float = 0.5,
    match_count: int = 5,
    document_ids: list[int] | None = None,
    project_id: int | None = None,
) -> list[Document]:
    """Supabase pgvector에서 유사도 검색 수행."""
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — returning empty results")
        return []

    from supabase import create_client

    client = create_client(settings.supabase_url, settings.supabase_key)

    params: dict[str, Any] = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": match_count,
        "filter_user_id": user_id,
    }
    if document_ids:
        params["filter_document_ids"] = document_ids
    if project_id is not None:
        params["filter_project_id"] = project_id

    result = client.rpc("match_document_chunks", params).execute()

    docs = []
    for row in result.data or []:
        docs.append(Document(
            page_content=row["content"],
            metadata={
                "id": row["id"],
                "document_id": row["document_id"],
                "similarity": row["similarity"],
                "pii_mapping": row.get("pii_mapping"),
            },
        ))

    logger.info("Retrieved %d documents (threshold=%.2f)", len(docs), match_threshold)
    return docs


def retrieve_relevant_docs(
    query: str,
    user_id: int,
    match_count: int = 5,
    document_ids: list[int] | None = None,
    project_id: int | None = None,
) -> list[Document]:
    """쿼리 텍스트로 관련 문서 검색. 임베딩 생성 → 벡터 검색."""
    from app.services.embedding_service import generate_embeddings

    embeddings = generate_embeddings([query])
    if not embeddings:
        return []

    return search_documents(
        query_embedding=embeddings[0],
        user_id=user_id,
        match_count=match_count,
        document_ids=document_ids,
        project_id=project_id,
    )
