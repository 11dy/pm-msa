import logging
from collections.abc import AsyncIterator

from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

from app.config import settings
from app.prompts.rag_prompt import RAG_PROMPT, GENERAL_PROMPT
from app.retrievers.supabase_retriever import retrieve_relevant_docs

logger = logging.getLogger(__name__)


def _get_llm(streaming: bool = False) -> ChatOpenAI:
    return ChatOpenAI(
        model="gpt-4o",
        api_key=settings.openai_api_key,
        temperature=0.7,
        streaming=streaming,
    )


def _format_context(docs: list[Document]) -> str:
    if not docs:
        return "관련 문서를 찾을 수 없습니다."
    parts = []
    for i, doc in enumerate(docs, 1):
        similarity = doc.metadata.get("similarity", 0)
        parts.append(f"[문서 {i}] (유사도: {similarity:.2f})\n{doc.page_content}")
    return "\n\n".join(parts)


def invoke_rag(question: str, user_id: int) -> str:
    """Naive RAG: 검색 → 컨텍스트 조합 → LLM 응답 (동기)."""
    docs = retrieve_relevant_docs(question, user_id)
    context = _format_context(docs)

    llm = _get_llm()
    chain = RAG_PROMPT | llm
    result = chain.invoke({"context": context, "question": question})
    return result.content


def invoke_general(question: str) -> str:
    """일반 질문: LLM 직접 응답 (동기)."""
    llm = _get_llm()
    chain = GENERAL_PROMPT | llm
    result = chain.invoke({"question": question})
    return result.content


async def stream_rag(question: str, user_id: int) -> AsyncIterator[str]:
    """Naive RAG: 검색 → 컨텍스트 조합 → LLM 스트리밍."""
    docs = retrieve_relevant_docs(question, user_id)
    context = _format_context(docs)

    llm = _get_llm(streaming=True)
    chain = RAG_PROMPT | llm

    async for chunk in chain.astream({"context": context, "question": question}):
        if chunk.content:
            yield chunk.content


async def stream_general(question: str) -> AsyncIterator[str]:
    """일반 질문: LLM 스트리밍."""
    llm = _get_llm(streaming=True)
    chain = GENERAL_PROMPT | llm

    async for chunk in chain.astream({"question": question}):
        if chunk.content:
            yield chunk.content
