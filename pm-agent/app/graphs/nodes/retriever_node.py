import logging

from app.retrievers.supabase_retriever import retrieve_relevant_docs
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def retrieve_documents(state: RAGState) -> RAGState:
    """Supabase pgvector에서 관련 문서 검색."""
    question = state["question"]
    user_id = state["user_id"]

    docs = retrieve_relevant_docs(question, user_id)
    logger.info("Retrieved %d documents for: '%s'", len(docs), question[:50])

    # 검색된 문서들의 PII 매핑 수집
    doc_pii_mappings = []
    for doc in docs:
        pii_mapping = doc.metadata.get("pii_mapping")
        if pii_mapping:
            doc_pii_mappings.append(pii_mapping)

    return {
        **state,
        "documents": docs,
        "document_pii_mappings": doc_pii_mappings,
        "nodes_executed": state["nodes_executed"] + ["retriever"],
    }
