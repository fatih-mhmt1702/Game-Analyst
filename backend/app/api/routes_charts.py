import sqlite3
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..database.db import get_db_connection
from ..models.schemas import FEEDBACK_TOPICS

router = APIRouter(prefix="/api/charts", tags=["Charts & Comparisons"])

@router.get("/sentiment-by-game")
def get_sentiment_by_game(limit: int = 10):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT g.title,
                   SUM(CASE WHEN sc.sentiment = 'Positive' THEN 1 ELSE 0 END) as positive,
                   SUM(CASE WHEN sc.sentiment = 'Negative' THEN 1 ELSE 0 END) as negative,
                   SUM(CASE WHEN sc.sentiment = 'Mixed' THEN 1 ELSE 0 END) as mixed,
                   SUM(CASE WHEN sc.sentiment = 'Neutral' THEN 1 ELSE 0 END) as neutral,
                   COUNT(pc.id) as total
            FROM games g
            JOIN game_comment_associations gca ON g.id = gca.game_id
            JOIN posts_comments pc ON gca.comment_id = pc.id
            JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY g.id
            ORDER BY total DESC
            LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

@router.get("/topic-frequency")
def get_topic_frequency():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as total_count,
                   SUM(CASE WHEN tc.sentiment_in_topic = 'Positive' THEN 1 ELSE 0 END) as positive_count,
                   SUM(CASE WHEN tc.sentiment_in_topic = 'Negative' THEN 1 ELSE 0 END) as negative_count
            FROM topic_classifications tc
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY tc.topic
            ORDER BY total_count DESC
        """)
        return [dict(r) for r in cursor.fetchall()]

@router.get("/platform-comparison")
def get_platform_comparison():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ds.name as platform, sc.sentiment, COUNT(pc.id) as count
            FROM posts_comments pc
            JOIN data_sources ds ON pc.source_id = ds.id
            JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
              AND ds.name IN ('reddit', 'x', 'steam')
            GROUP BY ds.name, sc.sentiment
        """)
        rows = cursor.fetchall()
        result: Dict[str, Dict[str, int]] = {}
        for r in rows:
            plat = r["platform"]
            if plat not in result:
                result[plat] = {"Positive": 0, "Negative": 0, "Mixed": 0, "Neutral": 0, "Uncertain": 0}
            result[plat][r["sentiment"]] = r["count"]
        return result

@router.get("/volume-over-time")
def get_volume_over_time():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SUBSTR(pc.published_at, 1, 10) as date,
                   ds.name as source_name,
                   COUNT(pc.id) as count
            FROM posts_comments pc
            JOIN data_sources ds ON pc.source_id = ds.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY date, ds.name
            ORDER BY date ASC
        """)
        rows = cursor.fetchall()
        days_map: Dict[str, Dict[str, Any]] = {}
        for r in rows:
            d = r["date"]
            if d not in days_map:
                days_map[d] = {"date": d, "total": 0, "reddit": 0, "x": 0, "steam": 0, "imported": 0}
            src = r["source_name"]
            c = r["count"]
            days_map[d]["total"] += c
            if src in days_map[d]:
                days_map[d][src] += c
            else:
                days_map[d]["imported"] += c
        return list(days_map.values())

@router.get("/severity-by-game")
def get_severity_by_game(limit: int = 10):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT g.title,
                   SUM(CASE WHEN tc.severity = 'Critical' THEN 1 ELSE 0 END) as critical,
                   SUM(CASE WHEN tc.severity = 'Major' THEN 1 ELSE 0 END) as major,
                   SUM(CASE WHEN tc.severity = 'Moderate' THEN 1 ELSE 0 END) as moderate,
                   SUM(CASE WHEN tc.severity = 'Minor' THEN 1 ELSE 0 END) as minor
            FROM games g
            JOIN game_comment_associations gca ON g.id = gca.game_id
            JOIN topic_classifications tc ON gca.comment_id = tc.comment_id
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY g.id
            ORDER BY (critical * 3 + major * 2 + moderate) DESC
            LIMIT ?
        """, (limit,))
        return [dict(r) for r in cursor.fetchall()]

@router.get("/heatmap")
def get_heatmap():
    """Returns matrix of Topics vs Sentiments."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT tc.topic, tc.sentiment_in_topic as sentiment, COUNT(tc.id) as count
            FROM topic_classifications tc
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY tc.topic, tc.sentiment_in_topic
        """)
        rows = cursor.fetchall()
        matrix: Dict[str, Dict[str, int]] = {}
        for topic in FEEDBACK_TOPICS:
            matrix[topic] = {"Positive": 0, "Negative": 0, "Mixed": 0, "Neutral": 0}
        
        for r in rows:
            top = r["topic"]
            sent = r["sentiment"]
            if top in matrix and sent in matrix[top]:
                matrix[top][sent] = r["count"]
        
        return [{"topic": k, **v} for k, v in matrix.items()]
