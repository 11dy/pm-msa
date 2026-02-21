import logging

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.models.schemas import Chunk

logger = logging.getLogger(__name__)


def chunk_text(text: str) -> list[Chunk]:
    """텍스트를 청크로 분할."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
    )

    splits = splitter.split_text(text)
    chunks = [Chunk(index=i, content=c) for i, c in enumerate(splits)]
    logger.info("Text chunked: %d chunks (chunk_size=%d, overlap=%d)",
                len(chunks), settings.chunk_size, settings.chunk_overlap)
    return chunks
