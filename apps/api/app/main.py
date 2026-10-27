from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.curriculum import Curriculum, load_demo_curriculum
from app.database import check_database

app = FastAPI(
    title="Avenra API",
    version="0.1.0",
    description="Local development foundation. Academic simulation is not implemented yet.",
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
