import logging
import os
import uuid

from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger(__name__)


async def save_file(user_id: int, file: UploadFile) -> tuple[str, str, int]:
    """파일을 로컬 저장소에 저장하고 (저장경로, 고유파일명, 파일크기) 반환."""
    user_dir = os.path.join(settings.upload_dir, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "file")[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(user_dir, unique_name)

    content = await file.read()
    file_size = len(content)

    with open(file_path, "wb") as f:
        f.write(content)

    logger.info("File saved: %s (%d bytes)", file_path, file_size)
    return file_path, unique_name, file_size


def delete_file(storage_path: str) -> None:
    """저장된 파일 삭제."""
    try:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            logger.info("File deleted: %s", storage_path)
    except Exception as e:
        logger.error("Failed to delete file %s: %s", storage_path, e)
