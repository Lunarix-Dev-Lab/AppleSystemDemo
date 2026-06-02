from datetime import time as time_type

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.schedule import BusinessSchedule, SlotConfig

# ── Horarios ──────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/schedules", tags=["schedules"])


class ScheduleUpdate(BaseModel):
    open_time: str   # "HH:MM"
    close_time: str  # "HH:MM"
    is_active: bool

    @field_validator("open_time", "close_time")
    @classmethod
    def valid_time(cls, v: str) -> str:
        try:
            h, m = map(int, v.split(":"))
            assert 0 <= h <= 23 and 0 <= m <= 59
        except Exception:
            raise ValueError("Formato de hora inválido. Use HH:MM")
        return v


def _serialize(s: BusinessSchedule) -> dict:
    return {
        "id": s.id,
        "day_of_week": s.day_of_week,
        "open_time": s.open_time.strftime("%H:%M"),
        "close_time": s.close_time.strftime("%H:%M"),
        "is_active": s.is_active,
    }


@router.get("", dependencies=[Depends(require_admin)])
async def list_schedules(db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(BusinessSchedule).order_by(BusinessSchedule.day_of_week)
    )
    return [_serialize(s) for s in result.scalars().all()]


@router.put("/{schedule_id}", dependencies=[Depends(require_admin)])
async def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    schedule = (
        await db.execute(select(BusinessSchedule).where(BusinessSchedule.id == schedule_id))
    ).scalar_one_or_none()
    if not schedule:
        raise HTTPException(404, "Horario no encontrado")

    h_open, m_open = map(int, data.open_time.split(":"))
    h_close, m_close = map(int, data.close_time.split(":"))

    if time_type(h_open, m_open) >= time_type(h_close, m_close):
        raise HTTPException(400, "La hora de apertura debe ser anterior al cierre")

    schedule.open_time = time_type(h_open, m_open)
    schedule.close_time = time_type(h_close, m_close)
    schedule.is_active = data.is_active
    await db.commit()
    return _serialize(schedule)


# ── Configuración de slots ────────────────────────────────────────────────────

config_router = APIRouter(prefix="/config", tags=["config"])


class SlotConfigUpdate(BaseModel):
    slot_duration_minutes: int
    max_per_slot: int
    max_advance_days: int


@config_router.get("", dependencies=[Depends(require_admin)])
async def get_config(db: AsyncSession = Depends(get_db)) -> dict:
    config = (await db.execute(select(SlotConfig).limit(1))).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Configuración no encontrada")
    return {
        "id": config.id,
        "slot_duration_minutes": config.slot_duration_minutes,
        "max_per_slot": config.max_per_slot,
        "max_advance_days": config.max_advance_days,
    }


@config_router.put("", dependencies=[Depends(require_admin)])
async def update_config(data: SlotConfigUpdate, db: AsyncSession = Depends(get_db)) -> dict:
    config = (await db.execute(select(SlotConfig).limit(1))).scalar_one_or_none()
    if not config:
        raise HTTPException(404, "Configuración no encontrada")

    if data.slot_duration_minutes < 15:
        raise HTTPException(400, "La duración mínima es 15 minutos")
    if data.max_per_slot < 1:
        raise HTTPException(400, "El mínimo es 1 persona por turno")
    if data.max_advance_days < 1:
        raise HTTPException(400, "El mínimo es 1 día de anticipación")

    config.slot_duration_minutes = data.slot_duration_minutes
    config.max_per_slot = data.max_per_slot
    config.max_advance_days = data.max_advance_days
    await db.commit()
    return {
        "id": config.id,
        "slot_duration_minutes": config.slot_duration_minutes,
        "max_per_slot": config.max_per_slot,
        "max_advance_days": config.max_advance_days,
    }
