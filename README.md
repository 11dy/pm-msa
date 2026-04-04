# PM (Personal Manager)

프로젝트별 AI 문서 질의 서비스 — PII 마스킹 기반 Privacy-Preserving RAG

## 핵심 기능

### 1. Adaptive RAG 채팅
LangGraph 상태머신 기반 AI 채팅. 질문을 자동 분류(rag/general)하고, 문서 검색 → 관련성 평가 → 응답 생성/쿼리 재작성을 수행합니다. SSE 스트리밍으로 실시간 토큰 단위 응답을 전송합니다.

### 2. 문서 처리 파이프라인
파일 업로드 → 파싱(PDF/DOCX/TXT/Excel/HWP) → 청킹 → PII 마스킹 → 임베딩 → Supabase pgvector 저장. Kafka 이벤트 드리븐으로 서비스 간 비동기 처리합니다.

### 3. Privacy-Preserving AI
문서 저장 시점에 PII(개인정보)를 `[MASK_N]` 토큰으로 마스킹하여 벡터DB에 저장하고, 채팅 응답 시 문서 PII + 질문 PII를 병합하여 원본 복원합니다. Ollama 로컬 LLM 우선, 실패 시 한국어 정규식 fallback으로 동작합니다.

### 4. 프로젝트별 데이터 격리 + 문서 자동 분석
업로드 → 임베딩 → 벡터검색 → 채팅까지 project_id 기반 격리. 임베딩 완료 시 LLM이 추천 질문 5개 + 교차 분석 질문 3개를 자동 생성하여, 채팅 시작 시 추천 질문 버튼으로 표시합니다.

### 5. 문서 마스킹 다운로드
업로드한 문서의 PII를 마스킹하여 다운로드. PDF/DOCX는 원본 포맷 유지, Excel은 시트별 CSV 스냅샷으로 변환됩니다. 마스킹된 파일과 PII 대조표를 ZIP으로 반환합니다.

## Architecture

<img src="docs/architecture.png" alt="PM-MSA Architecture" width="100%">

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Backend (Java)** | Java | 25 |
| | Spring Boot | 4.0.2 |
| | Spring Cloud | 2025.1.0 |
| | Gradle | 9.3.0 |
| **Backend (Python)** | Python | 3.12 |
| | FastAPI | 0.115.6 |
| | LangChain / LangGraph | 0.3.x / 0.2.x |
| | OpenAI SDK | 1.61.0 |
| **Frontend** | Next.js | 16.1.6 |
| | React | 19.2.3 |
| | TypeScript | 5.x |
| | TailwindCSS | 4.x |
| **Infrastructure** | Apache Kafka | Confluent 7.5.0 |
| | MySQL | 8.0 |
| | Redis | 7 |
| | Supabase (pgvector) | Cloud |
| | Kubernetes | Docker Desktop |

## 접속 정보

IntelliJ 로컬 개발과 K8s 배포 모두 동일한 포트로 접근합니다.

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3000 |
| API (Gateway) | http://localhost:8080 |
| Eureka 대시보드 | http://localhost:8761 |
| Kafka UI | http://localhost:8090 |

## Documentation

| 문서 | 설명 |
|------|------|
| [Getting Started](docs/GETTING-STARTED.md) | 로컬 실행, 빌드, 프로젝트 구조 |
| [Kubernetes](docs/KUBERNETES.md) | K8s 배포, 통신 구조, 운영 |
| [PII & Privacy](docs/PII-PRIVACY.md) | PII 마스킹 파이프라인, Ollama 설정, Privacy Mode |
