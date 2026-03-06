import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, chat, pii
from app.config import settings
from app.kafka.consumer import start_consumer, stop_consumer
from app.kafka.producer import close_producer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

_eureka_client = None


async def _register_eureka() -> None:
    global _eureka_client
    try:
        import py_eureka_client.eureka_client as eureka_client

        await eureka_client.init_async(
            eureka_server=settings.eureka_server,
            app_name="PM-AGENT",
            instance_port=settings.app_port,
            instance_ip="127.0.0.1",
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(pii.router)
