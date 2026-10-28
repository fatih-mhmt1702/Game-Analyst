-- NextFest Insight Normalized SQLite Database Schema
-- Optimized for high-throughput queries, filtering, and cross-tabulation

PRAGMA foreign_keys = ON;

-- 1. Events (Next Fest Editions)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Games
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    developer TEXT,
    publisher TEXT,
    steam_app_id TEXT,
    genre TEXT,
    tags TEXT, -- JSON array of strings
    peak_ccu INTEGER DEFAULT 0,
    ccu_source TEXT, -- e.g., 'SteamDB (Verified)', 'Official Steam Next Fest Tracker', 'Unverified Community Estimate'
    ccu_verified INTEGER DEFAULT 0, -- 1 = verified, 0 = unverified
    rank_order INTEGER, -- Top 10 rank if applicable (1..10)
    is_top10 INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0, -- Total tracked/estimated Steam wishlists
    wishlist_rank INTEGER, -- Global Steam Upcoming Wishlist Rank (e.g. #14)
    steam_followers INTEGER DEFAULT 0, -- Public Steam Community Hub Followers
    wishlist_source TEXT, -- 'SteamDB Verified', 'Steamworks Partner Direct', 'Follower Conversion Multiplier'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_event_id ON games(event_id);
CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_games_rank_order ON games(rank_order);
CREATE INDEX IF NOT EXISTS idx_games_is_top10 ON games(is_top10);

-- 3. Data Sources
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL, -- 'reddit', 'x', 'steam', 'csv_import', 'json_import', 'sample_fixture'
    display_name TEXT NOT NULL,
    base_url TEXT,
    auth_type TEXT, -- 'oauth2', 'bearer', 'none', 'api_key'
    status TEXT DEFAULT 'idle', -- 'idle', 'active', 'rate_limited', 'unauthorized', 'error'
    rate_limit_rpm INTEGER DEFAULT 60,
    last_sync_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Posts and Comments
CREATE TABLE IF NOT EXISTS posts_comments (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES data_sources(id),
    external_id TEXT,
    permalink TEXT,
    author TEXT,
    title TEXT,
    content TEXT NOT NULL,
    published_at TEXT NOT NULL,
    retrieved_at TEXT DEFAULT CURRENT_TIMESTAMP,
    language TEXT DEFAULT 'en',
    content_hash TEXT NOT NULL, -- SHA256 of normalized text for exact deduplication
    simhash TEXT, -- Approximate hash for near-duplicate detection
    is_duplicate INTEGER DEFAULT 0,
    duplicate_of_id TEXT REFERENCES posts_comments(id),
    is_spam_or_irrelevant INTEGER DEFAULT 0,
    spam_reason TEXT,
    raw_metrics TEXT, -- JSON: {"score": 45, "upvotes": 50, "retweets": 3, "replies": 8}
    data_origin TEXT NOT NULL DEFAULT 'actual', -- 'actual', 'imported', 'sample'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_comments_source_id ON posts_comments(source_id);
CREATE INDEX IF NOT EXISTS idx_posts_comments_published_at ON posts_comments(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_comments_content_hash ON posts_comments(content_hash);
CREATE INDEX IF NOT EXISTS idx_posts_comments_is_duplicate ON posts_comments(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_posts_comments_is_spam ON posts_comments(is_spam_or_irrelevant);
CREATE INDEX IF NOT EXISTS idx_posts_comments_data_origin ON posts_comments(data_origin);

-- 5. Game to Comment Associations
CREATE TABLE IF NOT EXISTS game_comment_associations (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    comment_id TEXT NOT NULL REFERENCES posts_comments(id) ON DELETE CASCADE,
    confidence REAL DEFAULT 1.0, -- 0.0 to 1.0
    association_method TEXT DEFAULT 'keyword_match', -- 'explicit_import', 'title_match', 'keyword_match', 'manual'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_gca_game_id ON game_comment_associations(game_id);
CREATE INDEX IF NOT EXISTS idx_gca_comment_id ON game_comment_associations(comment_id);

-- 6. Sentiment Classifications
CREATE TABLE IF NOT EXISTS sentiment_classifications (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES posts_comments(id) ON DELETE CASCADE,
    sentiment TEXT NOT NULL, -- 'Positive', 'Negative', 'Mixed', 'Neutral', 'Uncertain'
    confidence REAL NOT NULL DEFAULT 0.8,
    positive_score REAL DEFAULT 0.0,
    negative_score REAL DEFAULT 0.0,
    neutral_score REAL DEFAULT 0.0,
    reasoning TEXT,
    provider TEXT DEFAULT 'local_nlp', -- 'local_nlp', 'openai', 'gemini'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sentiment_comment_id ON sentiment_classifications(comment_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_sentiment ON sentiment_classifications(sentiment);

-- 7. Topic Classifications (Multi-topic support per comment)
CREATE TABLE IF NOT EXISTS topic_classifications (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES posts_comments(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    sentiment_in_topic TEXT DEFAULT 'Neutral', -- Topic-level sentiment ('Positive', 'Negative', 'Mixed', 'Neutral')
    severity TEXT DEFAULT 'None', -- 'Minor', 'Moderate', 'Major', 'Critical', 'None'
    actionability TEXT DEFAULT 'General opinion', -- 'Actionable bug report', 'Actionable design feedback', 'General opinion', 'Suggestion', 'Question', 'Irrelevant'
    confidence REAL NOT NULL DEFAULT 0.8,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_comment_id ON topic_classifications(comment_id);
CREATE INDEX IF NOT EXISTS idx_topics_topic ON topic_classifications(topic);
CREATE INDEX IF NOT EXISTS idx_topics_severity ON topic_classifications(severity);
CREATE INDEX IF NOT EXISTS idx_topics_actionability ON topic_classifications(actionability);

-- 8. Classification Evidence (Quotes, reasoning, human review recommendation)
CREATE TABLE IF NOT EXISTS classification_evidence (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES posts_comments(id) ON DELETE CASCADE,
    excerpt TEXT NOT NULL,
    context_notes TEXT,
    recommended_human_review INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_comment_id ON classification_evidence(comment_id);

-- 9. Collection Jobs
CREATE TABLE IF NOT EXISTS collection_jobs (
    id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    target_game_id TEXT REFERENCES games(id),
    status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'running', 'paused', 'completed', 'failed', 'cancelled'
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    progress_pct REAL DEFAULT 0.0,
    current_step TEXT,
    error_message TEXT,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON collection_jobs(status);

-- 10. API Status Metadata
CREATE TABLE IF NOT EXISTS api_status_metadata (
    id TEXT PRIMARY KEY,
    source_name TEXT UNIQUE NOT NULL,
    is_configured INTEGER DEFAULT 0,
    last_test_status TEXT, -- 'success', 'failed', 'warning', 'not_configured'
    last_test_message TEXT,
    tested_at TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 11. Analysis Runs (Snapshots of analysis configurations)
CREATE TABLE IF NOT EXISTS analysis_runs (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    run_name TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    sample_threshold INTEGER DEFAULT 30,
    settings_json TEXT,
    summary_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 12. Export History
CREATE TABLE IF NOT EXISTS export_history (
    id TEXT PRIMARY KEY,
    export_type TEXT NOT NULL, -- 'csv', 'json', 'html', 'pdf'
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    record_count INTEGER DEFAULT 0,
    parameters_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 13. Application Settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
