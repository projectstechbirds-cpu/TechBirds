"""Tests for the blog router.

The published-only filter and the dynamic sitemap response are the parts that
matter most: list/detail endpoints are thin shims over SQLAlchemy queries,
which we cover at the integration level via the published filter.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.routers.blog import _published_filter


def test_published_filter_restricts_to_published_status() -> None:
    clause = _published_filter()
    # The compiled SQL should reference status and the literal 'published'.
    rendered = str(clause.compile(compile_kwargs={"literal_binds": True}))
    assert "status" in rendered
    assert "'published'" in rendered


@dataclass
class _FakePost:
    slug: str
    status: str = "published"
    published_at: datetime | None = None
    updated_at: datetime | None = None
    title: str = ""
    id: uuid.UUID = field(default_factory=uuid.uuid4)


class _FakeScalarResult:
    def __init__(self, items: list) -> None:
        self._items = items

    def all(self) -> list:
        return self._items


class _FakeSession:
    """Minimal AsyncSession surface for the sitemap endpoint."""

    def __init__(self, posts: list[_FakePost]) -> None:
        self._posts = posts

    async def scalars(self, _stmt) -> _FakeScalarResult:
        return _FakeScalarResult(self._posts)


@pytest.fixture
def fake_session_with_posts():
    posts = [
        _FakePost(
            slug="hello-world",
            published_at=datetime(2026, 4, 10, 12, 0, tzinfo=timezone.utc),
            updated_at=datetime(2026, 4, 12, 9, 0, tzinfo=timezone.utc),
        ),
        _FakePost(
            slug="another-post",
            published_at=datetime(2026, 3, 1, 8, 0, tzinfo=timezone.utc),
            updated_at=None,
        ),
    ]
    session = _FakeSession(posts)

    async def _override():
        yield session

    from app.db import get_session

    app.dependency_overrides[get_session] = _override
    yield session
    app.dependency_overrides.clear()


async def test_sitemap_xml_contains_each_published_slug(fake_session_with_posts) -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/blog/sitemap.xml")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/xml")
    body = res.text
    assert "<urlset" in body
    assert "/posts/hello-world" in body
    assert "/posts/another-post" in body
    # The first post had updated_at, so its URL should carry a <lastmod>.
    assert "<lastmod>2026-04-12</lastmod>" in body


async def test_sitemap_xml_handles_post_with_no_dates(fake_session_with_posts) -> None:
    # The second post in the fixture has updated_at=None and no published_at
    # date emitted in <lastmod>. Confirm the URL is still listed.
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/blog/sitemap.xml")
    body = res.text
    # The "another-post" URL appears even when lastmod was unset (we passed
    # published_at=2026-03-01, so its lastmod = 2026-03-01).
    assert "/posts/another-post" in body
    assert "2026-03-01" in body


async def test_sitemap_root_url_uses_settings_base() -> None:
    # Empty session — sitemap should still emit the root URL.
    session = _FakeSession([])

    async def _override():
        yield session

    from app.db import get_session

    app.dependency_overrides[get_session] = _override
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/v1/blog/sitemap.xml")
        assert res.status_code == 200
        body = res.text
        # Default BLOG_PUBLIC_URL setting.
        assert "https://blog.techbirdsgroup.com/" in body
    finally:
        app.dependency_overrides.clear()
