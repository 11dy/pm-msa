# k6 부하테스트

PM-MSA 서비스에 대한 k6 부하테스트 스크립트입니다. Gateway(`localhost:8080`)를 통해 실제 운영과 동일한 경로로 요청합니다.

## 1. 사전 준비

### k6 설치

```bash
# macOS
brew install k6

# 버전 확인
k6 version
```

### 환경변수 설정

```bash
# .env 파일 생성
cp k6/.env.example k6/.env
```

`k6/.env` 파일을 열어 실제 값을 입력합니다:

```bash
TEST_EMAIL=your-email@test.com
TEST_PASSWORD=your-password
BASE_URL=http://localhost:8080
PROJECT_ID=1
```

> `k6/.env`는 `.gitignore`에 등록되어 있어 원격에 올라가지 않습니다.

### 테스트 계정 생성

서비스가 실행 중인 상태에서 회원가입 API를 호출합니다.

```bash
# ex) 이메일, 비밀번호, 이름은 원하는 값으로 변경
curl -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d '{"email":"<your-email>","password":"<your-password>","name":"<your-name>"}'
```

## 2. 스크립트 구성

```
k6/
├── config.js            # 공통 설정 (BASE_URL, 테스트 계정)
├── helpers.js           # 로그인 헬퍼
├── run.sh               # .env 로드 + k6 실행 래퍼
├── .env.example         # 환경변수 템플릿
│
├── 01-auth.js           # 인증 테스트
├── 02-project-crud.js   # 프로젝트 CRUD 테스트
├── 03-document-list.js  # 문서 조회 테스트
├── 04-chat.js           # AI 채팅 테스트
├── 05-user-flow.js      # 통합 시나리오
└── 06-health.js         # 헬스체크
```

## 3. 모듈별 실행

`run.sh`를 사용하면 `.env` 로드 + 웹 대시보드가 자동 활성화됩니다.

### 인증 (pm-auth)

로그인 → 토큰 갱신 → 토큰 검증을 반복합니다.

```bash
./k6/run.sh k6/01-auth.js
```

필요 서비스: Eureka, Gateway, pm-auth, MySQL

### 프로젝트 CRUD (pm-resource)

프로젝트 목록 조회 → 생성 → 수정을 반복합니다.

```bash
./k6/run.sh k6/02-project-crud.js
```

필요 서비스: Eureka, Gateway, pm-auth, pm-resource, MySQL

### 문서 목록 + 추천 질문 (pm-workflow)

프로젝트별 문서 목록과 추천 질문을 조회합니다.

```bash
./k6/run.sh k6/03-document-list.js
```

필요 서비스: Eureka, Gateway, pm-auth, pm-workflow, MySQL

### AI 채팅 (pm-agent)

LLM + RAG 파이프라인을 통한 채팅 요청입니다. VU를 낮게 설정했습니다.

```bash
./k6/run.sh k6/04-chat.js
```

필요 서비스: Eureka, Gateway, pm-auth, pm-agent, Supabase, OpenAI API

### 통합 시나리오 (전체)

로그인 → 프로젝트 목록 → 문서 목록 → 추천 질문 → AI 채팅 순서로 실제 사용자 플로우를 시뮬레이션합니다.

```bash
./k6/run.sh k6/05-user-flow.js
```

필요 서비스: 전체

### 헬스체크 (전체)

각 서비스에 직접 헬스체크 요청을 보냅니다. Gateway를 거치지 않고 개별 포트로 호출합니다.

```bash
./k6/run.sh k6/06-health.js
```

필요 서비스: 확인하고 싶은 서비스만 (나머지는 해당 check만 실패)

## 4. 실행 옵션

```bash
# VU/시간 오버라이드 (스크립트 options 무시)
./k6/run.sh k6/03-document-list.js --vus 30 --duration 2m

# HTML 리포트 저장 (종료 후 브라우저로 열어 확인)
K6_WEB_DASHBOARD_EXPORT=report.html ./k6/run.sh k6/01-auth.js
```

## 5. 성능 지표 (Thresholds)

각 스크립트에 설정된 통과/실패 기준입니다. 테스트 종료 시 터미널에서 통과 여부(pass/fail)를 확인할 수 있습니다.

| 스크립트 | 지표 | 목표 | 설명 |
|----------|------|------|------|
| 01-auth | `http_req_duration{name:login}` | p(95) < 500ms | 로그인 응답 시간 |
| 01-auth | `http_req_duration{name:refresh}` | p(95) < 300ms | 토큰 갱신 응답 시간 |
| 01-auth | `http_req_failed` | rate < 1% | 전체 에러율 |
| 02-project-crud | `http_req_duration{name:list_projects}` | p(95) < 500ms | 프로젝트 목록 응답 시간 |
| 02-project-crud | `http_req_duration{name:create_project}` | p(95) < 800ms | 프로젝트 생성 응답 시간 |
| 03-document-list | `http_req_duration{name:documents}` | p(95) < 500ms | 문서 목록 응답 시간 |
| 03-document-list | `http_req_duration{name:suggestions}` | p(95) < 500ms | 추천 질문 응답 시간 |
| 04-chat | `http_req_duration{name:chat}` | p(95) < 30s | AI 채팅 응답 시간 |
| 06-health | `http_req_duration` | p(95) < 300ms | 헬스체크 응답 시간 |

### 부하 단계 (Stages)

| 스크립트 | 단계 | 최대 VU |
|----------|------|---------|
| 01-auth | 10s ramp-up → 30s sustain → 10s ramp-down | 10 |
| 02-project-crud | 10s ramp-up → 30s sustain → 10s ramp-down | 10 |
| 03-document-list | 10s ramp-up → 1m sustain → 10s ramp-down | 20 |
| 04-chat | 10s ramp-up → 1m sustain → 10s ramp-down | 5 |
| 05-user-flow | 15s ramp-up → 1m sustain → 10s ramp-down | 5 |
| 06-health | 고정 | 5 |

> VU (Virtual User): 동시에 요청을 보내는 가상 사용자 수

## 6. 웹 대시보드

`run.sh`로 실행하면 웹 대시보드가 자동 활성화됩니다.

### 실시간 모니터링

테스트 실행 중 브라우저에서 접속합니다:

```
http://127.0.0.1:5665
```

확인 가능한 항목:
- 요청 수 (RPS)
- 응답 시간 (avg, p95, p99)
- 에러율
- VU 수 변화
- 데이터 전송량

### HTML 리포트 저장

테스트 종료 후에도 결과를 확인하려면 리포트를 저장합니다:

```bash
K6_WEB_DASHBOARD_EXPORT=report.html ./k6/run.sh k6/01-auth.js

# 종료 후 브라우저로 열기
open report.html
```

## 7. 실행/종료

| 동작 | 방법 |
|------|------|
| 실행 | `./k6/run.sh k6/스크립트.js` |
| 정상 종료 | stages 완료 후 자동 종료 |
| 수동 중단 | `Ctrl + C` (현재 반복 완료 후 종료) |
| 강제 중단 | `Ctrl + C` 2회 연속 |

---

## 8. 테스트 결과 기록

### 03-document-list (2026-03-29)

문서 목록 + 추천 질문 조회 | 20 VU | 1m 20s

| 지표 | avg | p(90) | p(95) | p(99) | max |
|------|-----|-------|-------|-------|-----|
| http_req_duration | 8ms | 11ms | 12ms | 15ms | 242ms |
| group_duration | 317ms | 322ms | 324ms | 329ms | 566ms |

| 지표 | 값 |
|------|-----|
| 총 요청 수 | 2,200 (26.6 req/s) |
| checks 통과율 | 100.0% |
| 에러율 | 0.0% |
| 데이터 수신 | 1.23 MB (15.2 kB/s) |
| 데이터 송신 | 880 KB (10.9 kB/s) |

> threshold 기준 p(95) < 500ms 대비 12ms로 여유 있게 통과
