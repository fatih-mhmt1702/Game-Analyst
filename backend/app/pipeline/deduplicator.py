import sqlite3
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class DeduplicationEngine:
    """Detects exact duplicates and near-duplicates using content hashes and simhash distances."""

    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def check_duplicate(self, content_hash: str, simhash: str) -> Tuple[bool, Optional[str], str]:
        """
        Returns (is_duplicate, duplicate_of_id, reason).
        Does NOT discard independent opinions silently, but links duplicate reference.
        """
        # 1. Exact match check
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id FROM posts_comments 
            WHERE content_hash = ? AND is_duplicate = 0
            LIMIT 1
        """, (content_hash,))
        row = cursor.fetchone()
        if row:
            return True, row["id"], "Exact text match"

        # 2. Near-duplicate check via Simhash Hamming Distance
        # 64-bit simhash with Hamming distance <= 3 is considered a near-duplicate
        if simhash and simhash != "0" * 16:
            cursor.execute("""
                SELECT id, simhash FROM posts_comments
                WHERE is_duplicate = 0 AND simhash IS NOT NULL AND simhash != '0000000000000000'
                LIMIT 500
            """)
            rows = cursor.fetchall()
            val1 = int(simhash, 16)
            for r in rows:
                val2 = int(r["simhash"], 16)
                # Compute Hamming distance
                dist = bin(val1 ^ val2).count("1")
                if dist <= 3:
                    return True, r["id"], f"Near duplicate (Hamming distance {dist})"

        return False, None, "Unique"
