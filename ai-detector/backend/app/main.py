from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.logging import configure_logging
from app.routes import analysis, auth, files, history

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

# Mount routes under /api/v1
api_v1 = FastAPI()
api_v1.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_v1.include_router(files.router, prefix="", tags=["Files"])
api_v1.include_router(history.router, prefix="/history", tags=["History"])

app.mount("/api/v1", api_v1)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": settings.project_name}


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}
