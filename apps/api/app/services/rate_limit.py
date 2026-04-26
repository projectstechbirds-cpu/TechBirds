"""Tiny fixed-window rate limiter backed by Redis.

Falls back to an in-process dict when Redis is unreachable, so dev and tests
never block on infra. Returns True when the request is allowed.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict

import redis.asyncio as redis

from app.config import get_settings

log = logging.getLogger(__name__)

_local_counts: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))
_client: redis.Redis | None = None


def _get_client() -> redis.Redis | None:
    global _client
    if _client is not None:
        return _client
    try:
        _client = redis.from_url(get_settings().REDIS_URL_RATELIMIT, decode_responses=True)
    except Exception as exc:  # pragma: no cover — defensive
        log.warning("rate limit redis unavailable: %s", exc)
        _client = None
    return _client


async def check_rate_limit(key: str, *, limit: int, window_seconds: int) -> bool:
    """Allow at most `limit` hits per `window_seconds` for `key`."""
    client = _get_client()
    if client is not None:
        try:
            full_key = f"rl:{key}:{window_seconds}"
            count = await client.incr(full_key)
            if count == 1:
                await client.expire(full_key, window_seconds)
            return count <= limit
        except Exception as exc:
            log.warning("rate limit redis call failed, falling back: %s", exc)

    now = time.monotonic()
    count, window_start = _local_counts[key]
    if now - window_start >= window_seconds:
        _local_counts[key] = (1, now)
        return True
    _local_counts[key] = (count + 1, window_start)
    return count + 1 <= limit
