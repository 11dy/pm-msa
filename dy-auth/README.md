# DY-Auth

DY-MSA 프로젝트의 인증/인가 서비스입니다. JWT 기반의 사용자 인증과 토큰 관리를 담당합니다.

## 프로젝트 구조

```
dy-auth/
└── src/main/java/com/dy/dyauth/
    ├── DyAuthApplication.java          # 메인 애플리케이션
    ├── config/
    │   ├── SecurityConfig.java         # Spring Security 설정
    │   └── OpenApiConfig.java          # Swagger/OpenAPI 설정
    ├── controller/
    │   ├── AuthController.java         # 인증 API 엔드포인트
    │   └── HealthController.java       # 헬스체크 API
    ├── service/
    │   └── AuthService.java            # 인증 비즈니스 로직
    ├── domain/
    │   ├── entity/
    │   │   ├── User.java               # 사용자 엔티티
    │   │   ├── UserAuth.java           # 인증 방식 엔티티 (LOCAL, OAuth2)
    │   │   └── RefreshToken.java       # Refresh Token 엔티티
    │   └── repository/
    │       ├── UserRepository.java
    │       ├── UserAuthRepository.java
    │       └── RefreshTokenRepository.java
    ├── security/
    │   ├── jwt/
    │   │   ├── JwtProperties.java      # JWT 설정 프로퍼티
    │   │   └── JwtTokenProvider.java   # JWT 생성/검증
    │   ├── JwtAuthenticationFilter.java # JWT 인증 필터
    │   └── CustomUserDetails.java      # 사용자 인증 정보
    ├── dto/
    │   ├── request/
    │   │   ├── SignUpRequest.java      # 회원가입 요청
    │   │   ├── LoginRequest.java       # 로그인 요청
    │   │   └── TokenRefreshRequest.java # 토큰 갱신 요청
    │   └── response/
    │       ├── ApiResponse.java        # 공통 응답 형식
    │       ├── TokenResponse.java      # 토큰 응답
    │       └── UserResponse.java       # 사용자 정보 응답
    └── exception/
        ├── AuthException.java          # 인증 예외
        └── GlobalExceptionHandler.java # 전역 예외 처리
```

## 데이터베이스 스키마

```sql
-- 사용자 기본 정보
CREATE TABLE users (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL UNIQUE,
    user_nm     VARCHAR(100),
    role        VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 인증 방식 관리 (비밀번호 로그인 + OAuth2 로그인)
CREATE TABLE user_auth (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT NOT NULL,
    provider      VARCHAR(50) NOT NULL,  -- LOCAL, GOOGLE, KAKAO, NAVER
    provider_id   VARCHAR(255),
    password      VARCHAR(255),          -- LOCAL일 때만 사용
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_provider_id (provider, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- JWT Refresh Token 관리
CREATE TABLE refresh_tokens (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API 엔드포인트

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/auth/signup` | 회원가입 | X |
| POST | `/api/auth/login` | 로그인 | X |
| POST | `/api/auth/refresh` | 토큰 갱신 | X |
| POST | `/api/auth/logout` | 로그아웃 | O |
| GET | `/api/auth/users/{userId}` | 사용자 조회 | O |
| GET | `/api/auth/validate` | 토큰 검증 | O |
| GET | `/health` | 헬스체크 | X |

## 인증/인가 흐름

### 1. 회원가입 (Sign Up)

```
Client                     dy-auth                      Database
  │                           │                            │
  │  POST /api/auth/signup    │                            │
  │  {email, password, name}  │                            │
  │ ────────────────────────> │                            │
  │                           │  이메일 중복 체크            │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │                           │  users 테이블에 저장         │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │                           │  user_auth 테이블에 저장     │
  │                           │  (provider=LOCAL,          │
  │                           │   password=BCrypt암호화)    │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │  201 Created              │                            │
  │  {id, email, name, role}  │                            │
  │ <──────────────────────── │                            │
```

### 2. 로그인 (Login)

```
Client                     dy-auth                      Database
  │                           │                            │
  │  POST /api/auth/login     │                            │
  │  {email, password}        │                            │
  │ ────────────────────────> │                            │
  │                           │  user_auth 조회             │
  │                           │  (provider=LOCAL)          │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │                           │  비밀번호 검증 (BCrypt)      │
  │                           │                            │
  │                           │  Access Token 생성          │
  │                           │  (userId, email, role)     │
  │                           │                            │
  │                           │  Refresh Token 생성/저장    │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │  200 OK                   │                            │
  │  {accessToken,            │                            │
  │   refreshToken,           │                            │
  │   tokenType: "Bearer",    │                            │
  │   expiresIn}              │                            │
  │ <──────────────────────── │                            │
```

### 3. 인증된 API 요청 (Gateway를 통한 요청)

```
Client                    Gateway                     dy-auth / 다른 서비스
  │                          │                              │
  │  GET /api/some-resource  │                              │
  │  Authorization: Bearer   │                              │
  │  <access_token>          │                              │
  │ ───────────────────────> │                              │
  │                          │                              │
  │                          │  JWT 검증                     │
  │                          │  (JwtAuthenticationFilter)   │
  │                          │                              │
  │                          │  [검증 성공 시]               │
  │                          │  헤더에 사용자 정보 추가       │
  │                          │  X-User-Id: {userId}         │
  │                          │  X-User-Email: {email}       │
  │                          │  X-User-Role: {role}         │
  │                          │                              │
  │                          │  요청 전달                    │
  │                          │ ──────────────────────────> │
  │                          │                              │
  │                          │  응답                        │
  │                          │ <────────────────────────── │
  │  200 OK                  │                              │
  │  {response data}         │                              │
  │ <─────────────────────── │                              │
```

### 4. 토큰 갱신 (Token Refresh)

```
Client                     dy-auth                      Database
  │                           │                            │
  │  POST /api/auth/refresh   │                            │
  │  {refreshToken}           │                            │
  │ ────────────────────────> │                            │
  │                           │  refresh_tokens 조회        │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │                           │  만료 여부 확인              │
  │                           │                            │
  │                           │  새 Access Token 생성       │
  │                           │  새 Refresh Token 생성      │
  │                           │                            │
  │                           │  Refresh Token 업데이트     │
  │                           │ ─────────────────────────> │
  │                           │                            │
  │  200 OK                   │                            │
  │  {accessToken,            │                            │
  │   refreshToken,           │                            │
  │   tokenType, expiresIn}   │                            │
  │ <──────────────────────── │                            │
```

## JWT 토큰 구조

### Access Token
- **만료 시간**: 30분 (설정 가능)
- **Payload**:
  ```json
  {
    "sub": "userId",
    "email": "user@example.com",
    "role": "ROLE_USER",
    "iss": "dy-auth",
    "iat": 1234567890,
    "exp": 1234569690
  }
  ```

### Refresh Token
- **만료 시간**: 7일 (설정 가능)
- **저장**: DB에 저장하여 관리 (다중 디바이스 지원, 강제 로그아웃 가능)

## 보안 설정

### 인증 불필요 엔드포인트
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/refresh`
- `/health`
- `/swagger-ui/**`
- `/v3/api-docs/**`
- `/actuator/**`

### 인증 필요 엔드포인트
- 위 목록 외 모든 요청

## 실행 방법

### 사전 요구사항
- Java 25
- MySQL 8.0+
- Eureka Server 실행 중

### 환경변수
```bash
DB_USERNAME=root          # 데이터베이스 사용자명
DB_PASSWORD=password      # 데이터베이스 비밀번호
JWT_SECRET=your-secret    # JWT 서명 키 (256bit 이상 권장)
```

### 실행
```bash
./gradlew bootRun
```

### 접속
- **서비스**: http://localhost:8081
- **Swagger UI**: http://localhost:8081/swagger-ui.html
- **Health Check**: http://localhost:8081/health

## Gateway 연동

Gateway에서 JWT 검증 후 다음 헤더를 하위 서비스로 전달합니다:

| Header | Description |
|--------|-------------|
| `X-User-Id` | 사용자 ID |
| `X-User-Email` | 사용자 이메일 |
| `X-User-Role` | 사용자 권한 (ROLE_USER, ROLE_ADMIN) |

하위 서비스에서는 이 헤더를 읽어 인가(Authorization) 처리를 수행합니다.

## 향후 확장 예정

- [ ] OAuth2 소셜 로그인 (Google, Kakao, Naver)
- [ ] 이메일 인증
- [ ] 비밀번호 재설정
- [ ] 2단계 인증 (2FA)
