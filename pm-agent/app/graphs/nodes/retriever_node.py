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

    return {
        **state,
        "documents": docs,
        "nodes_executed": state["nodes_executed"] + ["retriever"],
    }
