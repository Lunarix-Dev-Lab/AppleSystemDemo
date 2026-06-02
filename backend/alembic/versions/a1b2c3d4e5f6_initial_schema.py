"""initial schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-06-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums (PL/pgSQL anónimo, idempotente) ─────────────────────────────────
    # Usamos DDL puro para evitar el bug de SQLAlchemy 2.0.x donde Enum.copy()
    # no preserva create_type=False al construir el Table interno en op.create_table.
    op.execute(sa.text(
        "DO $$ BEGIN "
        "  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN "
        "    CREATE TYPE userrole AS ENUM ('superadmin', 'business_admin'); "
        "  END IF; "
        "END $$"
    ))
    op.execute(sa.text(
        "DO $$ BEGIN "
        "  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointmentstatus') THEN "
        "    CREATE TYPE appointmentstatus AS ENUM "
        "      ('pending_confirmation', 'confirmed', 'cancelled', 'rescheduled'); "
        "  END IF; "
        "END $$"
    ))

    # ── users ──────────────────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS users (
            id          SERIAL PRIMARY KEY,
            email       VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name   VARCHAR(255) NOT NULL,
            role        userrole     NOT NULL,
            is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """))
    op.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"
    ))

    # ── products ───────────────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS products (
            id              SERIAL       PRIMARY KEY,
            name            VARCHAR(255) NOT NULL,
            description     TEXT,
            price           NUMERIC(12,2) NOT NULL,
            colors          JSON         NOT NULL DEFAULT '[]',
            storage_options JSON         NOT NULL DEFAULT '[]',
            stock           INTEGER      NOT NULL DEFAULT 0,
            is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """))

    # ── product_images ─────────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS product_images (
            id         SERIAL       PRIMARY KEY,
            product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            url        VARCHAR(500) NOT NULL,
            "order"    INTEGER      NOT NULL DEFAULT 0,
            is_primary BOOLEAN      NOT NULL DEFAULT FALSE
        )
    """))
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_product_images_product_id "
        "ON product_images (product_id)"
    ))

    # ── business_schedules ─────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS business_schedules (
            id           SERIAL   PRIMARY KEY,
            day_of_week  INTEGER  NOT NULL,
            open_time    TIME     NOT NULL,
            close_time   TIME     NOT NULL,
            is_active    BOOLEAN  NOT NULL DEFAULT TRUE
        )
    """))

    # ── slot_config ────────────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS slot_config (
            id                     SERIAL  PRIMARY KEY,
            slot_duration_minutes  INTEGER NOT NULL DEFAULT 30,
            max_per_slot           INTEGER NOT NULL DEFAULT 1,
            max_advance_days       INTEGER NOT NULL DEFAULT 30
        )
    """))

    # ── appointments ───────────────────────────────────────────────────────────
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS appointments (
            id               SERIAL            PRIMARY KEY,
            guest_name       VARCHAR(255)      NOT NULL,
            guest_email      VARCHAR(255)      NOT NULL,
            guest_phone      VARCHAR(50)       NOT NULL,
            slot_datetime    TIMESTAMPTZ       NOT NULL,
            product_id       INTEGER           REFERENCES products(id) ON DELETE SET NULL,
            status           appointmentstatus NOT NULL DEFAULT 'pending_confirmation',
            management_token VARCHAR(64)       NOT NULL,
            notes            TEXT,
            created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
            updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_appointments_token UNIQUE (management_token)
        )
    """))
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_appointments_guest_email "
        "ON appointments (guest_email)"
    ))
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_appointments_slot_datetime "
        "ON appointments (slot_datetime)"
    ))


def downgrade() -> None:
    op.execute(sa.text("DROP TABLE IF EXISTS appointments"))
    op.execute(sa.text("DROP TABLE IF EXISTS slot_config"))
    op.execute(sa.text("DROP TABLE IF EXISTS business_schedules"))
    op.execute(sa.text("DROP TABLE IF EXISTS product_images"))
    op.execute(sa.text("DROP TABLE IF EXISTS products"))
    op.execute(sa.text("DROP TABLE IF EXISTS users"))
    op.execute(sa.text("DROP TYPE IF EXISTS appointmentstatus"))
    op.execute(sa.text("DROP TYPE IF EXISTS userrole"))
