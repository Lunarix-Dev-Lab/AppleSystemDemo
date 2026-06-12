"""products.price pasa a ser el precio base en USD

QA-ADM-010: antes price se guardaba en ARS y el USD se derivaba dividiendo por
la cotización, así que al cambiar la cotización se alteraba el valor en USD de
cada producto (se destruía la referencia de costo). Ahora price es la referencia
base en USD y el ARS se calcula al mostrar (price * usd_rate).

Esta migración convierte los precios existentes de ARS a USD dividiéndolos por
la cotización actual. En una base nueva (sin productos) no hace nada.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-06-12
"""
import sqlalchemy as sa
from alembic import op

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ARS -> USD: price = price / cotización
    op.execute(sa.text("""
        UPDATE products p
        SET price = ROUND(p.price / c.usd_rate, 2)
        FROM slot_config c
        WHERE c.usd_rate > 0
    """))


def downgrade() -> None:
    # USD -> ARS: price = price * cotización
    op.execute(sa.text("""
        UPDATE products p
        SET price = ROUND(p.price * c.usd_rate, 2)
        FROM slot_config c
        WHERE c.usd_rate > 0
    """))
