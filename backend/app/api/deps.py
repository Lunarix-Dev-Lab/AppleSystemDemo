from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

_bearer = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise exc

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise exc
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Como get_current_user pero devuelve None en vez de 401.

    Para endpoints públicos que muestran más datos a un admin logueado.
    """
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        return None
    return user


def require_role(*roles: UserRole):
    """Dependencia de rol. Uso: Depends(require_role(UserRole.business_admin))"""
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes",
            )
        return current_user
    return _check


# Alias listos para usar en rutas
require_admin = require_role(UserRole.business_admin, UserRole.superadmin)
require_superadmin = require_role(UserRole.superadmin)
