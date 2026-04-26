"""Tests for the documents router and its supporting schemas."""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from pydantic import ValidationError

from app.routers.documents import (
    ADMIN_ROLES,
    ALLOWED_DOC_TYPES,
    MAX_BYTES,
    _has,
    _require_admin,
)
from app.schemas.documents import DocumentDelete


def test_allowed_doc_types_matches_spec() -> None:
    # The 8 doc types from §4.10 of the master spec.
    assert ALLOWED_DOC_TYPES == {
        "offer_letter",
        "hike_letter",
        "form_16",
        "form_26as",
        "relieving_letter",
        "id_card",
        "fnf_letter",
        "experience_letter",
    }


def test_max_bytes_is_ten_megabytes() -> None:
    assert MAX_BYTES == 10 * 1024 * 1024


def test_admin_roles_set() -> None:
    assert ADMIN_ROLES == {"super_admin", "hr"}


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


def test_has_returns_true_when_role_intersects() -> None:
    assert _has(_user_with("hr"), ADMIN_ROLES) is True
    assert _has(_user_with("employee", "super_admin"), ADMIN_ROLES) is True


def test_has_returns_false_when_no_overlap() -> None:
    assert _has(_user_with("employee"), ADMIN_ROLES) is False
    assert _has(_user_with(), ADMIN_ROLES) is False


def test_require_admin_raises_for_non_admin() -> None:
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        _require_admin(_user_with("employee"))
    assert exc.value.status_code == 403


def test_require_admin_accepts_hr_and_super_admin() -> None:
    # Should not raise.
    _require_admin(_user_with("hr"))
    _require_admin(_user_with("super_admin"))


def test_document_delete_requires_min_20_chars() -> None:
    with pytest.raises(ValidationError):
        DocumentDelete(reason="too short")
    with pytest.raises(ValidationError):
        DocumentDelete(reason="x" * 19)
    # Exactly 20 chars is fine.
    DocumentDelete(reason="x" * 20)


def test_document_delete_rejects_overly_long_reason() -> None:
    with pytest.raises(ValidationError):
        DocumentDelete(reason="x" * 501)
    # 500 is the documented cap.
    DocumentDelete(reason="x" * 500)
