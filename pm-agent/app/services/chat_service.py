import logging
import uuid
from collections.abc import AsyncIterator

from app.config import settings
from app.graphs.adaptive_rag import run_adaptive_rag
from app.chains.rag_chain import stream_rag, stream_general
from app.graphs.nodes.router_node import route_question
from app.graphs.states.rag_state import RAGState
from app.kafka.producer import publish_event
from app.services.pii.masker import PIIMasker, MaskMapping

logger = logging.getLogger(__name__)

_masker = PIIMasker()


def chat_sync(
    question: str,
    user_id: int,
    privacy_mode: str | None = None,
) -> dict:
    """Adaptive RAG를 사용한 동기 채팅."""
    result = run_adaptive_rag(question, user_id, privacy_mode=privacy_mode)

    _publish_chat_event(user_id, question, result["answer"], result["route"])

    return result


async def chat_stream(
    question: str,
    user_id: int,
    privacy_mode: str | None = None,
) -> AsyncIterator[dict]:
    """라우팅 후 SSE 스트리밍 응답. PII 마스킹/언마스킹 적용.

    Yields:
        dict with keys: type ("token" | "privacy" | "done"), data
    """
    mode = privacy_mode or settings.privacy_mode

    # PII 마스킹
    masked_question = question
    mask_mapping = MaskMapping()

    if settings.pii_masking_enabled:
        masked_question, mask_mapping = _masker.mask(question)
        if mask_mapping.pii_detected:
            yield {
                "type": "privacy",
                "data": {
                    "pii_detected": True,
                    "masked_count": len(mask_mapping.mappings),
                    "categories": list(set(mask_mapping.categories.values())),
                    "privacy_mode": mode,
                },
            }

    # 라우팅 (마스킹된 질문 사용)
    route = _classify_route(masked_question, privacy_mode=mode)
    logger.info("Chat stream: route=%s, question='%s', pii=%s", route, question[:50], mask_mapping.pii_detected)

    full_response = []
    unmask_buffer = ""

    # 문서 PII 매핑 수집용
    doc_pii_mappings: list[dict] = []

    if route == "rag":
        def _on_doc_pii(mappings: list[dict]) -> None:
            doc_pii_mappings.extend(mappings)

        stream = stream_rag(masked_question, user_id, doc_pii_callback=_on_doc_pii)
    else:
        stream = stream_general(masked_question)

    # 질문 PII + 문서 PII 매핑 병합
    combined_mapping = MaskMapping(
        mappings=dict(mask_mapping.mappings),
        categories=dict(mask_mapping.categories),
        pii_detected=mask_mapping.pii_detected,
    )

    # stream_rag의 첫 번째 chunk를 가져온 후 문서 PII 매핑을 병합
    # (retrieve_relevant_docs가 첫 yield 전에 완료되므로 콜백이 이미 호출됨)
    first_chunk = True

    async for chunk in stream:
        if first_chunk:
            # 문서 PII 매핑 병합
            for doc_mapping in doc_pii_mappings:
                combined_mapping.mappings.update(doc_mapping.get("mappings", {}))
                combined_mapping.categories.update(doc_mapping.get("categories", {}))
            if doc_pii_mappings:
                combined_mapping.pii_detected = True
            first_chunk = False

        if combined_mapping.pii_detected:
            output, unmask_buffer = _masker.unmask_stream_chunk(
                chunk, combined_mapping, unmask_buffer
            )
            if output:
                full_response.append(output)
                yield {"type": "token", "data": output}
        else:
            full_response.append(chunk)
            yield {"type": "token", "data": chunk}

    # 버퍼에 남은 내용 flush
    if unmask_buffer:
        unmasked = _masker.unmask(unmask_buffer, combined_mapping)
        full_response.append(unmasked)
        yield {"type": "token", "data": unmasked}

    _publish_chat_event(user_id, question, "".join(full_response), route)


def _classify_route(question: str, privacy_mode: str | None = None) -> str:
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
        "original_question": "",
        "pii_mask_mapping": {},
        "pii_categories": {},
        "pii_detected": False,
        "privacy_mode": privacy_mode or settings.privacy_mode,
        "document_pii_mappings": [],
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
