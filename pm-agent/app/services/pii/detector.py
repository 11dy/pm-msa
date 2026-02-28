"""Ollama 기반 PII 감지. Ollama 불가 시 한국어 정규식 fallback."""

import json
import logging
import re
from dataclasses import dataclass, field

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PIIEntity:
    text: str
    category: str
    start: int
    end: int


@dataclass
class PIIDetectionResult:
    entities: list[PIIEntity] = field(default_factory=list)
    method: str = "none"  # "ollama" | "regex" | "none"

    @property
    def has_pii(self) -> bool:
        return len(self.entities) > 0


# 한국어 PII 정규식 패턴
_REGEX_PATTERNS: dict[str, re.Pattern] = {
    "PHONE": re.compile(
        r"(?:010|011|016|017|018|019|02|031|032|033|041|042|043|044|"
        r"051|052|053|054|055|061|062|063|064)"
        r"[-.\s]?\d{3,4}[-.\s]?\d{4}"
    ),
    "EMAIL": re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
    "ID_NUMBER": re.compile(r"\d{6}[-.\s]?[1-4]\d{6}"),
    "CARD": re.compile(r"\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}"),
    "ACCOUNT": re.compile(r"\d{3,6}[-.\s]?\d{2,6}[-.\s]?\d{2,6}(?:[-.\s]?\d{1,6})?"),
}


class PIIDetector:
    """PII 감지기. Ollama LLM 기반 감지 + regex fallback."""

    def detect(self, text: str) -> PIIDetectionResult:
        """텍스트에서 PII를 감지한다."""
        if not text or not text.strip():
            return PIIDetectionResult()

        if settings.ollama_enabled:
            try:
                return self._ollama_detect(text)
            except Exception as e:
                logger.warning("Ollama PII detection failed, falling back to regex: %s", e)

        if settings.pii_regex_fallback:
            return self._fallback_regex_detect(text)

        return PIIDetectionResult()

    def _ollama_detect(self, text: str) -> PIIDetectionResult:
        """Ollama로 PII 감지."""
        from langchain_ollama import ChatOllama
        from app.services.pii.prompts import PII_DETECTION_SYSTEM, PII_DETECTION_USER

        llm = ChatOllama(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model_pii,
            temperature=0,
        )
        messages = [
            ("system", PII_DETECTION_SYSTEM),
            ("human", PII_DETECTION_USER.format(text=text)),
        ]
        result = llm.invoke(messages)
        content = result.content.strip()

        # JSON 배열 파싱
        json_match = re.search(r"\[.*\]", content, re.DOTALL)
        if not json_match:
            logger.debug("Ollama returned no JSON array, assuming no PII")
            return PIIDetectionResult(method="ollama")

        raw = json.loads(json_match.group())
        entities = []
        for item in raw:
            pii_text = item.get("text", "")
            idx = text.find(pii_text)
            if idx == -1:
                continue
            entities.append(PIIEntity(
                text=pii_text,
                category=item.get("category", "UNKNOWN"),
                start=idx,
                end=idx + len(pii_text),
            ))

        logger.info("Ollama PII detection: found %d entities", len(entities))
        return PIIDetectionResult(entities=entities, method="ollama")

    def _fallback_regex_detect(self, text: str) -> PIIDetectionResult:
        """한국어 정규식 기반 PII 감지 (fallback)."""
        entities: list[PIIEntity] = []

        for category, pattern in _REGEX_PATTERNS.items():
            for match in pattern.finditer(text):
                entities.append(PIIEntity(
                    text=match.group(),
                    category=category,
                    start=match.start(),
                    end=match.end(),
                ))

        # 중복/겹침 제거 (더 긴 매치 우선)
        entities.sort(key=lambda e: (e.start, -(e.end - e.start)))
        filtered: list[PIIEntity] = []
        last_end = -1
        for entity in entities:
            if entity.start >= last_end:
                filtered.append(entity)
                last_end = entity.end

        if filtered:
            logger.info("Regex PII detection: found %d entities", len(filtered))

        return PIIDetectionResult(entities=filtered, method="regex")
