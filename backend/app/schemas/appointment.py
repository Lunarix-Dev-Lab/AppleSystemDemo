import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.appointment import AppointmentStatus


class ProductMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class AppointmentCreate(BaseModel):
    guest_name: str = Field(min_length=2, max_length=30)
    guest_email: EmailStr
    guest_phone: str = Field(min_length=7, max_length=20)
    slot_datetime: datetime
    product_id: int | None = None
    notes: str | None = Field(default=None, max_length=30)

    @field_validator("guest_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not re.match(r"^\d{7,20}$", cleaned):
            raise ValueError("Teléfono inválido. Ingresá solo dígitos (sin espacios ni símbolos).")
        return cleaned

    @field_validator("guest_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("El nombre no puede estar vacío.")
        return stripped


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    # QA-ADM-005: motivo de cancelación (opcional, se incluye en el email)
    cancel_reason: str | None = Field(default=None, max_length=300)


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    guest_name: str
    guest_email: str
    guest_phone: str
    slot_datetime: datetime
    product_id: int | None
    status: AppointmentStatus
    management_token: str
    notes: str | None
    created_at: datetime
    product: ProductMinimal | None = None


class SlotOut(BaseModel):
    time: str           # "09:00"
    slot_datetime: str  # ISO string naive
    available: bool
    booked: int
    max: int


class ScheduleItemOut(BaseModel):
    day_of_week: int
    open_time: str   # "09:00"
    close_time: str  # "18:00"
    is_active: bool


class SlotConfigOut(BaseModel):
    slot_duration_minutes: int
    max_per_slot: int
    max_advance_days: int
    display_currency: Literal['ARS', 'USD'] = 'ARS'
    usd_rate: float = 1000.0


class BusinessInfoOut(BaseModel):
    schedules: list[ScheduleItemOut]
    config: SlotConfigOut
