import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current and parent directories
base_dir = Path(__file__).resolve().parent.parent.parent
env_file = base_dir / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", str(base_dir / "backend" / "data" / "nextfest_insight.db"))
    
    # Reddit
    REDDIT_CLIENT_ID: str = os.getenv("REDDIT_CLIENT_ID", "")
    REDDIT_CLIENT_SECRET: str = os.getenv("REDDIT_CLIENT_SECRET", "")
    REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "NextFestInsight:v1.0.0")
    
    # X / Twitter
    X_BEARER_TOKEN: str = os.getenv("X_BEARER_TOKEN", "")
    X_API_KEY: str = os.getenv("X_API_KEY", "")
    X_API_KEY_SECRET: str = os.getenv("X_API_KEY_SECRET", "")
    
    # Steam
    STEAM_WEB_API_KEY: str = os.getenv("STEAM_WEB_API_KEY", "")
    
    # AI Provider
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Defaults
    LOW_SAMPLE_THRESHOLD: int = int(os.getenv("LOW_SAMPLE_THRESHOLD", 30))
    EVENT_DEFAULT_NAME: str = os.getenv("EVENT_DEFAULT_NAME", "Steam Next Fest: October 2026")
    EVENT_START_DATE: str = os.getenv("EVENT_START_DATE", "2026-10-19")
    EVENT_END_DATE: str = os.getenv("EVENT_END_DATE", "2026-10-26")

settings = Settings()
