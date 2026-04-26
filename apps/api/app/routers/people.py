"""People-of-the-studio: holidays + upcoming birthdays + work anniversaries."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from zoneinfo import ZoneInfo

from app.db import get_session
from app.deps.auth import current_user
from app.models.auth import User
from app.models.people import EmployeeProfile, Holiday
from app.schemas.people import BirthdayOut, HolidayOut, WorkAnniversaryOut

router = APIRouter(prefix="/people", tags=["people"])

TZ = ZoneInfo("Asia/Kolkata")


def _today() -> date:
    return datetime.now(TZ).date()


@router.get("/holidays", response_model=list[HolidayOut])
async def list_holidays(
    year: int | None = None,
    _: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[HolidayOut]:
    today = _today()
    y = year or today.year
    rows = (
        await session.scalars(
            select(Holiday)
            .where(Holiday.date >= date(y, 1, 1), Holiday.date <= date(y, 12, 31))
            .order_by(Holiday.date)
        )
    ).all()
    return [HolidayOut.model_validate(h) for h in rows]


def _days_until(today: date, target_month: int, target_day: int) -> int:
    """Days until next occurrence of (month, day) from today (inclusive)."""
    try:
        candidate = today.replace(month=target_month, day=target_day)
    except ValueError:
        # Feb 29 in a non-leap year — fall back to Feb 28.
        candidate = today.replace(month=target_month, day=28)
    if candidate < today:
        try:
            candidate = candidate.replace(year=today.year + 1)
        except ValueError:
            candidate = date(today.year + 1, target_month, 28)
    return (candidate - today).days


@router.get("/birthdays/upcoming", response_model=list[BirthdayOut])
async def upcoming_birthdays(
    days: int = Query(30, ge=1, le=120),
    _: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[BirthdayOut]:
    today = _today()
    rows = (
        await session.execute(
            select(EmployeeProfile, User)
            .join(User, User.id == EmployeeProfile.user_id)
            .where(
                EmployeeProfile.dob.is_not(None),
                User.is_active.is_(True),
                User.is_employee.is_(True),
            )
        )
    ).all()
    result: list[BirthdayOut] = []
    for profile, user in rows:
        assert profile.dob is not None
        until = _days_until(today, profile.dob.month, profile.dob.day)
        if until <= days:
            result.append(
                BirthdayOut(
                    user_id=user.id,
                    full_name=user.full_name,
                    designation=profile.designation,
                    dob_day=profile.dob.day,
                    dob_month=profile.dob.month,
                    days_until=until,
                )
            )
    result.sort(key=lambda b: b.days_until)
    return result


@router.get("/anniversaries/upcoming", response_model=list[WorkAnniversaryOut])
async def upcoming_anniversaries(
    days: int = Query(30, ge=1, le=120),
    _: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[WorkAnniversaryOut]:
    today = _today()
    rows = (
        await session.execute(
            select(EmployeeProfile, User)
            .join(User, User.id == EmployeeProfile.user_id)
            .where(
                EmployeeProfile.joined_at.is_not(None),
                User.is_active.is_(True),
                User.is_employee.is_(True),
            )
        )
    ).all()
    out: list[WorkAnniversaryOut] = []
    for profile, user in rows:
        assert profile.joined_at is not None
        until = _days_until(today, profile.joined_at.month, profile.joined_at.day)
        if until > days:
            continue
        # Years they will have completed on the upcoming date.
        upcoming = today + timedelta(days=until)
        years = upcoming.year - profile.joined_at.year
        if years <= 0:
            continue
        out.append(
            WorkAnniversaryOut(
                user_id=user.id,
                full_name=user.full_name,
                designation=profile.designation,
                joined_at=profile.joined_at,
                years=years,
                days_until=until,
            )
        )
    out.sort(key=lambda a: a.days_until)
    return out
