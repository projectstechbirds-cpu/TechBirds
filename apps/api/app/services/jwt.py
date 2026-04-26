"""JWT helpers for the access + refresh token pair.

Access token   — short-lived (15 min default), readable claims, sub = user id.
Refresh token  — long-lived (7 days), only used by /auth/refresh; we also store
                 a SHA256 hash of it in user_sessions so we can revoke it.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from jose import JWTError, jwt

from app.config import get_settings

ALGO = "HS256"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, get_settings().SECRET_KEY, algorithm=ALGO)


def _decode(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, get_settings().SECRET_KEY, algorithms=[ALGO])
    except JWTError:
        return None


def create_access_token(user_id: UUID, *, roles: list[str] | None = None) -> str:
    s = get_settings()
    now = _now()
    return _encode(
        {
            "sub": str(user_id),
            "roles": roles or [],
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=s.ACCESS_TOKEN_TTL_MINUTES)).timestamp()),
        }
    )


def create_refresh_token(user_id: UUID) -> tuple[str, datetime]:
    """Returns (token, expires_at)."""
    s = get_settings()
    expires = _now() + timedelta(days=s.REFRESH_TOKEN_TTL_DAYS)
    jti = secrets.token_urlsafe(24)
    token = _encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "jti": jti,
            "iat": int(_now().timestamp()),
            "exp": int(expires.timestamp()),
        }
    )
    return token, expires


def verify_access(token: str) -> dict[str, Any] | None:
    payload = _decode(token)
    if not payload or payload.get("type") != "access":
        return None
    return payload


def verify_refresh(token: str) -> dict[str, Any] | None:
    payload = _decode(token)
    if not payload or payload.get("type") != "refresh":
        return None
    return payload


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
