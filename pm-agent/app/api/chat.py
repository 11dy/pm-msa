import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.services.chat_service import chat_sync, chat_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    user_id: int = 0
    stream: bool = True


class ChatResponse(BaseModel):
    answer: str
    route: str
    execution_id: str
    nodes_executed: list[str]
    documents_used: int


@router.post("/message")
async def chat_message(req: ChatRequest):
    """채팅 메시지 처리. stream=true면 SSE, false면 JSON 응답."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요.")

    if req.stream:
        return EventSourceResponse(
            _stream_generator(req.question, req.user_id),
            media_type="text/event-stream",
        )

    result = chat_sync(req.question, req.user_id)
    return ChatResponse(
        answer=result["answer"],
        route=result["route"],
        execution_id=result["execution_id"],
        nodes_executed=result["nodes_executed"],
        documents_used=result["documents_used"],
    )


async def _stream_generator(question: str, user_id: int):
    """SSE 이벤트 생성기."""
    try:
        async for chunk in chat_stream(question, user_id):
            yield {"event": "token", "data": json.dumps({"content": chunk})}
        yield {"event": "done", "data": json.dumps({"status": "completed"})}
    except Exception as e:
        logger.error("Stream error: %s", e)
        yield {"event": "error", "data": json.dumps({"error": str(e)})}
