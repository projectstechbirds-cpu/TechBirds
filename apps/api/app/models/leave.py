"""Leave types, balances, and requests."""

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
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    default_annual_quota: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False, server_default="0"
    )
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    description: Mapped[str | None] = mapped_column(Text)


class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    __table_args__ = (UniqueConstraint("user_id", "leave_type_id", "year"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type_id: Mapped[int] = mapped_column(
        ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quota: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, server_default="0")
    used: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, server_default="0")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type_id: Mapped[int] = mapped_column(
        ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    from_date: Mapped[date] = mapped_column(Date, nullable=False)
    to_date: Mapped[date] = mapped_column(Date, nullable=False)
    days: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="pending", index=True
    )  # pending | approved | rejected | cancelled
    decided_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
