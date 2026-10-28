from fastapi import APIRouter
from ..database.db import get_db_connection
from ..analytics.recommendations import RecommendationEngine

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("")
def get_recommendations():
    with get_db_connection() as conn:
        return RecommendationEngine.generate_recommendations(conn)
