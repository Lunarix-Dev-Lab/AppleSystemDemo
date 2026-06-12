"""slot_datetime a timestamp sin zona (wall-clock ART)

Evita el bug de zona horaria: guardar el horario del turno como hora de pared
(naive) hace que '09:00' se guarde y se lea como '09:00' siempre, sin depender
de la variable TZ del contenedor ni de la zona del servidor/navegador.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-12
"""
import sqlalchemy as sa
from alembic import op

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None

_TZ = "America/Argentina/Buenos_Aires"


def upgrade() -> None:
    # Convierte los timestamptz existentes (en UTC) a la hora de pared ART.
    op.execute(sa.text(
        "ALTER TABLE appointments "
        "ALTER COLUMN slot_datetime TYPE timestamp without time zone "
        f"USING (slot_datetime AT TIME ZONE '{_TZ}')"
    ))


def downgrade() -> None:
    # Interpreta la hora naive como ART y vuelve a timestamptz.
    op.execute(sa.text(
        "ALTER TABLE appointments "
        "ALTER COLUMN slot_datetime TYPE timestamp with time zone "
        f"USING (slot_datetime AT TIME ZONE '{_TZ}')"
    ))
