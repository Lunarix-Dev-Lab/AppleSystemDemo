from datetime import time

from sqlalchemy import Boolean, Integer, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BusinessSchedule(Base):
    """Horario de atención del local por día de semana (0=Lunes, 6=Domingo)."""

    __tablename__ = "business_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class SlotConfig(Base):
    """Configuración global de franjas de turno. Tabla de una sola fila."""

    __tablename__ = "slot_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    max_per_slot: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_advance_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
