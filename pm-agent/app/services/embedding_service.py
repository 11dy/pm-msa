import logging

from app.config import settings
from app.llm import get_embedding_model

logger = logging.getLogger(__name__)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Model Factory를 통해 텍스트 임베딩 생성.

    Performance mode → OpenAI text-embedding-3-small
    Security mode → Ollama BGE-M3
    """
    embedding_model = get_embedding_model()
    all_embeddings: list[list[float]] = []
    batch_size = settings.embedding_batch_size

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_embeddings = embedding_model.embed_documents(batch)
        all_embeddings.extend(batch_embeddings)
        logger.info("Embeddings generated: batch %d-%d / %d",
                     i, min(i + batch_size, len(texts)), len(texts))

    return all_embeddings
