import re
from collections.abc import Iterator
from functools import lru_cache
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import HTTPException, Request
from sqlalchemy import Engine, create_engine, event, text
from sqlalchemy.orm import Session

from app.config import get_settings

MIGRATIONS = Path(__file__).resolve().parent.parent / "migrations"
WORKSPACE_ID_RE = re.compile(r"^[a-zA-Z0-9-]{1,40}$")


@lru_cache
def get_engine() -> Engine:
    url = get_settings().effective_database_url
    if not url:
        raise RuntimeError("Set DATABASE_URL, or AVENRA_LOCAL=1 for the local SQLite file")
    if url.startswith("sqlite"):
        engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 5})

        @event.listens_for(engine, "connect")
        def configure(connection, _):
            # Foreign keys are off by default in SQLite. WAL keeps reads fast during a write.
            cursor = connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

        return engine
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


def migrate() -> None:
    """Bring the database to the latest revision. The desktop app calls this on start."""
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS))
    command.upgrade(config, "head")


def check_database() -> None:
    with get_engine().connect() as connection:
        connection.execute(text("SELECT 1"))


def get_session(request: Request) -> Iterator[Session]:
    workspace_id = request.headers.get("X-Workspace-ID", "local-demo")
    if not WORKSPACE_ID_RE.fullmatch(workspace_id):
        raise HTTPException(
            400,
            {
                "code": "INVALID_WORKSPACE_ID",
                "message": "Invalid workspace identifier.",
                "params": {},
            },
        )
    with Session(get_engine()) as session:
        session.info["workspace_id"] = workspace_id
        yield session
