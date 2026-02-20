from fastapi import Header, HTTPException


def get_current_user(x_user_id: str = Header(None)) -> int:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")
