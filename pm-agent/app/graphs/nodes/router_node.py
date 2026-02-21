import logging

from langchain_openai import ChatOpenAI

from app.config import settings
from app.prompts.rag_prompt import ROUTER_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def route_question(state: RAGState) -> RAGState:
    """질문을 분류: rag(문서 검색 필요) / general(일반 대화)."""
    question = state["question"]

    llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0)
    chain = ROUTER_PROMPT | llm
    result = chain.invoke({"question": question})

    route = result.content.strip().lower()
    if route not in ("rag", "general"):
        route = "rag"  # 판단 불확실하면 검색 수행

    logger.info("Route decided: question='%s' → %s", question[:50], route)
    return {
        **state,
        "route": route,
        "nodes_executed": state["nodes_executed"] + ["router"],
    }
