from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.logging_config import configure_logging
from app.middleware import RequestIdMiddleware, SecurityHeadersMiddleware
from app.routers import (
    attendance,
    auth,
    blog,
    dev_files,
    documents,
    enquiries,
    feed,
    health,
    leave,
    payroll,
    people,
)

settings = get_settings()
configure_logging(settings.ENVIRONMENT)

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 0,
        send_default_pii=False,
    )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="TechBirds API",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware, environment=settings.ENVIRONMENT)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    rid = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": rid},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    rid = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "request_id": rid},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "request_id", None)
    # The stack trace was already logged by RequestIdMiddleware. Don't leak
    # internal detail to clients.
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": rid},
    )


app.include_router(health.router)
app.include_router(enquiries.router, prefix="/v1")
app.include_router(blog.router, prefix="/v1")
app.include_router(auth.router, prefix="/v1")
app.include_router(attendance.router, prefix="/v1")
app.include_router(people.router, prefix="/v1")
app.include_router(leave.router, prefix="/v1")
app.include_router(feed.router, prefix="/v1")
app.include_router(payroll.router, prefix="/v1")
app.include_router(documents.router, prefix="/v1")

if settings.ENVIRONMENT != "production":
    app.include_router(dev_files.router)
