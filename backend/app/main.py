import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database.db import init_db
from .config import settings
from .api.routes_overview import router as overview_router
from .api.routes_games import router as games_router
from .api.routes_industry import router as industry_router
from .api.routes_charts import router as charts_router
from .api.routes_recommendations import router as recommendations_router
from .api.routes_data import router as data_router
from .api.routes_jobs import router as jobs_router
from .api.routes_exports import router as exports_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("NextFestInsight")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database schema and default rows exist
    logger.info("Initializing NextFest Insight database...")
    init_db()
    yield
    logger.info("Shutting down NextFest Insight backend...")

app = FastAPI(
    title="NextFest Insight API",
    description="Steam Next Fest Feedback Intelligence Desktop Service",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Desktop Electron / Web React UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(overview_router)
app.include_router(games_router)
app.include_router(industry_router)
app.include_router(charts_router)
app.include_router(recommendations_router)
app.include_router(data_router)
app.include_router(jobs_router)
app.include_router(exports_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NextFest Insight Backend",
        "version": "1.0.0",
        "low_sample_threshold": settings.LOW_SAMPLE_THRESHOLD,
        "active_event": settings.EVENT_DEFAULT_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
