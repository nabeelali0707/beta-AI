import asyncio
import logging
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class SentenceAnalysis:
    def __init__(self, sentence: str, ai_score: float, suspicious: bool = False):
        self.sentence = sentence
        self.ai_score = ai_score
        self.suspicious = suspicious


class AIDetectionService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.loaded = False
        self._load_model()

    def _load_model(self):
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            model_name = "roberta-base-openai-detector"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.loaded = True
            logger.info("AI detection model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load AI detection model: {e}. Using heuristic fallback.")
            self.loaded = False

    def _heuristic_detection(self, text: str) -> tuple[float, float]:
        """Fallback heuristic-based AI detection"""
        import re

        text_lower = text.lower()
        # Simple heuristics for AI-generated content
        ai_markers = [
            r"\bI\s(?:cannot|must|should)\b",
            r"(?:furthermore|additionally|moreover),",
            r"(?:it\s)?(?:is\s)?(?:important|crucial|essential)\s(?:to|that)",
            r"(?:in\s)?(?:conclusion|summary|essence)",
        ]

        marker_count = sum(len(re.findall(pattern, text_lower)) for pattern in ai_markers)
        words = text.split()
        word_count = len(words)

        ai_score = min(0.7, (marker_count / max(word_count / 100, 1)) * 0.5)
        human_score = 1.0 - ai_score

        return float(ai_score), float(human_score)

    def _split_into_sentences(self, text: str) -> List[str]:
        """Simple sentence splitting"""
        import re

        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        return [s.strip() for s in sentences if s.strip()]

    async def detect_ai_content(self, text: str) -> Dict:
        """Detect AI-generated content with sentence-level analysis"""
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        if not self.loaded:
            ai_score, human_score = self._heuristic_detection(text)
            return {
                "ai_score": ai_score,
                "human_score": human_score,
                "confidence_score": 0.4,
                "label": "HUMAN" if human_score > 0.5 else "AI",
                "sentence_analysis": [],
                "method": "heuristic",
            }

        try:
            import torch

            # Tokenize and get predictions
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            with torch.no_grad():
                outputs = self.model(**inputs)
            logits = outputs.logits[0]
            probs = torch.softmax(logits, dim=-1)

            ai_score = float(probs[1].item())
            human_score = float(probs[0].item())
            confidence_score = float(max(ai_score, human_score))
            label = "AI" if ai_score > human_score else "HUMAN"

            # Sentence-level analysis
            sentences = self._split_into_sentences(text)
            sentence_analysis = []

            for sentence in sentences:
                if len(sentence.strip()) > 0:
                    sent_inputs = self.tokenizer(
                        sentence, return_tensors="pt", truncation=True, max_length=512
                    )
                    with torch.no_grad():
                        sent_outputs = self.model(**sent_inputs)
                    sent_logits = sent_outputs.logits[0]
                    sent_probs = torch.softmax(sent_logits, dim=-1)
                    sent_ai_score = float(sent_probs[1].item())
                    suspicious = sent_ai_score > 0.6

                    sentence_analysis.append(
                        {
                            "sentence": sentence,
                            "ai_score": sent_ai_score,
                            "suspicious": suspicious,
                        }
                    )

            return {
                "ai_score": ai_score,
                "human_score": human_score,
                "confidence_score": confidence_score,
                "label": label,
                "sentence_analysis": sentence_analysis,
                "method": "transformer",
            }

        except Exception as e:
            logger.error(f"Error in AI detection: {e}")
            ai_score, human_score = self._heuristic_detection(text)
            return {
                "ai_score": ai_score,
                "human_score": human_score,
                "confidence_score": 0.3,
                "label": "HUMAN" if human_score > 0.5 else "AI",
                "sentence_analysis": [],
                "method": "heuristic_fallback",
            }


ai_detection_service = AIDetectionService()
