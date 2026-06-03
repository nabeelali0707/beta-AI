from typing import List, Optional

from pydantic import AnyUrl, BaseSettings, Field


class Settings(BaseSettings):
    project_name: str = "Beta-AI Backend"
    environment: str = "development"
    database_url: str = Field(..., env="DATABASE_URL")
    supabase_url: AnyUrl = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(..., env="SUPABASE_JWT_SECRET")
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-3.5-turbo", env="OPENAI_MODEL")
    ai_detection_model_name: str = Field("all-MiniLM-L6-v2", env="AI_DETECTION_MODEL_NAME")
    summarization_model_name: str = Field("google/flan-t5-small", env="SUMMARIZATION_MODEL_NAME")

    storage_bucket: str = Field("beta-ai-files", env="STORAGE_BUCKET")
    allowed_origins: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
