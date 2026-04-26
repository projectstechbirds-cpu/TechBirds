"""blog_posts table

Revision ID: 0003_blog_posts
Revises: 0002_enquiries
Create Date: 2026-04-25
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_blog_posts"
down_revision: str | None = "0002_enquiries"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "blog_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(220), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("body_md", sa.Text(), nullable=False),
        sa.Column("cover_image", sa.Text()),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(64)),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
        sa.Column("reading_minutes", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("status", sa.String(16), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("author_name", sa.String(120)),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])
    op.create_index("ix_blog_posts_published_at", "blog_posts", ["published_at"])
    op.create_index("ix_blog_posts_tags_gin", "blog_posts", ["tags"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_table("blog_posts")
