"""PII 마스킹 그래프 노드."""

import logging

from app.config import settings
from app.graphs.states.rag_state import RAGState
from app.services.pii.masker import PIIMasker

logger = logging.getLogger(__name__)

_masker = PIIMasker()


def mask_question(state: RAGState) -> RAGState:
    """사용자 질문에서 PII를 감지하고 마스킹.

    pii_masking_enabled=False이면 원본을 그대로 통과시킨다.
    """
    question = state["question"]
    execution_id = state.get("execution_id", "")

    if not settings.pii_masking_enabled:
        return {
            **state,
            "original_question": question,
            "pii_mask_mapping": {},
            "pii_categories": {},
            "pii_detected": False,
            "nodes_executed": state["nodes_executed"] + ["mask"],
        }

    masked_text, mapping = _masker.mask(question, request_id=execution_id)

    logger.info(
        "PII mask: execution=%s, detected=%s, entities=%d",
        execution_id[:8] if execution_id else "N/A",
        mapping.pii_detected,
        len(mapping.mappings),
    )

    return {
        **state,
        "original_question": question,
        "question": masked_text,
        "pii_mask_mapping": mapping.mappings,
        "pii_categories": mapping.categories,
        "pii_detected": mapping.pii_detected,
        "nodes_executed": state["nodes_executed"] + ["mask"],
    }
