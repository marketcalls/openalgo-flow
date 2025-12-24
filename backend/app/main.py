from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import create_tables
from app.core.scheduler import workflow_scheduler
from app.api.routes import settings as settings_router
from app.api.routes import workflows as workflows_router
from app.api.routes import symbols as symbols_router
from app.api import websocket as websocket_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting OpenAlgo Flow...")
    await create_tables()
    workflow_scheduler.init()
    logger.info("OpenAlgo Flow started successfully")
    yield
    # Shutdown
    logger.info("Shutting down OpenAlgo Flow...")
    workflow_scheduler.shutdown()


app = FastAPI(
    title=settings.app_name,
    description="Visual workflow editor for OpenAlgo trading automation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(settings_router.router, prefix=settings.api_prefix)
app.include_router(workflows_router.router, prefix=settings.api_prefix)
app.include_router(symbols_router.router, prefix=settings.api_prefix)
app.include_router(websocket_router.router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
