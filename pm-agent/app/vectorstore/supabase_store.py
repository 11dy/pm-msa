import logging

from app.config import settings

logger = logging.getLogger(__name__)


def store_embeddings(
    document_id: int,
    user_id: int,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> int:
    """Supabase document_chunks 테이블에 임베딩 저장. 설정 미완시 건너뜀."""
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — skipping vector storage for document %d", document_id)
        return len(embeddings)

    from supabase import create_client

    client = create_client(settings.supabase_url, settings.supabase_key)
    stored = 0

    for chunk, embedding in zip(chunks, embeddings):
        row = {
            "document_id": document_id,
            "user_id": user_id,
            "chunk_index": chunk["index"],
            "content": chunk["content"],
            "embedding": embedding,
        }
        client.table("document_chunks").insert(row).execute()
        stored += 1

    logger.info("Stored %d embeddings for document %d in Supabase", stored, document_id)
    return stored
