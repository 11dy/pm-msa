"""Ollama 헬스체크."""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_ollama_healthy: bool | None = None


async def check_ollama_health() -> bool:
    """Ollama 서버 상태를 비동기로 확인."""
    global _ollama_healthy
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            _ollama_healthy = resp.status_code == 200
    except Exception:
        _ollama_healthy = False
    return _ollama_healthy


def check_ollama_health_sync() -> bool:
    """Ollama 서버 상태를 동기로 확인."""
    global _ollama_healthy
    try:
        resp = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=3.0)
        _ollama_healthy = resp.status_code == 200
    except Exception:
        _ollama_healthy = False
    return _ollama_healthy


def is_ollama_available() -> bool:
    """마지막 헬스체크 결과 반환. 없으면 동기 체크."""
    if _ollama_healthy is None:
        return check_ollama_health_sync()
    return _ollama_healthy
