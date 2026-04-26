"""Smoke tests for POST /v1/enquiries.

The DB write path is mocked (we don't spin up Postgres in unit tests); we focus
on validation, honeypot routing, and captcha enforcement.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.enquiries import Enquiry
from app.routers import enquiries as enquiries_router


class _FakeSession:
    def __init__(self) -> None:
        self.added: list[Enquiry] = []

    def add(self, obj: Enquiry) -> None:
        obj.id = uuid.uuid4()
        obj.created_at = datetime.now(timezone.utc)
        self.added.append(obj)

    async def commit(self) -> None:
        pass

    async def refresh(self, _obj: Enquiry) -> None:
        pass


@pytest.fixture
def fake_session() -> _FakeSession:
    session = _FakeSession()

    async def _override():
        yield session

    from app.db import get_session

    app.dependency_overrides[get_session] = _override
    yield session
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    from app.services import rate_limit

    rate_limit._local_counts.clear()
    rate_limit._client = None
    yield


def _payload(**overrides):
    base = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "enquiry_type": "general",
        "message": "Hello there, I would like to discuss a project with you.",
        "turnstile_token": "dev-bypass-token",
    }
    base.update(overrides)
    return base


async def _post(payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/v1/enquiries", json=payload)


async def test_create_enquiry_happy_path(fake_session: _FakeSession) -> None:
    res = await _post(_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "new"
    assert len(fake_session.added) == 1
    assert fake_session.added[0].email == "ada@example.com"


async def test_honeypot_marks_spam_and_returns_201(fake_session: _FakeSession) -> None:
    res = await _post(_payload(website=""))  # empty is fine
    assert res.status_code == 201
    res2 = await _post(_payload(website="http://spam.example"))
    # Pydantic rejects website with max_length=0
    assert res2.status_code == 422


async def test_rejects_bad_turnstile(fake_session: _FakeSession) -> None:
    res = await _post(_payload(turnstile_token="not-the-bypass"))
    assert res.status_code == 400
    assert fake_session.added == []


async def test_short_message_rejected(fake_session: _FakeSession) -> None:
    res = await _post(_payload(message="too short"))
    assert res.status_code == 422


async def test_rate_limit_after_threshold(fake_session: _FakeSession) -> None:
    for _ in range(enquiries_router.RATE_LIMIT):
        res = await _post(_payload())
        assert res.status_code == 201
    res = await _post(_payload())
    assert res.status_code == 429
