"""PII mask/unmask 로직. 매핑 테이블 관리."""

import logging
import re
from dataclasses import dataclass, field

from app.services.pii.detector import PIIDetector, PIIDetectionResult

logger = logging.getLogger(__name__)


@dataclass
class MaskMapping:
    """마스킹 매핑 정보. [MASK_N] → 원본값, 카테고리."""
    mappings: dict[str, str] = field(default_factory=dict)      # [MASK_1] → "홍길동"
    categories: dict[str, str] = field(default_factory=dict)    # [MASK_1] → "PERSON"
    detection_method: str = "none"
    pii_detected: bool = False

    def to_dict(self) -> dict:
        return {
            "mappings": self.mappings,
            "categories": self.categories,
            "detection_method": self.detection_method,
            "pii_detected": self.pii_detected,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MaskMapping":
        return cls(
            mappings=data.get("mappings", {}),
            categories=data.get("categories", {}),
            detection_method=data.get("detection_method", "none"),
            pii_detected=data.get("pii_detected", False),
        )


# SSE 스트리밍용 언마스킹 버퍼 패턴
_MASK_TOKEN_PATTERN = re.compile(r"\[MASK_\d+\]")
_PARTIAL_MASK_PATTERN = re.compile(r"\[MASK_\d*$")


class PIIMasker:
    """PII 마스킹/언마스킹 처리기."""

    def __init__(self):
        self._detector = PIIDetector()

    def mask(self, text: str, request_id: str = "") -> tuple[str, MaskMapping]:
        """텍스트의 PII를 [MASK_N] 토큰으로 치환.

        Returns:
            (masked_text, MaskMapping)
        """
        result: PIIDetectionResult = self._detector.detect(text)
        if not result.has_pii:
            return text, MaskMapping(detection_method=result.method)

        mapping = MaskMapping(
            detection_method=result.method,
            pii_detected=True,
        )

        # 뒤에서부터 치환 (인덱스 보존)
        masked = text
        entities = sorted(result.entities, key=lambda e: e.start, reverse=True)
        for i, entity in enumerate(entities, 1):
            mask_token = f"[MASK_{i}]"
            masked = masked[:entity.start] + mask_token + masked[entity.end:]
            mapping.mappings[mask_token] = entity.text
            mapping.categories[mask_token] = entity.category

        logger.info(
            "PII masked: request=%s, entities=%d, method=%s",
            request_id[:8] if request_id else "N/A",
            len(entities),
            result.method,
        )
        return masked, mapping

    def unmask(self, text: str, mapping: MaskMapping) -> str:
        """[MASK_N] 토큰을 원본 PII 값으로 복원."""
        if not mapping.pii_detected or not mapping.mappings:
            return text

        result = text
        for mask_token, original in mapping.mappings.items():
            result = result.replace(mask_token, original)

        return result

    def unmask_stream_chunk(
        self, chunk: str, mapping: MaskMapping, buffer: str = ""
    ) -> tuple[str, str]:
        """스트리밍 청크에서 [MASK_N] 토큰을 언마스킹.

        SSE 스트리밍 시 [MASK_1] 토큰이 청크에 걸쳐 분리될 수 있으므로
        버퍼 로직을 사용한다.

        Args:
            chunk: 현재 SSE 청크
            mapping: 마스크 매핑 정보
            buffer: 이전 미완성 토큰 버퍼

        Returns:
            (unmasked_output, remaining_buffer)
        """
        if not mapping.pii_detected or not mapping.mappings:
            return buffer + chunk, ""

        text = buffer + chunk

        # 완전한 [MASK_N] 토큰 치환
        for mask_token, original in mapping.mappings.items():
            text = text.replace(mask_token, original)

        # 미완성 [MASK_ 패턴 감지 → 버퍼에 보관
        partial = _PARTIAL_MASK_PATTERN.search(text)
        if partial:
            remaining = text[partial.start():]
            output = text[:partial.start()]
            return output, remaining

        return text, ""
