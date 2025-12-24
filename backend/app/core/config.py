from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "OpenAlgo Flow"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./openalgo_flow.db"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # API
    api_prefix: str = "/api"

    class Config:
        env_file = ".env"


settings = Settings()

# Ensure data directory exists
DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
