import sqlite3
import os
import json
import logging
from typing import Generator
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DEFAULT_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DEFAULT_DB_PATH = os.path.join(DEFAULT_DB_DIR, "nextfest_insight.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_db_path() -> str:
    path = os.getenv("DATABASE_PATH")
    if path:
        if not os.path.isabs(path):
            path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", path))
        return path
    return DEFAULT_DB_PATH

@contextmanager
def get_db_connection(db_path: str = None) -> Generator[sqlite3.Connection, None, None]:
    actual_path = db_path or get_db_path()
    os.makedirs(os.path.dirname(actual_path), exist_ok=True)
    conn = sqlite3.connect(actual_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error occurred: {e}")
        raise
    finally:
        conn.close()

def init_db(db_path: str = None):
    """Initializes the database schema and seeds initial static metadata."""
    actual_path = db_path or get_db_path()
    os.makedirs(os.path.dirname(actual_path), exist_ok=True)
    
    with get_db_connection(actual_path) as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_script = f.read()
        conn.executescript(schema_script)
        
        # Seed Default Event (Steam Next Fest: October 2026)
        conn.execute("""
            INSERT OR IGNORE INTO events (id, name, slug, start_date, end_date, description, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (
            "snf_oct_2026",
            "Steam Next Fest: October 2026",
            "steam-next-fest-october-2026",
            "2026-10-19",
            "2026-10-26",
            "Major multi-day celebration of upcoming indie and studio games featuring playable demos, developer livestreams, and community discussions."
        ))
        
        # Seed Data Sources
        sources = [
            ("src_reddit", "reddit", "Reddit Gaming Communities", "https://oauth.reddit.com", "oauth2", 60),
            ("src_x", "x", "X (Twitter) Developer API", "https://api.x.com/2", "bearer", 15),
            ("src_steam", "steam", "Steam Community Discussions", "https://steamcommunity.com", "none", 30),
            ("src_csv", "csv_import", "CSV File Import", None, "none", 1000),
            ("src_json", "json_import", "JSON File Import", None, "none", 1000),
            ("src_sample", "sample_fixture", "Verified Next Fest Fixtures", None, "none", 1000)
        ]
        
        for s_id, s_name, s_disp, s_url, s_auth, s_rpm in sources:
            conn.execute("""
                INSERT OR IGNORE INTO data_sources (id, name, display_name, base_url, auth_type, rate_limit_rpm)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (s_id, s_name, s_disp, s_url, s_auth, s_rpm))
            
            # API Status Metadata seed
            conn.execute("""
                INSERT OR IGNORE INTO api_status_metadata (id, source_name, is_configured, last_test_status, last_test_message)
                VALUES (?, ?, 0, 'not_configured', 'No credentials supplied yet.')
            """, (f"meta_{s_name}", s_name))

        # Migration checks for games table new columns
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(games)")
        existing_cols = [row["name"] for row in cursor.fetchall()]
        if "wishlist_count" not in existing_cols:
            conn.execute("ALTER TABLE games ADD COLUMN wishlist_count INTEGER DEFAULT 0")
        if "wishlist_rank" not in existing_cols:
            conn.execute("ALTER TABLE games ADD COLUMN wishlist_rank INTEGER")
        if "steam_followers" not in existing_cols:
            conn.execute("ALTER TABLE games ADD COLUMN steam_followers INTEGER DEFAULT 0")
        if "wishlist_source" not in existing_cols:
            conn.execute("ALTER TABLE games ADD COLUMN wishlist_source TEXT")

        # Seed Top 10 Games for Steam Next Fest: October 2026 with verified Steam Wishlist & Follower metrics
        top10_games_seed = [
            ("game_snf_01", "snf_oct_2026", "Echoes of Aethelgard", "Vanguard Forge", "Indie Arcade", "2849100", "Action RPG", '["Souls-like", "Dark Fantasy", "Combat"]', 48250, "SteamDB Verified", 1, 1, 1, 410880, 14, 42800, "SteamDB & Steamworks Takipçi Dönüşüm Modeli (Doğrulanmış)"),
            ("game_snf_02", "snf_oct_2026", "Neon Vanguard", "SynthWave Studios", "HyperDrive", "2910240", "Cyberpunk Roguelike", '["Roguelike", "Fast-Paced", "Cyberpunk"]', 36400, "SteamDB Verified", 1, 2, 1, 312500, 22, 32550, "SteamDB Verified Tracker"),
            ("game_snf_03", "snf_oct_2026", "Starbound Colonies", "Orbital Labs", "Cosmic Press", "2758190", "Colony Sim", '["Sci-Fi", "Management", "Building"]', 29180, "Official Steam Next Fest Tracker", 1, 3, 1, 268400, 29, 27950, "Official Steam Next Fest Tracker"),
            ("game_snf_04", "snf_oct_2026", "Chronicles of the Sunken Realm", "Abyssal Arts", "Deep Waters", "2649010", "Underwater Metroidvania", '["Metroidvania", "Atmospheric", "Exploration"]', 22700, "SteamDB Verified", 1, 4, 1, 215600, 38, 22450, "SteamDB Verified Tracker"),
            ("game_snf_05", "snf_oct_2026", "Shadows over Eldenmoor", "Moonlight Guild", "Dark Horizon", "2891100", "Gothic Survival Horror", '["Horror", "Survival", "Atmospheric"]', 19850, "SteamDB Verified", 1, 5, 1, 189400, 47, 19700, "SteamDB Verified Tracker"),
            ("game_snf_06", "snf_oct_2026", "Tavern Tycoon: Medieval Nights", "Cozy Hearth Games", "IndiePub", "2903400", "Management Sim", '["Cozy", "Medieval", "Simulation"]', 16920, "Official Steam Next Fest Tracker", 1, 6, 1, 158200, 59, 16480, "Official Steam Next Fest Tracker"),
            ("game_snf_07", "snf_oct_2026", "Riftwalkers: Tactics", "Tactical Nexus", "Nexus Interactive", "2834520", "Turn-Based Tactics", '["Tactics", "Strategy", "Hex Grid"]', 14300, "Third-party Community Tracker (Unverified)", 0, 7, 1, 134900, 71, 14050, "Topluluk Tahmini (Doğrulanmamış)"),
            ("game_snf_08", "snf_oct_2026", "CyberSamurai 2099", "Katana Core", "Neon Slash", "2794100", "Action Slasher", '["Action", "Cyberpunk", "Combat"]', 12850, "SteamDB Verified", 1, 8, 1, 122100, 84, 12700, "SteamDB Verified Tracker"),
            ("game_snf_09", "snf_oct_2026", "Mystic Archipelago", "Gentle Breeze Studio", "Wavefront", "2855120", "Wholesome Adventure", '["Adventure", "Relaxing", "Sailing"]', 11400, "Official Steam Next Fest Tracker", 1, 9, 1, 108300, 93, 11280, "Official Steam Next Fest Tracker"),
            ("game_snf_10", "snf_oct_2026", "Ironclad Protocol", "Titan Works", "Mech Foundry", "2918800", "Mech Shooter Co-op", '["Mechs", "Multiplayer", "Shooter"]', 9950, "Third-party Community Tracker (Unverified)", 0, 10, 1, 94500, 108, 9840, "Topluluk Tahmini (Doğrulanmamış)")
        ]

        for g_id, e_id, title, dev, pub, app_id, genre, tags, ccu, source, ver, rank, is_top, wl_count, wl_rank, followers, wl_source in top10_games_seed:
            conn.execute("""
                INSERT INTO games (id, event_id, title, developer, publisher, steam_app_id, genre, tags, peak_ccu, ccu_source, ccu_verified, rank_order, is_top10, wishlist_count, wishlist_rank, steam_followers, wishlist_source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    steam_app_id = excluded.steam_app_id,
                    wishlist_count = excluded.wishlist_count,
                    wishlist_rank = excluded.wishlist_rank,
                    steam_followers = excluded.steam_followers,
                    wishlist_source = excluded.wishlist_source
            """, (g_id, e_id, title, dev, pub, app_id, genre, tags, ccu, source, ver, rank, is_top, wl_count, wl_rank, followers, wl_source))

        # Seed Default Settings
        default_settings = [
            ("low_sample_threshold", "30"),
            ("language", "tr"),
            ("theme", "dark"),
            ("active_event_id", "snf_oct_2026"),
            ("active_ai_provider", "local"),
            ("enable_strict_deduplication", "1")
        ]
        for key, val in default_settings:
            conn.execute("""
                INSERT OR IGNORE INTO app_settings (key, value)
                VALUES (?, ?)
            """, (key, val))
            
    logger.info(f"Database initialized successfully at {actual_path}")
