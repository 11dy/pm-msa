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
| `pm-agent` | FastAPI + LangGraph | AI 에이전트 서비스 (RAG, 채팅) |
| `pm-workflow` | Spring Boot | 워크플로우 서비스 (에이전트 관리, 대화, 문서 처리) |
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

## 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Eureka Server | 8761 | 서비스 레지스트리 대시보드 |
| Gateway | 8080 | API 진입점 |
| pm-auth | 8081 | 인증 서비스 |
| pm-agent | 8083 | AI 에이전트 서비스 |
| pm-workflow | 8084 | 워크플로우 서비스 |
| pm-web | 3000 | 프론트엔드 |
| Kafka | 9092 | 메시지 브로커 |

## 실행 방법

```bash
# 1. Eureka Server 실행 (먼저)
cd pm-infra
./gradlew :eureka-server:bootRun

# 2. Gateway 실행
./gradlew :gateway:bootRun

# 3. Auth 서비스 실행
cd ../pm-auth
./gradlew bootRun

# 4. Agent 서비스 실행
cd ../pm-agent
./run.sh

# 5. Workflow 서비스 실행
cd ../pm-workflow
./gradlew bootRun

# 6. 프론트엔드 실행
cd ../pm-web
npm run dev

# 7. 확인
# - Eureka 대시보드: http://localhost:8761
# - Gateway: http://localhost:8080
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

# Agent 서비스 (Docker)
cd pm-agent
docker build -t pm-agent .

# Workflow 서비스 빌드
cd pm-workflow
./gradlew build

# 프론트엔드 빌드
cd pm-web
npm run build
```
