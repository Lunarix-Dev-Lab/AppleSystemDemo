from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.ratelimit import RateLimiter
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.user import RefreshRequest, TokenResponse, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

# Anti fuerza bruta: 5 intentos de login por minuto por IP
_login_limiter = RateLimiter(max_requests=5, window_seconds=60)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    client_ip = (request.client.host if request.client else None) or "unknown"
    if not _login_limiter.allow(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Esperá un minuto e intentá de nuevo.",
        )

    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user:
        # Verificación dummy: iguala el tiempo de respuesta con el caso de
        # email válido para que no se puedan enumerar emails por timing.
        verify_password(credentials.password, DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    return TokenResponse(
        access_token=create_access_token(user.id, extra={"role": user.role}),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
    )
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise invalid
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise invalid

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise invalid

    return TokenResponse(
        access_token=create_access_token(user.id, extra={"role": user.role}),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return current_user
