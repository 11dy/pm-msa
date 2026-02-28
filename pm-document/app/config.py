from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "pm-document"
    app_port: int = 8082

    eureka_server: str = "http://localhost:8761/eureka"
    kafka_bootstrap_servers: str = "localhost:9092"
    pm_workflow_url: str = "http://localhost:8084"
    pm_resource_url: str = "http://localhost:8085"
    upload_dir: str = "./uploads"

    # 청킹 설정
    chunk_size: int = 1000
    chunk_overlap: int = 200

    class Config:
        env_file = ".env"


settings = Settings()
