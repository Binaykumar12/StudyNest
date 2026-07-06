import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.logging import setup_logging
from routes.auth import router as auth_router
from routes.health import router as health_router

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AK Pathshala API",
    description="Nepal CDC AI-Powered Learning Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("AK Pathshala API started (env=%s)", settings.env)
