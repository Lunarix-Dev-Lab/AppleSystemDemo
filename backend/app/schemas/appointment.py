from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.appointment import AppointmentStatus


class ProductMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class AppointmentCreate(BaseModel):
    guest_name: str
    guest_email: EmailStr
    guest_phone: str
    slot_datetime: datetime
    product_id: int | None = None
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


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


class BusinessInfoOut(BaseModel):
    schedules: list[ScheduleItemOut]
    config: SlotConfigOut
