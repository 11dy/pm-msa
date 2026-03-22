"""PII 언마스킹 그래프 노드."""

import logging

from app.graphs.states.rag_state import RAGState
from app.services.pii.masker import PIIMasker, MaskMapping

logger = logging.getLogger(__name__)

_masker = PIIMasker()


def unmask_response(state: RAGState) -> RAGState:
    """LLM 응답에서 [MASK_N] 토큰을 원본 PII로 복원.

    질문 PII 매핑 + 문서 PII 매핑을 모두 합쳐서 언마스킹.
    """
    generation = state.get("generation", "")
    question_pii_detected = state.get("pii_detected", False)
    doc_pii_mappings = state.get("document_pii_mappings", [])

    has_question_pii = question_pii_detected and state.get("pii_mask_mapping")
    has_doc_pii = bool(doc_pii_mappings)

    if not has_question_pii and not has_doc_pii:
        return {
            **state,
            "nodes_executed": state["nodes_executed"] + ["unmask"],
        }

    # 질문 PII 매핑
    merged_mappings = {}
    merged_categories = {}
    if has_question_pii:
        merged_mappings.update(state["pii_mask_mapping"])
        merged_categories.update(state.get("pii_categories", {}))

    # 문서 PII 매핑 병합
    for doc_mapping in doc_pii_mappings:
        doc_maps = doc_mapping.get("mappings", {})
        doc_cats = doc_mapping.get("categories", {})
        merged_mappings.update(doc_maps)
        merged_categories.update(doc_cats)

    mapping = MaskMapping(
        mappings=merged_mappings,
        categories=merged_categories,
        pii_detected=True,
    )

    unmasked = _masker.unmask(generation, mapping)

    logger.info(
        "PII unmask: execution=%s, question_tokens=%d, doc_tokens=%d",
        state.get("execution_id", "")[:8],
        len(state.get("pii_mask_mapping", {})),
        sum(len(m.get("mappings", {})) for m in doc_pii_mappings),
    )

    return {
        **state,
        "generation": unmasked,
        "nodes_executed": state["nodes_executed"] + ["unmask"],
    }
