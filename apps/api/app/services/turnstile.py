"""Cloudflare Turnstile token verification.

In dev (no TURNSTILE_SECRET_KEY set) we accept the front-end's `dev-bypass-token`
sentinel so the contact form keeps working locally.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
DEV_BYPASS_TOKEN = "dev-bypass-token"


async def verify_turnstile(token: str, remote_ip: str | None = None) -> bool:
    settings = get_settings()
    secret = settings.TURNSTILE_SECRET_KEY

    if not secret:
        # Dev mode — only accept the documented bypass sentinel.
        return token == DEV_BYPASS_TOKEN

    if not token:
        return False

    data: dict[str, Any] = {"secret": secret, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(VERIFY_URL, data=data)
            res.raise_for_status()
            payload = res.json()
    except httpx.HTTPError as exc:
        log.warning("turnstile verify failed: %s", exc)
        return False

    return bool(payload.get("success"))
