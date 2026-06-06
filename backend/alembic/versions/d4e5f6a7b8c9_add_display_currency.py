"""Add display_currency to slot_config

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-05
"""
import sqlalchemy as sa
from alembic import op

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text(
        "ALTER TABLE slot_config "
        "ADD COLUMN IF NOT EXISTS display_currency VARCHAR(3) NOT NULL DEFAULT 'ARS'"
    ))


def downgrade() -> None:
    op.execute(sa.text(
        "ALTER TABLE slot_config DROP COLUMN IF EXISTS display_currency"
    ))
