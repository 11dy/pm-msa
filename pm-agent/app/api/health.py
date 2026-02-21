from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "UP",
        "service": "pm-agent",
        "openai_configured": bool(settings.openai_api_key),
        "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
    }
