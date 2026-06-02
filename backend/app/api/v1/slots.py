from collections import Counter
from datetime import date as date_t, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.schedule import BusinessSchedule, SlotConfig
from app.schemas.appointment import BusinessInfoOut, SlotOut

router = APIRouter(prefix="/slots", tags=["slots"])

_ACTIVE = (AppointmentStatus.pending_confirmation, AppointmentStatus.confirmed)


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

    if target < date_t.today():
        return []

    # Schedule for this weekday (Python: Mon=0 … Sun=6)
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

    # Generate slot datetimes
    duration = timedelta(minutes=config.slot_duration_minutes)
    slot_times: list[datetime] = []
    cur = datetime.combine(target, schedule.open_time)
    end = datetime.combine(target, schedule.close_time)
    while cur + duration <= end:
        slot_times.append(cur)
        cur += duration

    if not slot_times:
        return []

    # Count booked slots for this date (naive comparison)
    day_start = datetime.combine(target, time.min)
    day_end = datetime.combine(target, time.max)
    booked_dts = (
        await db.execute(
            select(Appointment.slot_datetime)
            .where(Appointment.slot_datetime.between(day_start, day_end))
            .where(Appointment.status.in_(_ACTIVE))
        )
    ).scalars().all()

    # Strip tz for comparison
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
