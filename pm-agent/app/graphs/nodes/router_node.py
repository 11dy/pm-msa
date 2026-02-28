import logging

from app.llm import get_llm, TaskType
from app.prompts.rag_prompt import ROUTER_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def route_question(state: RAGState) -> RAGState:
    """질문을 분류: rag(문서 검색 필요) / general(일반 대화)."""
    question = state["question"]
    privacy_mode = state.get("privacy_mode")

    llm = get_llm(TaskType.ROUTING, privacy_mode=privacy_mode)
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
