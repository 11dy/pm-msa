# pm-agent

PM-MSA 프로젝트의 AI 에이전트 서비스입니다. LangChain + LangGraph 기반의 Adaptive RAG 파이프라인을 통해 AI 채팅 기능을 제공합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | FastAPI 0.115.x |
| AI/LLM | LangChain 0.3.x + LangGraph 0.2.x |
| Embedding | OpenAI text-embedding-3-small |
| Vector Store | Supabase (pgvector) |
| Message Broker | Kafka (confluent-kafka) |
| Service Discovery | Eureka (py-eureka-client) |
| Streaming | SSE (sse-starlette) |

## 프로젝트 구조

```
pm-agent/
├── run.sh                      # 실행 스크립트
├── requirements.txt
├── Dockerfile
│
└── app/
    ├── main.py                 # FastAPI 앱 (lifespan, 미들웨어)
    ├── config.py               # Pydantic Settings 설정
    │
    ├── api/
    │   ├── chat.py             # 채팅 API 엔드포인트
    │   └── health.py           # 헬스체크 API
    │
    ├── services/
    │   ├── chat_service.py     # 채팅 비즈니스 로직
    │   └── embedding_service.py # 임베딩 생성 서비스
    │
    ├── graphs/                 # LangGraph Adaptive RAG
    │   ├── adaptive_rag.py     # 그래프 정의
    │   ├── states/
    │   │   └── rag_state.py    # 그래프 상태 정의
    │   └── nodes/
    │       ├── router_node.py      # 질문 라우팅
    │       ├── retriever_node.py   # 문서 검색
    │       ├── grader_node.py      # 문서 관련성 평가
    │       ├── generator_node.py   # 답변 생성
    │       └── rewriter_node.py    # 질문 재작성
    │
    ├── chains/
    │   └── rag_chain.py        # RAG 체인
    │
    ├── prompts/
    │   └── rag_prompt.py       # RAG 프롬프트 템플릿
    │
    ├── retrievers/
    │   └── supabase_retriever.py # Supabase 벡터 검색
    │
    ├── vectorstore/
    │   └── supabase_store.py   # Supabase 벡터 저장소
    │
    └── kafka/
        ├── consumer.py         # Kafka 메시지 소비
        └── producer.py         # Kafka 메시지 발행
```

## Adaptive RAG 파이프라인

```
┌──────────┐
│  질문 입력 │
└────┬─────┘
     ▼
┌──────────┐     vectorstore     ┌──────────────┐
│  Router  │ ──────────────────> │  Retriever   │
│ (라우팅)  │                     │ (문서 검색)   │
└────┬─────┘                     └──────┬───────┘
     │ web_search                       ▼
     │                           ┌──────────────┐
     │                           │   Grader     │  관련 없음
     │                           │ (관련성 평가)  │ ──────────┐
     │                           └──────┬───────┘           │
     │                              관련 있음                ▼
     │                                  │           ┌──────────────┐
     │                                  ▼           │  Rewriter    │
     │                           ┌──────────────┐   │ (질문 재작성)  │
     └──────────────────────────>│  Generator   │   └──────┬───────┘
                                 │  (답변 생성)  │          │
                                 └──────────────┘   Retriever로 재시도
```

## API 엔드포인트

| Method | URL | Description | Streaming |
|--------|-----|-------------|-----------|
| POST | `/api/chat` | AI 채팅 메시지 전송 | SSE |
| GET | `/health` | 헬스체크 | - |
| GET | `/docs` | Swagger UI | - |

## 환경변수

```bash
# .env
EUREKA_SERVER=http://localhost:8761/eureka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

## 실행 방법

### 사전 요구사항
- Python 3.11+
- OpenAI API Key
- Supabase 프로젝트 (벡터 저장소)

### 실행

```bash
# 실행 스크립트 사용
./run.sh

# 또는 직접 실행
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload
```

### 접속
- **서비스**: http://localhost:8083
- **Swagger UI**: http://localhost:8083/docs

## 외부 연동

| 서비스 | 용도 | 필수 여부 |
|--------|------|-----------|
| Eureka | 서비스 디스커버리 등록 | 선택 (실패 시 경고만 출력) |
| Kafka | 이벤트 메시지 수신/발행 | 선택 |
| OpenAI | LLM 및 임베딩 생성 | 필수 |
| Supabase | 벡터 저장소 (pgvector) | 필수 |
