from typing import TypedDict

from langchain_core.documents import Document


class RAGState(TypedDict):
    question: str
    user_id: int
    route: str  # "rag" | "general"
    documents: list[Document]
    relevant_documents: list[Document]
    generation: str
    retry_count: int
    max_retries: int
    # 워크플로우 추적
    execution_id: str
    nodes_executed: list[str]
    # PII 마스킹 (Phase 5: Privacy-Preserving)
    original_question: str      # 마스킹 전 원본
    pii_mask_mapping: dict      # [MASK_N] → 원본값
    pii_categories: dict        # [MASK_N] → 카테고리
    pii_detected: bool
    privacy_mode: str           # "performance" | "security"
    # 문서 PII 매핑 (검색된 문서들의 pii_mapping 목록)
    document_pii_mappings: list[dict]
