import logging
import uuid
from collections.abc import AsyncIterator

from app.graphs.adaptive_rag import run_adaptive_rag
from app.chains.rag_chain import stream_rag, stream_general
from app.graphs.nodes.router_node import route_question
from app.graphs.states.rag_state import RAGState
from app.kafka.producer import publish_event

logger = logging.getLogger(__name__)


def chat_sync(question: str, user_id: int) -> dict:
    """Adaptive RAG를 사용한 동기 채팅."""
    result = run_adaptive_rag(question, user_id)

    _publish_chat_event(user_id, question, result["answer"], result["route"])

    return result


async def chat_stream(question: str, user_id: int) -> AsyncIterator[str]:
    """라우팅 후 SSE 스트리밍 응답."""
    route = _classify_route(question)

    logger.info("Chat stream: route=%s, question='%s'", route, question[:50])

    full_response = []

    if route == "rag":
        async for chunk in stream_rag(question, user_id):
            full_response.append(chunk)
            yield chunk
    else:
        async for chunk in stream_general(question):
            full_response.append(chunk)
            yield chunk

    _publish_chat_event(user_id, question, "".join(full_response), route)


def _classify_route(question: str) -> str:
    """질문을 rag/general로 분류."""
    state: RAGState = {
        "question": question,
        "user_id": 0,
        "route": "",
        "documents": [],
        "relevant_documents": [],
        "generation": "",
        "retry_count": 0,
        "max_retries": 2,
        "execution_id": "",
        "nodes_executed": [],
    }
    result = route_question(state)
    return result["route"]


def _publish_chat_event(user_id: int, question: str, answer: str, route: str) -> None:
    """Kafka로 채팅 이벤트 발행."""
    try:
        publish_event("workflow-events", {
            "type": "CHAT_COMPLETED",
            "userId": user_id,
            "question": question[:200],
            "answerLength": len(answer),
            "route": route,
            "eventId": str(uuid.uuid4()),
        })
    except Exception as e:
        logger.warning("Failed to publish chat event: %s", e)
