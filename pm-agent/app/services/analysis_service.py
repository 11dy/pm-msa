"""문서 자동 분석 서비스: 임베딩 완료 후 질문 자동 생성."""

import json
import logging

from app.config import settings
from app.kafka.producer import publish_event
from app.llm import get_llm, TaskType
from app.prompts.analysis_prompt import DOCUMENT_QUESTION_PROMPT, CROSS_REFERENCE_PROMPT
from app.retrievers.supabase_retriever import retrieve_relevant_docs
from app.services.pii.masker import PIIMasker

logger = logging.getLogger(__name__)

DOCUMENT_EVENTS_TOPIC = "pm.document.events"

_masker = PIIMasker()


def generate_auto_analysis(
    document_id: int,
    user_id: int,
    project_id: int | None,
    chunks: list[dict],
) -> None:
    """마스킹된 청크에서 질문 자동 생성 → Kafka 이벤트 발행."""
    # 상위 10개 청크의 내용 결합
    top_chunks = chunks[:10]
    content = "\n\n".join(c["content"] for c in top_chunks)

    if not content.strip():
        logger.warning("No content for analysis: document=%d", document_id)
        return

    all_questions: list[dict] = []

    # 1. 문서 내용 기반 질문 생성
    try:
        llm = get_llm(TaskType.GENERATION)
        chain = DOCUMENT_QUESTION_PROMPT | llm
        result = chain.invoke({"content": content[:4000]})
        doc_questions = _parse_questions(result.content)
        all_questions.extend(doc_questions)
        logger.info("Generated %d document questions for document %d", len(doc_questions), document_id)
    except Exception as e:
        logger.error("Document question generation failed: document=%d, error=%s", document_id, e)

    # 2. 교차 분석 질문 생성 (기존 문서가 있을 때)
    try:
        existing_docs = retrieve_relevant_docs(
            content[:500], user_id, match_count=3, project_id=project_id,
        )
        if existing_docs:
            existing_content = "\n\n".join(d.page_content[:1000] for d in existing_docs[:3])
            chain = CROSS_REFERENCE_PROMPT | llm
            result = chain.invoke({
                "new_content": content[:2000],
                "existing_content": existing_content,
            })
            cross_questions = _parse_questions(result.content)
            all_questions.extend(cross_questions)
            logger.info("Generated %d cross-reference questions for document %d", len(cross_questions), document_id)
    except Exception as e:
        logger.error("Cross-reference question generation failed: document=%d, error=%s", document_id, e)

    if not all_questions:
        return

    # 3. PII 언마스킹 적용 (청크의 pii_mapping을 병합)
    combined_pii = {}
    for chunk in top_chunks:
        mapping = chunk.get("pii_mapping")
        if mapping and isinstance(mapping, dict):
            combined_pii.update(mapping.get("mappings", {}))

    if combined_pii:
        from app.services.pii.masker import MaskMapping
        unmask_mapping = MaskMapping(mappings=combined_pii, pii_detected=True)
        for q in all_questions:
            q["question"] = _masker.unmask(q["question"], unmask_mapping)

    # 4. Kafka 이벤트 발행
    event = {
        "type": "document.analysis.completed",
        "documentId": document_id,
        "suggestedQuestions": all_questions,
    }
    if project_id is not None:
        event["projectId"] = project_id
    publish_event(DOCUMENT_EVENTS_TOPIC, event)
    logger.info("Published analysis.completed: document=%d, questions=%d", document_id, len(all_questions))


def _parse_questions(llm_output: str) -> list[dict]:
    """LLM 출력에서 JSON 질문 배열 파싱."""
    try:
        text = llm_output.strip()
        # LLM이 markdown code block으로 감쌀 수 있음
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
        questions = json.loads(text)
        if isinstance(questions, list):
            return [q for q in questions if isinstance(q, dict) and "question" in q]
    except (json.JSONDecodeError, IndexError) as e:
        logger.warning("Failed to parse questions from LLM output: %s", e)
    return []
