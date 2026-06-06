"""Add is_sealed and battery_health to products

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-06
"""
import sqlalchemy as sa
from alembic import op

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text(
        "ALTER TABLE products "
        "ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN NOT NULL DEFAULT FALSE"
    ))
    op.execute(sa.text(
        "ALTER TABLE products "
        "ADD COLUMN IF NOT EXISTS battery_health INTEGER"
    ))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE products DROP COLUMN IF EXISTS battery_health"))
    op.execute(sa.text("ALTER TABLE products DROP COLUMN IF EXISTS is_sealed"))
