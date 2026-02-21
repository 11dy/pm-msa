# pm-auth

PM-MSA 프로젝트의 인증/인가 서비스입니다. JWT 기반의 사용자 인증과 토큰 관리를 담당합니다.

## 프로젝트 구조

```
pm-auth/
└── src/main/java/com/pm/pmauth/
    ├── PmAuthApplication.java          # 메인 애플리케이션
    ├── config/
    │   ├── SecurityConfig.java         # Spring Security 설정
    │   ├── OAuth2Config.java           # OAuth2 설정
    │   └── OpenApiConfig.java          # Swagger/OpenAPI 설정
    ├── controller/
    │   ├── AuthController.java         # 인증 API 엔드포인트
    │   ├── OAuth2Controller.java       # OAuth2 API 엔드포인트
    │   └── HealthController.java       # 헬스체크 API
    ├── service/
    │   ├── AuthService.java            # 인증 비즈니스 로직
    │   └── OAuth2Service.java          # OAuth2 비즈니스 로직
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
    │   ├── GatewayAuthenticationFilter.java # Gateway 인증 필터
    │   └── CustomUserDetails.java      # 사용자 인증 정보
    ├── oauth2/
    │   ├── OAuth2Properties.java       # OAuth2 설정 프로퍼티
    │   ├── OAuth2Provider.java         # Provider enum
    │   ├── client/
    │   │   ├── OAuth2Client.java       # 인터페이스
    │   │   ├── OAuth2ClientFactory.java
    │   │   ├── GoogleOAuth2Client.java
    │   │   ├── KakaoOAuth2Client.java
    │   │   └── NaverOAuth2Client.java
    │   └── userinfo/
    │       ├── OAuth2UserInfo.java      # 인터페이스
    │       ├── OAuth2UserInfoFactory.java
    │       ├── GoogleUserInfo.java
    │       ├── KakaoUserInfo.java
    │       └── NaverUserInfo.java
    ├── dto/
    │   ├── request/
    │   │   ├── SignUpRequest.java      # 회원가입 요청
    │   │   ├── LoginRequest.java       # 로그인 요청
    │   │   └── TokenRefreshRequest.java # 토큰 갱신 요청
    │   └── response/
    │       ├── ApiResponse.java        # 공통 응답 형식
    │       ├── TokenResponse.java      # 토큰 응답
    │       ├── UserResponse.java       # 사용자 정보 응답
    │       ├── OAuth2UrlResponse.java  # OAuth2 URL 응답
    │       └── LinkedProvidersResponse.java # 연동 Provider 응답
    └── exception/
        ├── AuthException.java          # 인증 예외
        └── GlobalExceptionHandler.java # 전역 예외 처리
```

## 데이터베이스 스키마

> FK 제약조건 없이 설계 (애플리케이션 레벨에서 관계 관리)

```sql
-- 사용자 기본 정보
CREATE TABLE users (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL UNIQUE,
    user_nm     VARCHAR(100),
    act_st      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, SUSPENDED
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
    UNIQUE KEY uk_provider_provider_id (provider, provider_id)
);

-- JWT Refresh Token 관리
CREATE TABLE refresh_tokens (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## API 엔드포인트

### 인증 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/auth/signup` | 회원가입 | X |
| POST | `/api/auth/login` | 로그인 | X |
| POST | `/api/auth/refresh` | 토큰 갱신 | X |
| POST | `/api/auth/logout` | 로그아웃 | O |
| GET | `/api/auth/users/{userId}` | 사용자 조회 | O |
| GET | `/api/auth/validate` | 토큰 검증 | O |
| GET | `/health` | 헬스체크 | X |

### OAuth2 API

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/auth/oauth2/{provider}` | 소셜 로그인 URL 조회 | X |
| GET | `/api/auth/oauth2/callback/{provider}` | 소셜 로그인 콜백 | X |
| POST | `/api/auth/oauth2/link/{provider}` | 소셜 계정 연동 | O |
| DELETE | `/api/auth/oauth2/link/{provider}` | 소셜 계정 연동 해제 | O |
| GET | `/api/auth/oauth2/providers` | 연동된 소셜 계정 목록 | O |

**지원 Provider:** `google` (활성), `kakao` (준비중), `naver` (준비중)

## JWT 토큰 구조

### Access Token
- **만료 시간**: 30분 (설정 가능)
- **Payload**:
  ```json
  {
    "sub": "userId",
    "email": "user@example.com",
    "role": "ROLE_USER",
    "iss": "pm-auth",
    "iat": 1234567890,
    "exp": 1234569690
  }
  ```

### Refresh Token
- **만료 시간**: 7일 (설정 가능)
- **저장**: DB에 저장하여 관리 (다중 디바이스 지원, 강제 로그아웃 가능)

## 실행 방법

### 사전 요구사항
- Java 25
- MySQL 8.0+
- Eureka Server 실행 중

### 환경변수
```bash
DB_USERNAME=root
DB_PASSWORD=password
JWT_SECRET=your-256-bit-secret-key

# OAuth2 (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth2 (Kakao) - 준비중
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# OAuth2 (Naver) - 준비중
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
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

## 향후 확장 예정

- [x] OAuth2 소셜 로그인 (Google)
- [ ] OAuth2 소셜 로그인 (Kakao, Naver)
- [ ] 이메일 인증
- [ ] 비밀번호 재설정
- [ ] 2단계 인증 (2FA)
