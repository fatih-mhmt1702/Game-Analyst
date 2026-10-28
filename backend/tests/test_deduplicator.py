import tempfile
import os
from backend.app.database.db import init_db, get_db_connection
from backend.app.pipeline.normalizer import DataNormalizer
from backend.app.pipeline.deduplicator import DeduplicationEngine

def test_exact_and_near_deduplication():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        init_db(db_path)
        with get_db_connection(db_path) as conn:
            dedup = DeduplicationEngine(conn)
            
            text_1 = "The boss fight was incredible and very well balanced."
            h1 = DataNormalizer.compute_content_hash(text_1)
            s1 = DataNormalizer.compute_simhash(text_1)

            # Insert first entry
            conn.execute("""
                INSERT INTO posts_comments (id, source_id, content, published_at, content_hash, simhash, is_duplicate, data_origin)
                VALUES ('cmt_test_01', 'src_sample', ?, '2026-10-20T10:00:00Z', ?, ?, 0, 'actual')
            """, (text_1, h1, s1))

            # Exact match check
            is_dup, dup_id, reason = dedup.check_duplicate(h1, s1)
            assert is_dup is True
            assert dup_id == "cmt_test_01"
            assert "Exact" in reason

            # Unique text check
            text_2 = "Completely different topic regarding user interface scaling."
            h2 = DataNormalizer.compute_content_hash(text_2)
            s2 = DataNormalizer.compute_simhash(text_2)
            is_dup2, _, _ = dedup.check_duplicate(h2, s2)
            assert is_dup2 is False
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
