"""Auth smoke tests.

Full OTP flow exercising the DB is covered by integration tests against a real
Postgres (run via `pnpm --filter techbirds-api test`). Here we keep just the
behavior that doesn't need DB plumbing — JWT issuance, dependency overrides,
and the ApiClient cookie wiring.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient

from app.deps.auth import ACCESS_COOKIE, current_user
from app.main import app
from app.models.auth import User
from app.services.jwt import create_access_token, hash_token, verify_access, verify_refresh


@pytest.fixture
def fake_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="ada@techbirdsgroup.com",
        full_name="Ada Lovelace",
        is_active=True,
        is_employee=True,
        roles=[],
    )


def test_jwt_round_trip(fake_user: User) -> None:
    token = create_access_token(fake_user.id, roles=["employee"])
    payload = verify_access(token)
    assert payload is not None
    assert payload["sub"] == str(fake_user.id)
    assert payload["roles"] == ["employee"]


def test_refresh_token_rejected_as_access(fake_user: User) -> None:
    from app.services.jwt import create_refresh_token

    token, _ = create_refresh_token(fake_user.id)
    assert verify_access(token) is None  # wrong type
    assert verify_refresh(token) is not None


def test_hash_token_is_stable() -> None:
    assert hash_token("abc") == hash_token("abc")
    assert hash_token("abc") != hash_token("abd")


async def test_me_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        res = await c.get("/v1/auth/me")
    assert res.status_code == 401


async def test_me_returns_user_via_override(fake_user: User) -> None:
    async def _override() -> User:
        return fake_user

    app.dependency_overrides[current_user] = _override
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            res = await c.get("/v1/auth/me")
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == fake_user.email
    assert body["is_employee"] is True


async def test_otp_verify_rejects_bad_code_format() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        res = await c.post(
            "/v1/auth/otp/verify",
            json={"email": "ada@techbirdsgroup.com", "code": "abc123"},
        )
    assert res.status_code == 422


async def test_punch_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        res = await c.post("/v1/attendance/punch", json={})
    assert res.status_code == 401


async def test_access_cookie_with_invalid_token_returns_401() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test", cookies={ACCESS_COOKIE: "not-a-jwt"}
    ) as c:
        res = await c.get("/v1/auth/me")
    assert res.status_code == 401


# Sanity: an expired access token does not validate.
def test_expired_access_token_rejected(fake_user: User) -> None:
    from jose import jwt

    from app.config import get_settings

    s = get_settings()
    payload = {
        "sub": str(fake_user.id),
        "roles": [],
        "type": "access",
        "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
        "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
    }
    token = jwt.encode(payload, s.SECRET_KEY, algorithm="HS256")
    assert verify_access(token) is None
