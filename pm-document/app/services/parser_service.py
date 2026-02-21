import logging
import os

logger = logging.getLogger(__name__)


def extract_text(file_path: str) -> str:
    """파일에서 텍스트 추출. PDF, DOCX, TXT 지원."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    elif ext in (".txt", ".md", ".csv"):
        return _extract_text(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _extract_pdf(file_path: str) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(file_path)
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    text = "\n".join(text_parts)
    logger.info("PDF extracted: %d chars from %s", len(text), file_path)
    return text


def _extract_docx(file_path: str) -> str:
    from docx import Document

    doc = Document(file_path)
    text = "\n".join(p.text for p in doc.paragraphs)
    logger.info("DOCX extracted: %d chars from %s", len(text), file_path)
    return text


def _extract_text(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    logger.info("Text extracted: %d chars from %s", len(text), file_path)
    return text
