"""Employee profile + company holidays.

We extend the existing User row with optional HR fields rather than spinning a
separate Employee table — every employee is a user, the inverse isn't true.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    employee_code: Mapped[str | None] = mapped_column(String(32), unique=True)
    designation: Mapped[str | None] = mapped_column(String(120))
    department: Mapped[str | None] = mapped_column(String(120))
    dob: Mapped[date | None] = mapped_column(Date)
    joined_at: Mapped[date | None] = mapped_column(Date)
    manager_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    phone: Mapped[str | None] = mapped_column(String(32))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Holiday(Base):
    __tablename__ = "holidays"
    __table_args__ = (UniqueConstraint("date", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str] = mapped_column(String(32), nullable=False, server_default="IN")
    is_optional: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
