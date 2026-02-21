import json
import logging

from confluent_kafka import Producer

from app.config import settings

logger = logging.getLogger(__name__)

_producer: Producer | None = None


def get_producer() -> Producer | None:
    global _producer
    if _producer is None:
        try:
            _producer = Producer({
                "bootstrap.servers": settings.kafka_bootstrap_servers,
                "client.id": "pm-agent",
            })
            logger.info("Kafka producer initialized: %s", settings.kafka_bootstrap_servers)
        except Exception as e:
            logger.error("Failed to create Kafka producer: %s", e)
            return None
    return _producer


def publish_event(topic: str, event: dict) -> None:
    producer = get_producer()
    if producer is None:
        logger.warning("Kafka producer not available, skipping event: %s", event.get("type"))
        return
    try:
        producer.produce(
            topic,
            value=json.dumps(event).encode("utf-8"),
        )
        producer.flush(timeout=5)
        logger.info("Published event: topic=%s, type=%s", topic, event.get("type"))
    except Exception as e:
        logger.error("Failed to publish event: %s", e)


def close_producer() -> None:
    global _producer
    if _producer is not None:
        _producer.flush(timeout=10)
        _producer = None
        logger.info("Kafka producer closed")
