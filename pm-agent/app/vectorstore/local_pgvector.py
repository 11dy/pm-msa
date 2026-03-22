"""로컬 pgvector 저장/검색."""

import json
import logging

import psycopg2
from psycopg2.extras import execute_values

from app.config import settings

logger = logging.getLogger(__name__)


def _get_connection():
    return psycopg2.connect(
        host=settings.local_pgvector_host,
        port=settings.local_pgvector_port,
        dbname=settings.local_pgvector_db,
        user=settings.local_pgvector_user,
        password=settings.local_pgvector_password,
    )


def store_embeddings(
    document_id: int,
    user_id: int,
    chunks: list[dict],
    embeddings: list[list[float]],
    project_id: int | None = None,
) -> int:
    """로컬 pgvector에 임베딩 저장."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            rows = []
            for chunk, embedding in zip(chunks, embeddings):
                rows.append((
                    document_id,
                    user_id,
                    chunk["index"],
                    chunk["content"],
                    embedding,
                    json.dumps(chunk.get("pii_mapping")) if chunk.get("pii_mapping") else None,
                    project_id,
                ))
            execute_values(
                cur,
                """INSERT INTO document_chunks
                   (document_id, user_id, chunk_index, content, embedding, pii_mapping, project_id)
                   VALUES %s""",
                rows,
                template="(%s, %s, %s, %s, %s::vector, %s::jsonb, %s)",
            )
            conn.commit()
            stored = len(rows)
            logger.info("Stored %d embeddings in local pgvector for document %d", stored, document_id)
            return stored
    finally:
        conn.close()


def search_similar(
    query_embedding: list[float],
    user_id: int,
    top_k: int = 5,
    similarity_threshold: float = 0.3,
    project_id: int | None = None,
) -> list[dict]:
    """로컬 pgvector에서 코사인 유사도 기반 검색."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            query = """SELECT document_id, chunk_index, content,
                          1 - (embedding <=> %s::vector) AS similarity,
                          pii_mapping
                   FROM document_chunks
                   WHERE user_id = %s
                     AND 1 - (embedding <=> %s::vector) > %s"""
            params: list = [query_embedding, user_id, query_embedding, similarity_threshold]
            if project_id is not None:
                query += " AND project_id = %s"
                params.append(project_id)
            query += " ORDER BY embedding <=> %s::vector LIMIT %s"
            params.extend([query_embedding, top_k])
            cur.execute(query, params)
            results = []
            for row in cur.fetchall():
                results.append({
                    "document_id": row[0],
                    "chunk_index": row[1],
                    "content": row[2],
                    "similarity": float(row[3]),
                    "pii_mapping": row[4],
                })
            return results
    finally:
        conn.close()
