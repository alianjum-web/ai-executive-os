"""Sprint 5: query accuracy ratings, ticket resolution tracking

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
    op.add_column("queries", sa.Column("accuracy_rating", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("tickets", "resolved_at")
    op.drop_column("queries", "accuracy_rating")
