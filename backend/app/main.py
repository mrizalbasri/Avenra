from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.curriculum import Curriculum, load_demo_curriculum
from app.database import check_database, migrate
from app.routes import router


@asynccontextmanager
async def lifespan(_):
    # The desktop app has no separate migration step, so the API upgrades its own file.
    if get_settings().local_mode:
        migrate()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Avenra API",
    version="0.2.0",
    description="Single-user synthetic academic planning and learning workspace. Local use only.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Workspace-ID"],
)
app.include_router(router)


@app.exception_handler(SQLAlchemyError)
async def database_error(request, exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database unavailable. Check PostgreSQL and migrations, then retry."},
    )


@app.get("/health/live", tags=["health"])
def live() -> dict[str, str]:
    return {"status": "ok", "service": "avenra-api"}


@app.get("/health/ready", tags=["health"])
def ready() -> JSONResponse:
    try:
        check_database()
    except (SQLAlchemyError, RuntimeError, ValueError):
        return JSONResponse(
            status_code=503, content={"status": "unavailable", "database": "unavailable"}
        )
    return JSONResponse(content={"status": "ok", "database": "connected"})


@app.get("/api/v1/curricula/demo", response_model=Curriculum, tags=["curricula"])
def demo_curriculum() -> Curriculum:
    return load_demo_curriculum()
