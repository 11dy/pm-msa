#!/bin/bash
cd "$(dirname "$0")"

# 가상환경 활성화
source .venv/bin/activate

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload
