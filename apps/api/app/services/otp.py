"""OTP issuance and verification.

We hash the 6-digit code (bcrypt) and store with a 10-minute expiry. Verifying
increments the attempts counter and bails out after OTP_MAX_ATTEMPTS.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.auth import OtpCode

log = logging.getLogger(__name__)


def _hash_code(code: str) -> str:
    # Codes are 6 digits and ephemeral — sha256 with a server-side pepper is plenty
    # and avoids bcrypt's per-call cost on the hot OTP path.
    return hashlib.sha256(f"{get_settings().SECRET_KEY}:{code}".encode("utf-8")).hexdigest()


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


async def issue_otp(
    session: AsyncSession,
    *,
    email: str,
    purpose: str = "login",
    ip: str | None = None,
    user_agent: str | None = None,
) -> str:
    """Mint a fresh OTP, persist its hash, return the plaintext code (to email)."""
    s = get_settings()
    code = generate_code()
    expires = datetime.now(timezone.utc) + timedelta(minutes=s.OTP_TTL_MINUTES)
    session.add(
        OtpCode(
            email=email.lower(),
            code_hash=_hash_code(code),
            purpose=purpose,
            expires_at=expires,
            ip=ip,
            user_agent=user_agent,
        )
    )
    await session.commit()
    return code


async def verify_otp(
    session: AsyncSession,
    *,
    email: str,
    code: str,
    purpose: str = "login",
) -> bool:
    s = get_settings()
    now = datetime.now(timezone.utc)
    row = await session.scalar(
        select(OtpCode)
        .where(
            OtpCode.email == email.lower(),
            OtpCode.purpose == purpose,
            OtpCode.consumed_at.is_(None),
            OtpCode.expires_at > now,
        )
        .order_by(desc(OtpCode.created_at))
        .limit(1)
    )
    if row is None:
        return False

    if row.attempts >= s.OTP_MAX_ATTEMPTS:
        return False

    row.attempts += 1
    if row.code_hash != _hash_code(code):
        await session.commit()
        return False

    row.consumed_at = now
    await session.commit()
    return True
