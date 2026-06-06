"""Add usd_rate to slot_config

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-05
"""
import sqlalchemy as sa
from alembic import op

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text(
        "ALTER TABLE slot_config "
        "ADD COLUMN IF NOT EXISTS usd_rate NUMERIC(10,2) NOT NULL DEFAULT 1000"
    ))


def downgrade() -> None:
    op.execute(sa.text(
        "ALTER TABLE slot_config DROP COLUMN IF EXISTS usd_rate"
    ))
