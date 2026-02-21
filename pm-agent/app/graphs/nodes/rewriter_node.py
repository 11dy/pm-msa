import logging

from langchain_openai import ChatOpenAI

from app.config import settings
from app.prompts.rag_prompt import REWRITER_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def rewrite_query(state: RAGState) -> RAGState:
    """관련 문서가 없을 때 쿼리를 재작성."""
    question = state["question"]

    llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.3)
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
