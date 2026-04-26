"""Leave management — employees self-serve, admins decide.

Approval rule (MVP): admin/super_admin/hr roles can decide any pending request.
A future iteration can route by manager_id from EmployeeProfile.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.deps.auth import current_user, role_names
from app.models.auth import User
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.people import Holiday
from app.schemas.leave import (
    LeaveBalanceOut,
    LeaveDecision,
    LeaveRequestCreate,
    LeaveRequestOut,
    LeaveTypeOut,
)

router = APIRouter(prefix="/leave", tags=["leave"])

APPROVER_ROLES = {"admin", "super_admin", "hr"}


def _has_approver_role(user: User) -> bool:
    return bool(set(role_names(user)).intersection(APPROVER_ROLES))


async def _holiday_dates(session: AsyncSession, start: date, end: date) -> set[date]:
    rows = await session.scalars(
        select(Holiday.date).where(
            Holiday.date >= start,
            Holiday.date <= end,
            Holiday.is_optional.is_(False),
        )
    )
    return set(rows.all())


def _working_days(start: date, end: date, holidays: set[date]) -> float:
    """Inclusive day count, excluding Sat/Sun and the supplied holiday dates."""
    days = 0
    cursor = start
    while cursor <= end:
        if cursor.weekday() < 5 and cursor not in holidays:
            days += 1
        cursor += timedelta(days=1)
    return float(days)


async def _request_to_out(
    session: AsyncSession, req: LeaveRequest, *, with_user: bool = False
) -> LeaveRequestOut:
    lt = await session.get(LeaveType, req.leave_type_id)
    user_name: str | None = None
    if with_user:
        u = await session.get(User, req.user_id)
        user_name = u.full_name if u else None
    return LeaveRequestOut(
        id=req.id,
        user_id=req.user_id,
        user_name=user_name,
        leave_type_id=req.leave_type_id,
        leave_type_code=lt.code if lt else None,
        leave_type_name=lt.name if lt else None,
        from_date=req.from_date,
        to_date=req.to_date,
        days=float(req.days),
        reason=req.reason,
        status=req.status,  # type: ignore[arg-type]
        decided_by=req.decided_by,
        decided_at=req.decided_at,
        decision_note=req.decision_note,
        created_at=req.created_at,
    )


@router.get("/types", response_model=list[LeaveTypeOut])
async def list_types(
    _: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[LeaveTypeOut]:
    rows = (await session.scalars(select(LeaveType).order_by(LeaveType.id))).all()
    return [LeaveTypeOut.model_validate(r) for r in rows]


@router.get("/balance", response_model=list[LeaveBalanceOut])
async def my_balance(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[LeaveBalanceOut]:
    year = datetime.now(timezone.utc).year
    rows = (
        await session.execute(
            select(LeaveBalance, LeaveType)
            .join(LeaveType, LeaveType.id == LeaveBalance.leave_type_id)
            .where(LeaveBalance.user_id == user.id, LeaveBalance.year == year)
            .order_by(LeaveType.id)
        )
    ).all()
    out: list[LeaveBalanceOut] = []
    for bal, lt in rows:
        out.append(
            LeaveBalanceOut(
                leave_type_id=bal.leave_type_id,
                leave_type_code=lt.code,
                leave_type_name=lt.name,
                year=bal.year,
                quota=float(bal.quota),
                used=float(bal.used),
                remaining=float(bal.quota) - float(bal.used),
            )
        )
    return out


@router.get("/requests", response_model=list[LeaveRequestOut])
async def my_requests(
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[LeaveRequestOut]:
    rows = (
        await session.scalars(
            select(LeaveRequest)
            .where(LeaveRequest.user_id == user.id)
            .order_by(desc(LeaveRequest.created_at))
            .limit(limit)
        )
    ).all()
    return [await _request_to_out(session, r) for r in rows]


@router.post(
    "/requests",
    response_model=LeaveRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_request(
    payload: LeaveRequestCreate,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> LeaveRequestOut:
    if not user.is_employee:
        raise HTTPException(status_code=403, detail="Only employees can apply for leave")

    lt = await session.get(LeaveType, payload.leave_type_id)
    if lt is None:
        raise HTTPException(status_code=400, detail="Unknown leave type")

    holidays = await _holiday_dates(session, payload.from_date, payload.to_date)
    days = _working_days(payload.from_date, payload.to_date, holidays)
    if days <= 0:
        raise HTTPException(
            status_code=400, detail="Selected range covers no working days"
        )

    req = LeaveRequest(
        user_id=user.id,
        leave_type_id=payload.leave_type_id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        days=days,
        reason=payload.reason,
        status="pending",
    )
    session.add(req)
    await session.commit()
    await session.refresh(req)
    return await _request_to_out(session, req)


@router.post("/requests/{request_id}/cancel", response_model=LeaveRequestOut)
async def cancel_request(
    request_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> LeaveRequestOut:
    req = await session.get(LeaveRequest, request_id)
    if req is None or req.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status not in ("pending", "approved"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {req.status} request")

    if req.status == "approved":
        bal = await session.scalar(
            select(LeaveBalance).where(
                LeaveBalance.user_id == req.user_id,
                LeaveBalance.leave_type_id == req.leave_type_id,
                LeaveBalance.year == req.from_date.year,
            )
        )
        if bal is not None:
            bal.used = max(0, float(bal.used) - float(req.days))

    req.status = "cancelled"
    req.decided_at = datetime.now(timezone.utc)
    req.decided_by = user.id
    await session.commit()
    await session.refresh(req)
    return await _request_to_out(session, req)


# ─── Approver endpoints ────────────────────────────────────────────────────


@router.get("/admin/pending", response_model=list[LeaveRequestOut])
async def list_pending(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[LeaveRequestOut]:
    if not _has_approver_role(user):
        raise HTTPException(status_code=403, detail="Forbidden")
    rows = (
        await session.scalars(
            select(LeaveRequest)
            .where(LeaveRequest.status == "pending")
            .order_by(LeaveRequest.created_at)
        )
    ).all()
    return [await _request_to_out(session, r, with_user=True) for r in rows]


@router.post("/admin/requests/{request_id}/decide", response_model=LeaveRequestOut)
async def decide_request(
    request_id: UUID,
    payload: LeaveDecision,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> LeaveRequestOut:
    if not _has_approver_role(user):
        raise HTTPException(status_code=403, detail="Forbidden")
    req = await session.get(LeaveRequest, request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Already {req.status}")

    if payload.decision == "approved":
        bal = await session.scalar(
            select(LeaveBalance).where(
                LeaveBalance.user_id == req.user_id,
                LeaveBalance.leave_type_id == req.leave_type_id,
                LeaveBalance.year == req.from_date.year,
            )
        )
        if bal is None:
            lt = await session.get(LeaveType, req.leave_type_id)
            bal = LeaveBalance(
                user_id=req.user_id,
                leave_type_id=req.leave_type_id,
                year=req.from_date.year,
                quota=lt.default_annual_quota if lt else 0,
                used=0,
            )
            session.add(bal)
            await session.flush()
        bal.used = float(bal.used) + float(req.days)

    req.status = payload.decision
    req.decided_by = user.id
    req.decided_at = datetime.now(timezone.utc)
    req.decision_note = payload.note
    await session.commit()
    await session.refresh(req)
    return await _request_to_out(session, req, with_user=True)
