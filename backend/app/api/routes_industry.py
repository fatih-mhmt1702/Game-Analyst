from fastapi import APIRouter
from ..database.db import get_db_connection
from ..analytics.patterns import IndustryPatternAnalyzer

router = APIRouter(prefix="/api/industry", tags=["Industry Feedback"])

@router.get("/patterns")
def get_industry_patterns():
    with get_db_connection() as conn:
        return IndustryPatternAnalyzer.analyze_patterns(conn)
