import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.services.chat_service import chat_sync, chat_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    user_id: int = 0
    stream: bool = True
    privacy_mode: str | None = None  # "performance" | "security"
    project_id: int | None = None


class ChatResponse(BaseModel):
    answer: str
    route: str
    execution_id: str
    nodes_executed: list[str]
    documents_used: int
    pii_detected: bool = False
    privacy_mode: str = "performance"


@router.post("/message")
async def chat_message(req: ChatRequest):
    """채팅 메시지 처리. stream=true면 SSE, false면 JSON 응답."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    if req.stream:
        return EventSourceResponse(
            _stream_generator(req.question, req.user_id, req.privacy_mode, req.project_id),
            media_type="text/event-stream",
        )

    result = chat_sync(req.question, req.user_id, privacy_mode=req.privacy_mode, project_id=req.project_id)
    return ChatResponse(
        answer=result["answer"],
        route=result["route"],
        execution_id=result["execution_id"],
        nodes_executed=result["nodes_executed"],
        documents_used=result["documents_used"],
        pii_detected=result.get("pii_detected", False),
        privacy_mode=result.get("privacy_mode", "performance"),
    )


async def _stream_generator(
    question: str,
    user_id: int,
    privacy_mode: str | None = None,
    project_id: int | None = None,
):
    """SSE 이벤트 생성기. privacy 이벤트 타입 포함."""
    try:
        async for event in chat_stream(question, user_id, privacy_mode=privacy_mode, project_id=project_id):
            event_type = event["type"]

            if event_type == "privacy":
                yield {"event": "privacy", "data": json.dumps(event["data"])}
            elif event_type == "token":
                yield {"event": "token", "data": json.dumps({"content": event["data"]})}

        yield {"event": "done", "data": json.dumps({"status": "completed"})}
    except Exception as e:
        logger.error("Stream error: %s", e)
        yield {"event": "error", "data": json.dumps({"error": str(e)})}
