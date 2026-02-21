"""
Adaptive RAG 워크플로우 (LangGraph)

[질문] → [라우터]
              ├─ general → [일반 응답 생성] → 완료
              └─ rag → [문서 검색] → [관련성 평가]
                            ├─ 관련 있음 → [RAG 응답 생성] → 완료
                            └─ 관련 없음 + 재시도 < 2 → [쿼리 재작성] → [문서 검색]
                            └─ 관련 없음 + 재시도 >= 2 → [일반 응답 생성] → 완료
"""
import logging
import uuid

from langgraph.graph import StateGraph, END

from app.graphs.states.rag_state import RAGState
from app.graphs.nodes.router_node import route_question
from app.graphs.nodes.retriever_node import retrieve_documents
from app.graphs.nodes.grader_node import grade_documents
from app.graphs.nodes.generator_node import generate_rag_response, generate_general_response
from app.graphs.nodes.rewriter_node import rewrite_query

logger = logging.getLogger(__name__)


def _route_after_router(state: RAGState) -> str:
    return "retrieve" if state["route"] == "rag" else "generate_general"


def _route_after_grader(state: RAGState) -> str:
    if state["relevant_documents"]:
        return "generate_rag"
    if state["retry_count"] < state["max_retries"]:
        return "rewrite"
    return "generate_general"


def build_adaptive_rag_graph() -> StateGraph:
    graph = StateGraph(RAGState)

    graph.add_node("router", route_question)
    graph.add_node("retrieve", retrieve_documents)
    graph.add_node("grader", grade_documents)
    graph.add_node("generate_rag", generate_rag_response)
    graph.add_node("generate_general", generate_general_response)
    graph.add_node("rewrite", rewrite_query)

    graph.set_entry_point("router")

    graph.add_conditional_edges("router", _route_after_router, {
        "retrieve": "retrieve",
        "generate_general": "generate_general",
    })
    graph.add_edge("retrieve", "grader")
    graph.add_conditional_edges("grader", _route_after_grader, {
        "generate_rag": "generate_rag",
        "rewrite": "rewrite",
        "generate_general": "generate_general",
    })
    graph.add_edge("rewrite", "retrieve")
    graph.add_edge("generate_rag", END)
    graph.add_edge("generate_general", END)

    return graph.compile()


# 컴파일된 그래프 (싱글턴)
adaptive_rag = build_adaptive_rag_graph()


def run_adaptive_rag(question: str, user_id: int) -> dict:
    """Adaptive RAG 워크플로우 실행."""
    execution_id = str(uuid.uuid4())

    initial_state: RAGState = {
        "question": question,
        "user_id": user_id,
        "route": "",
        "documents": [],
        "relevant_documents": [],
        "generation": "",
        "retry_count": 0,
        "max_retries": 2,
        "execution_id": execution_id,
        "nodes_executed": [],
    }

    result = adaptive_rag.invoke(initial_state)

    logger.info(
        "Adaptive RAG completed: execution=%s, nodes=%s",
        execution_id,
        result["nodes_executed"],
    )

    return {
        "execution_id": execution_id,
        "answer": result["generation"],
        "route": result["route"],
        "nodes_executed": result["nodes_executed"],
        "documents_used": len(result.get("relevant_documents") or result.get("documents", [])),
    }
