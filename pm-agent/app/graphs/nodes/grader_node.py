import logging

from langchain_openai import ChatOpenAI
from langchain_core.documents import Document

from app.config import settings
from app.prompts.rag_prompt import GRADER_PROMPT
from app.graphs.states.rag_state import RAGState

logger = logging.getLogger(__name__)


def grade_documents(state: RAGState) -> RAGState:
    """검색된 문서의 관련성 평가. 관련 문서만 필터링."""
    question = state["question"]
    documents = state["documents"]

    if not documents:
        return {
            **state,
            "relevant_documents": [],
            "nodes_executed": state["nodes_executed"] + ["grader"],
        }

    llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0)
    chain = GRADER_PROMPT | llm

    relevant: list[Document] = []
    for doc in documents:
        result = chain.invoke({
            "question": question,
            "document": doc.page_content[:500],
        })
        grade = result.content.strip().lower()
        if grade == "yes":
            relevant.append(doc)

    logger.info("Grading: %d/%d documents relevant", len(relevant), len(documents))
    return {
        **state,
        "relevant_documents": relevant,
        "nodes_executed": state["nodes_executed"] + ["grader"],
    }
