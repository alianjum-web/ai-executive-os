"""initial schema with pgvector

Revision ID: 001
Revises:
Create Date: 2026-06-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("role", sa.String(50), server_default="employee"),
        sa.Column("org_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("org_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("filename", sa.String(512), nullable=False),
        sa.Column("storage_path", sa.String(1024), nullable=False),
        sa.Column("status", sa.String(32), server_default="pending"),
        sa.Column("metadata_json", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "document_chunks",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "document_id",
            sa.UUID(),
            sa.ForeignKey("documents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("embedding", Vector(1536), nullable=True),
    )

    op.create_table(
        "queries",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("cited_chunks", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("queries")
    op.drop_table("document_chunks")
    op.drop_table("documents")
    op.drop_table("users")
