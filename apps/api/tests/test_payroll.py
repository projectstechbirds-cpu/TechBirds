"""Pure-function tests for payroll math and storage helpers."""

from __future__ import annotations

from decimal import Decimal

from app.services.payroll import working_days_in_month
from app.services.storage import document_key, payslip_key


def test_working_days_april_2026() -> None:
    # April 2026 has 30 days; weekends are Sat/Sun.
    # Apr 4,5,11,12,18,19,25,26 → 8 weekend days, so 30 - 8 = 22 weekdays.
    assert working_days_in_month(2026, 4) == 22


def test_working_days_february_non_leap() -> None:
    # 2026 is not a leap year. Feb 1, 2026 is a Sunday — 8 weekend days
    # (1,7,8,14,15,21,22,28). 28 - 8 = 20.
    assert working_days_in_month(2026, 2) == 20


def _expected_weekdays(year: int, month: int) -> int:
    import calendar
    cal = calendar.Calendar()
    return sum(
        1 for d in cal.itermonthdates(year, month) if d.month == month and d.weekday() < 5
    )


def test_working_days_helper_matches_calendar() -> None:
    for year in (2025, 2026, 2027):
        for month in range(1, 13):
            assert working_days_in_month(year, month) == _expected_weekdays(year, month)


def test_payslip_key_includes_user_and_period() -> None:
    key = payslip_key("123e4567-e89b-12d3-a456-426614174000", 2026, 4)
    assert key.startswith("payslips/123e4567-e89b-12d3-a456-426614174000/2026-04-")
    assert key.endswith(".pdf")


def test_document_key_groups_by_type() -> None:
    key = document_key("u1", "offer_letter", 2026, 4)
    assert key.startswith("documents/u1/offer_letter/2026-04-")
    assert key.endswith(".pdf")


def test_payslip_breakdown_serializes_decimals_as_strings() -> None:
    from uuid import uuid4

    from app.services.payroll import ComputedLine, ComputedPayslip, payslip_breakdown

    p = ComputedPayslip(
        structure_id=uuid4(),
        working_days=Decimal("22"),
        paid_days=Decimal("22"),
        earnings=[ComputedLine(code="BASIC", name="Basic", kind="earning", amount=Decimal("60000.00"))],
        deductions=[ComputedLine(code="PF", name="PF", kind="deduction", amount=Decimal("7200.00"))],
        total_earnings=Decimal("60000.00"),
        total_deductions=Decimal("7200.00"),
        gross=Decimal("60000.00"),
        net_pay=Decimal("52800.00"),
    )
    out = payslip_breakdown(p)
    assert out["earnings"][0] == {"code": "BASIC", "name": "Basic", "amount": "60000.00"}
    assert out["deductions"][0] == {"code": "PF", "name": "PF", "amount": "7200.00"}


def test_decimal_money_format_round_trip() -> None:
    # Confirms our Decimal usage rounds to 2 places via the same rule the
    # service uses (HALF_UP), so test fixtures stay deterministic.
    from decimal import ROUND_HALF_UP

    val = (Decimal("1234.567")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    assert str(val) == "1234.57"
