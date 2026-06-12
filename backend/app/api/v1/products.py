import shutil
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user_optional, require_admin
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.product_image import ProductImage
from app.schemas.product import (
    ImageReorderRequest,
    ProductCreate,
    ProductImageOut,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])

_MEDIA_ROOT = Path("media/products")
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
_MAX_IMAGES_PER_PRODUCT = 12


async def _get_or_404(product_id: int, db: AsyncSession) -> Product:
    stmt = (
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.id == product_id)
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    return product


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProductOut])
async def list_products(
    active_only: bool = True,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    # Los productos inactivos solo son visibles para usuarios autenticados:
    # sin esto, cualquiera podría listar los ocultos con ?active_only=false
    if user is None:
        active_only = True
    stmt = (
        select(Product)
        .options(selectinload(Product.images))
        .order_by(Product.id)
    )
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True))
    return (await db.execute(stmt)).scalars().all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_or_404(product_id, db)
    if not product.is_active and user is None:
        raise HTTPException(404, "Producto no encontrado")
    return product


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("", response_model=ProductOut, status_code=201, dependencies=[Depends(require_admin)])
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    return await _get_or_404(product.id, db)


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
async def update_product(
    product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    product = await _get_or_404(product_id, db)
    updated = data.model_dump(exclude_unset=True)
    for field, value in updated.items():
        setattr(product, field, value)
    # Solo validar consistencia si se tocó algún campo de condición
    if "is_sealed" in updated or "battery_health" in updated:
        if product.is_sealed:
            product.battery_health = None
        elif product.battery_health is None:
            raise HTTPException(400, "Un producto usado debe tener porcentaje de batería.")
    await db.commit()
    return await _get_or_404(product_id, db)


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await _get_or_404(product_id, db)
    await db.delete(product)
    await db.commit()
    # Sin esto los archivos de imágenes quedan huérfanos y llenan el disco
    shutil.rmtree(_MEDIA_ROOT / str(product_id), ignore_errors=True)


# ── Images ────────────────────────────────────────────────────────────────────

@router.post(
    "/{product_id}/images",
    response_model=ProductImageOut,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
async def upload_image(
    product_id: int, file: UploadFile, db: AsyncSession = Depends(get_db)
):
    # Validar producto ANTES de procesar/escribir: si no existe, no queda
    # ningún archivo huérfano en disco.
    product = await _get_or_404(product_id, db)
    if len(product.images) >= _MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(
            400, f"Máximo {_MAX_IMAGES_PER_PRODUCT} imágenes por producto"
        )

    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(400, "Solo se permiten imágenes JPEG, PNG o WEBP")

    content = await file.read()
    if len(content) > _MAX_BYTES:
        raise HTTPException(400, "La imagen supera el límite de 10 MB")

    try:
        from PIL import Image

        img = Image.open(BytesIO(content)).convert("RGB")
        img.thumbnail((1200, 1200), Image.LANCZOS)

        dest = _MEDIA_ROOT / str(product_id)
        dest.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.jpg"
        img.save(dest / filename, "JPEG", quality=85)
    except Exception as exc:
        raise HTTPException(400, f"Imagen inválida: {exc}") from exc

    image = ProductImage(
        product_id=product_id,
        url=f"/media/products/{product_id}/{filename}",
        order=len(product.images),
        is_primary=len(product.images) == 0,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
)
async def delete_image(
    product_id: int, image_id: int, db: AsyncSession = Depends(get_db)
):
    product = await _get_or_404(product_id, db)
    image = next((i for i in product.images if i.id == image_id), None)
    if not image:
        raise HTTPException(404, "Imagen no encontrada")

    Path(image.url.lstrip("/")).unlink(missing_ok=True)

    was_primary = image.is_primary
    await db.delete(image)
    await db.flush()

    if was_primary:
        remaining = sorted(
            [i for i in product.images if i.id != image_id], key=lambda x: x.order
        )
        if remaining:
            remaining[0].is_primary = True

    await db.commit()


@router.put(
    "/{product_id}/images/reorder",
    dependencies=[Depends(require_admin)],
)
async def reorder_images(
    product_id: int, data: ImageReorderRequest, db: AsyncSession = Depends(get_db)
):
    product = await _get_or_404(product_id, db)
    img_map = {i.id: i for i in product.images}
    for order, image_id in enumerate(data.image_ids):
        if image_id in img_map:
            img_map[image_id].order = order
            img_map[image_id].is_primary = order == 0
    await db.commit()
    return {"ok": True}
