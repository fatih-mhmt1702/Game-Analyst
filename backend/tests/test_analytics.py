import tempfile
import os
from backend.app.database.db import init_db, get_db_connection
from backend.app.analytics.metrics import AnalyticsMetrics
from backend.app.analytics.recommendations import RecommendationEngine

def test_analytics_metrics_and_low_sample_warning():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        init_db(db_path)
        with get_db_connection(db_path) as conn:
            overview = AnalyticsMetrics.get_overview_metrics(conn, low_sample_threshold=30)
            assert overview["total_games_analyzed"] >= 10
            assert "coverage_warnings" in overview

            top10 = AnalyticsMetrics.get_top10_games(conn, low_sample_threshold=30)
            assert len(top10) == 10
            # Every game should have a verified status flag
            assert isinstance(top10[0]["ccu_verified"], bool)

            recs = RecommendationEngine.generate_recommendations(conn)
            assert "recommendations" in recs
            assert len(recs["recommendations"]) >= 6
            # Verify estimated effort is explicitly labeled
            for r in recs["recommendations"]:
                assert "Tahmini" in r["estimated_effort"] or "Estimate" in r["estimated_effort"]
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
