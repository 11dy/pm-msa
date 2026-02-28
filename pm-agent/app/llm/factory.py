"""태스크별 모델 라우팅 팩토리.

Privacy Mode에 따라 OpenAI 또는 Ollama 모델을 반환한다.
Ollama 불가 시 자동으로 OpenAI fallback.
"""

import logging

from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.config import settings
from app.llm.types import TaskType, ModelProvider
from app.llm.health import is_ollama_available

logger = logging.getLogger(__name__)

# Task → (Performance Mode Provider, Security Mode Provider)
_TASK_ROUTING: dict[TaskType, dict[str, ModelProvider]] = {
    TaskType.ROUTING:       {"performance": ModelProvider.OPENAI, "security": ModelProvider.OLLAMA},
    TaskType.GRADING:       {"performance": ModelProvider.OPENAI, "security": ModelProvider.OLLAMA},
    TaskType.REWRITING:     {"performance": ModelProvider.OPENAI, "security": ModelProvider.OLLAMA},
    TaskType.GENERATION:    {"performance": ModelProvider.OPENAI, "security": ModelProvider.OPENAI},
    TaskType.PII_DETECTION: {"performance": ModelProvider.OLLAMA, "security": ModelProvider.OLLAMA},
    TaskType.EMBEDDING:     {"performance": ModelProvider.OPENAI, "security": ModelProvider.OLLAMA},
}

# OpenAI 모델 매핑
_OPENAI_MODELS: dict[TaskType, str] = {
    TaskType.ROUTING: "gpt-4o-mini",
    TaskType.GRADING: "gpt-4o-mini",
    TaskType.REWRITING: "gpt-4o-mini",
    TaskType.GENERATION: "gpt-4o",
    TaskType.PII_DETECTION: "gpt-4o-mini",
}

# OpenAI temperature 매핑
_TEMPERATURES: dict[TaskType, float] = {
    TaskType.ROUTING: 0,
    TaskType.GRADING: 0,
    TaskType.REWRITING: 0.3,
    TaskType.GENERATION: 0.7,
    TaskType.PII_DETECTION: 0,
}


def _resolve_provider(task: TaskType, privacy_mode: str | None = None) -> ModelProvider:
    """태스크와 프라이버시 모드에 따라 모델 제공자를 결정."""
    mode = privacy_mode or settings.privacy_mode
    routing = _TASK_ROUTING.get(task, {})
    provider = routing.get(mode, ModelProvider.OPENAI)

    # Ollama가 선택되었지만 사용 불가능한 경우 → OpenAI fallback
    if provider == ModelProvider.OLLAMA:
        if not settings.ollama_enabled or not is_ollama_available():
            logger.debug("Ollama unavailable for %s, falling back to OpenAI", task.value)
            return ModelProvider.OPENAI

    return provider


def get_llm(
    task: TaskType,
    privacy_mode: str | None = None,
    streaming: bool = False,
) -> BaseChatModel:
    """태스크에 맞는 LLM 인스턴스를 반환.

    ChatOpenAI와 ChatOllama 모두 BaseChatModel이므로
    LCEL 체인 (prompt | llm)에서 동일하게 동작한다.
    """
    provider = _resolve_provider(task, privacy_mode)
    temperature = _TEMPERATURES.get(task, 0.7)

    if provider == ModelProvider.OLLAMA:
        from langchain_ollama import ChatOllama

        model = settings.ollama_model_light
        logger.debug("Using Ollama %s for %s", model, task.value)
        return ChatOllama(
            base_url=settings.ollama_base_url,
            model=model,
            temperature=temperature,
        )

    model = _OPENAI_MODELS.get(task, "gpt-4o")
    logger.debug("Using OpenAI %s for %s", model, task.value)
    return ChatOpenAI(
        model=model,
        api_key=settings.openai_api_key,
        temperature=temperature,
        streaming=streaming,
    )


def get_embedding_model(privacy_mode: str | None = None):
    """임베딩 모델 인스턴스를 반환.

    Performance mode → OpenAI text-embedding-3-small (1536차원)
    Security mode → Ollama BGE-M3 (1024차원)
    """
    provider = _resolve_provider(TaskType.EMBEDDING, privacy_mode)

    if provider == ModelProvider.OLLAMA:
        from langchain_ollama import OllamaEmbeddings

        logger.debug("Using Ollama %s for embeddings", settings.ollama_embedding_model)
        return OllamaEmbeddings(
            base_url=settings.ollama_base_url,
            model=settings.ollama_embedding_model,
        )

    from langchain_openai import OpenAIEmbeddings

    logger.debug("Using OpenAI %s for embeddings", settings.openai_embedding_model)
    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )
