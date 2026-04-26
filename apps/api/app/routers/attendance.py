"""Punch in/out + day-state for the employee app."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.deps.auth import current_user
from app.models.attendance import PunchEntry
from app.models.auth import User
from app.schemas.attendance import (
    HistoryDay,
    HistoryResponse,
    PunchCreate,
    PunchEntryOut,
    TodayState,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])

# Asia/Kolkata for "today" boundaries — that's where the team is.
TZ = ZoneInfo("Asia/Kolkata")


def _today_local() -> date:
    return datetime.now(TZ).date()


def _local_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=TZ)
    end = start + timedelta(days=1)
    return start, end


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def _pair_minutes(entries: list[PunchEntry]) -> int:
    """Sum (out - in) minutes. Open punches count up to now."""
    total = 0.0
    open_in: datetime | None = None
    for e in sorted(entries, key=lambda x: x.created_at):
        if e.type == "in" and open_in is None:
            open_in = e.created_at
        elif e.type == "out" and open_in is not None:
            total += (e.created_at - open_in).total_seconds() / 60
            open_in = None
    if open_in is not None:
        total += (datetime.now(timezone.utc) - open_in).total_seconds() / 60
    return int(total)


@router.post("/punch", response_model=PunchEntryOut, status_code=status.HTTP_201_CREATED)
async def punch(
    payload: PunchCreate,
    request: Request,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> PunchEntryOut:
    if not user.is_employee:
        raise HTTPException(status_code=403, detail="Only employees can punch.")

    last = await session.scalar(
        select(PunchEntry)
        .where(PunchEntry.user_id == user.id)
        .order_by(desc(PunchEntry.created_at))
        .limit(1)
    )
    next_type = "in" if last is None or last.type == "out" else "out"

    entry = PunchEntry(
        user_id=user.id,
        type=next_type,
        note=payload.note,
        ip=_client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:255] or None,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return PunchEntryOut.model_validate(entry)


@router.get("/today", response_model=TodayState)
async def today(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> TodayState:
    today_d = _today_local()
    start, end = _local_day_bounds(today_d)

    rows = (
        await session.scalars(
            select(PunchEntry)
            .where(
                PunchEntry.user_id == user.id,
                PunchEntry.created_at >= start,
                PunchEntry.created_at < end,
            )
            .order_by(PunchEntry.created_at)
        )
    ).all()

    last_overall = await session.scalar(
        select(PunchEntry)
        .where(PunchEntry.user_id == user.id)
        .order_by(desc(PunchEntry.created_at))
        .limit(1)
    )

    return TodayState(
        is_punched_in=bool(last_overall and last_overall.type == "in"),
        last_entry=(PunchEntryOut.model_validate(last_overall) if last_overall else None),
        today_total_minutes=_pair_minutes(list(rows)),
        today_date=today_d,
    )


@router.get("/history", response_model=HistoryResponse)
async def history(
    days: int = 14,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> HistoryResponse:
    days = max(1, min(days, 60))
    today_d = _today_local()
    start = datetime.combine(today_d - timedelta(days=days - 1), time.min, tzinfo=TZ)

    rows = (
        await session.scalars(
            select(PunchEntry)
            .where(PunchEntry.user_id == user.id, PunchEntry.created_at >= start)
            .order_by(PunchEntry.created_at)
        )
    ).all()

    grouped: dict[date, list[PunchEntry]] = defaultdict(list)
    for e in rows:
        grouped[e.created_at.astimezone(TZ).date()].append(e)

    out = [
        HistoryDay(
            date=d,
            entries=[PunchEntryOut.model_validate(x) for x in es],
            total_minutes=_pair_minutes(es),
        )
        for d, es in sorted(grouped.items(), reverse=True)
    ]
    return HistoryResponse(days=out)
