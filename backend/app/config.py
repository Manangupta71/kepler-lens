"""Configuration settings for KeplerLens backend service.
"""

import os
from pathlib import Path
from typing import List


class Settings:
    PROJECT_NAME: str = "KeplerLens API"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))

    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))

    # CORS configuration
    # Can be configured via ALLOWED_ORIGINS env var (e.g. "https://kepler-lens.vercel.app,http://localhost:5173")
    _raw_origins = os.getenv("ALLOWED_ORIGINS", "")
    if _raw_origins:
        ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]
    else:
        ALLOWED_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
            "https://*.vercel.app",
        ]


settings = Settings()
