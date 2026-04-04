# PII 마스킹 & Privacy Mode

## 마스킹 파이프라인

문서 업로드 시 PII가 자동으로 마스킹되어 벡터DB에 저장됩니다.

```
[파일 업로드] → 파싱 → 청킹 → PII 마스킹 (Ollama/regex)
  → 마스킹된 텍스트로 임베딩 → Supabase 저장 (마스킹 content + pii_mapping)

[채팅 질의] → 질문 마스킹 → 벡터 검색 (마스킹된 컨텍스트)
  → OpenAI 질의 → 응답 언마스킹 (질문 PII + 문서 PII 복원) → 사용자
```

## 설정

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `PII_MASKING_ENABLED` | `true` | PII 마스킹 활성화 |
| `PII_REGEX_FALLBACK` | `true` | Ollama 실패 시 한국어 정규식 fallback |
| `OLLAMA_ENABLED` | `true` | Ollama LLM 기반 PII 감지 활성화 |

Ollama 비활성화 시 정규식만으로 PII를 감지합니다 (전화번호, 이메일, 주민번호, 카드번호, 계좌번호).

## Hybrid AI Setup

로컬 Ollama를 활용한 Privacy-Preserving 모드:

```bash
# 1. Ollama + pgvector 기동
docker compose --profile local-ai up -d

# 2. Ollama 모델 다운로드
docker exec pm-ollama ollama pull llama3.2:3b
docker exec pm-ollama ollama pull bge-m3

# 3. pm-agent .env 설정
OLLAMA_ENABLED=true
PII_MASKING_ENABLED=true
PRIVACY_MODE=security
USE_LOCAL_VECTORSTORE=true     # 로컬 pgvector 사용 시
```

## Privacy Mode

| Mode | 설명 |
|------|------|
| `performance` | OpenAI 우선 (빠른 응답, 클라우드 의존) |
| `security` | Ollama 우선 (PII 보호, 로컬 처리) |

## Ollama 모델 관리

```bash
ollama list                    # 설치된 모델 확인
ollama pull llama3.2:3b        # PII 감지용 (기본)
ollama pull llama3.2:1b        # 경량 대안
ollama pull bge-m3             # 임베딩용
ollama rm <모델명>              # 모델 삭제
```

모델 교체는 `pm-agent/.env`에서 설정:

| 환경변수 | 기본값 | 용도 |
|----------|--------|------|
| `OLLAMA_MODEL_PII` | `llama3.2:3b` | PII 감지 모델 |
| `OLLAMA_MODEL_LIGHT` | `llama3.2:3b` | 경량 LLM (라우팅, 평가 등) |
| `OLLAMA_EMBEDDING_MODEL` | `bge-m3` | 로컬 임베딩 모델 |

> 모델이 클수록 PII 감지 정확도가 높지만 응답 속도가 느려집니다. `llama3.2:3b`은 정확도와 속도의 균형점입니다.

## 프로젝트별 채팅 + 문서 자동 분석

문서 업로드 시 프로젝트별 격리된 RAG 검색과 자동 분석 질문 생성을 지원합니다.

```
[문서 업로드] → pm-document → Kafka(document.chunked + projectId)
  → pm-agent → PII 마스킹 → 임베딩 → Supabase 저장 (+project_id)
  → 자동 분석: 마스킹된 내용 → OpenAI 질문 생성 + 교차 분석
  → Kafka(document.analysis.completed) → pm-workflow 추천 질문 저장

[채팅] → pm-agent(question, project_id)
  → mask → retrieve(project_id 필터) → generate → unmask → 사용자
```

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `AUTO_ANALYSIS_ENABLED` | `true` | 임베딩 완료 후 자동 질문 생성 |
