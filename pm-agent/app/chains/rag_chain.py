import logging
from collections.abc import AsyncIterator
from typing import Any

from langchain_core.documents import Document

from app.llm import get_llm, TaskType
from app.prompts.rag_prompt import RAG_PROMPT, GENERAL_PROMPT
from app.retrievers.supabase_retriever import retrieve_relevant_docs

logger = logging.getLogger(__name__)


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

    llm = get_llm(TaskType.GENERATION)
    chain = RAG_PROMPT | llm
    result = chain.invoke({"context": context, "question": question})
    return result.content


def invoke_general(question: str) -> str:
    """일반 질문: LLM 직접 응답 (동기)."""
    llm = get_llm(TaskType.GENERATION)
    chain = GENERAL_PROMPT | llm
    result = chain.invoke({"question": question})
    return result.content


async def stream_rag(
    question: str,
    user_id: int,
    doc_pii_callback: Any = None,
) -> AsyncIterator[str]:
    """Naive RAG: 검색 → 컨텍스트 조합 → LLM 스트리밍.

    Args:
        doc_pii_callback: 호출 시 검색된 문서의 PII 매핑 목록을 전달받는 콜백.
    """
    docs = retrieve_relevant_docs(question, user_id)
    context = _format_context(docs)

    # 문서 PII 매핑 수집 및 콜백
    if doc_pii_callback is not None:
        doc_pii_mappings = [
            doc.metadata["pii_mapping"]
            for doc in docs
            if doc.metadata.get("pii_mapping")
        ]
        doc_pii_callback(doc_pii_mappings)

    llm = get_llm(TaskType.GENERATION, streaming=True)
    chain = RAG_PROMPT | llm

    async for chunk in chain.astream({"context": context, "question": question}):
        if chunk.content:
            yield chunk.content


async def stream_general(question: str) -> AsyncIterator[str]:
    """일반 질문: LLM 스트리밍."""
    llm = get_llm(TaskType.GENERATION, streaming=True)
    chain = GENERAL_PROMPT | llm

    async for chunk in chain.astream({"question": question}):
        if chunk.content:
            yield chunk.content
