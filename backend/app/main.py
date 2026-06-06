import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.api.v1 import router as api_v1_router
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


# QA-ADM-002: auto-cancelación de no-shows ────────────────────────────────────
# Cada 30 min cancela turnos pendientes/confirmados cuya hora ya pasó hace >1h.
# No envía email para evitar spam — el admin ya sabe que el turno no se realizó.

async def _auto_cancel_noshow() -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.appointment import Appointment, AppointmentStatus

    active = (AppointmentStatus.pending_confirmation, AppointmentStatus.confirmed)

    while True:
        await asyncio.sleep(30 * 60)  # ejecutar cada 30 minutos
        try:
            cutoff = datetime.now() - timedelta(hours=1)
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Appointment)
                    .where(Appointment.slot_datetime < cutoff)
                    .where(Appointment.status.in_(active))
                )
                apts = result.scalars().all()
                for apt in apts:
                    apt.status = AppointmentStatus.cancelled
                await db.commit()
                if apts:
                    logger.info("Auto-cancelados %d turno(s) sin asistencia", len(apts))
        except Exception as exc:
            logger.error("Error en tarea auto-cancel: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("media", exist_ok=True)
    task = asyncio.create_task(_auto_cancel_noshow())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory="media"), name="media")
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
