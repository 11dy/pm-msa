# pm-web

PM-MSA 프로젝트의 프론트엔드 웹 애플리케이션입니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Form/Validation | react-hook-form + zod |
| HTTP Client | ky |
| Icons | lucide-react |

## 프로젝트 구조 (FSD Architecture)

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx      # 로그인 페이지
│   │   └── signup/page.tsx     # 회원가입 페이지
│   ├── (main)/
│   │   ├── layout.tsx          # 인증된 사용자 레이아웃 (사이드바)
│   │   └── dashboard/page.tsx  # 대시보드 (프로젝트 + 채팅)
│   ├── oauth2/
│   │   └── callback/page.tsx   # OAuth2 콜백 처리
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 랜딩 페이지
│   └── globals.css             # 다크 테마 글로벌 스타일
│
├── features/                   # 비즈니스 기능
│   ├── auth/
│   │   ├── ui/                 # LoginForm, SignupForm, SocialLoginButtons
│   │   ├── model/              # useAuthStore, authSchema
│   │   └── api/                # authApi
│   ├── chat/
│   │   ├── ui/                 # ChatPanel, ChatInput, ChatMessage
│   │   ├── api/                # fetchSuggestions (추천 질문 API)
│   │   └── model/              # useChatStore, types
│   ├── document/
│   │   ├── ui/                 # DocumentPanel, UploadDocumentModal
│   │   └── model/              # useDocumentStore, types
│   └── project/
│       ├── ui/                 # ProjectList, ProjectCard, ProjectDetailView, ProjectCalendar, CreateProjectModal
│       └── model/              # useProjectStore, types
│
├── entities/                   # 비즈니스 엔티티
│   ├── user/model/types.ts
│   └── session/model/useSessionStore.ts
│
├── widgets/                    # 복합 UI 블록
│   └── sidebar/Sidebar.tsx     # 좌측 사이드바 (프로젝트 생성, 사용자 메뉴)
│
└── shared/                     # 공유 모듈
    ├── api/client.ts           # ky 인스턴스 (Bearer 토큰 자동 주입)
    ├── ui/                     # Button, Input, Card, Modal
    ├── lib/cn.ts               # className 유틸
    └── config/env.ts           # 환경변수
```

## 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 (히어로 + 기능 소개) |
| `/login` | 로그인 페이지 (소셜 로그인 포함) |
| `/signup` | 회원가입 페이지 |
| `/dashboard` | 대시보드 (프로젝트 목록 + AI 채팅) |
| `/oauth2/callback` | OAuth2 콜백 처리 |

## 주요 기능

### 대시보드
- **프로젝트 관리**: 프로젝트 카드 목록, 프로젝트 생성/요약
- **프로젝트 상세**: 캘린더 뷰 + 날짜별 문서 목록 (ProjectDetailView), 문서 업로드/삭제, 상태 추적
- **AI 채팅**: pm-agent와 연동된 ChatGPT 스타일 채팅 패널 (SSE 스트리밍)
  - 프로젝트 선택 시 해당 프로젝트 문서만 RAG 검색
  - 자동 생성된 추천 질문 pill 버튼 (클릭 시 채팅 전송)

### 인증
- 이메일/비밀번호 로그인
- OAuth2 소셜 로그인 (Google, Kakao, Naver)
- JWT 토큰 기반 세션 관리

## 실행 방법

### 사전 요구사항
- Node.js 18+
- Gateway 실행 중 (localhost:8080)
- pm-auth 실행 중

### 설치 및 실행

```bash
cd pm-web

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### 접속

- **개발 서버**: http://localhost:3000

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## API 연동

Gateway를 통해 백엔드 서비스와 통신합니다.

| 기능 | 엔드포인트 | 대상 서비스 |
|------|-----------|-------------|
| 회원가입 | POST /api/auth/signup | pm-auth |
| 로그인 | POST /api/auth/login | pm-auth |
| 토큰 갱신 | POST /api/auth/refresh | pm-auth |
| 로그아웃 | POST /api/auth/logout | pm-auth |
| OAuth2 URL | GET /api/auth/oauth2/{provider} | pm-auth |
| 프로젝트 목록 | GET /api/project | pm-workflow |
| 프로젝트 생성 | POST /api/project | pm-workflow |
| 문서 목록 | GET /api/documents?projectId=N | pm-workflow |
| 문서 업로드 | POST /api/documents/upload | pm-document |
| 문서 삭제 | DELETE /api/documents/{id} | pm-workflow |
| AI 채팅 | POST /api/chat/message | pm-agent |
| 추천 질문 | GET /api/documents/suggestions?projectId=N | pm-workflow |

## 소셜 로그인 지원

| Provider | 상태 |
|----------|------|
| Google | 활성 |
| Kakao | 준비중 |
| Naver | 준비중 |
