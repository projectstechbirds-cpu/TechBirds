"""punch_entries table

Revision ID: 0004_punch_entries
Revises: 0003_blog_posts
Create Date: 2026-04-25
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_punch_entries"
down_revision: str | None = "0003_blog_posts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "punch_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(8), nullable=False),
        sa.Column("source", sa.String(16), nullable=False, server_default=sa.text("'web'")),
        sa.Column("note", sa.String(255)),
        sa.Column("ip", postgresql.INET()),
        sa.Column("user_agent", sa.String(255)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_punch_entries_user_id", "punch_entries", ["user_id"])
    op.create_index("ix_punch_entries_created_at", "punch_entries", ["created_at"])
    op.create_index(
        "ix_punch_entries_user_created", "punch_entries", ["user_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_table("punch_entries")
