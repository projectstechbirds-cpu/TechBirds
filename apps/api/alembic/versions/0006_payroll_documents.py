"""payroll: salary structures + components + runs + payslips + documents

Revision ID: 0006_payroll_documents
Revises: 0005_people_leave_feed
Create Date: 2026-04-25
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_payroll_documents"
down_revision: str | None = "0005_people_leave_feed"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ─── salary_structures ────────────────────────────────────────────────
    op.create_table(
        "salary_structures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date()),
        sa.Column("ctc_annual", sa.Numeric(14, 2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_salary_structures_user_id", "salary_structures", ["user_id"])

    # ─── salary_components ────────────────────────────────────────────────
    op.create_table(
        "salary_components",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "structure_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("salary_structures.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("monthly_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("is_taxable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_salary_components_structure_id", "salary_components", ["structure_id"])

    # ─── payroll_runs ─────────────────────────────────────────────────────
    op.create_table(
        "payroll_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("locked_at", sa.DateTime(timezone=True)),
        sa.Column("computed_at", sa.DateTime(timezone=True)),
        sa.Column("released_at", sa.DateTime(timezone=True)),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("year", "month"),
    )
    op.create_index("ix_payroll_runs_status", "payroll_runs", ["status"])

    # ─── payslips ─────────────────────────────────────────────────────────
    op.create_table(
        "payslips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "payroll_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("payroll_runs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "structure_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("salary_structures.id", ondelete="SET NULL"),
        ),
        sa.Column("working_days", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("paid_days", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("gross", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "total_earnings", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "total_deductions", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")
        ),
        sa.Column("net_pay", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("breakdown", postgresql.JSONB()),
        sa.Column("pdf_r2_key", sa.Text()),
        sa.Column("generated_at", sa.DateTime(timezone=True)),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column(
            "deleted_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("deletion_reason", sa.Text()),
        sa.UniqueConstraint("payroll_run_id", "user_id"),
    )
    op.create_index("ix_payslips_payroll_run_id", "payslips", ["payroll_run_id"])
    op.create_index("ix_payslips_user_id", "payslips", ["user_id"])

    # ─── employee_documents ───────────────────────────────────────────────
    op.create_table(
        "employee_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("doc_type", sa.String(32), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("period_label", sa.String(64)),
        sa.Column("r2_key", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.Integer()),
        sa.Column(
            "mime_type",
            sa.String(64),
            nullable=False,
            server_default=sa.text("'application/pdf'"),
        ),
        sa.Column(
            "issued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "issued_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column(
            "deleted_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("deletion_reason", sa.Text()),
    )
    op.create_index("ix_employee_documents_user_id", "employee_documents", ["user_id"])
    op.create_index("ix_employee_documents_doc_type", "employee_documents", ["doc_type"])


def downgrade() -> None:
    op.drop_table("employee_documents")
    op.drop_table("payslips")
    op.drop_table("payroll_runs")
    op.drop_table("salary_components")
    op.drop_table("salary_structures")
