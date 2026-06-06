"""Seed initial business_schedules and slot_config

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-05
"""
import sqlalchemy as sa
from alembic import op

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Singleton slot_config — sólo inserta si la tabla está vacía
    op.execute(sa.text("""
        INSERT INTO slot_config (slot_duration_minutes, max_per_slot, max_advance_days)
        SELECT 30, 1, 30
        WHERE NOT EXISTS (SELECT 1 FROM slot_config LIMIT 1)
    """))

    # 7 días de la semana: 0=Lun … 6=Dom
    # Lun-Vie: 09:00-18:00 activos | Sáb: 09:00-14:00 activo | Dom: 09:00-18:00 inactivo
    # Sólo inserta si la tabla está vacía (idempotente)
    op.execute(sa.text("""
        INSERT INTO business_schedules (day_of_week, open_time, close_time, is_active)
        SELECT * FROM (VALUES
            (0, '09:00'::time, '18:00'::time, true),
            (1, '09:00'::time, '18:00'::time, true),
            (2, '09:00'::time, '18:00'::time, true),
            (3, '09:00'::time, '18:00'::time, true),
            (4, '09:00'::time, '18:00'::time, true),
            (5, '09:00'::time, '14:00'::time, true),
            (6, '09:00'::time, '18:00'::time, false)
        ) AS v(day_of_week, open_time, close_time, is_active)
        WHERE NOT EXISTS (SELECT 1 FROM business_schedules LIMIT 1)
    """))


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM business_schedules"))
    op.execute(sa.text("DELETE FROM slot_config"))
