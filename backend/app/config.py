import os
import sys
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def default_data_dir() -> Path:
    """Where the desktop app keeps its database, using each system's convention."""
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming")
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path(os.environ.get("XDG_DATA_HOME") or Path.home() / ".local" / "share")
    return base / "Avenra"


class Settings(BaseSettings):
    database_url: str = ""
    # Desktop mode: no PostgreSQL. The API keeps a SQLite file in the app data folder.
    local_mode: bool = Field(default=False, validation_alias="AVENRA_LOCAL")
    data_dir: str = Field(default="", validation_alias="AVENRA_DATA_DIR")
    cors_origins: list[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
    ]
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def effective_database_url(self) -> str:
        # Local mode wins over DATABASE_URL: the desktop app must never reach for a
        # server database just because a developer .env is present.
        if self.local_mode:
            folder = Path(self.data_dir) if self.data_dir else default_data_dir()
            folder.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{(folder / 'avenra.db').as_posix()}"
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
