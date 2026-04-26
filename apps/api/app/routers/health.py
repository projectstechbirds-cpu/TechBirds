from typing import Literal

import redis.asyncio as redis
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.config import get_settings
from app.db import engine

router = APIRouter(tags=["meta"])
settings = get_settings()

Status = Literal["ok", "degraded", "down"]


class HealthChecks(BaseModel):
    db: Status
    redis: Status
    r2: Status
    smtp: Status


class HealthResponse(BaseModel):
    status: Status
    version: str
    checks: HealthChecks


async def _check_db() -> Status:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        return "down"


async def _check_redis() -> Status:
    try:
        client = redis.from_url(settings.REDIS_URL_CACHE, socket_connect_timeout=2)
        await client.ping()
        await client.aclose()
        return "ok"
    except Exception:
        return "down"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    checks = HealthChecks(
        db=await _check_db(),
        redis=await _check_redis(),
        r2="ok" if settings.R2_ACCESS_KEY_ID else "degraded",
        smtp="ok" if settings.SMTP_PASSWORD else "degraded",
    )
    overall: Status = "ok"
    values = [checks.db, checks.redis, checks.r2, checks.smtp]
    if "down" in values:
        overall = "down"
    elif "degraded" in values:
        overall = "degraded"
    return HealthResponse(status=overall, version=settings.APP_VERSION, checks=checks)
