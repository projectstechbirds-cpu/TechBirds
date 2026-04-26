"""Public enquiries endpoint — backs the marketing-site contact form."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.enquiries import Enquiry
from app.schemas.enquiries import EnquiryCreate, EnquiryResponse
from app.services.email import send_enquiry_notification
from app.services.rate_limit import check_rate_limit
from app.services.turnstile import verify_turnstile

router = APIRouter(tags=["enquiries"])

RATE_LIMIT = 5
RATE_WINDOW = 600  # 10 minutes per IP


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


@router.post(
    "/enquiries",
    response_model=EnquiryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_enquiry(
    payload: EnquiryCreate,
    request: Request,
    background: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
) -> EnquiryResponse:
    ip = _client_ip(request)

    if not await check_rate_limit(f"enquiries:{ip}", limit=RATE_LIMIT, window_seconds=RATE_WINDOW):
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    # Honeypot — silently mark as spam, return 201 so bots don't learn.
    is_spam = bool(payload.website)

    if not is_spam and not await verify_turnstile(payload.turnstile_token, ip):
        raise HTTPException(status_code=400, detail="Captcha verification failed.")

    enquiry = Enquiry(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        enquiry_type=payload.enquiry_type,
        project_type=payload.project_type,
        budget_range=payload.budget_range,
        message=payload.message,
        status="spam" if is_spam else "new",
        ip=ip,
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
    )
    session.add(enquiry)
    await session.commit()
    await session.refresh(enquiry)

    if not is_spam:
        background.add_task(
            send_enquiry_notification,
            enquiry_type=payload.enquiry_type,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            company=payload.company,
            project_type=payload.project_type,
            budget_range=payload.budget_range,
            message=payload.message,
        )

    return EnquiryResponse(id=enquiry.id, status=enquiry.status, created_at=enquiry.created_at)
