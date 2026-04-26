"""employee profiles + holidays + leave + feed

Revision ID: 0005_people_leave_feed
Revises: 0004_punch_entries
Create Date: 2026-04-25
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_people_leave_feed"
down_revision: str | None = "0004_punch_entries"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ─── employee_profiles ────────────────────────────────────────────────
    op.create_table(
        "employee_profiles",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("employee_code", sa.String(32), unique=True),
        sa.Column("designation", sa.String(120)),
        sa.Column("department", sa.String(120)),
        sa.Column("dob", sa.Date()),
        sa.Column("joined_at", sa.Date()),
        sa.Column(
            "manager_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("phone", sa.String(32)),
        sa.Column("avatar_url", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_employee_profiles_manager_id", "employee_profiles", ["manager_id"])

    # ─── holidays ─────────────────────────────────────────────────────────
    op.create_table(
        "holidays",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("region", sa.String(32), nullable=False, server_default=sa.text("'IN'")),
        sa.Column(
            "is_optional", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("notes", sa.Text()),
        sa.UniqueConstraint("date", "name"),
    )
    op.create_index("ix_holidays_date", "holidays", ["date"])

    # ─── leave_types ──────────────────────────────────────────────────────
    op.create_table(
        "leave_types",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column(
            "default_annual_quota",
            sa.Numeric(5, 2),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("is_paid", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("description", sa.Text()),
    )

    # ─── leave_balances ───────────────────────────────────────────────────
    op.create_table(
        "leave_balances",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "leave_type_id",
            sa.Integer(),
            sa.ForeignKey("leave_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("quota", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("used", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.UniqueConstraint("user_id", "leave_type_id", "year"),
    )
    op.create_index("ix_leave_balances_user_id", "leave_balances", ["user_id"])

    # ─── leave_requests ───────────────────────────────────────────────────
    op.create_table(
        "leave_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "leave_type_id",
            sa.Integer(),
            sa.ForeignKey("leave_types.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("from_date", sa.Date(), nullable=False),
        sa.Column("to_date", sa.Date(), nullable=False),
        sa.Column("days", sa.Numeric(5, 2), nullable=False),
        sa.Column("reason", sa.Text()),
        sa.Column(
            "status", sa.String(16), nullable=False, server_default=sa.text("'pending'")
        ),
        sa.Column(
            "decided_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.Column("decision_note", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_leave_requests_user_id", "leave_requests", ["user_id"])
    op.create_index("ix_leave_requests_status", "leave_requests", ["status"])
    op.create_index("ix_leave_requests_created_at", "leave_requests", ["created_at"])

    # ─── feed_posts ───────────────────────────────────────────────────────
    op.create_table(
        "feed_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body_md", sa.Text(), nullable=False),
        sa.Column("attachments", postgresql.JSON()),
        sa.Column("pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_feed_posts_author_id", "feed_posts", ["author_id"])
    op.create_index("ix_feed_posts_created_at", "feed_posts", ["created_at"])

    # ─── feed_reactions ───────────────────────────────────────────────────
    op.create_table(
        "feed_reactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "post_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("feed_posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("emoji", sa.String(8), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("post_id", "user_id", "emoji"),
    )


def downgrade() -> None:
    op.drop_table("feed_reactions")
    op.drop_table("feed_posts")
    op.drop_table("leave_requests")
    op.drop_table("leave_balances")
    op.drop_table("leave_types")
    op.drop_table("holidays")
    op.drop_table("employee_profiles")
