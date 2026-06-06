from collections import Counter
from datetime import date as date_t, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.schedule import BusinessSchedule, SlotConfig
from app.schemas.appointment import BusinessInfoOut, SlotOut

router = APIRouter(prefix="/slots", tags=["slots"])

_ACTIVE = (AppointmentStatus.pending_confirmation, AppointmentStatus.confirmed)
_ART = ZoneInfo("America/Argentina/Buenos_Aires")


def _local_now() -> datetime:
    """Hora actual en Argentina, como datetime naive (compatible con slot_times)."""
    return datetime.now(_ART).replace(tzinfo=None)


def _local_today() -> date_t:
    """Fecha de hoy en Argentina."""
    return datetime.now(_ART).date()


@router.get("/schedule", response_model=BusinessInfoOut)
async def get_schedule(db: AsyncSession = Depends(get_db)):
    schedules = (
        await db.execute(select(BusinessSchedule).order_by(BusinessSchedule.day_of_week))
    ).scalars().all()
    config = (await db.execute(select(SlotConfig).limit(1))).scalar_one_or_none()
    if not config:
        raise HTTPException(500, "Configuración de turnos no encontrada")
    return {
        "schedules": [
            {
                "day_of_week": s.day_of_week,
                "open_time": s.open_time.strftime("%H:%M"),
                "close_time": s.close_time.strftime("%H:%M"),
                "is_active": s.is_active,
            }
            for s in schedules
        ],
        "config": {
            "slot_duration_minutes": config.slot_duration_minutes,
            "max_per_slot": config.max_per_slot,
            "max_advance_days": config.max_advance_days,
            "display_currency": config.display_currency,
            "usd_rate": float(config.usd_rate),
        },
    }


@router.get("", response_model=list[SlotOut])
async def get_slots(
    date: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        target = date_t.fromisoformat(date)
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido. Use YYYY-MM-DD")

    if target < _local_today():
        return []

    dow = target.weekday()
    schedule = (
        await db.execute(
            select(BusinessSchedule)
            .where(BusinessSchedule.day_of_week == dow)
            .where(BusinessSchedule.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if not schedule:
        return []

    config = (await db.execute(select(SlotConfig).limit(1))).scalar_one()

    # QA-ADM-010: si close_time es 00:00, tratarlo como medianoche del día siguiente
    if schedule.close_time == time(0, 0):
        end = datetime.combine(target + timedelta(days=1), time(0, 0))
    else:
        end = datetime.combine(target, schedule.close_time)

    duration = timedelta(minutes=config.slot_duration_minutes)
    slot_times: list[datetime] = []
    cur = datetime.combine(target, schedule.open_time)
    while cur + duration <= end:
        slot_times.append(cur)
        cur += duration

    # QA-RES-005: para el día de hoy, descartar slots que ya pasaron
    # (con 5 min de gracia para no rechazar el slot actual)
    if target == _local_today():
        cutoff = _local_now() + timedelta(minutes=5)
        slot_times = [s for s in slot_times if s > cutoff]

    if not slot_times:
        return []

    day_start = datetime.combine(target, time.min)
    day_end = datetime.combine(target, time.max)
    booked_dts = (
        await db.execute(
            select(Appointment.slot_datetime)
            .where(Appointment.slot_datetime.between(day_start, day_end))
            .where(Appointment.status.in_(_ACTIVE))
        )
    ).scalars().all()

    counts: Counter = Counter(
        dt.replace(tzinfo=None) if getattr(dt, "tzinfo", None) else dt
        for dt in booked_dts
    )

    return [
        {
            "time": s.strftime("%H:%M"),
            "slot_datetime": s.isoformat(),
            "available": counts.get(s, 0) < config.max_per_slot,
            "booked": counts.get(s, 0),
            "max": config.max_per_slot,
        }
        for s in slot_times
    ]
