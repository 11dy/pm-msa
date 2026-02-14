# dy-web

DY-MSA 프로젝트의 프론트엔드 웹 애플리케이션입니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Form/Validation | react-hook-form + zod |
| HTTP Client | ky |

## 프로젝트 구조 (FSD Architecture)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/         # 로그인 페이지
│   │   └── signup/        # 회원가입 페이지
│   ├── (main)/
│   │   └── dashboard/     # 대시보드 페이지
│   ├── oauth2/
│   │   └── callback/      # OAuth2 콜백 처리
│   ├── layout.tsx
│   ├── page.tsx           # 메인 페이지
│   └── globals.css
│
├── features/              # 비즈니스 기능
│   └── auth/
│       ├── ui/
│       │   ├── LoginForm.tsx
│       │   ├── SignupForm.tsx
│       │   └── SocialLoginButtons.tsx
│       ├── model/
│       │   ├── useAuthStore.ts
│       │   └── authSchema.ts
│       └── api/
│           └── authApi.ts
│
├── entities/              # 비즈니스 엔티티
│   ├── user/
│   │   └── model/types.ts
│   └── session/
│       └── model/useSessionStore.ts
│
└── shared/                # 공유 모듈
    ├── api/
    │   ├── client.ts      # ky 인스턴스
    │   └── types.ts       # API 타입
    ├── ui/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   └── Card.tsx
    ├── lib/
    │   └── cn.ts          # className 유틸
    └── config/
        └── env.ts         # 환경변수
```

## 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 (로그인/회원가입 선택) |
| `/login` | 로그인 페이지 |
| `/signup` | 회원가입 페이지 |
| `/dashboard` | 대시보드 (인증 필요) |
| `/oauth2/callback` | OAuth2 콜백 처리 |

## 인증 흐름

### 일반 로그인

```
1. /login 페이지에서 이메일/비밀번호 입력
2. POST /api/auth/login 호출
3. 토큰 저장 (localStorage + Zustand)
4. /dashboard로 이동
```

### OAuth2 소셜 로그인

```
1. /login 페이지에서 "Google로 계속하기" 클릭
2. GET /api/auth/oauth2/google → 인증 URL 응답
3. Google 로그인 페이지로 리다이렉트
4. 로그인 완료 → /oauth2/callback#access_token=...&refresh_token=...
5. 콜백 페이지에서 토큰 파싱 및 저장
6. /dashboard로 이동
```

## 실행 방법

### 사전 요구사항

- Node.js 18+
- Gateway 실행 중 (localhost:8080)
- dy-auth 실행 중

### 설치 및 실행

```bash
cd dy-web

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

Gateway를 통해 dy-auth API와 통신합니다.

| 기능 | 엔드포인트 |
|------|-----------|
| 회원가입 | POST /api/auth/signup |
| 로그인 | POST /api/auth/login |
| 토큰 갱신 | POST /api/auth/refresh |
| 로그아웃 | POST /api/auth/logout |
| OAuth2 URL | GET /api/auth/oauth2/{provider} |

## 소셜 로그인 지원

| Provider | 상태 |
|----------|------|
| Google | 활성 |
| Kakao | 준비중 |
| Naver | 준비중 |
