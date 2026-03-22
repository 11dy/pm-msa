# pm-document

PM-MSA 프로젝트의 문서 처리 서비스입니다. 파일 업로드, 텍스트 파싱, 청킹을 담당하며 Kafka를 통해 다운스트림 서비스에 이벤트를 전파합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | FastAPI 0.115.x |
| Language | Python 3.11+ |
| File Parsing | PyMuPDF (PDF), python-docx (DOCX), openpyxl (Excel), olefile (HWP), 내장 (TXT/MD/CSV) |
| Text Splitting | LangChain RecursiveCharacterTextSplitter |
| Message Broker | Kafka (confluent-kafka) |
| Service Discovery | Eureka (py-eureka-client) |
| HTTP Client | httpx (pm-workflow 내부 통신) |

## 프로젝트 구조

```
pm-document/
├── run.sh                      # 실행 스크립트
├── requirements.txt
├── Dockerfile
│
└── app/
    ├── main.py                 # FastAPI 앱 (lifespan, Eureka 등록)
    ├── config.py               # Pydantic Settings 설정
    ├── dependencies.py         # 인증 의존성 (X-User-Id 헤더)
    │
    ├── api/
    │   └── documents.py        # 문서 업로드 API 엔드포인트
    │
    ├── models/
    │   └── schemas.py          # Pydantic 스키마 (Request/Response)
    │
    ├── services/
    │   ├── document_service.py # 업로드 + 백그라운드 처리 오케스트레이션
    │   ├── storage_service.py  # 로컬 파일 저장소
    │   ├── parser_service.py   # 텍스트 추출 (PDF, DOCX, TXT)
    │   └── chunker_service.py  # 텍스트 청킹
    │
    └── kafka/
        └── producer.py         # Kafka 이벤트 발행
```

## 처리 흐름

```
파일 업로드 (multipart/form-data)
     │
     ▼
로컬 저장 (uploads/{userId}/{uuid}.ext)
     │
     ▼
pm-workflow 내부 API로 메타데이터 등록
     │
     ▼
Kafka: document.uploaded 이벤트 발행
     │
     ▼  (백그라운드)
텍스트 추출 (PyMuPDF / python-docx / UTF-8)
     │
     ▼
텍스트 청킹 (RecursiveCharacterTextSplitter)
     │
     ▼
Kafka: document.chunked 이벤트 발행
     │
     ▼  (pm-agent가 소비)
임베딩 생성 → pgvector 저장
```

## API 엔드포인트

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/documents/upload` | 문서 업로드 (FormData: file, project_id) | O (X-User-Id) |

### 업로드 요청 예시

```bash
curl -X POST http://localhost:8082/api/documents/upload \
  -H "X-User-Id: 1" \
  -F "file=@document.pdf" \
  -F "project_id=1"
```

### 지원 파일 형식

| 확장자 | 파서 |
|--------|------|
| .pdf | PyMuPDF |
| .docx | python-docx |
| .txt | UTF-8 read |
| .md | UTF-8 read |
| .csv | UTF-8 read |
| .xlsx, .xls | openpyxl |
| .hwp | olefile |

## 환경변수

```bash
# .env
EUREKA_SERVER=http://localhost:8761/eureka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
PM_WORKFLOW_URL=http://localhost:8084
UPLOAD_DIR=./uploads
```

## 실행 방법

### 사전 요구사항
- Python 3.11+
- pm-workflow 실행 중 (메타데이터 등록)
- Kafka 실행 중 (이벤트 발행)

### 실행

```bash
cd pm-document

# 방법 1: run.sh 사용 (venv 자동 생성, 중복 실행 방지)
./run.sh

# 방법 2: 수동 실행
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8082 --reload
```

> `run.sh`는 `.gitignore`에 포함되어 있습니다. 최초 클론 시 직접 생성하거나 수동 실행하세요.

### 접속
- **서비스**: http://localhost:8082
- **Swagger UI**: http://localhost:8082/docs

## Kafka 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| document.uploaded | pm.document.events | 파일 업로드 완료 |
| document.chunked | pm.document.events | 텍스트 청킹 완료 |
| document.failed | pm.document.events | 처리 실패 |

### Phase 6 변경사항

`document.chunked` 이벤트에 `projectId` 필드가 추가되었습니다. `process_document()`에 `project_id` 파라미터가 전달되어, 다운스트림(pm-agent)에서 프로젝트별 벡터 저장이 가능합니다.

```json
{
  "type": "document.chunked",
  "documentId": 1,
  "userId": 1,
  "projectId": 3,
  "chunks": [...]
}
```
