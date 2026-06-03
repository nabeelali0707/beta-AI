import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.client = None
        self.use_fallback = True

        if supabase_url and supabase_key:
            self._initialize_client()
        else:
            self._init_fallback()

    def _initialize_client(self):
        try:
            from supabase import create_client

            self.client = create_client(self.supabase_url, self.supabase_key)
            self.use_fallback = False
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase: {e}. Using in-memory fallback.")
            self.use_fallback = True
            self._init_fallback()

    def _init_fallback(self):
        """Initialize in-memory fallback storage"""
        self.fallback_store = {
            "users": {},
            "analyses": {},
            "files": {},
        }

    async def save_analysis(self, user_id: str, analysis_data: Dict) -> str:
        """Save analysis result"""
        if self.use_fallback:
            analysis_id = str(len(self.fallback_store["analyses"]) + 1)
            self.fallback_store["analyses"][analysis_id] = {
                "user_id": user_id,
                "data": analysis_data,
                "created_at": datetime.utcnow().isoformat(),
            }
            return analysis_id

        try:
            response = self.client.table("analyses").insert(
                {
                    "user_id": user_id,
                    "title": analysis_data.get("title", "Analysis"),
                    "ai_score": analysis_data.get("ai_score"),
                    "plagiarism_score": analysis_data.get("plagiarism_score"),
                    "summary": analysis_data.get("summary"),
                    "metadata": json.dumps(analysis_data),
                }
            ).execute()

            if response.data:
                return response.data[0]["id"]
            raise ValueError("Failed to insert analysis")

        except Exception as e:
            logger.error(f"Error saving analysis to Supabase: {e}")
            # Fall back to in-memory
            return await self.save_analysis(user_id, analysis_data)

    async def get_user_analyses(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's analysis history"""
        if self.use_fallback:
            analyses = [
                v["data"]
                for v in self.fallback_store["analyses"].values()
                if v["user_id"] == user_id
            ]
            return analyses[:limit]

        try:
            response = (
                self.client.table("analyses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            return response.data or []

        except Exception as e:
            logger.error(f"Error fetching analyses: {e}")
            return []

    async def get_analysis(self, analysis_id: str) -> Optional[Dict]:
        """Get specific analysis"""
        if self.use_fallback:
            analysis = self.fallback_store["analyses"].get(analysis_id)
            return analysis["data"] if analysis else None

        try:
            response = self.client.table("analyses").select("*").eq("id", analysis_id).execute()

            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error fetching analysis: {e}")
            return None

    async def delete_analysis(self, analysis_id: str) -> bool:
        """Delete analysis"""
        if self.use_fallback:
            if analysis_id in self.fallback_store["analyses"]:
                del self.fallback_store["analyses"][analysis_id]
                return True
            return False

        try:
            self.client.table("analyses").delete().eq("id", analysis_id).execute()
            return True

        except Exception as e:
            logger.error(f"Error deleting analysis: {e}")
            return False

    async def save_file_metadata(self, user_id: str, file_metadata: Dict) -> str:
        """Save uploaded file metadata"""
        if self.use_fallback:
            file_id = str(len(self.fallback_store["files"]) + 1)
            self.fallback_store["files"][file_id] = {
                "user_id": user_id,
                "metadata": file_metadata,
                "created_at": datetime.utcnow().isoformat(),
            }
            return file_id

        try:
            response = self.client.table("uploaded_files").insert(
                {
                    "user_id": user_id,
                    "file_name": file_metadata.get("filename"),
                    "file_type": file_metadata.get("extension"),
                    "file_url": file_metadata.get("file_url"),
                }
            ).execute()

            if response.data:
                return response.data[0]["id"]
            raise ValueError("Failed to insert file metadata")

        except Exception as e:
            logger.error(f"Error saving file metadata: {e}")
            return ""

    async def upload_file(self, path: str, content: bytes, content_type: str) -> Optional[str]:
        """Upload a file to Supabase Storage and return a public URL when available."""
        if self.use_fallback:
            return None

        try:
            self.client.storage.from_(settings.storage_bucket).upload(
                path,
                content,
                {"content-type": content_type, "upsert": "true"},
            )
            return self.client.storage.from_(settings.storage_bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Error uploading file to Supabase Storage: {e}")
            return None

    async def get_user_files(self, user_id: str) -> List[Dict]:
        """Get user's uploaded files"""
        if self.use_fallback:
            files = [
                v["metadata"]
                for v in self.fallback_store["files"].values()
                if v["user_id"] == user_id
            ]
            return files

        try:
            response = (
                self.client.table("uploaded_files")
                .select("*")
                .eq("user_id", user_id)
                .order("uploaded_at", desc=True)
                .execute()
            )

            return response.data or []

        except Exception as e:
            logger.error(f"Error fetching files: {e}")
            return []


supabase_service = SupabaseService(
    settings.supabase_url,
    settings.supabase_service_role_key or settings.supabase_anon_key,
)
