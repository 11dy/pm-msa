-- Local pgvector 초기화 스크립트
-- docker-compose local-ai 프로필에서 사용

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    pii_mapping JSONB,
    project_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW 인덱스 (코사인 유사도)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id
    ON document_chunks (user_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_project_id
    ON document_chunks (project_id);

-- 유사도 검색 함수
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding vector(1536),
    match_user_id BIGINT,
    match_count INT DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.3,
    filter_project_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    document_id BIGINT,
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT,
    pii_mapping JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        dc.pii_mapping
    FROM document_chunks dc
    WHERE dc.user_id = match_user_id
      AND (filter_project_id IS NULL OR dc.project_id = filter_project_id)
      AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
