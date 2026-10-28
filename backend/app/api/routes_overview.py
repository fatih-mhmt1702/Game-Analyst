from fastapi import APIRouter, Depends
from ..database.db import get_db_connection
from ..analytics.metrics import AnalyticsMetrics
from ..config import settings

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("")
def get_overview():
    with get_db_connection() as conn:
        metrics = AnalyticsMetrics.get_overview_metrics(conn, low_sample_threshold=settings.LOW_SAMPLE_THRESHOLD)
        return metrics
