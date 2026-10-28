import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import sqlite3

from .normalizer import DataNormalizer
from .deduplicator import DeduplicationEngine
from .filter_engine import FilterEngine
from ..nlp.classifier import FeedbackClassifier
from ..database.db import get_db_connection

logger = logging.getLogger(__name__)

class ProcessingEngine:
    """End-to-end ingestion and analysis processing engine."""

    def __init__(self, classifier: Optional[FeedbackClassifier] = None):
        self.classifier = classifier or FeedbackClassifier()
        self._cancellation_requested = set()

    def request_cancellation(self, job_id: str):
        self._cancellation_requested.add(job_id)

    def process_records(
        self,
        job_id: str,
        records: List[Dict[str, Any]],
        source_name: str,
        data_origin: str = "actual",
        db_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process and ingest a batch of records with incremental updates and full classification.
        """
        total = len(records)
        processed = 0
        duplicates_count = 0
        spam_count = 0
        inserted_count = 0

        with get_db_connection(db_path) as conn:
            # 1. Update job to running
            conn.execute("""
                UPDATE collection_jobs
                SET status = 'running', total_items = ?, processed_items = 0, progress_pct = 0.0, started_at = ?
                WHERE id = ?
            """, (total, datetime.now(timezone.utc).isoformat(), job_id))

            # Fetch source ID
            cur = conn.cursor()
            cur.execute("SELECT id FROM data_sources WHERE name = ?", (source_name,))
            source_row = cur.fetchone()
            source_id = source_row["id"] if source_row else "src_sample"

            dedup = DeduplicationEngine(conn)

            for rec in records:
                if job_id in self._cancellation_requested:
                    conn.execute("""
                        UPDATE collection_jobs
                        SET status = 'cancelled', finished_at = ?
                        WHERE id = ?
                    """, (datetime.now(timezone.utc).isoformat(), job_id))
                    logger.info(f"Job {job_id} cancelled by user request.")
                    return {"status": "cancelled", "processed": processed}

                raw_text = rec.get("content") or rec.get("text") or rec.get("comment") or ""
                text = DataNormalizer.normalize_text(raw_text)
                if not text:
                    processed += 1
                    continue

                content_hash = DataNormalizer.compute_content_hash(text)
                simhash = DataNormalizer.compute_simhash(text)
                published_at = DataNormalizer.normalize_timestamp(rec.get("published_at") or rec.get("date") or rec.get("created_utc"))
                lang = rec.get("language") or DataNormalizer.detect_language(text)

                # Filter Spam / Junk
                is_spam, spam_reason = FilterEngine.evaluate(text)
                if is_spam:
                    spam_count += 1

                # Deduplication check
                is_dup, dup_of_id, dup_reason = dedup.check_duplicate(content_hash, simhash)
                if is_dup:
                    duplicates_count += 1

                comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
                metrics_json = json.dumps(rec.get("raw_metrics") or {
                    "score": rec.get("score", 0),
                    "upvotes": rec.get("upvotes", 0),
                    "retweets": rec.get("retweets", 0),
                    "replies": rec.get("replies", 0)
                })

                # Insert into posts_comments
                conn.execute("""
                    INSERT INTO posts_comments (
                        id, source_id, external_id, permalink, author, title, content,
                        published_at, language, content_hash, simhash, is_duplicate,
                        duplicate_of_id, is_spam_or_irrelevant, spam_reason, raw_metrics, data_origin
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    comment_id,
                    source_id,
                    str(rec.get("external_id") or rec.get("id") or ""),
                    rec.get("permalink") or rec.get("url") or "",
                    rec.get("author") or rec.get("user") or "anonymous",
                    rec.get("title") or "",
                    text,
                    published_at,
                    lang,
                    content_hash,
                    simhash,
                    1 if is_dup else 0,
                    dup_of_id,
                    1 if is_spam else 0,
                    spam_reason if is_spam else None,
                    metrics_json,
                    data_origin
                ))

                # Game association if game title or game_id given
                target_game_id = rec.get("game_id")
                game_title = rec.get("game_title") or rec.get("game")
                
                if not target_game_id and game_title:
                    cur.execute("SELECT id FROM games WHERE LOWER(title) = LOWER(?) LIMIT 1", (game_title.strip(),))
                    g_row = cur.fetchone()
                    if g_row:
                        target_game_id = g_row["id"]
                    else:
                        # Auto-create game if needed
                        new_gid = f"game_{uuid.uuid4().hex[:8]}"
                        conn.execute("""
                            INSERT INTO games (id, event_id, title, genre, peak_ccu, ccu_source, ccu_verified, rank_order, is_top10)
                            VALUES (?, 'snf_oct_2026', ?, 'Indie Showcase', 0, 'Auto-associated', 0, NULL, 0)
                        """, (new_gid, game_title.strip()))
                        target_game_id = new_gid

                if target_game_id:
                    conn.execute("""
                        INSERT OR IGNORE INTO game_comment_associations (id, game_id, comment_id, confidence, association_method)
                        VALUES (?, ?, ?, 1.0, ?)
                    """, (f"gca_{uuid.uuid4().hex[:10]}", target_game_id, comment_id, rec.get("association_method", "explicit_import")))

                # Run NLP Classification only on non-spam or for full audit
                classification = self.classifier.classify_comment(text)

                # Insert sentiment classification
                conn.execute("""
                    INSERT INTO sentiment_classifications (
                        id, comment_id, sentiment, confidence, positive_score, negative_score, neutral_score, reasoning, provider
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"sent_{uuid.uuid4().hex[:10]}",
                    comment_id,
                    classification.sentiment,
                    classification.confidence,
                    classification.positive_score,
                    classification.negative_score,
                    classification.neutral_score,
                    classification.reasoning,
                    classification.provider
                ))

                # Insert topic classifications
                for topic_item in classification.topics:
                    conn.execute("""
                        INSERT INTO topic_classifications (
                            id, comment_id, topic, sentiment_in_topic, severity, actionability, confidence
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"top_{uuid.uuid4().hex[:10]}",
                        comment_id,
                        topic_item.topic,
                        topic_item.sentiment_in_topic,
                        topic_item.severity,
                        topic_item.actionability,
                        topic_item.confidence
                    ))

                # Insert classification evidence
                conn.execute("""
                    INSERT INTO classification_evidence (
                        id, comment_id, excerpt, context_notes, recommended_human_review
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    f"evi_{uuid.uuid4().hex[:10]}",
                    comment_id,
                    classification.evidence.excerpt,
                    classification.evidence.context_notes,
                    1 if classification.evidence.recommended_human_review else 0
                ))

                inserted_count += 1
                processed += 1

                # Periodically update job progress
                if processed % 10 == 0 or processed == total:
                    pct = round((processed / max(total, 1)) * 100, 1)
                    conn.execute("""
                        UPDATE collection_jobs
                        SET processed_items = ?, progress_pct = ?, current_step = ?
                        WHERE id = ?
                    """, (processed, pct, f"Processed {processed}/{total} items", job_id))

            # Mark completed
            conn.execute("""
                UPDATE collection_jobs
                SET status = 'completed', processed_items = ?, progress_pct = 100.0,
                    current_step = 'Finished', finished_at = ?
                WHERE id = ?
            """, (processed, datetime.now(timezone.utc).isoformat(), job_id))

        return {
            "status": "completed",
            "total": total,
            "processed": processed,
            "inserted": inserted_count,
            "duplicates": duplicates_count,
            "spam": spam_count
        }
