"""Executive OS schema enhancements — profiles, org branding, richer documents/tickets

Revision ID: 004
Revises: 003
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── organizations ─────────────────────────────────────────────────────
    op.add_column("organizations", sa.Column("slug", sa.String(128), nullable=True))
    op.add_column("organizations", sa.Column("industry", sa.String(64), nullable=True))
    op.add_column("organizations", sa.Column("logo_url", sa.String(512), nullable=True))
    op.add_column("organizations", sa.Column("website", sa.String(255), nullable=True))
    op.add_column(
        "organizations",
        sa.Column("timezone", sa.String(64), server_default="UTC", nullable=False),
    )
    op.add_column(
        "organizations",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.add_column(
        "organizations",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # ── users ─────────────────────────────────────────────────────────────
    op.add_column("users", sa.Column("full_name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("job_title", sa.String(128), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(512), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(32), nullable=True))
    op.add_column("users", sa.Column("timezone", sa.String(64), nullable=True))
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "users",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.add_column("users", sa.Column("preferences_json", sa.dialects.postgresql.JSONB(), nullable=True))
    op.create_foreign_key(
        "fk_users_org_id",
        "users",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_org_id", "users", ["org_id"])

    # ── documents ─────────────────────────────────────────────────────────
    op.create_foreign_key(
        "fk_documents_org_id",
        "documents",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.add_column("documents", sa.Column("mime_type", sa.String(128), nullable=True))
    op.add_column("documents", sa.Column("file_size_bytes", sa.BigInteger(), nullable=True))
    op.add_column("documents", sa.Column("page_count", sa.Integer(), nullable=True))
    op.add_column("documents", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("documents", sa.Column("indexed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_documents_org_status", "documents", ["org_id", "status"])

    # ── document_chunks ───────────────────────────────────────────────────
    op.add_column(
        "document_chunks",
        sa.Column("token_count", sa.Integer(), nullable=True),
    )

    # ── tickets ───────────────────────────────────────────────────────────
    op.add_column("tickets", sa.Column("title", sa.String(255), nullable=True))
    op.add_column(
        "tickets",
        sa.Column("created_by_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
    )
    op.add_column("tickets", sa.Column("due_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tickets", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("tickets", sa.Column("tags", sa.dialects.postgresql.JSONB(), nullable=True))
    op.create_index("ix_tickets_org_status", "tickets", ["org_id", "status"])

    # ── queries (AI assistant sessions) ─────────────────────────────────────
    op.add_column("queries", sa.Column("session_id", sa.String(64), nullable=True))
    op.add_column("queries", sa.Column("model", sa.String(64), nullable=True))
    op.add_column("queries", sa.Column("feedback", sa.String(16), nullable=True))
    op.create_index("ix_queries_org_created", "queries", ["org_id", "created_at"])

    # ── activity_logs ─────────────────────────────────────────────────────
    op.add_column(
        "activity_logs",
        sa.Column("metadata_json", sa.dialects.postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("activity_logs", "metadata_json")

    op.drop_index("ix_queries_org_created", table_name="queries")
    op.drop_column("queries", "feedback")
    op.drop_column("queries", "model")
    op.drop_column("queries", "session_id")

    op.drop_index("ix_tickets_org_status", table_name="tickets")
    op.drop_column("tickets", "tags")
    op.drop_column("tickets", "resolved_at")
    op.drop_column("tickets", "due_at")
    op.drop_column("tickets", "created_by_id")
    op.drop_column("tickets", "title")

    op.drop_column("document_chunks", "token_count")

    op.drop_index("ix_documents_org_status", table_name="documents")
    op.drop_column("documents", "indexed_at")
    op.drop_column("documents", "deleted_at")
    op.drop_column("documents", "description")
    op.drop_column("documents", "page_count")
    op.drop_column("documents", "file_size_bytes")
    op.drop_column("documents", "mime_type")
    op.drop_constraint("fk_documents_org_id", "documents", type_="foreignkey")

    op.drop_index("ix_users_org_id", table_name="users")
    op.drop_constraint("fk_users_org_id", "users", type_="foreignkey")
    op.drop_column("users", "preferences_json")
    op.drop_column("users", "updated_at")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "is_active")
    op.drop_column("users", "timezone")
    op.drop_column("users", "phone")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "job_title")
    op.drop_column("users", "full_name")

    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_column("organizations", "updated_at")
    op.drop_column("organizations", "is_active")
    op.drop_column("organizations", "timezone")
    op.drop_column("organizations", "website")
    op.drop_column("organizations", "logo_url")
    op.drop_column("organizations", "industry")
    op.drop_column("organizations", "slug")
