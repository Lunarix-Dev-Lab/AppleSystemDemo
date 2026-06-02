from fastapi import APIRouter

from .auth import router as auth_router
from .products import router as products_router
from .slots import router as slots_router
from .appointments import router as appointments_router
from .stats import router as stats_router
from .schedules import router as schedules_router, config_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(products_router)
router.include_router(slots_router)
router.include_router(appointments_router)
router.include_router(stats_router)
router.include_router(schedules_router)
router.include_router(config_router)
