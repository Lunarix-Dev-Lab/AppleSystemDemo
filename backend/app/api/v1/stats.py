from datetime import date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.product import Product

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", dependencies=[Depends(require_admin)])
async def get_stats(db: AsyncSession = Depends(get_db)) -> dict:
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    products = (
        await db.execute(
            select(func.count(Product.id)).where(Product.is_active.is_(True))
        )
    ).scalar_one()

    today_appointments = (
        await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.slot_datetime.between(today_start, today_end))
            .where(Appointment.status != AppointmentStatus.cancelled)
        )
    ).scalar_one()

    pending_appointments = (
        await db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.status == AppointmentStatus.pending_confirmation)
        )
    ).scalar_one()

    return {
        "products": products,
        "today_appointments": today_appointments,
        "pending_appointments": pending_appointments,
    }
