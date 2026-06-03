"""Sprint 4: integration settings, user jira account

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
    op.add_column("users", sa.Column("jira_account_id", sa.String(128), nullable=True))

    op.create_table(
        "org_integration_settings",
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id"), primary_key=True),
        sa.Column("jira_site_url", sa.String(512), nullable=True),
        sa.Column("jira_project_key", sa.String(32), nullable=True),
        sa.Column("jira_client_id_encrypted", sa.Text(), nullable=True),
        sa.Column("jira_client_secret_encrypted", sa.Text(), nullable=True),
        sa.Column("jira_access_token_encrypted", sa.Text(), nullable=True),
        sa.Column("jira_refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("sendgrid_api_key_encrypted", sa.Text(), nullable=True),
        sa.Column("sendgrid_from_email", sa.String(255), nullable=True),
        sa.Column("inbound_email_address", sa.String(255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("org_integration_settings")
    op.drop_column("users", "jira_account_id")
