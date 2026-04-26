"""OTP-only authentication.

Flow:
  1. POST /v1/auth/otp/request  → always 200 (no enumeration); emails OTP if user exists
  2. POST /v1/auth/otp/verify   → sets access + refresh cookies, returns user
  3. POST /v1/auth/refresh      → rotates access cookie using refresh cookie
  4. POST /v1/auth/logout       → revokes session + clears cookies
  5. GET  /v1/auth/me           → current user
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.deps.auth import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    current_user,
    role_names,
)
from app.models.auth import User, UserRole, UserSession
from app.schemas.auth import AuthOk, GenericOk, OtpRequest, OtpVerify, UserPublic
from app.services.email import send_otp_email
from app.services.jwt import (
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_refresh,
)
from app.services.otp import issue_otp, verify_otp
from app.services.rate_limit import check_rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


def _set_access_cookie(response: Response, token: str) -> None:
    s = get_settings()
    response.set_cookie(
        ACCESS_COOKIE,
        token,
        max_age=s.ACCESS_TOKEN_TTL_MINUTES * 60,
        httponly=True,
        secure=s.COOKIE_SECURE,
        samesite="lax",
        domain=s.COOKIE_DOMAIN if s.ENVIRONMENT != "development" else None,
        path="/",
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    s = get_settings()
    response.set_cookie(
        REFRESH_COOKIE,
        token,
        max_age=s.REFRESH_TOKEN_TTL_DAYS * 86400,
        httponly=True,
        secure=s.COOKIE_SECURE,
        samesite="lax",
        domain=s.COOKIE_DOMAIN if s.ENVIRONMENT != "development" else None,
        path="/v1/auth",  # only sent to /v1/auth/* — narrows blast radius of CSRF
    )


def _clear_cookies(response: Response) -> None:
    s = get_settings()
    domain = s.COOKIE_DOMAIN if s.ENVIRONMENT != "development" else None
    response.delete_cookie(ACCESS_COOKIE, domain=domain, path="/")
    response.delete_cookie(REFRESH_COOKIE, domain=domain, path="/v1/auth")


def _user_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_employee=user.is_employee,
        roles=role_names(user),
        last_login_at=user.last_login_at,
    )


@router.post("/otp/request", response_model=GenericOk)
async def otp_request(
    payload: OtpRequest,
    request: Request,
    background: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
) -> GenericOk:
    ip = _client_ip(request)
    email = payload.email.lower()

    # Two limits: per-email (slower) and per-IP (faster) to slow scrapers.
    if not await check_rate_limit(f"otp:email:{email}", limit=5, window_seconds=900):
        raise HTTPException(status_code=429, detail="Too many requests")
    if not await check_rate_limit(f"otp:ip:{ip}", limit=20, window_seconds=900):
        raise HTTPException(status_code=429, detail="Too many requests")

    user = await session.scalar(select(User).where(User.email == email, User.is_active.is_(True)).options(selectinload(User.roles).selectinload(UserRole.role)))
    # Always 200 — never reveal whether an email exists.
    if user is None:
        return GenericOk()

    code = await issue_otp(
        session,
        email=email,
        ip=ip,
        user_agent=request.headers.get("user-agent"),
    )
    background.add_task(send_otp_email, to=email, code=code)
    return GenericOk()


@router.post("/otp/verify", response_model=AuthOk)
async def otp_verify(
    payload: OtpVerify,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> AuthOk:
    email = payload.email.lower()

    if not await check_rate_limit(f"otp_verify:{email}", limit=10, window_seconds=900):
        raise HTTPException(status_code=429, detail="Too many attempts")

    if not await verify_otp(session, email=email, code=payload.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user = await session.scalar(select(User).where(User.email == email, User.is_active.is_(True)).options(selectinload(User.roles).selectinload(UserRole.role)))
    if user is None:
        # Stale OTP for a now-deactivated user — treat as invalid.
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.last_login_at = datetime.now(timezone.utc)

    access = create_access_token(user.id, roles=role_names(user))
    refresh, refresh_exp = create_refresh_token(user.id)
    session.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh),
            ip=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            expires_at=refresh_exp,
        )
    )
    await session.commit()
    await session.refresh(user)

    _set_access_cookie(response, access)
    _set_refresh_cookie(response, refresh)
    return AuthOk(user=_user_public(user))


@router.post("/refresh", response_model=GenericOk)
async def refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> GenericOk:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = verify_refresh(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    sess = await session.scalar(
        select(UserSession).where(
            UserSession.refresh_token_hash == hash_token(token),
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    )
    if sess is None:
        raise HTTPException(status_code=401, detail="Session not found")

    user = await session.scalar(
        select(User).where(User.id == sess.user_id, User.is_active.is_(True))
    )
    if user is None:
        raise HTTPException(status_code=401, detail="User inactive")

    access = create_access_token(user.id, roles=role_names(user))
    _set_access_cookie(response, access)
    return GenericOk()


@router.post("/logout", response_model=GenericOk)
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> GenericOk:
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        sess = await session.scalar(
            select(UserSession).where(
                UserSession.refresh_token_hash == hash_token(token),
                UserSession.revoked_at.is_(None),
            )
        )
        if sess is not None:
            sess.revoked_at = datetime.now(timezone.utc)
            await session.commit()

    _clear_cookies(response)
    return GenericOk()


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(current_user)) -> UserPublic:
    return _user_public(user)
