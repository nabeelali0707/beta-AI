from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "Beta-AI Backend"
    environment: str = Field("development", env="ENVIRONMENT")
    database_url: str = Field("sqlite+aiosqlite:///./test.db", env="DATABASE_URL")
    supabase_url: str = Field("", env="SUPABASE_URL")
    supabase_anon_key: str = Field("", env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field("", env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field("", env="SUPABASE_JWT_SECRET")
    jwt_secret: str = Field("your-secret-key-change-in-production", env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-3.5-turbo", env="OPENAI_MODEL")
    ai_detection_model_name: str = Field("roberta-base-openai-detector", env="AI_DETECTION_MODEL_NAME")
    summarization_model_name: str = Field("google/flan-t5-small", env="SUMMARIZATION_MODEL_NAME")

    storage_bucket: str = Field("beta-ai-files", env="STORAGE_BUCKET")
    max_upload_size_mb: int = Field(50, env="MAX_UPLOAD_SIZE_MB")
    allowed_origins: List[str] = Field(["*"], env="ALLOWED_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
