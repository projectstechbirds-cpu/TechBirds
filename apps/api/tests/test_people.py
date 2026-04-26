"""Pure-function tests for people helpers."""

from __future__ import annotations

from datetime import date

from app.routers.people import _days_until


def test_days_until_today() -> None:
    today = date(2026, 4, 25)
    assert _days_until(today, 4, 25) == 0


def test_days_until_future_in_same_year() -> None:
    today = date(2026, 4, 25)
    assert _days_until(today, 5, 1) == 6


def test_days_until_wraps_to_next_year() -> None:
    today = date(2026, 12, 28)
    # Jan 3, 2027 is 6 days away
    assert _days_until(today, 1, 3) == 6


def test_days_until_feb_29_in_non_leap_year() -> None:
    # 2026 is not a leap year; Feb 29 should fall back to Feb 28.
    today = date(2026, 2, 1)
    assert _days_until(today, 2, 29) == 27
