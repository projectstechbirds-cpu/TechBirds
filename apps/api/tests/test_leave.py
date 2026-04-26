"""Pure-function tests for the leave router helpers."""

from __future__ import annotations

from datetime import date

from app.routers.leave import _working_days


def test_working_days_excludes_weekends() -> None:
    # Mon 2026-04-13 .. Sun 2026-04-19 → 5 working days
    assert _working_days(date(2026, 4, 13), date(2026, 4, 19), set()) == 5.0


def test_working_days_excludes_holidays() -> None:
    holidays = {date(2026, 4, 14)}  # Tue
    assert _working_days(date(2026, 4, 13), date(2026, 4, 17), holidays) == 4.0


def test_working_days_single_weekday() -> None:
    assert _working_days(date(2026, 4, 13), date(2026, 4, 13), set()) == 1.0


def test_working_days_weekend_only_returns_zero() -> None:
    # Sat + Sun
    assert _working_days(date(2026, 4, 18), date(2026, 4, 19), set()) == 0.0


def test_working_days_holiday_on_weekend_does_not_double_count() -> None:
    # Holiday falls on Saturday — already excluded as weekend.
    holidays = {date(2026, 4, 18)}
    assert _working_days(date(2026, 4, 13), date(2026, 4, 19), holidays) == 5.0
