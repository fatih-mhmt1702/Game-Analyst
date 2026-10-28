import os
import tempfile
import pytest
from backend.app.database.db import init_db, get_db_connection

def test_database_initialization_and_seeding():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        tmp_db_path = tmp.name

    try:
        init_db(tmp_db_path)
        with get_db_connection(tmp_db_path) as conn:
            cursor = conn.cursor()
            
            # Check events table
            cursor.execute("SELECT COUNT(*) as cnt FROM events")
            assert cursor.fetchone()["cnt"] >= 1

            # Check games table (Top 10 seed)
            cursor.execute("SELECT COUNT(*) as cnt FROM games WHERE is_top10 = 1")
            assert cursor.fetchone()["cnt"] == 10

            # Check data_sources table
            cursor.execute("SELECT COUNT(*) as cnt FROM data_sources")
            assert cursor.fetchone()["cnt"] >= 5

            # Check app settings
            cursor.execute("SELECT value FROM app_settings WHERE key = 'low_sample_threshold'")
            assert cursor.fetchone()["value"] == "30"
    finally:
        if os.path.exists(tmp_db_path):
            os.remove(tmp_db_path)
