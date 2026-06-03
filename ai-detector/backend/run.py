#!/usr/bin/env python3
"""
Beta-AI Backend Application Entrypoint
"""

import asyncio
import sys
from contextlib import asynccontextmanager

from app.config import settings
from app.db.session import engine
from app.db.base import Base
from app.main import app


@asynccontextmanager
async def lifespan(app):
    """Application lifespan manager"""
    # Startup
    print(f"Starting {settings.project_name}...")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.database_url}")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    await engine.dispose()


app.router.lifespan_context = lifespan


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.environment == "development",
        log_level="info",
    )
