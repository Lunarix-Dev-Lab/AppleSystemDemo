from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "SistemaApple API"
    DEBUG: bool = False
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Admin inicial ─────────────────────────────────────────────────────────
    # Usados por create_admin.py para crear/actualizar el usuario administrador.
    # No se usan en ningún endpoint: solo en el script de provisión.
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    # En .env: ALLOWED_ORIGINS=["http://localhost:4000"] (JSON array)
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list) -> list:
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [o.strip() for o in v.split(",")]
        return v

    # ── Base de datos ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://apple:apple123@localhost:5432/sistemaapple"

    # ── Frontend ──────────────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:4000"

    # ── Email ─────────────────────────────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_TLS: bool = True

    # ── WhatsApp (Meta Cloud API) ─────────────────────────────────────────────
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_API_VERSION: str = "v19.0"
    # Número del dueño que recibe avisos de nuevos turnos (formato internacional: 549XXXXXXXXXX)
    BUSINESS_PHONE: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
