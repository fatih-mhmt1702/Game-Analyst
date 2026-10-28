from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..database.db import get_db_connection
from .routes_data import processing_engine

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("")
def list_jobs(limit: int = 20):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM collection_jobs ORDER BY created_at DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]

@router.get("/{job_id}")
def get_job(job_id: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM collection_jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return dict(row)

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    processing_engine.request_cancellation(job_id)
    with get_db_connection() as conn:
        conn.execute("UPDATE collection_jobs SET status = 'cancelled' WHERE id = ?", (job_id,))
    return {"message": f"Cancellation requested for job {job_id}"}
