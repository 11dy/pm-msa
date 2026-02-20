import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import documents, health
from app.config import settings
from app.kafka.producer import close_producer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

_eureka_client = None


def _register_eureka() -> None:
    global _eureka_client
    try:
        import py_eureka_client.eureka_client as eureka_client

        eureka_client.init(
            eureka_server=settings.eureka_server,
            app_name="PM-DOCUMENT",
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
    _register_eureka()
    logger.info("pm-document started on port %d", settings.app_port)
    yield
    close_producer()
    _deregister_eureka()
    logger.info("pm-document stopped")


app = FastAPI(
    title="PM Document Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(documents.router)
