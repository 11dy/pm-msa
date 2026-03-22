# pm-agent

PM-MSA 프로젝트의 AI 에이전트 서비스입니다. LangChain + LangGraph 기반의 Adaptive RAG 파이프라인, PII 마스킹, 문서 자동 분석 기능을 제공합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | FastAPI 0.115.x |
| AI/LLM | LangChain 0.3.x + LangGraph 0.2.x |
| LLM Provider | OpenAI (GPT-4o) + Ollama (llama3.2:3b) |
| Embedding | OpenAI text-embedding-3-small / Ollama BGE-M3 |
| Vector Store | Supabase (pgvector) / 로컬 pgvector |
| PII Detection | Ollama LLM + 다국어 정규식 fallback |
| File Parsing | PyMuPDF (PDF), python-docx (DOCX), openpyxl (Excel), olefile (HWP) |
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
    │   ├── pii.py              # PII 마스킹 다운로드 API
    │   └── health.py           # 헬스체크 API
    │
    ├── llm/                    # Model Factory 패턴
    │   ├── factory.py          # get_llm(TaskType), get_embedding_model()
    │   ├── types.py            # TaskType, ModelProvider enum
    │   └── health.py           # Ollama 헬스체크
    │
    ├── services/
    │   ├── chat_service.py     # 채팅 오케스트레이션 (PII 스트리밍)
    │   ├── embedding_service.py # 임베딩 생성 서비스
    │   ├── analysis_service.py # 문서 자동 분석 + 추천 질문 생성
    │   └── pii/                # PII 마스킹 서비스
    │       ├── detector.py     # Ollama PII 감지 + 다국어 regex fallback
    │       ├── masker.py       # mask/unmask + 스트리밍 버퍼
    │       └── prompts.py      # PII 감지 프롬프트
    │
    ├── graphs/                 # LangGraph Adaptive RAG
    │   ├── adaptive_rag.py     # 그래프 정의 (mask → router → ... → unmask)
    │   ├── states/
    │   │   └── rag_state.py    # 그래프 상태 정의 (+ PII 필드)
    │   └── nodes/
    │       ├── router_node.py      # 질문 라우팅
    │       ├── retriever_node.py   # 문서 검색
    │       ├── grader_node.py      # 문서 관련성 평가
    │       ├── generator_node.py   # 답변 생성
    │       ├── rewriter_node.py    # 질문 재작성
    │       ├── mask_node.py        # PII 마스킹 노드
    │       └── unmask_node.py      # PII 언마스킹 노드
    │
    ├── chains/
    │   └── rag_chain.py        # RAG 체인 (Model Factory 사용)
    │
    ├── prompts/
    │   ├── rag_prompt.py       # RAG 프롬프트 템플릿
    │   └── analysis_prompt.py  # 문서/교차 분석 프롬프트
    │
    ├── retrievers/
    │   └── supabase_retriever.py # Supabase 벡터 검색 (pii_mapping 포함)
    │
    ├── vectorstore/
    │   ├── supabase_store.py   # Supabase pgvector
    │   ├── local_pgvector.py   # 로컬 pgvector
    │   └── factory.py          # 벡터스토어 라우팅
    │
    └── kafka/
        ├── consumer.py         # Kafka 메시지 소비 (임베딩 + 자동 분석)
        └── producer.py         # Kafka 메시지 발행
```

## Adaptive RAG 파이프라인

```
┌──────────┐
│  질문 입력 │
└────┬─────┘
     ▼
┌──────────┐
│   Mask   │ PII 마스킹 (Ollama/regex)
└────┬─────┘
     ▼
┌──────────┐     vectorstore     ┌──────────────┐
│  Router  │ ──────────────────> │  Retriever   │
│ (라우팅)  │                     │ (문서 검색)   │
└────┬─────┘                     └──────┬───────┘
     │ general                          ▼
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
                                 └──────┬───────┘   Retriever로 재시도
                                        ▼
                                 ┌──────────────┐
                                 │   Unmask     │ PII 언마스킹 (질문+문서 PII 복원)
                                 └──────────────┘
```

## API 엔드포인트

| Method | URL | Description | Streaming |
|--------|-----|-------------|-----------|
| POST | `/api/chat/message` | AI 채팅 메시지 전송 (project_id 지원) | SSE |
| POST | `/api/pii/mask` | 문서 PII 마스킹 다운로드 (ZIP) | - |
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

# PII 마스킹 (기본 활성화)
PII_MASKING_ENABLED=true
OLLAMA_ENABLED=true
PII_REGEX_FALLBACK=true

# Privacy Mode (performance: OpenAI 우선 / security: Ollama 우선)
PRIVACY_MODE=security

# Ollama 모델
OLLAMA_MODEL_PII=llama3.2:3b
OLLAMA_MODEL_LIGHT=llama3.2:3b
OLLAMA_EMBEDDING_MODEL=bge-m3

# 로컬 벡터스토어 (선택)
USE_LOCAL_VECTORSTORE=false

# 자동 분석
AUTO_ANALYSIS_ENABLED=true
```

## 실행 방법

### 사전 요구사항
- Python 3.11+
- OpenAI API Key
- Supabase 프로젝트 (벡터 저장소)
- Ollama (PII 감지용, 선택 — 없으면 regex fallback)

### 실행

```bash
cd pm-agent

# 방법 1: run.sh 사용 (venv 자동 생성, 중복 실행 방지)
./run.sh

# 방법 2: 수동 실행
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload
```

> `run.sh`는 `.gitignore`에 포함되어 있습니다. 최초 클론 시 직접 생성하거나 수동 실행하세요.

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
| Ollama | PII 감지, 경량 LLM | 선택 (없으면 regex fallback) |

## PII 마스킹

### 문서 임베딩 시 자동 마스킹

문서 업로드 → 청킹 → PII 마스킹 → 마스킹된 텍스트로 임베딩 → 벡터DB 저장 (pii_mapping 포함)

### 채팅 시 마스킹/언마스킹

질문 마스킹 → 벡터 검색 → LLM 응답 생성 → 언마스킹 (질문 PII + 문서 PII 병합 복원)

### 마스킹 다운로드 (POST /api/pii/mask)

파일을 업로드하면 PII를 마스킹한 파일과 대조표를 ZIP으로 반환합니다.

| 파일 형식 | 마스킹 방식 |
|-----------|------------|
| PDF | PyMuPDF redact_annot (원본 레이아웃 유지) |
| DOCX | paragraph/run/table 텍스트 치환 |
| Excel | 시트별 CSV 스냅샷 변환 + 마스킹 (숨김 시트 제외) |
| TXT/MD/CSV | 텍스트 치환 (동일 확장자 유지) |
| HWP | TXT fallback |

## 프로젝트별 채팅 + 자동 분석

### 프로젝트별 RAG 검색

채팅 API에 `project_id`를 전달하면 해당 프로젝트의 문서만 대상으로 벡터 검색합니다. `project_id`가 없으면 전체 문서에서 검색합니다.

```
POST /api/chat/message
{
  "question": "보고서 내용 요약해줘",
  "user_id": 1,
  "project_id": 3,    ← 프로젝트 필터
  "stream": true
}
```

### 문서 자동 분석

임베딩 완료 후 자동으로 문서 분석 질문을 생성합니다 (`auto_analysis_enabled=True`).

```
임베딩 완료 → generate_auto_analysis()
  1. 마스킹된 청크 상위 10개 → OpenAI로 세분화 질문 5개 생성
  2. RAG로 기존 문서 검색 → 교차 분석 질문 3개 생성
  3. PII 언마스킹 적용
  4. Kafka document.analysis.completed 이벤트 발행
```
