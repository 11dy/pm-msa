# pm-msa (Personal Manager)

Spring Cloud + Python 기반 마이크로서비스 아키텍처 모노레포

## 프로젝트 구조

```
pm-msa/
├── README.md
│
├── pm-infra/                     # 인프라 모듈 (Spring Cloud)
│   ├── eureka-server/            # 서비스 디스커버리 서버
│   └── gateway/                  # API Gateway
│
├── pm-auth/                      # 인증 서비스 (Spring Boot)
│   └── src/main/
│
├── pm-resource/                  # 프로젝트 리소스 CRUD (Spring Boot)
│   └── src/main/
│
├── pm-document/                  # 문서 처리 서비스 (FastAPI)
│   └── app/
│
├── pm-agent/                     # AI 에이전트 서비스 (FastAPI + LangGraph)
│   └── app/
│
├── pm-workflow/                  # 워크플로우 서비스 (Spring Boot)
│   └── src/main/
│
└── pm-web/                       # 프론트엔드 (Next.js)
    └── src/
```

## 모듈 설명

| 모듈 | 기술 | 설명 |
|------|------|------|
| `pm-infra` | Spring Cloud | 인프라 (Eureka, Gateway) |
| `pm-auth` | Spring Boot | 인증/인가 서비스 (JWT, OAuth2) |
| `pm-resource` | Spring Boot | 프로젝트 CRUD 서비스 |
| `pm-document` | FastAPI | 문서 업로드, 파싱, 청킹 서비스 |
| `pm-agent` | FastAPI + LangGraph | AI 에이전트 서비스 (RAG, 채팅) |
| `pm-workflow` | Spring Boot | 워크플로우 서비스 (에이전트 관리, 대화, 문서 메타데이터) |
| `pm-web` | Next.js | 프론트엔드 |

## 기술 스택

| 구분 | 버전 |
|------|------|
| Java | 25 |
| Spring Boot | 4.0.2 |
| Spring Cloud | 2025.1.0 (Oakwood) |
| Gradle | 9.3.0 |
| Python | 3.11 |
| FastAPI | 0.115.x |
| LangChain / LangGraph | 0.3.x / 0.2.x |
| Next.js | 16.x |

## 아키텍처

```
┌─────────────────┐
│  Client (브라우저) │
│  pm-web :3000    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Gateway      │ :8080 (API 진입점)
│   (WebFlux)     │
└────────┬────────┘
         │ 서비스 조회
         ▼
┌─────────────────┐
│  Eureka Server  │ :8761 (서비스 레지스트리)
└─────────────────┘
         ▲
         │ 서비스 등록
┌────────┴────────────────────┐
│                             │
│  pm-auth :8081              │
│  (인증/인가)                 │
│                             │
│  pm-resource :8085          │
│  (프로젝트 CRUD)             │
│                             │
│  pm-document :8082          │
│  (문서 업로드/파싱)           │
│                             │
│  pm-agent :8083             │
│  (AI 에이전트, RAG 채팅)     │
│                             │
│  pm-workflow :8084           │
│  (워크플로우, 대화, 문서)     │
│                             │
└─────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Kafka     Supabase
 :9092     (Vector DB)
```

## 데이터베이스 구조

MySQL에 2개의 DB를 분리 운영합니다.

### dy_db — 핵심 도메인 (사용자, 리소스)

pm-auth, pm-resource가 공유하는 DB. 변경이 적고 여러 서비스가 참조하는 핵심 데이터.

| 테이블 | 모듈 | 용도 | 주요 컬럼 |
|--------|------|------|-----------|
| `users` | pm-auth | 사용자 계정 | id, email, user_nm, role, act_st |
| `user_auth` | pm-auth | 인증 정보 | user_id, provider(LOCAL/GOOGLE/KAKAO), password |
| `refresh_tokens` | pm-auth | JWT 리프레시 토큰 | user_id, token, expires_at |
| `project` | pm-resource | 프로젝트 | user_id, name, description |

### pm_workflow — AI 워크플로우 도메인

pm-workflow 전용 DB. 대화, 메시지, 문서 등 빠르게 증가하는 AI 워크플로우 데이터.

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| `agents` | AI 에이전트 설정 | user_id, name, system_prompt, model, temperature |
| `conversations` | 대화 세션 | user_id, agent_id, title, status |
| `messages` | 채팅 메시지 | conversation_id, role(USER/ASSISTANT), content |
| `documents` | 업로드 문서 메타데이터 | user_id, project_id, filename, status, chunk_count |
| `agent_documents` | 에이전트-문서 연결 | agent_id, document_id |
| `workflow_executions` | LangGraph 실행 추적 | conversation_id, workflow_type, graph_state |

### DB 분리 이유

```
dy_db (핵심 도메인)              pm_workflow (AI 도메인)
┌─────────────────┐            ┌──────────────────────┐
│ users            │◄───────────│ agents               │
│ user_auth        │    user_id │ conversations        │
│ refresh_tokens   │            │ messages             │
│ project          │◄───────────│ documents            │
└─────────────────┘  project_id│ agent_documents      │
                               │ workflow_executions   │
                               └──────────────────────┘
```

- **데이터 증가 패턴이 다름**: dy_db는 사용자/프로젝트 등 느리게 증가, pm_workflow는 대화/메시지 등 빠르게 증가
- **독립적 스케일링**: 워크플로우 데이터가 폭증해도 인증/리소스 DB에 영향 없음
- **장애 격리**: 한쪽 DB에 부하가 걸려도 다른 쪽 서비스는 정상 운영
- **MSA Database-per-Service 패턴**: 도메인 경계에 따라 DB를 분리하는 마이크로서비스 원칙 적용

> 크로스 DB이므로 테이블 간 FK는 DB 제약조건이 아닌 애플리케이션 레벨에서 user_id, project_id로 참조합니다.

## 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Eureka Server | 8761 | 서비스 레지스트리 대시보드 |
| Gateway | 8080 | API 진입점 |
| pm-auth | 8081 | 인증 서비스 |
| pm-document | 8082 | 문서 처리 서비스 |
| pm-agent | 8083 | AI 에이전트 서비스 |
| pm-workflow | 8084 | 워크플로우 서비스 |
| pm-resource | 8085 | 프로젝트 리소스 서비스 |
| pm-web | 3000 | 프론트엔드 |
| Kafka | 9092 | 메시지 브로커 |

## 실행 방법

```bash
# 0. 인프라 (Kafka, Redis, Zookeeper, Kafka UI)
docker compose up -d

# 1. Eureka Server 실행 (먼저)
cd pm-infra
./gradlew :eureka-server:bootRun

# 2. Gateway 실행
./gradlew :gateway:bootRun

# 3. Auth 서비스 실행
cd ../pm-auth
DB_PASSWORD=your_password ./gradlew bootRun

# 4. Resource 서비스 실행
cd ../pm-resource
DB_PASSWORD=your_password ./gradlew bootRun

# 5. Workflow 서비스 실행
cd ../pm-workflow
DB_PASSWORD=your_password ./gradlew bootRun

# 6. Document 서비스 실행
cd ../pm-document
uvicorn app.main:app --port 8082 --reload

# 7. Agent 서비스 실행
cd ../pm-agent
uvicorn app.main:app --port 8083 --reload

# 8. 프론트엔드 실행
cd ../pm-web
npm run dev

# 9. 확인
# - Eureka 대시보드: http://localhost:8761
# - Gateway: http://localhost:8080
# - Document API 문서: http://localhost:8082/docs
# - Agent API 문서: http://localhost:8083/docs
# - Workflow Swagger: http://localhost:8084/swagger-ui.html
# - 프론트엔드: http://localhost:3000
```

## 빌드

```bash
# 인프라 빌드
cd pm-infra
./gradlew build

# Auth 서비스 빌드
cd pm-auth
./gradlew build

# Resource 서비스 빌드
cd pm-resource
./gradlew build

# Workflow 서비스 빌드
cd pm-workflow
./gradlew build

# Document 서비스 (Docker)
cd pm-document
docker build -t pm-document .

# Agent 서비스 (Docker)
cd pm-agent
docker build -t pm-agent .

# 프론트엔드 빌드
cd pm-web
npm run build
```
