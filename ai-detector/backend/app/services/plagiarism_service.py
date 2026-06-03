import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class PlagiarismService:
    def __init__(self):
        self.model = None
        self.loaded = False
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self.loaded = True
            logger.info("Plagiarism detection model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load plagiarism model: {e}. Using Jaccard fallback.")
            self.loaded = False

    def _jaccard_similarity(self, text1: str, text2: str) -> float:
        """Jaccard similarity as fallback"""
        set1 = set(text1.lower().split())
        set2 = set(text2.lower().split())
        if not set1 or not set2:
            return 0.0
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return float(intersection / union) if union > 0 else 0.0

    def _split_into_chunks(self, text: str, chunk_size: int = 5) -> List[str]:
        """Split text into sentence chunks"""
        import re

        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        chunks = []
        for i in range(0, len(sentences), chunk_size):
            chunk = " ".join(sentences[i : i + chunk_size]).strip()
            if chunk:
                chunks.append(chunk)
        return chunks

    async def detect_plagiarism(
        self, text: str, source_documents: Optional[List[str]] = None
    ) -> Dict:
        """Detect plagiarism using embeddings or Jaccard similarity"""
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        if not source_documents:
            source_documents = []

        if not self.loaded or not source_documents:
            # Use Jaccard fallback
            matches = []
            if source_documents:
                chunks = self._split_into_chunks(text)
                for i, chunk in enumerate(chunks):
                    for j, source in enumerate(source_documents):
                        sim = self._jaccard_similarity(chunk, source)
                        if sim > 0.3:
                            matches.append(
                                {
                                    "text": chunk[:100],
                                    "similarity": sim,
                                    "source": f"source_{j}",
                                }
                            )

            plagiarism_score = (
                (len(matches) / len(self._split_into_chunks(text))) * 100
                if matches
                else 0.0
            )

            return {
                "plagiarism_score": min(100.0, float(plagiarism_score)),
                "risk_level": self._get_risk_level(plagiarism_score),
                "matches_found": len(matches),
                "matched_sections": matches,
                "method": "jaccard",
            }

        try:
            import numpy as np

            text_chunks = self._split_into_chunks(text)
            text_embeddings = self.model.encode(text_chunks)

            matches = []
            match_count = 0

            for source in source_documents:
                source_chunks = self._split_into_chunks(source)
                source_embeddings = self.model.encode(source_chunks)

                for i, text_emb in enumerate(text_embeddings):
                    for j, source_emb in enumerate(source_embeddings):
                        similarity = float(
                            np.dot(text_emb, source_emb)
                            / (np.linalg.norm(text_emb) * np.linalg.norm(source_emb) + 1e-10)
                        )

                        if similarity > 0.75:
                            matches.append(
                                {
                                    "text": text_chunks[i][:100],
                                    "similarity": similarity,
                                    "source": source[:50],
                                }
                            )
                            match_count += 1

            plagiarism_score = (
                (match_count / len(text_chunks)) * 100 if text_chunks else 0.0
            )

            return {
                "plagiarism_score": min(100.0, float(plagiarism_score)),
                "risk_level": self._get_risk_level(plagiarism_score),
                "matches_found": len(matches),
                "matched_sections": matches[:10],  # Top 10 matches
                "method": "embeddings",
            }

        except Exception as e:
            logger.error(f"Error in plagiarism detection: {e}")
            return {
                "plagiarism_score": 0.0,
                "risk_level": "LOW",
                "matches_found": 0,
                "matched_sections": [],
                "method": "error",
            }

    def _get_risk_level(self, plagiarism_score: float) -> str:
        """Determine risk level based on plagiarism score"""
        if plagiarism_score >= 50:
            return "HIGH"
        elif plagiarism_score >= 20:
            return "MEDIUM"
        else:
            return "LOW"


plagiarism_service = PlagiarismService()
