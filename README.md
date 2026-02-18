# pm-msa (Personal Manager)

Spring Cloud 기반 마이크로서비스 아키텍처 모노레포

## 프로젝트 구조

```
pm-msa/
├── README.md
│
├── pm-infra/                     # 인프라 모듈 (Spring Cloud)
│   ├── build.gradle              # 루트 빌드 설정 (공통 의존성)
│   ├── settings.gradle           # 멀티모듈 설정
│   ├── gradlew / gradlew.bat     # Gradle Wrapper
│   │
│   ├── eureka-server/            # 서비스 디스커버리 서버
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── java/.../EurekaServerApplication.java
│   │       └── resources/application.yml
│   │
│   └── gateway/                  # API Gateway
│       ├── build.gradle
│       └── src/main/
│           ├── java/.../GatewayApplication.java
│           └── resources/application.yml
│
├── pm-auth/                      # 인증 서비스 모듈
│   ├── build.gradle
│   └── src/main/
│
└── pm-web/                       # 프론트엔드 (Next.js)
    ├── package.json
    └── src/
```

## 모듈 설명

| 모듈 | 설명 |
|------|------|
| `pm-infra` | Spring Cloud 인프라 (Eureka, Gateway) |
| `pm-auth` | 인증/인가 서비스 (JWT, OAuth2) |
| `pm-web` | 프론트엔드 (Next.js) |

## 기술 스택

| 구분 | 버전 |
|------|------|
| Java | 25 |
| Spring Boot | 4.0.2 |
| Spring Cloud | 2025.1.0 (Oakwood) |
| Gradle | 9.3.0 |
| Next.js | 16.x |

## 아키텍처

```
┌─────────────────┐
│  Client Request │
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
┌────────┴────────┐
│ pm-auth         │ :8081 (인증 서비스)
│ (추가 예정)      │
└─────────────────┘
```

## 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Eureka Server | 8761 | 서비스 레지스트리 대시보드 |
| Gateway | 8080 | API 진입점 |
| pm-auth | 8081 | 인증 서비스 |
| pm-web | 3000 | 프론트엔드 |

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

# 4. 프론트엔드 실행
cd ../pm-web
npm run dev

# 5. 확인
# - Eureka 대시보드: http://localhost:8761
# - Gateway: http://localhost:8080
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

# 프론트엔드 빌드
cd pm-web
npm run build
```
