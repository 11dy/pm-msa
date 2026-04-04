# Getting Started

## 프로젝트 구조

```
pm-msa/
├── pm-infra/                     # Spring Cloud (Eureka, Gateway)
│   ├── eureka-server/
│   └── gateway/
├── pm-auth/                      # 인증 서비스 (Spring Boot, JWT, OAuth2)
├── pm-document/                  # 문서 파싱/청킹 서비스 (FastAPI)
├── pm-agent/                     # AI 에이전트 서비스 (FastAPI, LangGraph)
├── pm-workflow/                  # 프로젝트 + 워크플로우 서비스 (Spring Boot)
├── pm-web/                       # 프론트엔드 (Next.js)
└── k8s/                          # Kubernetes 매니페스트
```

## 모듈 설명

| 모듈 | 기술 | 포트 | 설명 |
|------|------|------|------|
| `pm-infra` | Spring Cloud | 8761, 8080 | Eureka 서비스 디스커버리 + API Gateway |
| `pm-auth` | Spring Boot | 8081 | 인증/인가 (JWT, OAuth2) |
| `pm-document` | FastAPI | 8082 | 문서 업로드, 파싱, 청킹 |
| `pm-agent` | FastAPI + LangGraph | 8083 | RAG 채팅, 임베딩, PII 마스킹 |
| `pm-workflow` | Spring Boot | 8084 | 프로젝트 관리, 문서 메타데이터, 에이전트, 대화 |
| `pm-web` | Next.js | 3000 | 프론트엔드 |

## 로컬 실행

### 1. 인프라 실행 (Docker Compose)

```bash
docker compose up -d    # Kafka, Redis, Zookeeper, Kafka UI
```

MySQL은 별도 컨테이너가 이미 실행 중이라면 생략. 없으면:

```bash
docker compose --profile db up -d    # + MySQL
```

### 2. 앱 서비스 실행 (IntelliJ / 터미널)

```bash
# 1. Eureka Server (먼저)
cd pm-infra && ./gradlew :eureka-server:bootRun

# 2. Gateway
cd pm-infra && ./gradlew :gateway:bootRun

# 3. Auth
cd pm-auth && DB_PASSWORD=your_password ./gradlew bootRun

# 4. Workflow
cd pm-workflow && DB_PASSWORD=your_password ./gradlew bootRun

# 5. Document
cd pm-document && uvicorn app.main:app --port 8082 --reload

# 6. Agent
cd pm-agent && uvicorn app.main:app --port 8083 --reload

# 7. Frontend
cd pm-web && npm run dev
```

### 3. 확인

| 서비스 | URL |
|--------|-----|
| Eureka 대시보드 | http://localhost:8761 |
| Gateway | http://localhost:8080 |
| Document API 문서 | http://localhost:8082/docs |
| Agent API 문서 | http://localhost:8083/docs |
| 프론트엔드 | http://localhost:3000 |

## 빌드

```bash
# Spring 서비스
cd pm-infra && ./gradlew build
cd pm-auth && ./gradlew build
cd pm-workflow && ./gradlew build

# Python 서비스 (Docker)
cd pm-document && docker build -t pm-document .
cd pm-agent && docker build -t pm-agent .

# 프론트엔드
cd pm-web && npm run build
```
