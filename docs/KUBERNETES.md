# Kubernetes (로컬)

Docker Desktop Kubernetes를 사용한 로컬 클러스터 배포.
인프라(MySQL, Kafka, Redis)는 Docker Compose로, 앱 서비스만 K8s에 배포합니다.

## 통신 구조

IntelliJ 로컬 개발과 K8s 배포 모두 동일한 포트로 접근합니다.

```
┌─ IntelliJ 로컬 개발 ──────────────────────────────┐
│  브라우저 → localhost:3000 (npm run dev)            │
│          → localhost:8080 (Gateway bootRun)        │
│  인프라   → Docker Compose (MySQL, Kafka, Redis)   │
└────────────────────────────────────────────────────┘

┌─ K8s 배포 ─────────────────────────────────────────┐
│  브라우저 → localhost:3000 (LoadBalancer → pm-web)   │
│          → localhost:8080 (LoadBalancer → gateway)  │
│  인프라   → Docker Compose (MySQL, Kafka, Redis)    │
│  K8s Pod → host.docker.internal으로 인프라 접근      │
└─────────────────────────────────────────────────────┘
```

### Service 타입

| 서비스 | K8s Service 타입 | 외부 접근 |
|--------|-----------------|----------|
| gateway | LoadBalancer | localhost:8080 |
| pm-web | LoadBalancer | localhost:3000 |
| 나머지 | ClusterIP | K8s 내부 + Eureka 디스커버리 |

Docker Desktop의 LoadBalancer 구현이 localhost에 직접 매핑하므로 Ingress Controller가 불필요합니다.

## 사전 준비

- Docker Desktop에서 Kubernetes 활성화
- `k8s/secret.yaml` 생성 (`.gitignore` 대상)
- Docker Compose 인프라 실행: `docker compose up -d`

## 이미지 빌드 & 배포

```bash
# 전체 이미지 빌드
./k8s/build.sh

# 특정 서비스만 빌드
./k8s/build.sh pm-auth

# K8s 배포
kubectl apply -k k8s/

# 상태 확인
kubectl get pods -n pm-msa

# 전체 삭제
kubectl delete all --all -n pm-msa
```

## 코드 수정 후 재배포

```bash
./k8s/build.sh pm-auth                                # 변경된 서비스만 빌드
kubectl rollout restart deployment/pm-auth -n pm-msa   # Pod 재시작
```

## 인프라 분리 설계

K8s에는 stateless 앱 서비스만 배포하고, stateful 인프라는 Docker Compose로 운영합니다.

```
Docker Compose (인프라)          K8s (앱 서비스)
├── mysql       :3306            ├── eureka-server
├── kafka       :9092            ├── gateway        (LoadBalancer)
├── zookeeper   :2181            ├── pm-auth
├── redis       :6379            ├── pm-document
└── kafka-ui    :8090            ├── pm-agent
                                 ├── pm-workflow
                                 └── pm-web          (LoadBalancer)
```

**이유:**
- Docker Desktop Stop/Restart 시 K8s PVC 데이터 유실 방지
- 클러스터 리셋해도 DB/Kafka 데이터 안전
- K8s는 앱 배포/스케일링에만 집중

## DB per Service

| DB | 소유 서비스 | 테이블 |
|----|-----------|--------|
| `dy_db` | pm-auth | users, user_auth, refresh_tokens |
| `pm_workflow` | pm-workflow | project, documents, agents, conversations, messages, ... |
| Supabase pgvector | pm-agent | document_chunks |

K8s Pod에서 MySQL 접근 시 `host.docker.internal:3306`을 사용합니다 (ConfigMap 설정).
