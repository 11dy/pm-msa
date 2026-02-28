import logging

from app.llm import get_llm, TaskType
from app.prompts.rag_prompt import REWRITER_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def rewrite_query(state: RAGState) -> RAGState:
    """관련 문서가 없을 때 쿼리를 재작성."""
    question = state["question"]
    privacy_mode = state.get("privacy_mode")

    llm = get_llm(TaskType.REWRITING, privacy_mode=privacy_mode)
    chain = REWRITER_PROMPT | llm
    result = chain.invoke({"question": question})

    rewritten = result.content.strip()
    logger.info("Query rewritten: '%s' → '%s'", question[:30], rewritten[:30])

    return {
        **state,
        "question": rewritten,
        "retry_count": state["retry_count"] + 1,
        "nodes_executed": state["nodes_executed"] + ["rewriter"],
    }
