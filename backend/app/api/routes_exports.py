from fastapi import APIRouter, Response
from fastapi.responses import HTMLResponse
from ..database.db import get_db_connection
from ..export.exporters import ReportExporter
from ..analytics.metrics import AnalyticsMetrics
from ..analytics.recommendations import RecommendationEngine
from ..config import settings

router = APIRouter(prefix="/api/export", tags=["Exports"])

@router.get("/csv")
def export_csv():
    with get_db_connection() as conn:
        csv_data = ReportExporter.export_csv(conn)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=nextfest_intelligence_dataset.csv"}
        )

@router.get("/json")
def export_json():
    with get_db_connection() as conn:
        json_data = ReportExporter.export_json(conn)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=nextfest_intelligence_records.json"}
        )

@router.get("/html", response_class=HTMLResponse)
def export_html():
    with get_db_connection() as conn:
        overview = AnalyticsMetrics.get_overview_metrics(conn, low_sample_threshold=settings.LOW_SAMPLE_THRESHOLD)
        top10 = AnalyticsMetrics.get_top10_games(conn, low_sample_threshold=settings.LOW_SAMPLE_THRESHOLD)
        recommendations = RecommendationEngine.generate_recommendations(conn)
        html_report = ReportExporter.generate_html_report(conn, overview, top10, recommendations)
        return HTMLResponse(content=html_report)
