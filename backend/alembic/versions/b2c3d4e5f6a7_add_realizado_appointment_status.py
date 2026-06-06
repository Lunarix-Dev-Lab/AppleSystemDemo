"""Add realizado to appointmentstatus enum

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-06-05
"""
import sqlalchemy as sa
from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL 9.3+: IF NOT EXISTS hace la migración idempotente
    op.execute(sa.text(
        "ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'realizado'"
    ))


def downgrade() -> None:
    # PostgreSQL no permite eliminar valores de un ENUM sin recrear el tipo.
    # Convertir los turnos 'realizado' a 'cancelled' requeriría pasos adicionales.
    # Se deja como no-op: en caso de rollback, el valor permanece en el schema
    # pero el ORM no lo usa al hacer downgrade de código.
    pass
