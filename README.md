# dy-msa

Spring Cloud 기반 마이크로서비스 아키텍처 모노레포

## 프로젝트 구조

```
dy-msa/
├── README.md
│
└── dy-infra/                     # 인프라 모듈 (Spring Cloud)
    ├── build.gradle              # 루트 빌드 설정 (공통 의존성)
    ├── settings.gradle           # 멀티모듈 설정
    ├── gradlew / gradlew.bat     # Gradle Wrapper
    │
    ├── eureka-server/            # 서비스 디스커버리 서버
    │   ├── build.gradle
    │   └── src/main/
    │       ├── java/.../EurekaServerApplication.java
    │       └── resources/application.yml
    │
    └── gateway/                  # API Gateway
        ├── build.gradle
        └── src/main/
            ├── java/.../GatewayApplication.java
            └── resources/application.yml
```

## 모듈 설명

| 모듈 | 설명 |
|------|------|
| `dy-infra` | Spring Cloud 인프라 (Eureka, Gateway) |

## 기술 스택

| 구분 | 버전 |
|------|------|
| Java | 25 |
| Spring Boot | 4.0.2 |
| Spring Cloud | 2025.1.0 (Oakwood) |
| Gradle | 9.3.0 |

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
│ 마이크로서비스들  │
│ (추가 예정)      │
└─────────────────┘
```

## 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Eureka Server | 8761 | 서비스 레지스트리 대시보드 |
| Gateway | 8080 | API 진입점 |

## 실행 방법

```bash
# 1. Eureka Server 실행 (먼저)
cd dy-infra
./gradlew :eureka-server:bootRun

# 2. Gateway 실행
./gradlew :gateway:bootRun

# 3. 확인
# - Eureka 대시보드: http://localhost:8761
# - Gateway: http://localhost:8080
```

## 빌드

```bash
cd dy-infra
./gradlew build
```
