"""
LinguaPath — Duolingo-clone Language Learning API

Entry point: creates the FastAPI app, registers routers, sets up CORS,
and initializes the database + seed data on startup.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import Base, engine
from app.routers import auth, lessons, onboarding, path, social, user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed data on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight SQLite migration for new columns
        def _migrate(sync_conn):
            from sqlalchemy import text
            cols = {
                row[1]
                for row in sync_conn.execute(text("PRAGMA table_info(user_stats)")).fetchall()
            }
            if "free_coin_offer_claimed" not in cols:
                sync_conn.execute(
                    text(
                        "ALTER TABLE user_stats "
                        "ADD COLUMN free_coin_offer_claimed INTEGER DEFAULT 0"
                    )
                )

        await conn.run_sync(_migrate)

    from seed import seed_if_empty
    await seed_if_empty()

    yield


app = FastAPI(
    title="LinguaPath API",
    description="Backend for the LinguaPath language learning platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow local frontend + optional production origins via env
# Set CORS_ORIGINS as a comma-separated list, e.g.:
# CORS_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

_extra = os.getenv("CORS_ORIGINS", "").strip()
if _extra:
    ALLOWED_ORIGINS.extend(
        origin.strip() for origin in _extra.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global exception handler — consistent JSON error shape
# NOTE: We must manually inject CORS headers here because exception-handler
# responses bypass the CORSMiddleware and would otherwise arrive at the
# browser without 'Access-Control-Allow-Origin', breaking preflight checks.
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers,
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(path.router)
app.include_router(user.router)
app.include_router(lessons.router)
app.include_router(social.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "LinguaPath API"}
