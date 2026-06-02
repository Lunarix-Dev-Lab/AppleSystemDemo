from datetime import date, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_admin
from app.core.config import get_settings
from app.core.database import get_db
from app.core.notifications import (
    AptNotif,
    notify_cancelled,
    notify_cancelled_by_admin,
    notify_confirmed_by_admin,
    notify_created,
)
from app.models.appointment import Appointment, AppointmentStatus
from app.models.schedule import BusinessSchedule, SlotConfig
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatusUpdate,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

_ACTIVE = (AppointmentStatus.pending_confirmation, AppointmentStatus.confirmed)


def _notif(apt: Appointment) -> AptNotif:
    return AptNotif(
        guest_name=apt.guest_name,
        guest_email=apt.guest_email,
        guest_phone=apt.guest_phone,
        slot_datetime=apt.slot_datetime,
        management_token=apt.management_token,
        product_name=apt.product.name if apt.product else None,
    )


async def _load(appointment_id: int, db: AsyncSession) -> Appointment:
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.product))
        .where(Appointment.id == appointment_id)
    )
    a = (await db.execute(stmt)).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Turno no encontrado")
    return a


async def _load_by_token(token: str, db: AsyncSession) -> Appointment:
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.product))
        .where(Appointment.management_token == token)
    )
    a = (await db.execute(stmt)).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Turno no encontrado")
    return a


# ── Public: get by token ──────────────────────────────────────────────────────

@router.get("/by-token/{token}", response_model=AppointmentOut)
async def get_by_token(token: str, db: AsyncSession = Depends(get_db)):
    return await _load_by_token(token, db)


# ── Public: cancel by token ───────────────────────────────────────────────────

@router.post("/cancel/{token}", response_model=AppointmentOut)
async def cancel_by_token(
    token: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    appointment = await _load_by_token(token, db)
    if appointment.status == AppointmentStatus.cancelled:
        raise HTTPException(400, "El turno ya fue cancelado")

    data = _notif(appointment)  # capturar antes de cambiar estado
    appointment.status = AppointmentStatus.cancelled
    await db.commit()

    background_tasks.add_task(notify_cancelled, data)
    return await _load(appointment.id, db)


# ── Public: create ────────────────────────────────────────────────────────────

@router.post("", response_model=AppointmentOut, status_code=201)
async def create_appointment(
    data: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    slot_dt = data.slot_datetime.replace(tzinfo=None)
    target_date = slot_dt.date()
    today = date.today()

    if target_date < today:
        raise HTTPException(400, "No se puede reservar en el pasado")

    config = (await db.execute(select(SlotConfig).limit(1))).scalar_one()
    if (target_date - today).days > config.max_advance_days:
        raise HTTPException(
            400, f"Solo se puede reservar con {config.max_advance_days} días de anticipación máximo"
        )

    dow = target_date.weekday()
    schedule = (
        await db.execute(
            select(BusinessSchedule)
            .where(BusinessSchedule.day_of_week == dow)
            .where(BusinessSchedule.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if not schedule:
        raise HTTPException(400, "El local no atiende ese día")

    slot_time = slot_dt.time()
    if slot_time < schedule.open_time:
        raise HTTPException(400, "El horario está fuera del horario de atención")
    if (slot_dt + timedelta(minutes=config.slot_duration_minutes)).time() > schedule.close_time:
        raise HTTPException(400, "El horario está fuera del horario de atención")

    existing = (
        await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.slot_datetime == slot_dt)
            .where(Appointment.status.in_(_ACTIVE))
        )
    ).scalar()
    if existing >= config.max_per_slot:
        raise HTTPException(409, "El horario ya no tiene disponibilidad")

    appointment = Appointment(
        guest_name=data.guest_name,
        guest_email=data.guest_email,
        guest_phone=data.guest_phone,
        slot_datetime=slot_dt,
        product_id=data.product_id,
        notes=data.notes,
    )
    db.add(appointment)
    await db.commit()

    result = await _load(appointment.id, db)
    notif_data = _notif(result)
    business_phone = get_settings().BUSINESS_PHONE
    background_tasks.add_task(notify_created, notif_data, business_phone)

    return result


# ── Admin: list ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[AppointmentOut], dependencies=[Depends(require_admin)])
async def list_appointments(
    status: AppointmentStatus | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Appointment)
        .options(selectinload(Appointment.product))
        .order_by(Appointment.slot_datetime)
    )
    if status:
        stmt = stmt.where(Appointment.status == status)
    return (await db.execute(stmt)).scalars().all()


# ── Admin: update status ──────────────────────────────────────────────────────

@router.put(
    "/{appointment_id}/status",
    response_model=AppointmentOut,
    dependencies=[Depends(require_admin)],
)
async def update_status(
    appointment_id: int,
    data: AppointmentStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    appointment = await _load(appointment_id, db)
    notif_data = _notif(appointment)

    appointment.status = data.status
    await db.commit()

    if data.status == AppointmentStatus.confirmed:
        background_tasks.add_task(notify_confirmed_by_admin, notif_data)
    elif data.status == AppointmentStatus.cancelled:
        background_tasks.add_task(notify_cancelled_by_admin, notif_data)

    return await _load(appointment_id, db)
