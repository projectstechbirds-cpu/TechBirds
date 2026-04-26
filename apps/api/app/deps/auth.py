"""Auth dependencies — `current_user` and `require_role` for FastAPI routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models.auth import Role, User, UserRole
from app.services.jwt import verify_access

ACCESS_COOKIE = "tb_access"
REFRESH_COOKIE = "tb_refresh"


async def current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = verify_access(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await session.scalar(
        select(User)
        .where(User.id == user_id, User.is_active.is_(True))
        .options(selectinload(User.roles).selectinload(UserRole.role))
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def role_names(user: User) -> list[str]:
    out: list[str] = []
    for ur in user.roles:
        role: Role | None = getattr(ur, "role", None)
        if role is not None:
            out.append(role.name)
    return out


def require_roles(*allowed: str):
    """Dependency factory: deny if user has none of the named roles."""

    async def _checker(user: User = Depends(current_user)) -> User:
        if not allowed:
            return user
        if not set(role_names(user)).intersection(allowed):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _checker
