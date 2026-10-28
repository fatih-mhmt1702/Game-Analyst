import sqlite3
from typing import Dict, Any, List, Optional
import json

class AnalyticsMetrics:
    """Calculates factual aggregate statistics with explicit denominators from SQLite records."""

    @staticmethod
    def get_overview_metrics(conn: sqlite3.Connection, low_sample_threshold: int = 30) -> Dict[str, Any]:
        cursor = conn.cursor()

        # 1. Active Event info
        cursor.execute("SELECT name, start_date, end_date FROM events WHERE is_active = 1 LIMIT 1")
        event = cursor.fetchone()
        event_name = event["name"] if event else "Steam Next Fest: October 2026"
        start_date = event["start_date"] if event else "2026-10-19"
        end_date = event["end_date"] if event else "2026-10-26"

        # 2. Total games analyzed
        cursor.execute("SELECT COUNT(*) as count FROM games")
        total_games = cursor.fetchone()["count"]

        # 3. Total relevant unique non-spam comments
        cursor.execute("""
            SELECT COUNT(*) as total_comments,
                   COUNT(DISTINCT permalink) as unique_discussions
            FROM posts_comments
            WHERE is_spam_or_irrelevant = 0 AND is_duplicate = 0
        """)
        c_row = cursor.fetchone()
        total_comments = c_row["total_comments"]
        unique_discussions = c_row["unique_discussions"]

        # 4. Data origin breakdown (actual vs imported vs sample)
        cursor.execute("""
            SELECT data_origin, COUNT(*) as count
            FROM posts_comments
            WHERE is_spam_or_irrelevant = 0 AND is_duplicate = 0
            GROUP BY data_origin
        """)
        origin_counts = {r["data_origin"]: r["count"] for r in cursor.fetchall()}

        # 5. Source distribution
        cursor.execute("""
            SELECT ds.name as source_name, COUNT(pc.id) as count
            FROM posts_comments pc
            JOIN data_sources ds ON pc.source_id = ds.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY ds.name
        """)
        source_counts = {r["source_name"]: r["count"] for r in cursor.fetchall()}

        # 6. Overall Sentiment distribution
        cursor.execute("""
            SELECT sc.sentiment, COUNT(sc.id) as count
            FROM sentiment_classifications sc
            JOIN posts_comments pc ON sc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY sc.sentiment
        """)
        sentiment_counts = {r["sentiment"]: r["count"] for r in cursor.fetchall()}

        # 7. Top praised topics
        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as count
            FROM topic_classifications tc
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
              AND tc.sentiment_in_topic = 'Positive'
            GROUP BY tc.topic
            ORDER BY count DESC
            LIMIT 5
        """)
        top_praises = [{"topic": r["topic"], "count": r["count"]} for r in cursor.fetchall()]

        # 8. Top complaint topics
        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as count
            FROM topic_classifications tc
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
              AND (tc.sentiment_in_topic = 'Negative' OR tc.severity IN ('Critical', 'Major', 'Moderate'))
            GROUP BY tc.topic
            ORDER BY count DESC
            LIMIT 5
        """)
        top_complaints = [{"topic": r["topic"], "count": r["count"]} for r in cursor.fetchall()]

        # 9. Freshness and Coverage warnings
        cursor.execute("SELECT MAX(retrieved_at) as latest FROM posts_comments")
        latest_sync = cursor.fetchone()["latest"] or "No data collected yet"

        warnings = []
        if total_comments == 0:
            warnings.append("Veritabanında henüz analiz edilmiş oyuncu yorumu bulunmuyor. Lütfen içe aktarma yapın veya veri toplamayı başlatın.")
        else:
            # Check how many games have < threshold comments
            cursor.execute("""
                SELECT g.title, COUNT(gca.comment_id) as count
                FROM games g
                LEFT JOIN game_comment_associations gca ON g.id = gca.game_id
                GROUP BY g.id
                HAVING count < ?
            """, (low_sample_threshold,))
            low_sample_games = cursor.fetchall()
            if low_sample_games:
                warnings.append(f"{len(low_sample_games)} oyun için örneklem boyutu {low_sample_threshold}'un altındadır (Düşük Örneklem Uyarısı).")

        return {
            "event_name": event_name,
            "event_start": start_date,
            "event_end": end_date,
            "total_games_analyzed": total_games,
            "total_relevant_comments": total_comments,
            "unique_discussions_count": unique_discussions,
            "data_origin_distribution": origin_counts,
            "source_distribution": source_counts,
            "sentiment_distribution": sentiment_counts,
            "top_praised_features": top_praises,
            "top_complaints": top_complaints,
            "data_freshness": latest_sync,
            "collection_status": "Ready",
            "coverage_warnings": warnings
        }

    @staticmethod
    def get_top10_games(conn: sqlite3.Connection, low_sample_threshold: int = 30) -> List[Dict[str, Any]]:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, developer, genre, peak_ccu, ccu_source, ccu_verified, rank_order,
                   steam_app_id, wishlist_count, wishlist_rank, steam_followers, wishlist_source
            FROM games
            WHERE is_top10 = 1 OR rank_order IS NOT NULL
            ORDER BY COALESCE(rank_order, 999), peak_ccu DESC
            LIMIT 10
        """)
        games = cursor.fetchall()

        results = []
        for g in games:
            game_id = g["id"]
            # Count comments
            cursor.execute("""
                SELECT COUNT(DISTINCT pc.id) as total,
                       SUM(CASE WHEN sc.sentiment = 'Positive' THEN 1 ELSE 0 END) as pos,
                       SUM(CASE WHEN sc.sentiment = 'Negative' THEN 1 ELSE 0 END) as neg,
                       SUM(CASE WHEN sc.sentiment = 'Mixed' THEN 1 ELSE 0 END) as mix,
                       SUM(CASE WHEN sc.sentiment = 'Neutral' THEN 1 ELSE 0 END) as neu
                FROM posts_comments pc
                JOIN game_comment_associations gca ON pc.id = gca.comment_id
                LEFT JOIN sentiment_classifications sc ON pc.id = sc.comment_id
                WHERE gca.game_id = ? AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            """, (game_id,))
            s_row = cursor.fetchone()
            total = s_row["total"] or 0
            pos = s_row["pos"] or 0
            neg = s_row["neg"] or 0
            mix = s_row["mix"] or 0
            neu = s_row["neu"] or 0

            pos_pct = round((pos / total) * 100, 1) if total > 0 else 0.0
            neg_pct = round((neg / total) * 100, 1) if total > 0 else 0.0
            mix_pct = round((mix / total) * 100, 1) if total > 0 else 0.0
            neu_pct = round((neu / total) * 100, 1) if total > 0 else 0.0

            # Most praised feature
            cursor.execute("""
                SELECT tc.topic, COUNT(tc.id) as cnt
                FROM topic_classifications tc
                JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
                JOIN posts_comments pc ON tc.comment_id = pc.id
                WHERE gca.game_id = ? AND tc.sentiment_in_topic = 'Positive'
                  AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
                GROUP BY tc.topic ORDER BY cnt DESC LIMIT 1
            """, (game_id,))
            praised_row = cursor.fetchone()
            most_praised = praised_row["topic"] if praised_row else "Insufficient data"

            # Most common complaint
            cursor.execute("""
                SELECT tc.topic, COUNT(tc.id) as cnt
                FROM topic_classifications tc
                JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
                JOIN posts_comments pc ON tc.comment_id = pc.id
                WHERE gca.game_id = ? AND (tc.sentiment_in_topic = 'Negative' OR tc.severity IN ('Critical', 'Major', 'Moderate'))
                  AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
                GROUP BY tc.topic ORDER BY cnt DESC LIMIT 1
            """, (game_id,))
            complaint_row = cursor.fetchone()
            most_common_complaint = complaint_row["topic"] if complaint_row else "None detected"

            # Data coverage assessment
            is_low = total < low_sample_threshold
            if total >= low_sample_threshold:
                data_coverage = f"Adequate ({total} comments)"
            elif total > 0:
                data_coverage = f"Low Sample Warning ({total} comments < {low_sample_threshold})"
            else:
                data_coverage = "Insufficient (0 comments)"

            # Source links count
            cursor.execute("""
                SELECT COUNT(DISTINCT pc.permalink) as cnt
                FROM posts_comments pc
                JOIN game_comment_associations gca ON pc.id = gca.comment_id
                WHERE gca.game_id = ? AND pc.permalink != ''
            """, (game_id,))
            source_links_count = cursor.fetchone()["cnt"]

            results.append({
                "rank": g["rank_order"] or (len(results) + 1),
                "game_id": game_id,
                "title": g["title"],
                "developer": g["developer"] or "Unknown Studio",
                "genre": g["genre"] or "Action",
                "peak_ccu": g["peak_ccu"],
                "ccu_source": g["ccu_source"] or "Third-party Tracker",
                "ccu_verified": bool(g["ccu_verified"]),
                "steam_app_id": g["steam_app_id"],
                "wishlist_count": g["wishlist_count"] or 0,
                "wishlist_rank": g["wishlist_rank"],
                "steam_followers": g["steam_followers"] or 0,
                "wishlist_source": g["wishlist_source"] or "SteamDB & Steam Tracker",
                "collected_comments_count": total,
                "positive_pct": pos_pct,
                "negative_pct": neg_pct,
                "mixed_pct": mix_pct,
                "neutral_pct": neu_pct,
                "most_praised_feature": most_praised,
                "most_common_complaint": most_common_complaint,
                "data_coverage": data_coverage,
                "is_low_sample": is_low,
                "source_links_count": source_links_count
            })

        return results

    @staticmethod
    def get_game_detail(conn: sqlite3.Connection, game_id: str, low_sample_threshold: int = 30) -> Optional[Dict[str, Any]]:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM games WHERE id = ?", (game_id,))
        game = cursor.fetchone()
        if not game:
            return None

        # Tags parsing
        tags = []
        if game["tags"]:
            try:
                tags = json.loads(game["tags"])
            except Exception:
                tags = [t.strip() for t in game["tags"].split(",") if t.strip()]

        game_data = {
            "id": game["id"],
            "event_id": game["event_id"],
            "title": game["title"],
            "developer": game["developer"],
            "publisher": game["publisher"],
            "steam_app_id": game["steam_app_id"],
            "genre": game["genre"],
            "tags": tags,
            "peak_ccu": game["peak_ccu"],
            "ccu_source": game["ccu_source"],
            "ccu_verified": bool(game["ccu_verified"]),
            "rank_order": game["rank_order"],
            "is_top10": bool(game["is_top10"]),
            "wishlist_count": game["wishlist_count"] if "wishlist_count" in game.keys() else 0,
            "wishlist_rank": game["wishlist_rank"] if "wishlist_rank" in game.keys() else None,
            "steam_followers": game["steam_followers"] if "steam_followers" in game.keys() else 0,
            "wishlist_source": game["wishlist_source"] if "wishlist_source" in game.keys() else "SteamDB Tracker"
        }

        # Comment and Sentiment stats
        cursor.execute("""
            SELECT sc.sentiment, COUNT(sc.id) as count
            FROM posts_comments pc
            JOIN game_comment_associations gca ON pc.id = gca.comment_id
            JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            WHERE gca.game_id = ? AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY sc.sentiment
        """, (game_id,))
        sent_counts = {r["sentiment"]: r["count"] for r in cursor.fetchall()}
        total_comments = sum(sent_counts.values())

        sent_pcts = {
            s: round((cnt / total_comments) * 100, 1) if total_comments > 0 else 0.0
            for s, cnt in sent_counts.items()
        }

        # Topic frequencies
        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as count,
                   SUM(CASE WHEN tc.sentiment_in_topic = 'Positive' THEN 1 ELSE 0 END) as pos,
                   SUM(CASE WHEN tc.sentiment_in_topic = 'Negative' THEN 1 ELSE 0 END) as neg
            FROM topic_classifications tc
            JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE gca.game_id = ? AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY tc.topic
            ORDER BY count DESC
        """, (game_id,))
        topics = [
            {"topic": r["topic"], "count": r["count"], "positive": r["pos"], "negative": r["neg"]}
            for r in cursor.fetchall()
        ]

        # Top praises and complaints
        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as count
            FROM topic_classifications tc
            JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE gca.game_id = ? AND tc.sentiment_in_topic = 'Positive'
              AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY tc.topic ORDER BY count DESC LIMIT 5
        """, (game_id,))
        top_praises = [{"topic": r["topic"], "count": r["count"]} for r in cursor.fetchall()]

        cursor.execute("""
            SELECT tc.topic, COUNT(tc.id) as count
            FROM topic_classifications tc
            JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
            JOIN posts_comments pc ON tc.comment_id = pc.id
            WHERE gca.game_id = ? AND (tc.sentiment_in_topic = 'Negative' OR tc.severity IN ('Critical', 'Major', 'Moderate'))
              AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY tc.topic ORDER BY count DESC LIMIT 5
        """, (game_id,))
        top_complaints = [{"topic": r["topic"], "count": r["count"]} for r in cursor.fetchall()]

        # Critical bugs and usability issues
        cursor.execute("""
            SELECT tc.topic, tc.severity, tc.actionability, ce.excerpt, pc.permalink, pc.published_at
            FROM topic_classifications tc
            JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
            JOIN posts_comments pc ON tc.comment_id = pc.id
            LEFT JOIN classification_evidence ce ON tc.comment_id = ce.comment_id
            WHERE gca.game_id = ? AND tc.severity IN ('Critical', 'Major')
              AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            ORDER BY CASE tc.severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 ELSE 3 END
            LIMIT 10
        """, (game_id,))
        critical_issues = [
            {
                "topic": r["topic"],
                "severity": r["severity"],
                "actionability": r["actionability"],
                "excerpt": r["excerpt"] or "",
                "permalink": r["permalink"] or "",
                "published_at": r["published_at"]
            }
            for r in cursor.fetchall()
        ]

        # Reddit vs X feedback difference
        cursor.execute("""
            SELECT ds.name as source_name, sc.sentiment, COUNT(pc.id) as count
            FROM posts_comments pc
            JOIN game_comment_associations gca ON pc.id = gca.comment_id
            JOIN data_sources ds ON pc.source_id = ds.id
            JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            WHERE gca.game_id = ? AND ds.name IN ('reddit', 'x')
              AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY ds.name, sc.sentiment
        """, (game_id,))
        rx_rows = cursor.fetchall()
        reddit_vs_x: Dict[str, Dict[str, int]] = {"reddit": {}, "x": {}}
        for r in rx_rows:
            src = r["source_name"]
            if src in reddit_vs_x:
                reddit_vs_x[src][r["sentiment"]] = r["count"]

        # Timeline activity (by date)
        cursor.execute("""
            SELECT SUBSTR(pc.published_at, 1, 10) as day, COUNT(pc.id) as count
            FROM posts_comments pc
            JOIN game_comment_associations gca ON pc.id = gca.comment_id
            WHERE gca.game_id = ? AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY day ORDER BY day ASC
        """, (game_id,))
        timeline = [{"date": r["day"], "count": r["count"]} for r in cursor.fetchall()]

        # Recent representative verified comments
        cursor.execute("""
            SELECT pc.id, pc.author, pc.content, pc.permalink, pc.published_at, pc.language,
                   sc.sentiment, sc.confidence, ce.excerpt, ce.recommended_human_review, ds.name as source_name
            FROM posts_comments pc
            JOIN game_comment_associations gca ON pc.id = gca.comment_id
            JOIN data_sources ds ON pc.source_id = ds.id
            LEFT JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            LEFT JOIN classification_evidence ce ON pc.id = ce.comment_id
            WHERE gca.game_id = ? AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            ORDER BY pc.published_at DESC
            LIMIT 25
        """, (game_id,))
        recent_comments = [
            {
                "id": r["id"],
                "author": r["author"],
                "content": r["content"],
                "permalink": r["permalink"],
                "published_at": r["published_at"],
                "language": r["language"],
                "sentiment": r["sentiment"],
                "confidence": r["confidence"],
                "excerpt": r["excerpt"],
                "recommended_human_review": bool(r["recommended_human_review"]),
                "source_name": r["source_name"]
            }
            for r in cursor.fetchall()
        ]

        coverage_notes = []
        is_low_sample = total_comments < low_sample_threshold
        if is_low_sample:
            coverage_notes.append(
                f"Düşük Örneklem Uyarısı: Bu oyun için toplanan bağımsız yorum sayısı ({total_comments}), eşik değer olan {low_sample_threshold}'un altındadır. Yüzdeler istatistiksel genelleme olarak kabul edilmemelidir."
            )

        return {
            "game": game_data,
            "collected_comments_count": total_comments,
            "is_low_sample": is_low_sample,
            "low_sample_threshold": low_sample_threshold,
            "sentiment_counts": sent_counts,
            "sentiment_percentages": sent_pcts,
            "topic_frequencies": topics,
            "top_complaints": top_complaints,
            "top_praises": top_praises,
            "critical_bugs_and_usability": critical_issues,
            "reddit_vs_x": reddit_vs_x,
            "timeline_activity": timeline,
            "recent_comments": recent_comments,
            "coverage_notes": coverage_notes
        }
