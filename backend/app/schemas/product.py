from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# Cada tag (color / storage) tiene max 100 chars y mínimo 1
_Tag = Annotated[str, Field(min_length=1, max_length=100)]


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    order: int
    is_primary: bool


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal = Field(ge=0, le=99_999_999)
    colors: list[_Tag] = Field(default=[], max_length=30)
    storage_options: list[_Tag] = Field(default=[], max_length=30)
    stock: int = Field(default=0, ge=0, le=99_999)
    is_active: bool = True
    is_sealed: bool = False
    battery_health: int | None = Field(default=None, ge=1, le=100)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("El nombre no puede estar vacío")
        return stripped

    @model_validator(mode="after")
    def validate_condition(self) -> "ProductCreate":
        if self.is_sealed:
            self.battery_health = None
        elif self.battery_health is None:
            raise ValueError("Un producto usado debe tener porcentaje de batería (1–100).")
        return self


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal | None = Field(default=None, ge=0, le=99_999_999)
    colors: list[_Tag] | None = Field(default=None, max_length=30)
    storage_options: list[_Tag] | None = Field(default=None, max_length=30)
    stock: int | None = Field(default=None, ge=0, le=99_999)
    is_active: bool | None = None
    is_sealed: bool | None = None
    battery_health: int | None = Field(default=None, ge=1, le=100)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError("El nombre no puede estar vacío")
        return stripped


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    price: Decimal
    colors: list[str]
    storage_options: list[str]
    stock: int
    is_active: bool
    is_sealed: bool
    battery_health: int | None
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageOut] = []


class ImageReorderRequest(BaseModel):
    image_ids: list[int] = Field(max_length=50)
