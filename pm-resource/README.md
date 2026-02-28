# pm-resource

PM-MSA 프로젝트의 리소스 관리 서비스입니다. 프로젝트 CRUD를 담당합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Boot 4.0.2 (WebMVC) |
| Language | Java 25 |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL (dy_db) |
| Service Discovery | Eureka Client |

## 프로젝트 구조

```
pm-resource/
└── src/main/java/com/pm/pmresource/
    ├── PmResourceApplication.java
    ├── config/
    │   ├── GatewayAuthenticationFilter.java   # Gateway 헤더 기반 인증
    │   ├── SecurityConfig.java                # Spring Security 설정
    │   └── JpaConfig.java                     # JPA Auditing 설정
    ├── controller/
    │   └── ProjectController.java             # 프로젝트 CRUD
    ├── service/
    │   └── ProjectService.java                # 프로젝트 비즈니스 로직
    ├── domain/
    │   ├── entity/
    │   │   ├── BaseEntity.java                # 공통 (createdAt, updatedAt)
    │   │   └── Project.java                   # 프로젝트
    │   └── repository/
    │       └── ProjectRepository.java
    ├── dto/
    │   ├── request/
    │   │   ├── ProjectCreateRequest.java
    │   │   └── ProjectUpdateRequest.java
    │   └── response/
    │       └── ProjectResponse.java
    └── exception/
        └── GlobalExceptionHandler.java
```

## 도메인 모델

### Project (프로젝트)

| 필드 | 설명 | 비고 |
|------|------|------|
| userId | 소유자 ID | Gateway에서 X-User-Id 헤더로 전달 |
| name | 프로젝트 이름 | 최대 200자 |
| description | 프로젝트 설명 | nullable |

## API 엔드포인트

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/project` | 내 프로젝트 목록 | O |
| POST | `/api/project` | 프로젝트 생성 | O |
| PUT | `/api/project/{id}` | 프로젝트 수정 | O |

## 환경변수

```bash
DB_USERNAME=root
DB_PASSWORD=password
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/dy_db
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka/
```

## 실행 방법

### 사전 요구사항
- Java 25
- MySQL 8.0+ (dy_db 데이터베이스)
- Eureka Server 실행 중

### 실행
```bash
DB_PASSWORD=your_password ./gradlew bootRun
```

### 접속
- **서비스**: http://localhost:8085
- **Health Check**: http://localhost:8085/health
