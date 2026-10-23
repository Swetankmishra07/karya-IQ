"""Add idempotency keys for task creation retries.

Revision ID: 20261017_0010
Revises: 20260912_0009
Create Date: 2026-10-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261017_0010"
down_revision: Union[str, None] = "20260912_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("idempotency_key", sa.String(length=36), nullable=True))
    op.create_index(
        "uq_tasks_creator_idempotency_key",
        "tasks",
        ["creator_id", "idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_tasks_creator_idempotency_key", table_name="tasks")
    op.drop_column("tasks", "idempotency_key")
