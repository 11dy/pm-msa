import logging
import os
import socket
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, chat, pii
from app.config import settings
from app.kafka.consumer import start_consumer, stop_consumer
from app.kafka.producer import close_producer

_log_fmt = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"
logging.basicConfig(level=logging.INFO, format=_log_fmt)

_log_dir = os.environ.get("LOG_DIR", "./logs")
Path(_log_dir).mkdir(parents=True, exist_ok=True)
_file_handler = RotatingFileHandler(
    f"{_log_dir}/pm-agent.log", maxBytes=10_000_000, backupCount=7
)
_file_handler.setFormatter(logging.Formatter(_log_fmt))
logging.getLogger().addHandler(_file_handler)

logger = logging.getLogger(__name__)

_eureka_client = None


async def _register_eureka() -> None:
    global _eureka_client
    try:
        import py_eureka_client.eureka_client as eureka_client

        instance_ip = socket.gethostbyname(socket.gethostname())
        await eureka_client.init_async(
            eureka_server=settings.eureka_server,
            app_name="PM-AGENT",
            instance_port=settings.app_port,
            instance_host=instance_ip,
            instance_ip=instance_ip,
        )
        _eureka_client = eureka_client
        logger.info("Registered with Eureka: %s", settings.eureka_server)
    except Exception as e:
        logger.warning("Eureka registration failed (non-fatal): %s", e)


def _deregister_eureka() -> None:
    global _eureka_client
    if _eureka_client is not None:
        try:
            _eureka_client.stop()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _register_eureka()
    start_consumer()

    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set — embedding generation will fail")
    if not settings.supabase_url or not settings.supabase_key:
        logger.warning("Supabase not configured — vector storage will be skipped")

    logger.info("pm-agent started on port %d", settings.app_port)
    yield
    stop_consumer()
    close_producer()
    _deregister_eureka()
    logger.info("pm-agent stopped")


app = FastAPI(
    title="PM Agent Service",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS는 Gateway에서 처리 — pm-agent에서 중복 설정하면
# access-control-allow-origin 헤더가 2번 전송되어 브라우저가 차단함

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(pii.router)
