"""Sprint 2: organizations, query org_id, activity_logs

Revision ID: 002
Revises: 001
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("plan", sa.String(50), server_default="standard"),
        sa.Column("settings_json", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.add_column("queries", sa.Column("org_id", sa.UUID(), nullable=True))
    op.add_column("queries", sa.Column("cited_chunk_ids", sa.dialects.postgresql.JSONB(), nullable=True))
    op.create_foreign_key("fk_queries_org", "queries", "organizations", ["org_id"], ["id"])

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_constraint("fk_queries_org", "queries", type_="foreignkey")
    op.drop_column("queries", "cited_chunk_ids")
    op.drop_column("queries", "org_id")
    op.drop_table("organizations")
