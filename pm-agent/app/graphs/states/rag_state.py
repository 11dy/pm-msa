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
