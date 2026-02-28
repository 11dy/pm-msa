"""Model Factory 타입 정의."""

from enum import Enum


class TaskType(str, Enum):
    """태스크별 모델 라우팅 타입."""
    ROUTING = "routing"
    GRADING = "grading"
    REWRITING = "rewriting"
    GENERATION = "generation"
    PII_DETECTION = "pii_detection"
    EMBEDDING = "embedding"


class ModelProvider(str, Enum):
    """모델 제공자."""
    OPENAI = "openai"
    OLLAMA = "ollama"
