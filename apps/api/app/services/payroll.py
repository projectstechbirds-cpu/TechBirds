"""Payroll computation and PDF generation.

Compute is intentionally simple for MVP: monthly amounts come straight from the
SalaryComponent rows on the active SalaryStructure. Proration runs on
(paid_days / working_days). Statutory components (PF/ESI/TDS) are modelled as
plain deductions for now — finance can override per-employee via salary
structure rows. Form 24Q + bank advice export ship in §6.6.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import SalaryComponent, SalaryStructure


def _q(value: Decimal | float) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass
class ComputedLine:
    code: str
    name: str
    kind: str  # earning | deduction
    amount: Decimal


@dataclass
class ComputedPayslip:
    structure_id: UUID
    working_days: Decimal
    paid_days: Decimal
    earnings: list[ComputedLine]
    deductions: list[ComputedLine]
    total_earnings: Decimal
    total_deductions: Decimal
    gross: Decimal
    net_pay: Decimal


def working_days_in_month(year: int, month: int) -> int:
    """Inclusive weekday count, Mon–Fri. Holidays are NOT subtracted here —
    the company's CTC contracts are full-month assumptions, and unpaid leave is
    captured via `paid_days` already."""
    cal = calendar.Calendar()
    return sum(1 for d in cal.itermonthdates(year, month) if d.month == month and d.weekday() < 5)


async def active_structure(
    session: AsyncSession, user_id: UUID, on_date: date
) -> SalaryStructure | None:
    return await session.scalar(
        select(SalaryStructure)
        .where(
            SalaryStructure.user_id == user_id,
            SalaryStructure.effective_from <= on_date,
        )
        .order_by(SalaryStructure.effective_from.desc())
        .limit(1)
    )


async def compute_payslip(
    session: AsyncSession,
    *,
    user_id: UUID,
    year: int,
    month: int,
    paid_days: Decimal | float,
) -> ComputedPayslip | None:
    """Compute a single payslip. Returns None if no salary structure is active."""
    on_date = date(year, month, 1)
    structure = await active_structure(session, user_id, on_date)
    if structure is None:
        return None
    if (
        structure.effective_to is not None
        and structure.effective_to < on_date
    ):
        return None

    components = (
        await session.scalars(
            select(SalaryComponent)
            .where(SalaryComponent.structure_id == structure.id)
            .order_by(SalaryComponent.sort_order, SalaryComponent.id)
        )
    ).all()

    wd = Decimal(working_days_in_month(year, month))
    pd = Decimal(paid_days)
    if pd > wd:
        pd = wd
    factor = (pd / wd) if wd > 0 else Decimal(0)

    earnings: list[ComputedLine] = []
    deductions: list[ComputedLine] = []
    for c in components:
        amt = _q(Decimal(c.monthly_amount) * factor)
        line = ComputedLine(code=c.code, name=c.name, kind=c.kind, amount=amt)
        if c.kind == "earning":
            earnings.append(line)
        elif c.kind == "deduction":
            deductions.append(line)

    total_earnings = _q(sum((l.amount for l in earnings), Decimal(0)))
    total_deductions = _q(sum((l.amount for l in deductions), Decimal(0)))
    net = _q(total_earnings - total_deductions)

    return ComputedPayslip(
        structure_id=structure.id,
        working_days=wd,
        paid_days=_q(pd),
        earnings=earnings,
        deductions=deductions,
        total_earnings=total_earnings,
        total_deductions=total_deductions,
        gross=total_earnings,
        net_pay=net,
    )


def payslip_breakdown(p: ComputedPayslip) -> dict:
    """JSON-safe snapshot persisted alongside the payslip row."""
    return {
        "earnings": [
            {"code": l.code, "name": l.name, "amount": str(l.amount)} for l in p.earnings
        ],
        "deductions": [
            {"code": l.code, "name": l.name, "amount": str(l.amount)} for l in p.deductions
        ],
    }
