"""SendGrid SMTP wrapper with routing rules for inbound enquiries.

Routing (per requirements §10):
  - careers          → HR_EMAILS
  - everything else  → ADMIN_EMAILS (info@ + founder)

If SMTP_PASSWORD is empty (dev) we just log the message and return.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

log = logging.getLogger(__name__)


def _recipients_for(enquiry_type: str) -> list[str]:
    s = get_settings()
    if enquiry_type == "careers":
        return list(s.HR_EMAILS)
    return list(s.ADMIN_EMAILS)


def _send(to: list[str], subject: str, body: str, cc: list[str] | None = None) -> None:
    s = get_settings()
    if not s.SMTP_PASSWORD:
        log.info("[dev email] to=%s cc=%s subject=%s\n%s", to, cc, subject, body)
        return

    msg = EmailMessage()
    msg["From"] = s.NOREPLY_FROM
    msg["To"] = ", ".join(to)
    if cc:
        msg["Cc"] = ", ".join(cc)
    msg["Subject"] = subject
    msg.set_content(body)

    recipients = list(to) + list(cc or [])
    try:
        with smtplib.SMTP(s.SMTP_HOST, s.SMTP_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(s.SMTP_USER, s.SMTP_PASSWORD)
            smtp.send_message(msg, to_addrs=recipients)
    except Exception as exc:  # pragma: no cover — best-effort
        log.warning("smtp send failed: %s", exc)


def send_email(*, to: list[str], subject: str, body: str, cc: list[str] | None = None) -> None:
    """Generic outbound mail. Use the more specific helpers below where they fit."""
    _send(to, subject, body, cc=cc)


def send_enquiry_notification(
    *,
    enquiry_type: str,
    name: str,
    email: str,
    phone: str | None,
    company: str | None,
    project_type: str | None,
    budget_range: str | None,
    message: str,
) -> None:
    to = _recipients_for(enquiry_type)
    subject = f"[{enquiry_type}] New enquiry from {name}"
    lines = [
        f"Type:    {enquiry_type}",
        f"Name:    {name}",
        f"Email:   {email}",
        f"Phone:   {phone or '-'}",
        f"Company: {company or '-'}",
    ]
    if project_type:
        lines.append(f"Project: {project_type}")
    if budget_range:
        lines.append(f"Budget:  {budget_range}")
    lines += ["", "Message:", message]
    _send(to, subject, "\n".join(lines))


def send_otp_email(*, to: str, code: str, purpose: str = "login") -> None:
    subject = f"Your {get_settings().NOREPLY_FROM.split('@')[-1]} sign-in code: {code}"
    body = (
        f"Your one-time code is: {code}\n\n"
        f"It expires in {get_settings().OTP_TTL_MINUTES} minutes. "
        f"If you didn't request this, ignore this email.\n\n"
        f"Purpose: {purpose}"
    )
    _send([to], subject, body)
