from collections.abc import Iterator
from functools import lru_cache

from fastapi import Request
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session

from app.config import get_settings


@lru_cache
def get_engine() -> Engine:
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 3})


def check_database() -> None:
    with get_engine().connect() as connection:
        connection.execute(text("SELECT 1"))


def get_session(request: Request) -> Iterator[Session]:
    with Session(get_engine()) as session:
        session.info["workspace_id"] = request.headers.get("X-Workspace-ID", "local-demo")
        yield session
