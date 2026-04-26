"""Security headers + request id propagation.

Centralises the boring-but-load-bearing HTTP response headers so individual
routes don't need to think about them. The CSP is intentionally not applied to
API responses (CSP belongs on the HTML hosts, www/blog/app), but the rest are
universal.
"""

from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

log = logging.getLogger("techbirds.access")


SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Sets static security response headers and HSTS in production."""

    def __init__(self, app, *, environment: str) -> None:
        super().__init__(app)
        self.environment = environment

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        if self.environment == "production":
            # 1 year, include subdomains; safe because we control the apex.
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload",
            )
        return response


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Adds an `X-Request-ID` header (echoed if the client provided one) and
    logs a single access line per request.
    """

    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        request.state.request_id = rid
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            log.exception(
                "request failed rid=%s method=%s path=%s elapsed_ms=%d",
                rid,
                request.method,
                request.url.path,
                elapsed_ms,
            )
            raise
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        response.headers["X-Request-ID"] = rid
        log.info(
            "rid=%s method=%s path=%s status=%d elapsed_ms=%d",
            rid,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response
