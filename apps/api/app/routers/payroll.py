"""Payroll: salary structures, runs, payslips.

Roles (§4.10):
  - Employees see only their own released payslips.
  - HR / payroll roles can manage structures, run payroll, release.
  - Only `super_admin` and `payroll` may delete a payslip (with a reason).
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.deps.auth import current_user, role_names
from app.models.auth import AuditLog, User
from app.models.payroll import (
    PayrollRun,
    Payslip,
    SalaryComponent,
    SalaryStructure,
)
from app.models.people import EmployeeProfile
from app.schemas.documents import SignedUrlOut
from app.schemas.payroll import (
    PayrollRunCreate,
    PayrollRunOut,
    PayslipBreakdown,
    PayslipDelete,
    PayslipOut,
    SalaryStructureCreate,
    SalaryStructureOut,
)
from app.services.email import send_email
from app.services.payroll import (
    compute_payslip,
    payslip_breakdown,
    working_days_in_month,
)
from app.services.pdf import render_payslip_html, render_pdf
from app.services.storage import get_storage, payslip_key

router = APIRouter(prefix="/payroll", tags=["payroll"])

ADMIN_ROLES = {"admin", "super_admin", "hr", "payroll"}
PAYROLL_ROLES = {"super_admin", "hr", "payroll"}
DELETE_ROLES = {"super_admin", "payroll"}

PERIOD_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _has(user: User, allowed: set[str]) -> bool:
    return bool(set(role_names(user)).intersection(allowed))


def _require(user: User, allowed: set[str]) -> None:
    if not _has(user, allowed):
        raise HTTPException(status_code=403, detail="Forbidden")


def _period_label(year: int, month: int) -> str:
    return f"{PERIOD_NAMES[month]} {year}"


async def _payslip_to_out(session: AsyncSession, p: Payslip) -> PayslipOut:
    run = await session.get(PayrollRun, p.payroll_run_id)
    user = await session.get(User, p.user_id)
    profile = await session.get(EmployeeProfile, p.user_id)
    breakdown = PayslipBreakdown.model_validate(p.breakdown) if p.breakdown else None
    return PayslipOut(
        id=p.id,
        payroll_run_id=p.payroll_run_id,
        user_id=p.user_id,
        user_name=user.full_name if user else None,
        employee_code=profile.employee_code if profile else None,
        year=run.year if run else 0,
        month=run.month if run else 0,
        working_days=Decimal(p.working_days),
        paid_days=Decimal(p.paid_days),
        gross=Decimal(p.gross),
        total_earnings=Decimal(p.total_earnings),
        total_deductions=Decimal(p.total_deductions),
        net_pay=Decimal(p.net_pay),
        breakdown=breakdown,
        has_pdf=bool(p.pdf_r2_key),
        generated_at=p.generated_at,
        deleted_at=p.deleted_at,
    )


# ─── Salary structures ───────────────────────────────────────────────────────


@router.post(
    "/structures",
    response_model=SalaryStructureOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_structure(
    payload: SalaryStructureCreate,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> SalaryStructureOut:
    _require(user, PAYROLL_ROLES)
    structure = SalaryStructure(
        user_id=payload.user_id,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
        ctc_annual=payload.ctc_annual,
        notes=payload.notes,
    )
    session.add(structure)
    await session.flush()
    for c in payload.components:
        session.add(SalaryComponent(structure_id=structure.id, **c.model_dump()))
    await session.commit()
    return await _structure_to_out(session, structure.id)


@router.get("/structures/{user_id}", response_model=list[SalaryStructureOut])
async def list_structures(
    user_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SalaryStructureOut]:
    if user.id != user_id:
        _require(user, PAYROLL_ROLES)
    rows = (
        await session.scalars(
            select(SalaryStructure)
            .where(SalaryStructure.user_id == user_id)
            .order_by(desc(SalaryStructure.effective_from))
        )
    ).all()
    return [await _structure_to_out(session, r.id) for r in rows]


async def _structure_to_out(session: AsyncSession, structure_id: UUID) -> SalaryStructureOut:
    structure = await session.get(SalaryStructure, structure_id)
    if structure is None:
        raise HTTPException(status_code=404, detail="Not found")
    components = (
        await session.scalars(
            select(SalaryComponent)
            .where(SalaryComponent.structure_id == structure_id)
            .order_by(SalaryComponent.sort_order, SalaryComponent.id)
        )
    ).all()
    return SalaryStructureOut(
        id=structure.id,
        user_id=structure.user_id,
        effective_from=structure.effective_from,
        effective_to=structure.effective_to,
        ctc_annual=Decimal(structure.ctc_annual),
        notes=structure.notes,
        created_at=structure.created_at,
        components=[
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "kind": c.kind,
                "monthly_amount": Decimal(c.monthly_amount),
                "is_taxable": c.is_taxable,
                "sort_order": c.sort_order,
            }
            for c in components
        ],
    )


# ─── Payroll runs ────────────────────────────────────────────────────────────


@router.get("/runs", response_model=list[PayrollRunOut])
async def list_runs(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PayrollRunOut]:
    _require(user, PAYROLL_ROLES)
    rows = (
        await session.scalars(
            select(PayrollRun).order_by(desc(PayrollRun.year), desc(PayrollRun.month))
        )
    ).all()
    return [PayrollRunOut.model_validate(r) for r in rows]


@router.post("/runs", response_model=PayrollRunOut, status_code=status.HTTP_201_CREATED)
async def create_run(
    payload: PayrollRunCreate,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> PayrollRunOut:
    _require(user, PAYROLL_ROLES)
    existing = await session.scalar(
        select(PayrollRun).where(
            PayrollRun.year == payload.year, PayrollRun.month == payload.month
        )
    )
    if existing is not None:
        raise HTTPException(status_code=400, detail="Run already exists for this period")
    run = PayrollRun(
        year=payload.year, month=payload.month, notes=payload.notes, created_by=user.id
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)
    return PayrollRunOut.model_validate(run)


@router.post("/runs/{run_id}/compute", response_model=PayrollRunOut)
async def compute_run(
    run_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> PayrollRunOut:
    _require(user, PAYROLL_ROLES)
    run = await session.get(PayrollRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Not found")
    if run.status not in ("draft", "locked"):
        raise HTTPException(status_code=400, detail=f"Run is {run.status}")

    employees = (
        await session.scalars(
            select(User).where(User.is_active.is_(True), User.is_employee.is_(True))
        )
    ).all()

    wd = Decimal(working_days_in_month(run.year, run.month))
    for emp in employees:
        existing = await session.scalar(
            select(Payslip).where(
                Payslip.payroll_run_id == run.id, Payslip.user_id == emp.id
            )
        )
        if existing is not None:
            continue
        # MVP: paid_days = working_days. Phase 6.6 will subtract unpaid leave.
        result = await compute_payslip(
            session,
            user_id=emp.id,
            year=run.year,
            month=run.month,
            paid_days=wd,
        )
        if result is None:
            continue
        slip = Payslip(
            payroll_run_id=run.id,
            user_id=emp.id,
            structure_id=result.structure_id,
            working_days=result.working_days,
            paid_days=result.paid_days,
            gross=result.gross,
            total_earnings=result.total_earnings,
            total_deductions=result.total_deductions,
            net_pay=result.net_pay,
            breakdown=payslip_breakdown(result),
        )
        session.add(slip)

    run.status = "computed"
    run.computed_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(run)
    return PayrollRunOut.model_validate(run)


@router.post("/runs/{run_id}/release", response_model=PayrollRunOut)
async def release_run(
    run_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> PayrollRunOut:
    _require(user, PAYROLL_ROLES)
    run = await session.get(PayrollRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Not found")
    if run.status != "computed":
        raise HTTPException(status_code=400, detail="Run must be computed first")

    slips = (
        await session.scalars(
            select(Payslip).where(
                Payslip.payroll_run_id == run.id, Payslip.deleted_at.is_(None)
            )
        )
    ).all()
    storage = get_storage()
    settings = get_settings()
    for slip in slips:
        if slip.pdf_r2_key:
            continue
        emp = await session.get(User, slip.user_id)
        profile = await session.get(EmployeeProfile, slip.user_id)
        breakdown = PayslipBreakdown.model_validate(slip.breakdown) if slip.breakdown else None
        if breakdown is None:
            continue
        # Re-shape into ComputedPayslip-compatible object for the template.
        from app.services.payroll import ComputedLine, ComputedPayslip

        comp = ComputedPayslip(
            structure_id=slip.structure_id,  # type: ignore[arg-type]
            working_days=Decimal(slip.working_days),
            paid_days=Decimal(slip.paid_days),
            earnings=[
                ComputedLine(code=l.code, name=l.name, kind="earning", amount=l.amount)
                for l in breakdown.earnings
            ],
            deductions=[
                ComputedLine(code=l.code, name=l.name, kind="deduction", amount=l.amount)
                for l in breakdown.deductions
            ],
            total_earnings=Decimal(slip.total_earnings),
            total_deductions=Decimal(slip.total_deductions),
            gross=Decimal(slip.gross),
            net_pay=Decimal(slip.net_pay),
        )
        html = render_payslip_html(
            employee_name=emp.full_name if emp else "Employee",
            employee_code=profile.employee_code if profile else None,
            designation=profile.designation if profile else None,
            period_label=_period_label(run.year, run.month),
            payslip=comp,
        )
        pdf_bytes = render_pdf(html)
        key = payslip_key(str(slip.user_id), run.year, run.month)
        storage.put(settings.R2_BUCKET_FILES, key, pdf_bytes, "application/pdf")
        slip.pdf_r2_key = key
        slip.generated_at = datetime.now(timezone.utc)

    run.status = "released"
    run.released_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(run)
    return PayrollRunOut.model_validate(run)


# ─── Payslips ────────────────────────────────────────────────────────────────


@router.get("/payslips/me", response_model=list[PayslipOut])
async def my_payslips(
    year: int | None = Query(None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PayslipOut]:
    stmt = (
        select(Payslip)
        .join(PayrollRun, PayrollRun.id == Payslip.payroll_run_id)
        .where(
            Payslip.user_id == user.id,
            Payslip.deleted_at.is_(None),
            PayrollRun.status == "released",
        )
        .order_by(desc(PayrollRun.year), desc(PayrollRun.month))
    )
    if year is not None:
        stmt = stmt.where(PayrollRun.year == year)
    rows = (await session.scalars(stmt)).all()
    return [await _payslip_to_out(session, p) for p in rows]


@router.get("/payslips", response_model=list[PayslipOut])
async def list_payslips(
    run_id: UUID | None = Query(None),
    user_id: UUID | None = Query(None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PayslipOut]:
    _require(user, PAYROLL_ROLES)
    stmt = select(Payslip).where(Payslip.deleted_at.is_(None))
    if run_id is not None:
        stmt = stmt.where(Payslip.payroll_run_id == run_id)
    if user_id is not None:
        stmt = stmt.where(Payslip.user_id == user_id)
    rows = (await session.scalars(stmt.order_by(desc(Payslip.generated_at)))).all()
    return [await _payslip_to_out(session, p) for p in rows]


@router.get("/payslips/{payslip_id}/url", response_model=SignedUrlOut)
async def payslip_url(
    payslip_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> SignedUrlOut:
    p = await session.get(Payslip, payslip_id)
    if p is None or p.deleted_at is not None or not p.pdf_r2_key:
        raise HTTPException(status_code=404, detail="Not found")
    if p.user_id != user.id and not _has(user, PAYROLL_ROLES):
        raise HTTPException(status_code=403, detail="Forbidden")
    storage = get_storage()
    settings = get_settings()
    url = storage.signed_url(settings.R2_BUCKET_FILES, p.pdf_r2_key)
    return SignedUrlOut(url=url, expires_in=300)


@router.delete("/payslips/{payslip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payslip(
    payslip_id: UUID,
    payload: PayslipDelete,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    _require(user, DELETE_ROLES)
    p = await session.get(Payslip, payslip_id)
    if p is None or p.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Not found")

    storage = get_storage()
    settings = get_settings()
    if p.pdf_r2_key:
        try:
            storage.delete(settings.R2_BUCKET_FILES, p.pdf_r2_key)
        except Exception:  # pragma: no cover — best-effort cleanup
            pass

    p.deleted_at = datetime.now(timezone.utc)
    p.deleted_by = user.id
    p.deletion_reason = payload.reason

    session.add(
        AuditLog(
            actor_user_id=user.id,
            action="payslip.delete",
            target_type="payslip",
            target_id=str(p.id),
            metadata_={"reason": payload.reason, "user_id": str(p.user_id)},
        )
    )
    await session.commit()

    employee = await session.get(User, p.user_id)
    if employee is not None:
        cc = list({settings.SUPER_ADMIN_EMAIL, *settings.HR_EMAILS})
        send_email(
            to=[employee.email],
            cc=cc,
            subject="A payslip on your record was deleted",
            body=(
                f"Hi {employee.full_name},\n\n"
                f"A payslip on your account was removed by an admin.\n"
                f"Reason: {payload.reason}\n\n"
                "If this looks wrong, please reply to this email."
            ),
        )
