import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """OpenAI API로 텍스트 임베딩 생성. batch_size 단위로 처리."""
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY not configured")

    client = OpenAI(api_key=settings.openai_api_key)
    all_embeddings: list[list[float]] = []
    batch_size = settings.embedding_batch_size

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(
            model=settings.openai_embedding_model,
            input=batch,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)
        logger.info("Embeddings generated: batch %d-%d / %d",
                     i, min(i + batch_size, len(texts)), len(texts))

    return all_embeddings
