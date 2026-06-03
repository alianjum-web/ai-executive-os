"""Sprint 3: tickets, assignee mappings, slack user ids

Revision ID: 003
Revises: 002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("slack_user_id", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(64), nullable=True))

    op.create_table(
        "assignee_mappings",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("department", sa.String(64), nullable=False),
        sa.Column("user_ids", sa.dialects.postgresql.JSONB(), nullable=False),
        sa.Column("round_robin_index", sa.Integer(), server_default="0"),
        sa.UniqueConstraint("org_id", "department", name="uq_assignee_org_dept"),
    )

    op.create_table(
        "tickets",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("source", sa.String(32), nullable=False),
        sa.Column("raw_payload", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("intent", sa.String(64), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("department", sa.String(64), nullable=True),
        sa.Column("assignee_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(32), server_default="open"),
        sa.Column("external_ticket_id", sa.String(128), nullable=True),
        sa.Column("slack_channel_id", sa.String(64), nullable=True),
        sa.Column("slack_message_ts", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("tickets")
    op.drop_table("assignee_mappings")
    op.drop_column("users", "department")
    op.drop_column("users", "slack_user_id")
