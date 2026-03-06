"""PII 마스킹 다운로드 API. 파일을 받아 마스킹 문서 + 대조표 ZIP 반환."""

import csv
import io
import logging
import os
import tempfile
import zipfile

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.services.pii.masker import PIIMasker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent/pii")

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx", ".xls", ".hwp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _extract_text(file_path: str) -> str:
    """파일에서 텍스트 추출."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        import fitz
        doc = fitz.open(file_path)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    elif ext == ".docx":
        from docx import Document
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    elif ext in (".txt", ".md", ".csv"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif ext in (".xlsx", ".xls"):
        from openpyxl import load_workbook
        wb = load_workbook(file_path, data_only=True)
        parts = []
        for sheet in wb.sheetnames:
            ws = wb[sheet]
            parts.append(f"[시트: {sheet}]")
            for row in ws.iter_rows(values_only=True):
                cells = [str(c) if c is not None else "" for c in row]
                if any(cells):
                    parts.append("\t".join(cells))
        wb.close()
        return "\n".join(parts)
    elif ext == ".hwp":
        import olefile
        ole = olefile.OleFileIO(file_path)
        parts = []
        if ole.exists("PrvText"):
            parts.append(ole.openstream("PrvText").read().decode("utf-16-le", errors="ignore"))
        elif ole.exists("BodyText/Section0"):
            for entry in ole.listdir():
                if entry[0] == "BodyText":
                    raw = ole.openstream(entry).read()
                    decoded = raw.decode("utf-16-le", errors="ignore")
                    parts.append("".join(c for c in decoded if c.isprintable() or c in "\n\t"))
        ole.close()
        return "\n".join(parts)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


@router.post("/mask")
async def mask_document(file: UploadFile):
    """파일을 PII 마스킹하여 마스킹 문서 + 대조표 ZIP으로 반환."""
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다: {ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 5MB를 초과합니다")

    # 임시 파일로 저장 후 텍스트 추출
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        logger.info("Extracting text: file=%s, ext=%s, size=%d, tmp=%s", filename, ext, len(content), tmp_path)
        text = _extract_text(tmp_path)
        logger.info("Extracted %d chars from %s", len(text), filename)
    except Exception as e:
        logger.error("Text extraction failed: file=%s, error=%s", filename, e, exc_info=True)
        raise HTTPException(status_code=400, detail=f"텍스트 추출 실패: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="파일에서 텍스트를 추출할 수 없습니다")

    # PII 마스킹
    masker = PIIMasker()
    masked_text, mapping = masker.mask(text)

    # ZIP 생성 (마스킹 문서 + 대조표)
    base_name = os.path.splitext(filename)[0]
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # 마스킹 문서
        zf.writestr(f"{base_name}_masked.txt", masked_text)

        # 대조표 CSV
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(["토큰", "원본값", "카테고리"])
        if mapping.pii_detected:
            for token, original in mapping.mappings.items():
                category = mapping.categories.get(token, "UNKNOWN")
                writer.writerow([token, original, category])
        else:
            writer.writerow(["-", "(PII 미감지)", "-"])
        zf.writestr(f"{base_name}_pii_mapping.csv", csv_buffer.getvalue())

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{base_name}_masked.zip"'},
    )
