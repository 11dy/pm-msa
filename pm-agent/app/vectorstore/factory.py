"""벡터스토어 라우팅 팩토리. Supabase 또는 로컬 pgvector 선택."""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


def store_embeddings(
    document_id: int,
    user_id: int,
    chunks: list[dict],
    embeddings: list[list[float]],
    project_id: int | None = None,
) -> int:
    """설정에 따라 적절한 벡터스토어에 임베딩 저장."""
    if settings.use_local_vectorstore:
        from app.vectorstore.local_pgvector import store_embeddings as local_store
        logger.debug("Storing embeddings in local pgvector")
        return local_store(document_id, user_id, chunks, embeddings, project_id=project_id)

    from app.vectorstore.supabase_store import store_embeddings as supabase_store
    logger.debug("Storing embeddings in Supabase")
    return supabase_store(document_id, user_id, chunks, embeddings, project_id=project_id)
