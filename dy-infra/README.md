# dy-infra

Spring Cloud 기반 MSA 인프라 프로젝트

## 프로젝트 구조

```
dy-infra/
├── build.gradle              # 루트 빌드 설정 (공통 의존성)
├── settings.gradle           # 멀티모듈 설정
├── gradlew / gradlew.bat     # Gradle Wrapper
│
├── eureka-server/            # 서비스 디스커버리 서버
│   ├── build.gradle
│   └── src/main/
│       ├── java/com/dy/eurekaserver/
│       │   └── EurekaServerApplication.java
│       └── resources/
│           └── application.yml
│
└── gateway/                  # API Gateway
    ├── build.gradle
    └── src/main/
        ├── java/com/dy/gateway/
        │   ├── GatewayApplication.java
        │   ├── config/
        │   │   ├── JwtProperties.java    # JWT 설정
        │   │   └── CorsConfig.java       # CORS 설정
        │   └── filter/
        │       └── JwtAuthenticationFilter.java  # JWT 인증 필터
        └── resources/
            └── application.yml
```

## 기술 스택

| 구분 | 버전 |
|------|------|
| Java | 25 |
| Spring Boot | 4.0.2 |
| Spring Cloud | 2025.1.0 (Oakwood) |
| Gradle | 9.3.0 |

## 의존성

### 공통 (전체 서브모듈)

| 의존성 | 용도 |
|--------|------|
| `lombok` | 보일러플레이트 코드 감소 |
| `spring-boot-devtools` | 개발 시 자동 재시작 |
| `spring-boot-starter-test` | 테스트 프레임워크 |

### Eureka Server

| 의존성 | 용도 |
|--------|------|
| `spring-cloud-starter-netflix-eureka-server` | 서비스 레지스트리 |

### Gateway

| 의존성 | 용도 |
|--------|------|
| `spring-boot-starter-webflux` | Reactive 웹서버 (Netty) |
| `spring-cloud-gateway-server-webflux` | API Gateway |
| `spring-cloud-starter-netflix-eureka-client` | Eureka 클라이언트 |
| `jjwt-api`, `jjwt-impl`, `jjwt-jackson` | JWT 토큰 검증 |

## 아키텍처

```
┌─────────────────┐
│  Client Request │
│  (dy-web:3000)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Gateway      │ :8080 (API 진입점)
│   (WebFlux)     │
│                 │
│  - JWT 검증     │
│  - CORS 처리    │
│  - 라우팅       │
└────────┬────────┘
         │ 서비스 조회
         ▼
┌─────────────────┐
│  Eureka Server  │ :8761 (서비스 레지스트리)
└─────────────────┘
         ▲
         │ 서비스 등록
┌────────┴────────┐
│ 마이크로서비스들  │
│ dy-auth         │
│ (추가 예정)      │
└─────────────────┘
```

## Gateway 기능

### JWT 인증 필터

Gateway에서 JWT 토큰을 검증하고 사용자 정보를 헤더에 추가하여 하위 서비스로 전달합니다.

**인증 불필요 경로:**
- `/api/auth/**` - 인증 관련 API
- `/oauth2/**` - OAuth2 인증 시작
- `/login/oauth2/**` - OAuth2 콜백

**전달 헤더:**
| Header | Description |
|--------|-------------|
| `X-User-Id` | 사용자 ID |
| `X-User-Email` | 사용자 이메일 |
| `X-User-Role` | 사용자 권한 |

### CORS 설정

- **허용 Origin**: `http://localhost:3000` (dy-web)
- **허용 Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: 허용

### 라우팅 설정

| 경로 | 대상 서비스 |
|------|-------------|
| `/api/auth/**` | DY-AUTH |
| `/oauth2/**` | DY-AUTH |
| `/login/oauth2/**` | DY-AUTH |

## 실행 방법

### 1. Eureka Server 실행 (먼저)

```bash
./gradlew :eureka-server:bootRun
```

### 2. Gateway 실행

```bash
./gradlew :gateway:bootRun
```

### 3. 확인

- Eureka 대시보드: http://localhost:8761
- Gateway: http://localhost:8080

## 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Eureka Server | 8761 | 서비스 레지스트리 대시보드 |
| Gateway | 8080 | API 진입점 |
