import uuid
import json
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from ..database.db import get_db_connection
from ..analytics.metrics import AnalyticsMetrics
from ..models.schemas import GameCreateRequest
from ..config import settings

router = APIRouter(prefix="/api/games", tags=["Games"])

@router.get("")
def list_games(search: Optional[str] = None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if search:
            cursor.execute("""
                SELECT g.*, COUNT(DISTINCT gca.comment_id) as comments_count
                FROM games g
                LEFT JOIN game_comment_associations gca ON g.id = gca.game_id
                WHERE LOWER(g.title) LIKE ?
                GROUP BY g.id
                ORDER BY g.is_top10 DESC, g.rank_order ASC, comments_count DESC
            """, (f"%{search.lower()}%",))
        else:
            cursor.execute("""
                SELECT g.*, COUNT(DISTINCT gca.comment_id) as comments_count
                FROM games g
                LEFT JOIN game_comment_associations gca ON g.id = gca.game_id
                GROUP BY g.id
                ORDER BY g.is_top10 DESC, g.rank_order ASC, comments_count DESC
            """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            tags = []
            if r["tags"]:
                try:
                    tags = json.loads(r["tags"])
                except Exception:
                    tags = [t.strip() for t in r["tags"].split(",") if t.strip()]
            
            result.append({
                "id": r["id"],
                "event_id": r["event_id"],
                "title": r["title"],
                "developer": r["developer"],
                "publisher": r["publisher"],
                "steam_app_id": r["steam_app_id"],
                "genre": r["genre"],
                "tags": tags,
                "peak_ccu": r["peak_ccu"],
                "ccu_source": r["ccu_source"],
                "ccu_verified": bool(r["ccu_verified"]),
                "rank_order": r["rank_order"],
                "is_top10": bool(r["is_top10"]),
                "wishlist_count": r["wishlist_count"] or 0,
                "wishlist_rank": r["wishlist_rank"],
                "steam_followers": r["steam_followers"] or 0,
                "wishlist_source": r["wishlist_source"],
                "comments_count": r["comments_count"]
            })
        return result

@router.get("/top10")
def get_top10():
    with get_db_connection() as conn:
        return AnalyticsMetrics.get_top10_games(conn, low_sample_threshold=settings.LOW_SAMPLE_THRESHOLD)

@router.get("/{game_id}")
def get_game_detail(game_id: str):
    with get_db_connection() as conn:
        detail = AnalyticsMetrics.get_game_detail(conn, game_id, low_sample_threshold=settings.LOW_SAMPLE_THRESHOLD)
        if not detail:
            raise HTTPException(status_code=404, detail="Game not found")
        return detail

@router.post("/{game_id}/sync-steam")
def sync_game_steam(game_id: str):
    """
    Fetches live/estimated Steam wishlist and community follower statistics
    and persists them to the games table.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT steam_app_id, title, steam_followers, peak_ccu, wishlist_rank FROM games WHERE id = ?",
            (game_id,)
        )
        game = cursor.fetchone()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        
        from ..connectors.steam_connector import SteamConnector
        steam_conn = SteamConnector(api_key=settings.STEAM_WEB_API_KEY)
        app_id = game["steam_app_id"] or steam_conn._resolve_app_id(game["title"]) or "2849100"

        stats = steam_conn.fetch_steam_wishlist_and_stats(
            app_id=app_id,
            fallback_followers=game["steam_followers"] or 0,
            fallback_ccu=game["peak_ccu"] or 0,
            fallback_rank=game["wishlist_rank"],
            fallback_title=game["title"]
        )

        if stats.get("success"):
            conn.execute("""
                UPDATE games
                SET steam_app_id = ?,
                    wishlist_count = ?,
                    wishlist_rank = ?,
                    steam_followers = ?,
                    wishlist_source = ?
                WHERE id = ?
            """, (
                app_id,
                stats.get("wishlist_count", 0),
                stats.get("wishlist_rank"),
                stats.get("steam_followers", 0),
                stats.get("source"),
                game_id
            ))
            return {
                "message": "Steam wishlist and follower stats synchronized successfully",
                "stats": stats
            }
        else:
            raise HTTPException(status_code=502, detail="Failed to fetch Steam statistics")

@router.post("")
def create_game(req: GameCreateRequest):
    game_id = f"game_{uuid.uuid4().hex[:8]}"
    followers = req.steam_followers
    if followers <= 0 and req.peak_ccu > 0:
        followers = int(req.peak_ccu * 0.89)
    wishlists = req.wishlist_count
    if wishlists <= 0 and followers > 0:
        wishlists = int(followers * 9.6)

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO games (
                id, event_id, title, developer, publisher, steam_app_id, genre, tags,
                peak_ccu, ccu_source, ccu_verified, rank_order, is_top10,
                wishlist_count, wishlist_rank, steam_followers, wishlist_source
            )
            VALUES (?, 'snf_oct_2026', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game_id,
            req.title.strip(),
            req.developer or "Indie Studio",
            req.publisher or "Self-Published",
            req.steam_app_id or "",
            req.genre or "Indie",
            json.dumps(req.tags),
            req.peak_ccu,
            req.ccu_source or "Manual entry",
            1 if req.ccu_verified else 0,
            req.rank_order,
            1 if req.is_top10 else 0,
            wishlists,
            req.wishlist_rank,
            followers,
            req.wishlist_source or "Steam Takipçi Modeli (9.6x)"
        ))
    return {"id": game_id, "message": "Game registered successfully"}

@router.put("/{game_id}")
def update_game(game_id: str, req: GameCreateRequest):
    followers = req.steam_followers
    if followers <= 0 and req.peak_ccu > 0:
        followers = int(req.peak_ccu * 0.89)
    wishlists = req.wishlist_count
    if wishlists <= 0 and followers > 0:
        wishlists = int(followers * 9.6)

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM games WHERE id = ?", (game_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Game not found")

        conn.execute("""
            UPDATE games
            SET title = ?,
                developer = ?,
                publisher = ?,
                steam_app_id = ?,
                genre = ?,
                tags = ?,
                peak_ccu = ?,
                ccu_source = ?,
                ccu_verified = ?,
                rank_order = ?,
                is_top10 = ?,
                wishlist_count = ?,
                wishlist_rank = ?,
                steam_followers = ?,
                wishlist_source = ?
            WHERE id = ?
        """, (
            req.title.strip(),
            req.developer or "Indie Studio",
            req.publisher or "Self-Published",
            req.steam_app_id or "",
            req.genre or "Indie",
            json.dumps(req.tags),
            req.peak_ccu,
            req.ccu_source or "Manual entry",
            1 if req.ccu_verified else 0,
            req.rank_order,
            1 if req.is_top10 else 0,
            wishlists,
            req.wishlist_rank,
            followers,
            req.wishlist_source or "Steam Takipçi Modeli (9.6x)",
            game_id
        ))
    return {"id": game_id, "message": "Game updated successfully"}

@router.delete("/{game_id}")
def delete_game(game_id: str):
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM games WHERE id = ?", (game_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Game not found")
        conn.execute("DELETE FROM game_comment_associations WHERE game_id = ?", (game_id,))
        conn.execute("DELETE FROM games WHERE id = ?", (game_id,))
    return {"id": game_id, "message": "Game deleted successfully"}
