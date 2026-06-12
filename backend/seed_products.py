#!/usr/bin/env python3
"""
Seed de productos de ejemplo: 8 iPhones con sus imágenes reales.

SEGURO para producción (a diferencia de seed.py, que BORRA todo):
- Es idempotente: solo inserta si la tabla `products` está vacía.
- No toca usuarios, turnos ni configuración.
- Las imágenes se empaquetan en backend/seed_assets/products/ y se procesan
  con el mismo pipeline que el panel admin (Pillow → JPEG ≤1200px).

Uso tras el deploy:
    docker compose -f docker-compose.prod.yml exec backend python seed_products.py

Nota: el precio se guarda en ARS = USD × (tipo de cambio configurado). Conviene
configurar el tipo de cambio en /admin/configuracion ANTES de correr el seed.
Igual son productos de ejemplo: editalos o ajustá precios desde el panel.
"""
import asyncio
import sys
import uuid
from pathlib import Path

from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.schedule import SlotConfig

settings = get_settings()

_ASSETS = Path(__file__).parent / "seed_assets" / "products"
_MEDIA_ROOT = Path("media/products")

# Precio en USD (se convierte a ARS con el tipo de cambio configurado).
PRODUCTS: list[dict] = [
    {
        "key": "16pro", "name": "iPhone 16 Pro", "usd": 1300, "sealed": True,
        "battery": None, "stock": 5,
        "colors": ["Titanio Natural", "Titanio Negro", "Titanio Blanco", "Titanio Desierto"],
        "storage": ["256GB", "512GB", "1TB"],
        "desc": "Sellado, nuevo de fábrica. Chip A18 Pro, sistema de cámaras Pro de 48 MP "
                "y pantalla Super Retina XDR de 6.3 pulgadas. Garantía Apple.",
    },
    {
        "key": "15promax", "name": "iPhone 15 Pro Max", "usd": 1150, "sealed": True,
        "battery": None, "stock": 3,
        "colors": ["Titanio Natural", "Titanio Azul", "Titanio Negro", "Titanio Blanco"],
        "storage": ["256GB", "512GB", "1TB"],
        "desc": "Sellado, nuevo. Cuerpo de titanio, chip A17 Pro, zoom óptico 5x y puerto "
                "USB-C. El Pro Max más potente.",
    },
    {
        "key": "15", "name": "iPhone 15", "usd": 800, "sealed": True,
        "battery": None, "stock": 6,
        "colors": ["Azul", "Rosa", "Negro", "Verde", "Amarillo"],
        "storage": ["128GB", "256GB", "512GB"],
        "desc": "Sellado, nuevo. Dynamic Island, cámara de 48 MP y USB-C. Garantía oficial.",
    },
    {
        "key": "se", "name": "iPhone SE (3ª gen)", "usd": 420, "sealed": True,
        "battery": None, "stock": 4,
        "colors": ["Medianoche", "Blanco Estrella", "PRODUCT RED"],
        "storage": ["64GB", "128GB", "256GB"],
        "desc": "Sellado, nuevo. Chip A15 Bionic y Touch ID. La opción más accesible con "
                "potencia de sobra.",
    },
    {
        "key": "14pro", "name": "iPhone 14 Pro", "usd": 750, "sealed": False,
        "battery": 91, "stock": 2,
        "colors": ["Morado Oscuro", "Negro Espacial", "Plata", "Oro"],
        "storage": ["128GB", "256GB"],
        "desc": "Usado en excelente estado. Dynamic Island, cámara de 48 MP y pantalla "
                "siempre activa.",
    },
    {
        "key": "13", "name": "iPhone 13", "usd": 520, "sealed": False,
        "battery": 88, "stock": 3,
        "colors": ["Blanco Estrella", "Medianoche", "Azul", "PRODUCT RED"],
        "storage": ["128GB", "256GB"],
        "desc": "Usado, muy buen estado. Doble cámara, chip A15 Bionic y gran autonomía.",
    },
    {
        "key": "12", "name": "iPhone 12", "usd": 400, "sealed": False,
        "battery": 84, "stock": 2,
        "colors": ["Negro", "Blanco", "Azul", "PRODUCT RED", "Verde"],
        "storage": ["64GB", "128GB"],
        "desc": "Usado, buen estado. Pantalla OLED Super Retina XDR y conectividad 5G.",
    },
    {
        "key": "11", "name": "iPhone 11", "usd": 290, "sealed": False,
        "battery": 79, "stock": 1,
        "colors": ["Negro", "Blanco", "PRODUCT RED", "Amarillo"],
        "storage": ["64GB", "128GB"],
        "desc": "Usado, funcional. Doble cámara y batería para todo el día. Ideal primer iPhone.",
    },
]


def _process_image(src: Path, product_id: int) -> str:
    """Mismo pipeline que el upload del admin: convierte a JPEG ≤1200px."""
    img = Image.open(src).convert("RGB")
    img.thumbnail((1200, 1200), Image.LANCZOS)
    dest = _MEDIA_ROOT / str(product_id)
    dest.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(dest / filename, "JPEG", quality=85)
    return f"/media/products/{product_id}/{filename}"


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with Session() as db:
            existing = (await db.execute(select(func.count(Product.id)))).scalar()
            if existing and existing > 0:
                print(f"Ya hay {existing} producto(s). El seed es idempotente y no hace nada.")
                return

            config = (await db.execute(select(SlotConfig).limit(1))).scalar_one_or_none()
            if not config:
                print("ERROR: no hay configuración de turnos. Corré 'alembic upgrade head' primero.")
                sys.exit(1)
            rate = float(config.usd_rate)

            print(f"Tipo de cambio configurado: 1 USD = {rate:.0f} ARS")
            for p in PRODUCTS:
                product = Product(
                    name=p["name"],
                    description=p["desc"],
                    price=round(p["usd"] * rate),
                    colors=p["colors"],
                    storage_options=p["storage"],
                    stock=p["stock"],
                    is_active=True,
                    is_sealed=p["sealed"],
                    battery_health=p["battery"],
                )
                db.add(product)
                await db.flush()  # asigna el id

                src = _ASSETS / f"{p['key']}.jpg"
                if src.exists():
                    url = _process_image(src, product.id)
                    db.add(ProductImage(product_id=product.id, url=url, order=0, is_primary=True))
                else:
                    print(f"  ! aviso: falta la imagen {src.name}, el producto queda sin foto")

                await db.commit()
                print(f"  + {p['name']}  (USD {p['usd']} = ARS {round(p['usd'] * rate)})")
    finally:
        await engine.dispose()

    print(f"\n✓ Seed completo: {len(PRODUCTS)} productos de ejemplo cargados.")


if __name__ == "__main__":
    asyncio.run(main())
