"""Unique Slack message key per org to prevent duplicate tickets

Revision ID: 005
Revises: 004
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove duplicate Slack tickets before adding the unique index.
    op.execute(
        sa.text(
            """
            DELETE FROM tickets t
            USING (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY org_id, slack_channel_id, slack_message_ts
                           ORDER BY created_at ASC, id ASC
                       ) AS rn
                FROM tickets
                WHERE slack_channel_id IS NOT NULL
                  AND slack_message_ts IS NOT NULL
            ) d
            WHERE t.id = d.id AND d.rn > 1
            """
        )
    )
    op.create_index(
        "uq_tickets_slack_message",
        "tickets",
        ["org_id", "slack_channel_id", "slack_message_ts"],
        unique=True,
        postgresql_where=sa.text(
            "slack_channel_id IS NOT NULL AND slack_message_ts IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index("uq_tickets_slack_message", table_name="tickets")
