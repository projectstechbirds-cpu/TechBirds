"""Payroll: salary structures + components + monthly runs + payslips.

State machine for `payroll_runs.status`:
    draft → locked → computed → released
A locked run is frozen from edits; computed has payslip rows; released has PDFs
and is visible to employees.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SalaryStructure(Base):
    """One row per employee per effective period (a new structure on hike)."""

    __tablename__ = "salary_structures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date)
    ctc_annual: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SalaryComponent(Base):
    """Earning or deduction line for a salary structure.

    `kind` ∈ {"earning", "deduction"}. `monthly_amount` is the contractual value
    for a full month — proration happens at run time.
    """

    __tablename__ = "salary_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    structure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("salary_structures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # earning | deduction
    monthly_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    is_taxable: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")


class PayrollRun(Base):
    __tablename__ = "payroll_runs"
    __table_args__ = (UniqueConstraint("year", "month"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..12
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="draft", index=True
    )  # draft | locked | computed | released
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    computed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = (UniqueConstraint("payroll_run_id", "user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payroll_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    structure_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("salary_structures.id", ondelete="SET NULL")
    )
    working_days: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, server_default="0")
    paid_days: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, server_default="0")
    gross: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default="0")
    total_earnings: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    total_deductions: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    net_pay: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default="0")
    breakdown: Mapped[dict | None] = mapped_column(JSONB)
    pdf_r2_key: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    deletion_reason: Mapped[str | None] = mapped_column(Text)


class EmployeeDocument(Base):
    """The 8 doc types from §4.10 (offer, hike, form_16, form_26as, relieving,
    id_card, fnf, experience). PDF lives in R2; row holds metadata + audit.
    """

    __tablename__ = "employee_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    period_label: Mapped[str | None] = mapped_column(String(64))  # e.g. "FY 2025-26", "Apr 2026"
    r2_key: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(
        String(64), nullable=False, server_default="application/pdf"
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    issued_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    deletion_reason: Mapped[str | None] = mapped_column(Text)
