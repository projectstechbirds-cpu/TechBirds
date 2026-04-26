"""enquiries table

Revision ID: 0002_enquiries
Revises: 0001_initial_auth
Create Date: 2026-04-25
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_enquiries"
down_revision: str | None = "0001_initial_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "enquiries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(64)),
        sa.Column("company", sa.String(255)),
        sa.Column("enquiry_type", sa.String(32), nullable=False),
        sa.Column("project_type", sa.String(32)),
        sa.Column("budget_range", sa.String(32)),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default=sa.text("'new'")),
        sa.Column("ip", postgresql.INET()),
        sa.Column("user_agent", sa.Text()),
        sa.Column("referrer", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_enquiries_email", "enquiries", ["email"])
    op.create_index("ix_enquiries_status", "enquiries", ["status"])
    op.create_index("ix_enquiries_created_at", "enquiries", ["created_at"])


def downgrade() -> None:
    op.drop_table("enquiries")
