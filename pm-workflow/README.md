# pm-workflow

PM-MSA 프로젝트의 워크플로우 서비스입니다. AI 에이전트 관리, 대화 세션, 문서 처리, 워크플로우 실행 추적을 담당합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Boot 4.0.2 (WebMVC) |
| Language | Java 25 |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL |
| Message Broker | Spring Kafka |
| WebSocket | STOMP over SockJS |
| Service Discovery | Eureka Client |
| API 문서 | SpringDoc OpenAPI (Swagger) |

## 프로젝트 구조

```
pm-workflow/
└── src/main/java/com/pm/pmworkflow/
    ├── PmWorkflowApplication.java
    ├── config/
    │   ├── GatewayAuthenticationFilter.java   # Gateway 헤더 기반 인증
    │   ├── WebSocketConfig.java               # STOMP WebSocket 설정
    │   └── JpaConfig.java                     # JPA Auditing 설정
    ├── controller/
    │   ├── AgentController.java               # 에이전트 CRUD
    │   ├── ConversationController.java        # 대화 세션 CRUD
    │   ├── DocumentController.java            # 문서 CRUD + 프로젝트별 조회
    │   ├── WorkflowController.java            # 워크플로우 실행 조회
    │   └── HealthController.java              # 헬스체크
    ├── service/
    │   ├── AgentService.java                  # 에이전트 비즈니스 로직
    │   ├── ConversationService.java           # 대화 비즈니스 로직
    │   └── DocumentService.java               # 문서 비즈니스 로직
    ├── domain/
    │   ├── entity/
    │   │   ├── BaseEntity.java                # 공통 (createdAt, updatedAt)
    │   │   ├── Agent.java                     # AI 에이전트 설정
    │   │   ├── Conversation.java              # 대화 세션
    │   │   ├── Message.java                   # 메시지
    │   │   ├── Document.java                  # 문서 (임베딩 대상)
    │   │   ├── AgentDocument.java             # 에이전트-문서 연결
    │   │   └── WorkflowExecution.java         # 워크플로우 실행 기록
    │   ├── enums/
    │   │   ├── ConversationStatus.java        # ACTIVE, ARCHIVED, DELETED
    │   │   ├── MessageRole.java               # USER, ASSISTANT, SYSTEM, TOOL
    │   │   ├── DocumentStatus.java            # UPLOADED, PROCESSING, COMPLETED, FAILED
    │   │   └── WorkflowStatus.java            # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    │   └── repository/
    │       ├── AgentRepository.java
    │       ├── ConversationRepository.java
    │       ├── MessageRepository.java
    │       ├── DocumentRepository.java
    │       ├── AgentDocumentRepository.java
    │       └── WorkflowExecutionRepository.java
    ├── dto/
    │   ├── request/
    │   │   ├── AgentCreateRequest.java
    │   │   ├── AgentUpdateRequest.java
    │   │   ├── ConversationCreateRequest.java
    │   │   └── DocumentRegisterRequest.java
    │   └── response/
    │       ├── ApiResponse.java
    │       ├── AgentResponse.java
    │       ├── ConversationResponse.java
    │       ├── ConversationDetailResponse.java
    │       ├── DocumentResponse.java
    │       └── MessageResponse.java
    ├── kafka/
    │   └── WorkflowEventConsumer.java         # Kafka 이벤트 처리 + WebSocket 전파
    └── exception/
        ├── WorkflowException.java
        └── GlobalExceptionHandler.java
```

## 도메인 모델

### Agent (AI 에이전트)
사용자별 커스텀 AI 에이전트를 정의합니다. 시스템 프롬프트, 모델, 온도 등 LLM 파라미터를 설정합니다.

| 필드 | 설명 | 기본값 |
|------|------|--------|
| name | 에이전트 이름 | - |
| systemPrompt | 시스템 프롬프트 | - |
| model | LLM 모델 | gpt-4o |
| temperature | 생성 온도 | 0.7 |
| maxTokens | 최대 토큰 | 4096 |
| tools | 사용 가능한 도구 (JSON) | null |

### Conversation (대화 세션)
사용자와 에이전트 간의 대화 세션을 관리합니다.

```
ACTIVE → ARCHIVED (보관)
       → DELETED  (삭제)
```

### Document (문서)
업로드된 문서의 임베딩 처리 상태를 추적합니다. `projectId`를 통해 프로젝트별 문서 관리를 지원합니다.

| 필드 | 설명 | 비고 |
|------|------|------|
| projectId | 소속 프로젝트 | nullable |
| originalFilename | 원본 파일명 | - |
| fileType | 파일 타입 (pdf, docx, ...) | - |
| fileSize | 파일 크기 (bytes) | - |
| status | 처리 상태 | UPLOADED → PROCESSING → COMPLETED/FAILED |
| chunkCount | 청크 수 | 임베딩 완료 후 갱신 |

```
UPLOADED → PROCESSING → COMPLETED
                      → FAILED
```

### WorkflowExecution (워크플로우 실행)
LangGraph 워크플로우의 실행 상태와 노드 실행 이력을 기록합니다.

```
PENDING → RUNNING → COMPLETED
                  → FAILED
                  → CANCELLED
```

## API 엔드포인트

### 에이전트 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/agents` | 내 에이전트 목록 | O |
| GET | `/api/agents/{id}` | 에이전트 상세 | O |
| POST | `/api/agents` | 에이전트 생성 | O |
| PUT | `/api/agents/{id}` | 에이전트 수정 | O |
| DELETE | `/api/agents/{id}` | 에이전트 삭제 (비활성화) | O |

### 대화 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/conversations` | 내 대화 목록 | O |
| GET | `/api/conversations/{id}` | 대화 상세 (메시지 포함) | O |
| POST | `/api/conversations` | 대화 생성 | O |
| DELETE | `/api/conversations/{id}` | 대화 삭제 | O |

### 워크플로우 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/workflows/executions/{id}` | 워크플로우 실행 조회 | O |

### 문서 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/documents/internal/register` | 문서 메타데이터 등록 (내부 전용) | X |
| GET | `/api/documents` | 문서 목록 (전체) | O |
| GET | `/api/documents?projectId=N` | 프로젝트별 문서 목록 | O |
| GET | `/api/documents/{id}` | 문서 상세 | O |
| DELETE | `/api/documents/{id}` | 문서 삭제 | O |

### 기타

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/health` | 헬스체크 | X |

## Kafka 이벤트

### 구독 토픽

| 토픽 | 이벤트 | 처리 |
|------|--------|------|
| `pm.document.events` | `document.embedding.started` | 문서 상태 → PROCESSING |
| | `document.embedding.completed` | 문서 상태 → COMPLETED + 청크 수 갱신 |
| | `document.failed` | 문서 상태 → FAILED |
| `pm.workflow.events` | `workflow.started` | 실행 상태 → RUNNING |
| | `workflow.completed` | 실행 상태 → COMPLETED |
| | `workflow.failed` | 실행 상태 → FAILED |

| `pm.document.events` | `document.analysis.completed` | 추천 질문 저장 (SuggestedQuestion) |

모든 이벤트는 처리 후 WebSocket (`/topic/documents/{id}`, `/topic/workflows/{id}`)으로 프론트엔드에 실시간 전파됩니다.

### 추천 질문 (Phase 6)

문서 자동 분석 후 생성된 추천 질문을 저장하고 제공합니다.

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/documents/suggestions?projectId=N` | 프로젝트별 미사용 추천 질문 목록 | O |

관련 파일:
- `SuggestedQuestion.java` — 엔티티 (documentId, projectId, question, questionType, used)
- `SuggestedQuestionRepository.java` — 프로젝트/문서별 조회
- `SuggestedQuestionService.java` — 저장/조회
- `SuggestedQuestionController.java` — REST API
- `WorkflowEventConsumer.java` — `document.analysis.completed` 이벤트 핸들러

## WebSocket

| 설정 | 값 |
|------|-----|
| 엔드포인트 | `/ws` (SockJS) |
| 메시지 브로커 | `/topic` |
| 앱 프리픽스 | `/app` |
| 허용 Origin | `http://localhost:3000` |

## 환경변수

```bash
DB_USERNAME=root
DB_PASSWORD=password
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/
```

## 실행 방법

### 사전 요구사항
- Java 25
- MySQL 8.0+ (`pm_workflow` 데이터베이스)
- Eureka Server 실행 중
- Kafka 실행 중 (이벤트 수신 시)

### 실행
```bash
./gradlew bootRun
```

### 접속
- **서비스**: http://localhost:8084
- **Swagger UI**: http://localhost:8084/swagger-ui.html
- **Health Check**: http://localhost:8084/health
