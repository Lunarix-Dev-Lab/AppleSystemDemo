from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    order: int
    is_primary: bool


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    colors: list[str] = []
    storage_options: list[str] = []
    stock: int = 0
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    colors: list[str] | None = None
    storage_options: list[str] | None = None
    stock: int | None = None
    is_active: bool | None = None


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
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageOut] = []


class ImageReorderRequest(BaseModel):
    image_ids: list[int]
