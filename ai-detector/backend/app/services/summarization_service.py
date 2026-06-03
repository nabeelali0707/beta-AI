import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class SummarizationService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.loaded = False
        self._load_model()

    def _load_model(self):
        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            model_name = "google/flan-t5-small"
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.loaded = True
            logger.info("Summarization model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load summarization model: {e}. Using extractive fallback.")
            self.loaded = False

    def _extractive_summary(self, text: str, num_sentences: int = 3) -> str:
        """Extractive summarization using sentence importance"""
        import re

        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        if len(sentences) <= num_sentences:
            return text

        # Simple heuristic: sentences with keywords and earlier position are important
        keywords = ["important", "significant", "crucial", "found", "result", "conclusion"]
        scored_sentences = []

        for i, sentence in enumerate(sentences):
            score = 0
            for keyword in keywords:
                score += sentence.lower().count(keyword)
            score += (num_sentences - i) * 0.1  # Boost earlier sentences

            scored_sentences.append((i, sentence, score))

        # Get top sentences in original order
        top_sentences = sorted(scored_sentences, key=lambda x: x[2], reverse=True)[:num_sentences]
        top_sentences = sorted(top_sentences, key=lambda x: x[0])

        return " ".join([s[1] for s in top_sentences])

    def _bullet_summary(self, text: str) -> str:
        """Convert summary to bullet points"""
        import re

        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        bullets = "\n".join([f"- {s.strip()}" for s in sentences[:5] if s.strip()])
        return bullets

    async def summarize(self, text: str, summary_type: str = "short") -> Dict:
        """Generate summary of specified type"""
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        if not self.loaded:
            base_summary = self._extractive_summary(text, 3)

            if summary_type == "bullet":
                summary = self._bullet_summary(base_summary)
            elif summary_type == "detailed":
                summary = self._extractive_summary(text, 5)
            else:  # short
                summary = base_summary

            return {
                "summary": summary,
                "summary_type": summary_type,
                "method": "extractive",
            }

        try:
            import torch

            if summary_type == "short":
                prompt = f"Summarize briefly: {text[:500]}"
                max_length = 50
            elif summary_type == "detailed":
                prompt = f"Provide detailed summary: {text}"
                max_length = 150
            else:  # bullet
                prompt = f"Summarize as bullet points: {text[:500]}"
                max_length = 100

            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)

            with torch.no_grad():
                outputs = self.model.generate(
                    inputs["input_ids"],
                    max_length=max_length,
                    num_beams=4,
                    early_stopping=True,
                )

            summary = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            if summary_type == "bullet":
                summary = self._bullet_summary(summary)

            return {
                "summary": summary,
                "summary_type": summary_type,
                "method": "transformer",
            }

        except Exception as e:
            logger.error(f"Error in summarization: {e}")
            base_summary = self._extractive_summary(text, 3)
            return {
                "summary": base_summary,
                "summary_type": summary_type,
                "method": "extractive_fallback",
            }


summarization_service = SummarizationService()
