"""
Fixtures compartidos para todos los tests.

Estrategia de aislamiento — NullPool:
  Con asyncpg, el connection pool guarda conexiones ligadas a un event loop
  específico. pytest-asyncio 0.24 crea un nuevo loop por test (scope function),
  por lo que las conexiones del pool quedan en el loop "viejo" y el siguiente
  test falla con "Future attached to a different loop".

  La solución es NullPool: elimina el pool completamente.
  Cada sesión abre y cierra su propia conexión — sin reutilización, sin loops
  cruzados, sin errores.
"""
import uuid
from datetime import time as time_type

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.schedule import BusinessSchedule, SlotConfig
from app.models.user import User, UserRole

# ── Engine sin pool ───────────────────────────────────────────────────────────

_settings = get_settings()
_engine = create_async_engine(_settings.DATABASE_URL, poolclass=NullPool, echo=False)
_session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def patch_db():
    """Hace que la app use el mismo engine NullPool durante los tests."""
    from app.core import database
    database.AsyncSessionLocal = _session_factory
    yield
    # No restauramos: al terminar la sesión de tests no importa


# ── HTTP client ───────────────────────────────────────────────────────────────

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ── Users ─────────────────────────────────────────────────────────────────────

@pytest.fixture
async def admin_user():
    uid = uuid.uuid4().hex[:8]
    email = f"pytest.{uid}@test.internal"
    async with _session_factory() as db:
        user = User(
            email=email,
            hashed_password=hash_password("pytest_secret_123!"),
            full_name="PyTest Admin",
            role=UserRole.business_admin,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    yield user
    async with _session_factory() as db:
        await db.execute(text(f"DELETE FROM users WHERE email = '{email}'"))
        await db.commit()


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(str(admin_user.id), {"role": admin_user.role.value})
    return {"Authorization": f"Bearer {token}"}


# ── Business schedule + slot config ──────────────────────────────────────────

@pytest.fixture
async def with_schedule():
    """
    Snapshot → delete → create datos de test → restore al finalizar.
    Evita MultipleResultsFound cuando el seed ya tiene datos en la DB.
    """
    async with _session_factory() as db:
        # Snapshot
        existing = (await db.execute(select(BusinessSchedule))).scalars().all()
        cfg = (await db.execute(select(SlotConfig).limit(1))).scalar_one_or_none()

        sched_snapshot = [
            {"day_of_week": s.day_of_week, "open_time": s.open_time,
             "close_time": s.close_time, "is_active": s.is_active}
            for s in existing
        ]
        cfg_snapshot = (
            {"slot_duration_minutes": cfg.slot_duration_minutes,
             "max_per_slot": cfg.max_per_slot,
             "max_advance_days": cfg.max_advance_days}
            if cfg else None
        )

        # Limpiar y crear datos de test
        await db.execute(text("DELETE FROM business_schedules"))
        await db.execute(text("DELETE FROM slot_config"))

        for dow in range(6):  # Lun–Sáb
            db.add(BusinessSchedule(
                day_of_week=dow,
                open_time=time_type(9, 0) if dow < 5 else time_type(10, 0),
                close_time=time_type(18, 0) if dow < 5 else time_type(14, 0),
                is_active=True,
            ))
        db.add(BusinessSchedule(  # Dom cerrado
            day_of_week=6, open_time=time_type(10, 0),
            close_time=time_type(13, 0), is_active=False,
        ))
        db.add(SlotConfig(slot_duration_minutes=30, max_per_slot=2, max_advance_days=30))
        await db.commit()

    yield

    # Restaurar datos originales
    async with _session_factory() as db:
        await db.execute(text("DELETE FROM appointments"))
        await db.execute(text("DELETE FROM business_schedules"))
        await db.execute(text("DELETE FROM slot_config"))
        for sd in sched_snapshot:
            db.add(BusinessSchedule(**sd))
        if cfg_snapshot:
            db.add(SlotConfig(**cfg_snapshot))
        await db.commit()
