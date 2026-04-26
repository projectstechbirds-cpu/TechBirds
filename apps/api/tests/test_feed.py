"""Tests for the feed router and its schemas."""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from pydantic import ValidationError

from app.routers.feed import POST_ROLES, _can_post
from app.schemas.feed import FeedPostCreate, ReactionToggle


def test_post_roles_set() -> None:
    assert POST_ROLES == {"admin", "super_admin", "hr"}


@dataclass
class _FakeRole:
    name: str


@dataclass
class _FakeUserRole:
    role: _FakeRole


@dataclass
class _FakeUser:
    roles: list[_FakeUserRole]


def _user_with(*role_names: str) -> _FakeUser:
    return _FakeUser(roles=[_FakeUserRole(role=_FakeRole(name=n)) for n in role_names])


def test_can_post_true_for_admin_roles() -> None:
    assert _can_post(_user_with("admin")) is True
    assert _can_post(_user_with("super_admin")) is True
    assert _can_post(_user_with("hr")) is True


def test_can_post_true_when_employee_also_holds_admin_role() -> None:
    assert _can_post(_user_with("employee", "hr")) is True


def test_can_post_false_for_employee_only() -> None:
    assert _can_post(_user_with("employee")) is False


def test_can_post_false_for_no_roles() -> None:
    assert _can_post(_user_with()) is False


def test_feed_post_create_requires_body() -> None:
    with pytest.raises(ValidationError):
        FeedPostCreate(body_md="")
    FeedPostCreate(body_md="hi")  # min_length=1 → 1 char is fine.


def test_feed_post_create_caps_body_length() -> None:
    with pytest.raises(ValidationError):
        FeedPostCreate(body_md="x" * 10_001)
    FeedPostCreate(body_md="x" * 10_000)


def test_feed_post_create_defaults() -> None:
    p = FeedPostCreate(body_md="hello")
    assert p.pinned is False
    assert p.attachments is None


def test_reaction_toggle_emoji_bounds() -> None:
    with pytest.raises(ValidationError):
        ReactionToggle(emoji="")
    with pytest.raises(ValidationError):
        ReactionToggle(emoji="x" * 9)
    # Typical emoji are well under 8 chars.
    ReactionToggle(emoji="👍")
    ReactionToggle(emoji="🎉")
