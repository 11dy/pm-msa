import logging

from langchain_openai import ChatOpenAI

from app.config import settings
from app.prompts.rag_prompt import RAG_PROMPT, GENERAL_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def _format_context(docs: list) -> str:
    if not docs:
        return "관련 문서를 찾을 수 없습니다."
    parts = []
    for i, doc in enumerate(docs, 1):
        similarity = doc.metadata.get("similarity", 0)
        parts.append(f"[문서 {i}] (유사도: {similarity:.2f})\n{doc.page_content}")
    return "\n\n".join(parts)


def generate_rag_response(state: RAGState) -> RAGState:
    """검색된 문서 기반으로 LLM 응답 생성."""
    question = state["question"]
    docs = state.get("relevant_documents") or state.get("documents", [])
    context = _format_context(docs)

    llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key, temperature=0.7)
    chain = RAG_PROMPT | llm
    result = chain.invoke({"context": context, "question": question})

    logger.info("Generated RAG response for: '%s'", question[:50])
    return {
        **state,
        "generation": result.content,
        "nodes_executed": state["nodes_executed"] + ["generator"],
    }


def generate_general_response(state: RAGState) -> RAGState:
    """일반 질문에 대한 LLM 직접 응답."""
    question = state["question"]

    llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key, temperature=0.7)
    chain = GENERAL_PROMPT | llm
    result = chain.invoke({"question": question})

    logger.info("Generated general response for: '%s'", question[:50])
    return {
        **state,
        "generation": result.content,
        "nodes_executed": state["nodes_executed"] + ["generator"],
    }
