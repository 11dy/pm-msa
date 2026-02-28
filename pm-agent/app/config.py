from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "pm-agent"
    app_port: int = 8083

    eureka_server: str = "http://localhost:8761/eureka"
    kafka_bootstrap_servers: str = "localhost:9092"

    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_batch_size: int = 20

    supabase_url: str = ""
    supabase_key: str = ""

    # Ollama (Local LLM)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_pii: str = "llama3.2:3b"
    ollama_model_light: str = "llama3.2:3b"
    ollama_embedding_model: str = "bge-m3"
    ollama_enabled: bool = True

    # PII Masking
    pii_masking_enabled: bool = True
    pii_regex_fallback: bool = True

    # Privacy Mode: "performance" (OpenAI 우선) | "security" (Ollama 우선)
    privacy_mode: str = "performance"

    # Local pgvector
    local_pgvector_host: str = "localhost"
    local_pgvector_port: int = 5433
    local_pgvector_db: str = "vectordb"
    local_pgvector_user: str = "postgres"
    local_pgvector_password: str = "postgres"
    use_local_vectorstore: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
