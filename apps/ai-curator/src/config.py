"""
AI Curator Configuration
Loads settings from environment variables
"""

import os
from pathlib import Path

# Load .env file from project root
# Path: ai-curator/src/config.py -> go up to Netflop/.env
_config_file = Path(__file__).resolve()
_project_root = _config_file.parent.parent.parent.parent  # Netflop/
_env_path = _project_root / ".env"

print(f"[INFO] Looking for .env at: {_env_path}")

if _env_path.exists():
    print(f"[OK] Found .env file")
    with open(_env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if key not in os.environ:  # Don't override existing env vars
                    os.environ[key] = value
else:
    print(f"[WARN] .env file not found at {_env_path}")


class Settings:
    """Simple settings class without pydantic validation issues."""
    
    # Database connections
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/netflop"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CLICKHOUSE_HOST: str = os.getenv("CLICKHOUSE_HOST", "localhost")
    CLICKHOUSE_PORT: int = int(os.getenv("CLICKHOUSE_PORT", "8123"))
    CLICKHOUSE_DATABASE: str = os.getenv("CLICKHOUSE_DATABASE", "netflop_analytics")

    # API settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # CORS - parse comma-separated string
    _cors_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    CORS_ORIGINS: list = [s.strip() for s in _cors_str.split(",")]

    # Google AI API Key for Gemma
    GOOGLE_AI_API_KEY: str = os.getenv("GOOGLE_AI_API_KEY", "")

    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models")
    CF_N_FACTORS: int = int(os.getenv("CF_N_FACTORS", "100"))
    CF_N_EPOCHS: int = int(os.getenv("CF_N_EPOCHS", "20"))
    RETRAIN_INTERVAL_HOURS: int = int(os.getenv("RETRAIN_INTERVAL_HOURS", "24"))

    # Recommendation weights
    CF_WEIGHT: float = float(os.getenv("CF_WEIGHT", "0.5"))
    CB_WEIGHT: float = float(os.getenv("CB_WEIGHT", "0.3"))
    POP_WEIGHT: float = float(os.getenv("POP_WEIGHT", "0.2"))


settings = Settings()
