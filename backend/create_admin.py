#!/usr/bin/env python3
"""
Crea (o actualiza) el usuario administrador de forma idempotente.

A diferencia de seed.py, este script es SEGURO para producción: solo toca la
tabla `users`, nunca borra productos ni turnos. Lee las credenciales de
ADMIN_EMAIL y ADMIN_PASSWORD (definidas en .env).

Uso tras el deploy:
    docker compose -f docker-compose.prod.yml exec backend python create_admin.py

Volvé a correrlo cuando quieras cambiar la contraseña del admin: actualizá
ADMIN_PASSWORD en .env y ejecutalo de nuevo.
"""
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User, UserRole

settings = get_settings()


async def main() -> None:
    email = (settings.ADMIN_EMAIL or "").strip().lower()
    password = settings.ADMIN_PASSWORD or ""

    if not email or not password:
        print("ERROR: definí ADMIN_EMAIL y ADMIN_PASSWORD en .env antes de correr este script.")
        sys.exit(1)
    if len(password) < 8:
        print("ERROR: ADMIN_PASSWORD debe tener al menos 8 caracteres.")
        sys.exit(1)

    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with Session() as db:
            user = (
                await db.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()

            if user:
                user.hashed_password = hash_password(password)
                user.is_active = True
                action = "actualizado"
            else:
                db.add(
                    User(
                        email=email,
                        hashed_password=hash_password(password),
                        full_name="Administrador",
                        role=UserRole.business_admin,
                        is_active=True,
                    )
                )
                action = "creado"
            await db.commit()
    finally:
        await engine.dispose()

    print(f"✓ Administrador {action}: {email}")


if __name__ == "__main__":
    asyncio.run(main())
