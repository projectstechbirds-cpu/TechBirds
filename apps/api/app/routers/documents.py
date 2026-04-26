"""Employee documents — the 8 doc types from §4.10.

Upload is multipart/form-data. PDFs ≤ 10 MB go straight to R2 (or the dev
fallback) and a metadata row is created. Employees can list/download their
own; HR/super_admin manage everyone's. Delete soft-deletes the row, removes
the underlying object, and writes an audit log entry with a mandatory reason.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.deps.auth import current_user, role_names
from app.models.auth import AuditLog, User
from app.models.payroll import EmployeeDocument
from app.schemas.documents import DocType, DocumentDelete, DocumentOut, SignedUrlOut
from app.services.email import send_email
from app.services.storage import document_key, get_storage

router = APIRouter(prefix="/documents", tags=["documents"])

ADMIN_ROLES = {"super_admin", "hr"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_DOC_TYPES = {
    "offer_letter",
    "hike_letter",
    "form_16",
    "form_26as",
    "relieving_letter",
    "id_card",
    "fnf_letter",
    "experience_letter",
}


def _has(user: User, allowed: set[str]) -> bool:
    return bool(set(role_names(user)).intersection(allowed))


def _require_admin(user: User) -> None:
    if not _has(user, ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Forbidden")


async def _to_out(session: AsyncSession, doc: EmployeeDocument) -> DocumentOut:
    user = await session.get(User, doc.user_id)
    return DocumentOut(
        id=doc.id,
        user_id=doc.user_id,
        user_name=user.full_name if user else None,
        doc_type=doc.doc_type,  # type: ignore[arg-type]
        title=doc.title,
        period_label=doc.period_label,
        size_bytes=doc.size_bytes,
        mime_type=doc.mime_type,
        issued_at=doc.issued_at,
        deleted_at=doc.deleted_at,
    )


@router.get("/me", response_model=list[DocumentOut])
async def my_documents(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[DocumentOut]:
    rows = (
        await session.scalars(
            select(EmployeeDocument)
            .where(
                EmployeeDocument.user_id == user.id,
                EmployeeDocument.deleted_at.is_(None),
            )
            .order_by(desc(EmployeeDocument.issued_at))
        )
    ).all()
    return [await _to_out(session, d) for d in rows]


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    user_id: UUID | None = Query(None),
    doc_type: DocType | None = Query(None),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[DocumentOut]:
    _require_admin(user)
    stmt = select(EmployeeDocument).where(EmployeeDocument.deleted_at.is_(None))
    if user_id is not None:
        stmt = stmt.where(EmployeeDocument.user_id == user_id)
    if doc_type is not None:
        stmt = stmt.where(EmployeeDocument.doc_type == doc_type)
    rows = (await session.scalars(stmt.order_by(desc(EmployeeDocument.issued_at)))).all()
    return [await _to_out(session, d) for d in rows]


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    user_id: UUID = Form(...),
    doc_type: str = Form(...),
    title: str = Form(...),
    period_label: str | None = Form(None),
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> DocumentOut:
    _require_admin(user)
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Unknown doc_type")
    if file.content_type and file.content_type not in {"application/pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported")

    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    target = await session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    now = datetime.now(timezone.utc)
    storage = get_storage()
    settings = get_settings()
    key = document_key(str(user_id), doc_type, now.year, now.month)
    storage.put(settings.R2_BUCKET_FILES, key, body, "application/pdf")

    doc = EmployeeDocument(
        user_id=user_id,
        doc_type=doc_type,
        title=title,
        period_label=period_label,
        r2_key=key,
        size_bytes=len(body),
        mime_type="application/pdf",
        issued_by=user.id,
    )
    session.add(doc)
    session.add(
        AuditLog(
            actor_user_id=user.id,
            action="document.upload",
            target_type="employee_document",
            target_id=str(user_id),
            metadata_={"doc_type": doc_type, "title": title},
        )
    )
    await session.commit()
    await session.refresh(doc)

    send_email(
        to=[target.email],
        subject=f"A new document was added: {title}",
        body=(
            f"Hi {target.full_name},\n\n"
            f"A new document — {title} — was uploaded to your records by HR.\n"
            f"Sign in to your portal to view it."
        ),
    )
    return await _to_out(session, doc)


@router.get("/{document_id}/url", response_model=SignedUrlOut)
async def document_url(
    document_id: UUID,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> SignedUrlOut:
    doc = await session.get(EmployeeDocument, document_id)
    if doc is None or doc.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Not found")
    if doc.user_id != user.id and not _has(user, ADMIN_ROLES):
        raise HTTPException(status_code=403, detail="Forbidden")
    storage = get_storage()
    settings = get_settings()
    return SignedUrlOut(url=storage.signed_url(settings.R2_BUCKET_FILES, doc.r2_key), expires_in=300)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    payload: DocumentDelete,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    _require_admin(user)
    doc = await session.get(EmployeeDocument, document_id)
    if doc is None or doc.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Not found")

    storage = get_storage()
    settings = get_settings()
    try:
        storage.delete(settings.R2_BUCKET_FILES, doc.r2_key)
    except Exception:  # pragma: no cover — best-effort cleanup
        pass

    doc.deleted_at = datetime.now(timezone.utc)
    doc.deleted_by = user.id
    doc.deletion_reason = payload.reason

    session.add(
        AuditLog(
            actor_user_id=user.id,
            action="document.delete",
            target_type="employee_document",
            target_id=str(doc.id),
            metadata_={"reason": payload.reason, "user_id": str(doc.user_id)},
        )
    )
    await session.commit()

    target = await session.get(User, doc.user_id)
    if target is not None:
        cc = list({settings.SUPER_ADMIN_EMAIL, *settings.HR_EMAILS})
        send_email(
            to=[target.email],
            cc=cc,
            subject=f"A document was removed from your records: {doc.title}",
            body=(
                f"Hi {target.full_name},\n\n"
                f"The document '{doc.title}' was removed from your account.\n"
                f"Reason: {payload.reason}\n\n"
                "If this looks wrong, please reply to this email."
            ),
        )
