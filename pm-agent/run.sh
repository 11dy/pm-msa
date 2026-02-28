#!/bin/bash
cd "$(dirname "$0")"

PORT=8083

# 이미 실행 중이면 종료
if lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[pm-agent] Already running on port $PORT"
    exit 0
fi

# 가상환경이 없으면 생성 + 의존성 설치
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
