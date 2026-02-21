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

    class Config:
        env_file = ".env"


settings = Settings()
