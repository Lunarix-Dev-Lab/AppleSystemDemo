#!/usr/bin/env python3
"""
Script de seed con datos de demo.
Uso (desde la carpeta backend/ o vía Docker):
    python seed.py
    docker-compose exec backend python seed.py
"""
import asyncio
import sys
from datetime import time
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import (
    Appointment,   # noqa: F401
    BusinessSchedule,
    Product,
    ProductImage,
    SlotConfig,
    User,
    UserRole,
)

settings = get_settings()
engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Usuario administrador ─────────────────────────────────────────────────────

ADMIN = {
    "email": "admin@sistemaapple.com",
    "password": "Admin2025!",
    "full_name": "Administrador",
    "role": UserRole.business_admin,
}

# ── Productos ─────────────────────────────────────────────────────────────────
# Precios en ARS (valores orientativos para demo).
# Imágenes via picsum.photos (placeholders — reemplazarlas con fotos reales).

PRODUCTS: list[dict] = [
    {
        "name": "iPhone 16 Pro Max",
        "description": (
            "El iPhone más avanzado. Chip A18 Pro con GPU de 6 núcleos, "
            "pantalla Super Retina XDR de 6.9\" con ProMotion 120 Hz, "
            "sistema de cámaras de 48 MP con zoom óptico 5x y Apple Intelligence. "
            "Cuerpo de titanio grado aeroespacial."
        ),
        "price": Decimal("2749999"),
        "colors": ["Titanio Negro", "Titanio Blanco", "Titanio Natural", "Titanio Desierto"],
        "storage_options": ["256GB", "512GB", "1TB"],
        "stock": 6,
        "images": [("/iphone-placeholder.svg", True)],
    },
    {
        "name": "iPhone 16 Pro",
        "description": (
            "Potencia Pro en el tamaño perfecto. Chip A18 Pro, "
            "pantalla Super Retina XDR de 6.3\" con ProMotion 120 Hz, "
            "cámara de 48 MP con zoom óptico 5x y control de cámara dedicado."
        ),
        "price": Decimal("2249999"),
        "colors": ["Titanio Negro", "Titanio Blanco", "Titanio Natural", "Titanio Desierto"],
        "storage_options": ["128GB", "256GB", "512GB", "1TB"],
        "stock": 8,
        "images": [("/iphone-placeholder.svg", True)],
    },
    {
        "name": "iPhone 16",
        "description": (
            "Diseñado para Apple Intelligence. Chip A18, Dynamic Island, "
            "cámara principal de 48 MP, pantalla de 6.1\" y carga MagSafe de 25 W. "
            "El iPhone para todos."
        ),
        "price": Decimal("1749999"),
        "colors": ["Negro", "Blanco", "Rosa", "Verde Azulado", "Ultramar"],
        "storage_options": ["128GB", "256GB", "512GB"],
        "stock": 15,
        "images": [("/iphone-placeholder.svg", True)],
    },
    {
        "name": "iPhone 16 Plus",
        "description": (
            "La pantalla grande con la batería más larga de la historia del iPhone. "
            "Chip A18, Dynamic Island, pantalla de 6.7\" y cámara de 48 MP. "
            "Ideal para quienes buscan más espacio sin resignar rendimiento."
        ),
        "price": Decimal("1949999"),
        "colors": ["Negro", "Blanco", "Rosa", "Verde Azulado", "Ultramar"],
        "storage_options": ["128GB", "256GB", "512GB"],
        "stock": 10,
        "images": [("/iphone-placeholder.svg", True)],
    },
    {
        "name": "iPhone 15 Pro",
        "description": (
            "Titanio. Tan liviano. Tan Pro. Chip A17 Pro, "
            "diseño de titanio grado aeroespacial, botón de Acción personalizable "
            "y cámara con zoom óptico 3x. El Pro más accesible del mercado."
        ),
        "price": Decimal("1649999"),
        "colors": ["Titanio Negro", "Titanio Azul", "Titanio Natural", "Titanio Blanco"],
        "storage_options": ["128GB", "256GB", "512GB", "1TB"],
        "stock": 5,
        "images": [("/iphone-placeholder.svg", True)],
    },
    {
        "name": "iPhone 15",
        "description": (
            "Dynamic Island en el iPhone estándar. Chip A16 Bionic, "
            "cámara principal de 48 MP, conector USB-C y pantalla de 6.1\". "
            "El punto de entrada perfecto al ecosistema Apple."
        ),
        "price": Decimal("1399999"),
        "colors": ["Negro", "Amarillo", "Rosa", "Verde", "Azul"],
        "storage_options": ["128GB", "256GB", "512GB"],
        "stock": 12,
        "images": [("/iphone-placeholder.svg", True)],
    },
]

# ── Horarios de atención ──────────────────────────────────────────────────────
# 0=Lunes … 6=Domingo

SCHEDULES: list[dict] = [
    {"day_of_week": 0, "open_time": time(9, 0),  "close_time": time(18, 0), "is_active": True},
    {"day_of_week": 1, "open_time": time(9, 0),  "close_time": time(18, 0), "is_active": True},
    {"day_of_week": 2, "open_time": time(9, 0),  "close_time": time(18, 0), "is_active": True},
    {"day_of_week": 3, "open_time": time(9, 0),  "close_time": time(18, 0), "is_active": True},
    {"day_of_week": 4, "open_time": time(9, 0),  "close_time": time(18, 0), "is_active": True},
    {"day_of_week": 5, "open_time": time(10, 0), "close_time": time(14, 0), "is_active": True},
    {"day_of_week": 6, "open_time": time(10, 0), "close_time": time(13, 0), "is_active": False},
]


async def seed() -> None:
    async with SessionLocal() as db:
        # Limpiar en orden correcto (FK)
        for table in (
            "appointments", "slot_config", "business_schedules",
            "product_images", "products", "users",
        ):
            await db.execute(text(f"DELETE FROM {table}"))  # noqa: S608
        await db.commit()

        # ── Usuario ────────────────────────────────────────────────────────────
        db.add(User(
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            full_name=ADMIN["full_name"],
            role=ADMIN["role"],
        ))

        # ── Productos ──────────────────────────────────────────────────────────
        for p_data in PRODUCTS:
            product = Product(
                name=p_data["name"],
                description=p_data["description"],
                price=p_data["price"],
                colors=p_data["colors"],
                storage_options=p_data["storage_options"],
                stock=p_data["stock"],
            )
            db.add(product)
            await db.flush()

            for idx, (url, is_primary) in enumerate(p_data["images"]):
                db.add(ProductImage(
                    product_id=product.id,
                    url=url,
                    order=idx,
                    is_primary=is_primary,
                ))

        # ── Horarios ───────────────────────────────────────────────────────────
        for s in SCHEDULES:
            db.add(BusinessSchedule(**s))

        # ── Configuración de franjas ───────────────────────────────────────────
        db.add(SlotConfig(
            slot_duration_minutes=30,
            max_per_slot=2,
            max_advance_days=30,
        ))

        await db.commit()

    print("\n✓ Seed completado\n")
    print("  Usuario administrador:")
    print(f"    Email:    {ADMIN['email']}")
    print(f"    Password: {ADMIN['password']}")
    print(f"\n  {len(PRODUCTS)} productos cargados")
    print("  Horarios: Lun–Vie 09:00–18:00 · Sáb 10:00–14:00 · Dom cerrado")
    print("  Turnos: 30 min · máx 2 personas/franja · 30 días de anticipación\n")


if __name__ == "__main__":
    try:
        asyncio.run(seed())
    except Exception as exc:
        print(f"\n✗ Error durante el seed: {exc}", file=sys.stderr)
        sys.exit(1)
