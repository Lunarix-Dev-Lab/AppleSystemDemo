import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from .product import Product


class AppointmentStatus(str, enum.Enum):
    pending_confirmation = "pending_confirmation"
    confirmed = "confirmed"
    cancelled = "cancelled"
    rescheduled = "rescheduled"
    realizado = "realizado"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _token() -> str:
    return uuid.uuid4().hex


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Datos del invitado (sin cuenta)
    guest_name: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    guest_phone: Mapped[str] = mapped_column(String(50), nullable=False)

    # Franja reservada (fecha + hora exacta)
    slot_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # Producto de interés (opcional)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, name="appointmentstatus", create_type=False),
        nullable=False,
        default=AppointmentStatus.pending_confirmation,
    )

    # Token único para el link de cancelación/reprogramación en el email
    management_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True, default=_token
    )

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=_utcnow
    )

    product: Mapped["Product | None"] = relationship("Product")
