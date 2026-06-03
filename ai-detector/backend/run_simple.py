#!/usr/bin/env python3
"""
Beta-AI Backend Application - Simplified Version (No ML Models)
"""

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.session import engine

configure_logging()

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="Backend API for Beta-AI: AI detection, plagiarism scanning, summarization, and reporting.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Beta-AI Backend API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "database": "connected" if settings.database_url else "not configured"
    }

@app.on_event("startup")
async def on_startup() -> None:
    if settings.auto_create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    print(f"✓ {settings.project_name} started successfully!")
    print(f"✓ Docs available at: http://localhost:8001/docs")

if __name__ == "__main__":
    import uvicorn
    
    print(f"Starting {settings.project_name}...")
    print(f"Environment: {settings.environment}")
    print(f"Database: {settings.database_url}")
    
    uvicorn.run(
        "run_simple:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.environment == "development",
        log_level="info",
    )
