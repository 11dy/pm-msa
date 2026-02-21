import json
import logging
import threading

from confluent_kafka import Consumer, KafkaError

from app.config import settings
from app.kafka.producer import publish_event
from app.services.embedding_service import generate_embeddings
from app.vectorstore.supabase_store import store_embeddings

logger = logging.getLogger(__name__)

DOCUMENT_EVENTS_TOPIC = "pm.document.events"
_consumer_thread: threading.Thread | None = None
_running = False


def _process_chunked_event(event: dict) -> None:
    """document.chunked 이벤트 처리: 임베딩 생성 → 벡터 저장."""
    document_id = event["documentId"]
    user_id = event.get("userId", 0)
    chunks = event["chunks"]
    total_chunks = len(chunks)

    # embedding.started 발행
    publish_event(DOCUMENT_EVENTS_TOPIC, {
        "type": "document.embedding.started",
        "documentId": document_id,
        "totalChunks": total_chunks,
    })

    try:
        texts = [c["content"] for c in chunks]
        embeddings = generate_embeddings(texts)

        stored_count = store_embeddings(document_id, user_id, chunks, embeddings)

        # embedding.completed 발행
        publish_event(DOCUMENT_EVENTS_TOPIC, {
            "type": "document.embedding.completed",
            "documentId": document_id,
            "embeddingCount": stored_count,
        })
        logger.info("Embedding completed: document=%d, count=%d", document_id, stored_count)

    except Exception as e:
        logger.error("Embedding failed: document=%d, error=%s", document_id, e)
        publish_event(DOCUMENT_EVENTS_TOPIC, {
            "type": "document.failed",
            "documentId": document_id,
            "error": str(e),
            "stage": "embedding",
        })


def _consume_loop() -> None:
    global _running

    consumer = Consumer({
        "bootstrap.servers": settings.kafka_bootstrap_servers,
        "group.id": "pm-agent-group",
        "auto.offset.reset": "earliest",
    })
    consumer.subscribe([DOCUMENT_EVENTS_TOPIC])
    logger.info("Kafka consumer started: topic=%s, group=pm-agent-group", DOCUMENT_EVENTS_TOPIC)

    while _running:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            logger.error("Kafka consumer error: %s", msg.error())
            continue

        try:
            event = json.loads(msg.value().decode("utf-8"))
            event_type = event.get("type", "")

            if event_type == "document.chunked":
                logger.info("Processing document.chunked: documentId=%s", event.get("documentId"))
                _process_chunked_event(event)
            else:
                logger.debug("Ignoring event type: %s", event_type)

        except Exception as e:
            logger.error("Failed to process message: %s", e)

    consumer.close()
    logger.info("Kafka consumer stopped")


def start_consumer() -> None:
    global _consumer_thread, _running
    if _consumer_thread is not None and _consumer_thread.is_alive():
        return
    _running = True
    _consumer_thread = threading.Thread(target=_consume_loop, daemon=True, name="kafka-consumer")
    _consumer_thread.start()
    logger.info("Kafka consumer thread started")


def stop_consumer() -> None:
    global _running
    _running = False
    if _consumer_thread is not None:
        _consumer_thread.join(timeout=10)
    logger.info("Kafka consumer thread stopped")
