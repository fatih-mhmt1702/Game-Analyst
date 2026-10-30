import uuid
import os
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Body
from typing import Optional, Dict, Any, List
from ..database.db import get_db_connection
from ..connectors.reddit_connector import RedditConnector
from ..connectors.x_connector import XConnector
from ..connectors.steam_connector import SteamConnector
from ..connectors.importer import FileImporter
from ..pipeline.processing_engine import ProcessingEngine
from ..models.schemas import LiveFetchRequest
from ..config import settings

router = APIRouter(prefix="/api/data", tags=["Data Management"])
processing_engine = ProcessingEngine()

@router.get("/sources")
def get_sources_status():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM data_sources")
        sources = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM api_status_metadata")
        meta = {r["source_name"]: dict(r) for r in cursor.fetchall()}
        
        for s in sources:
            s_name = s["name"]
            s["metadata"] = meta.get(s_name, {})
        return sources

@router.post("/test-connection/{source_name}")
def test_connection(source_name: str):
    result: Dict[str, Any] = {}
    if source_name == "reddit":
        conn_client = RedditConnector(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT
        )
        result = conn_client.test_connection()
    elif source_name == "x":
        conn_client = XConnector(bearer_token=settings.X_BEARER_TOKEN)
        result = conn_client.test_connection()
    elif source_name == "steam":
        conn_client = SteamConnector(api_key=settings.STEAM_WEB_API_KEY)
        result = conn_client.test_connection()
    else:
        result = {
            "source_name": source_name,
            "is_configured": True,
            "status": "success",
            "message": f"Source '{source_name}' is locally active and ready for data ingest."
        }

    # Save test metadata to DB
    with get_db_connection() as conn:
        conn.execute("""
            UPDATE api_status_metadata
            SET is_configured = ?, last_test_status = ?, last_test_message = ?, tested_at = CURRENT_TIMESTAMP
            WHERE source_name = ?
        """, (1 if result.get("is_configured") else 0, result.get("status"), result.get("message"), source_name))

    return result

@router.post("/fetch-live")
def fetch_live_feedback(req: LiveFetchRequest):
    """
    Triggers live feedback ingestion from an authorized public API (Steam, Reddit, or X)
    for either a selected game or top tracked games.
    """
    source = req.source_name
    if source == "reddit":
        connector = RedditConnector(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT
        )
    elif source == "x":
        connector = XConnector(bearer_token=settings.X_BEARER_TOKEN)
        if not connector.is_configured():
            raise HTTPException(
                status_code=400,
                detail="X (Twitter) API anahtarı (.env içinde X_BEARER_TOKEN) tanımlı değil."
            )
    elif source == "steam":
        connector = SteamConnector(api_key=settings.STEAM_WEB_API_KEY)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported live source: {source}")

    with get_db_connection() as conn:
        cur = conn.cursor()
        if req.game_id and req.game_id != "ALL":
            cur.execute("SELECT id, title, steam_app_id FROM games WHERE id = ?", (req.game_id,))
            target_games = [dict(r) for r in cur.fetchall()]
        else:
            cur.execute("SELECT id, title, steam_app_id FROM games ORDER BY is_top10 DESC, rank_order ASC LIMIT 5")
            target_games = [dict(r) for r in cur.fetchall()]

    if not target_games:
        raise HTTPException(status_code=404, detail="Hedef oyun bulunamadı.")

    collected_records: List[Dict[str, Any]] = []
    per_game_limit = max(5, req.limit // max(len(target_games), 1)) if len(target_games) > 1 else req.limit

    for g in target_games:
        query_val = (g.get("steam_app_id") or g["title"]) if source == "steam" else g["title"]
        try:
            items = connector.fetch_feedback(query=query_val, limit=per_game_limit)
            # If game title yielded no specific results on Reddit, fallback to festival discussions
            if not items and source == "reddit":
                items = connector.fetch_feedback(query=f"{g['title']} demo", limit=per_game_limit)
                if not items:
                    items = connector.fetch_feedback(query="Steam Next Fest demo", limit=per_game_limit)

            for item in items:
                item["game_id"] = g["id"]
                item["game_title"] = g["title"]
                item["association_method"] = f"live_{source}_api"
                collected_records.append(item)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Canlı veri çekme hatası ({g['title']}): {str(e)}")

    job_id = f"job_{source}_{uuid.uuid4().hex[:8]}"
    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO collection_jobs (id, source_name, status, total_items, processed_items, current_step)
            VALUES (?, ?, 'idle', ?, 0, ?)
        """, (job_id, source, len(collected_records), f"Live {source.upper()} fetch initialized"))

    if not collected_records:
        with get_db_connection() as conn:
            conn.execute("""
                UPDATE collection_jobs
                SET status = 'completed', progress_pct = 100.0, current_step = 'Finished (0 public reviews returned)', finished_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (job_id,))
        return {
            "job_id": job_id,
            "message": f"{source.upper()} kaynağından sorgulandı ancak bu oyun(lar) için henüz kamuya açık yeni inceleme bulunamadı.",
            "result": {"status": "completed", "total": 0, "inserted": 0, "duplicates": 0, "spam": 0}
        }

    res = processing_engine.process_records(
        job_id=job_id,
        records=collected_records,
        source_name=source,
        data_origin="actual"
    )
    return {
        "job_id": job_id,
        "message": f"{source.upper()} üzerinden canlı geri bildirimler başarıyla çekildi ve sınıflandırıldı.",
        "result": res
    }

@router.post("/import/csv")
async def import_csv_file(file: UploadFile = File(...)):
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="replace")
    
    records = FileImporter.parse_csv(content_str)
    if not records:
        raise HTTPException(status_code=400, detail="No valid records found in CSV file.")

    job_id = f"job_csv_{uuid.uuid4().hex[:8]}"
    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO collection_jobs (id, source_name, status, total_items, processed_items, current_step)
            VALUES (?, 'csv_import', 'idle', ?, 0, 'Starting ingestion')
        """, (job_id, len(records)))

    res = processing_engine.process_records(job_id, records, source_name="csv_import", data_origin="imported")
    return {"job_id": job_id, "result": res}

@router.post("/import/json")
async def import_json_file(file: UploadFile = File(...)):
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="replace")
    
    records = FileImporter.parse_json(content_str)
    if not records:
        raise HTTPException(status_code=400, detail="No valid records found in JSON file.")

    job_id = f"job_json_{uuid.uuid4().hex[:8]}"
    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO collection_jobs (id, source_name, status, total_items, processed_items, current_step)
            VALUES (?, 'json_import', 'idle', ?, 0, 'Starting ingestion')
        """, (job_id, len(records)))

    res = processing_engine.process_records(job_id, records, source_name="json_import", data_origin="imported")
    return {"job_id": job_id, "result": res}

@router.post("/seed-sample")
def seed_sample_fixture():
    """
    Seeds verified baseline data for Steam Next Fest: October 2026.
    Clearly marks all records with data_origin='sample'.
    """
    fixture_path = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "oct2026_top10_demo.csv")
    if not os.path.exists(fixture_path):
        raise HTTPException(status_code=404, detail="Sample fixture file not found.")

    with open(fixture_path, "r", encoding="utf-8") as f:
        content_str = f.read()

    records = FileImporter.parse_csv(content_str)
    job_id = f"job_sample_{uuid.uuid4().hex[:8]}"

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO collection_jobs (id, source_name, status, total_items, processed_items, current_step)
            VALUES (?, 'sample_fixture', 'idle', ?, 0, 'Seeding October 2026 Sample Dataset')
        """, (job_id, len(records)))

    res = processing_engine.process_records(job_id, records, source_name="sample_fixture", data_origin="sample")
    return {"job_id": job_id, "message": "Sample Next Fest dataset loaded successfully.", "result": res}

@router.get("/stats")
def get_data_stats():
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as total FROM posts_comments")
        total = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*) as dups FROM posts_comments WHERE is_duplicate = 1")
        dups = cur.fetchone()["dups"]

        cur.execute("SELECT COUNT(*) as spam FROM posts_comments WHERE is_spam_or_irrelevant = 1")
        spam = cur.fetchone()["spam"]

        cur.execute("SELECT data_origin, COUNT(*) as count FROM posts_comments GROUP BY data_origin")
        origins = {r["data_origin"]: r["count"] for r in cur.fetchall()}

        return {
            "total_records": total,
            "duplicate_records": dups,
            "spam_or_irrelevant": spam,
            "data_origins": origins
        }

@router.post("/clear")
def clear_all_collected_data():
    with get_db_connection() as conn:
        conn.execute("DELETE FROM classification_evidence")
        conn.execute("DELETE FROM topic_classifications")
        conn.execute("DELETE FROM sentiment_classifications")
        conn.execute("DELETE FROM game_comment_associations")
        conn.execute("DELETE FROM posts_comments")
        conn.execute("DELETE FROM collection_jobs")
    return {"message": "All collected and sample data cleared successfully. Schema and configuration preserved."}
