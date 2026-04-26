"""Pure-function tests for attendance router helpers."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from starlette.requests import Request

from app.routers.attendance import (
    _client_ip,
    _local_day_bounds,
    _pair_minutes,
    _today_local,
)


@dataclass
class _FakePunch:
    type: str
    created_at: datetime


def _utc(y: int, m: int, d: int, hh: int, mm: int) -> datetime:
    return datetime(y, m, d, hh, mm, tzinfo=timezone.utc)


def test_pair_minutes_simple_in_out_pair() -> None:
    entries = [
        _FakePunch(type="in", created_at=_utc(2026, 4, 13, 9, 0)),
        _FakePunch(type="out", created_at=_utc(2026, 4, 13, 17, 30)),
    ]
    assert _pair_minutes(entries) == 8 * 60 + 30  # 510


def test_pair_minutes_multiple_pairs_summed() -> None:
    entries = [
        _FakePunch(type="in", created_at=_utc(2026, 4, 13, 9, 0)),
        _FakePunch(type="out", created_at=_utc(2026, 4, 13, 12, 0)),
        _FakePunch(type="in", created_at=_utc(2026, 4, 13, 13, 0)),
        _FakePunch(type="out", created_at=_utc(2026, 4, 13, 17, 0)),
    ]
    assert _pair_minutes(entries) == 7 * 60  # 3h + 4h


def test_pair_minutes_unsorted_input_is_sorted_internally() -> None:
    # Same data as the simple pair, but reversed.
    entries = [
        _FakePunch(type="out", created_at=_utc(2026, 4, 13, 17, 30)),
        _FakePunch(type="in", created_at=_utc(2026, 4, 13, 9, 0)),
    ]
    assert _pair_minutes(entries) == 8 * 60 + 30


def test_pair_minutes_open_punch_counts_up_to_now() -> None:
    # An "in" with no matching "out" should accrue minutes against `now`.
    started = datetime.now(timezone.utc) - timedelta(minutes=45)
    entries = [_FakePunch(type="in", created_at=started)]
    minutes = _pair_minutes(entries)
    # Allow a 1-minute slack for the time it takes the test to run.
    assert 44 <= minutes <= 46


def test_pair_minutes_orphan_out_is_ignored() -> None:
    entries = [_FakePunch(type="out", created_at=_utc(2026, 4, 13, 9, 0))]
    assert _pair_minutes(entries) == 0


def test_pair_minutes_empty() -> None:
    assert _pair_minutes([]) == 0


def test_local_day_bounds_is_24_hours_apart() -> None:
    from datetime import date

    start, end = _local_day_bounds(date(2026, 4, 13))
    assert (end - start) == timedelta(days=1)
    assert start.tzinfo is not None
    # Local midnight in Asia/Kolkata is 18:30 UTC the previous day.
    assert start.utcoffset() == timedelta(hours=5, minutes=30)


def _make_request(headers: dict[str, str], client_host: str | None = "1.2.3.4") -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": (client_host, 12345) if client_host else None,
    }
    return Request(scope)


def test_client_ip_uses_forwarded_first_hop() -> None:
    req = _make_request({"x-forwarded-for": "10.0.0.1, 192.168.1.1"})
    assert _client_ip(req) == "10.0.0.1"


def test_client_ip_falls_back_to_socket() -> None:
    req = _make_request({})
    assert _client_ip(req) == "1.2.3.4"


def test_client_ip_handles_missing_client() -> None:
    req = _make_request({}, client_host=None)
    assert _client_ip(req) == "0.0.0.0"


def test_today_local_returns_a_date() -> None:
    from datetime import date as date_cls

    assert isinstance(_today_local(), date_cls)
