import logging
import re
from typing import Dict, List

logger = logging.getLogger(__name__)


class AnalyticsService:
    @staticmethod
    def calculate_analytics(text: str) -> Dict:
        """Calculate comprehensive text analytics"""
        if not text or len(text.strip()) == 0:
            return {
                "word_count": 0,
                "character_count": 0,
                "sentence_count": 0,
                "paragraph_count": 0,
                "reading_time_minutes": 0,
                "readability_score": 0.0,
                "vocabulary_diversity": 0.0,
                "top_terms": [],
            }

        words = text.split()
        word_count = len(words)
        character_count = len(text)
        sentence_count = AnalyticsService._count_sentences(text)
        paragraph_count = len([p for p in text.split("\n\n") if p.strip()])

        # Reading time (average 200 words per minute)
        reading_time_minutes = max(1, round(word_count / 200))

        # Readability score (Flesch Reading Ease approximation)
        readability_score = AnalyticsService._calculate_flesch_score(text, word_count, sentence_count)

        # Vocabulary diversity (unique words / total words)
        unique_words = len(set(word.lower() for word in words))
        vocabulary_diversity = (unique_words / word_count) if word_count > 0 else 0.0

        # Top terms
        top_terms = AnalyticsService._get_top_terms(text, 10)

        return {
            "word_count": word_count,
            "character_count": character_count,
            "sentence_count": sentence_count,
            "paragraph_count": paragraph_count,
            "reading_time_minutes": reading_time_minutes,
            "readability_score": round(readability_score, 2),
            "vocabulary_diversity": round(vocabulary_diversity, 2),
            "top_terms": top_terms,
        }

    @staticmethod
    def _count_sentences(text: str) -> int:
        """Count sentences using regex"""
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        return len([s for s in sentences if s.strip()])

    @staticmethod
    def _calculate_flesch_score(text: str, word_count: int, sentence_count: int) -> float:
        """Calculate Flesch Reading Ease score"""
        if word_count == 0 or sentence_count == 0:
            return 0.0

        # Count syllables (simplified)
        syllable_count = AnalyticsService._count_syllables(text)

        # Flesch Reading Ease = 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
        score = 206.835 - (1.015 * (word_count / sentence_count)) - (84.6 * (syllable_count / word_count))

        return max(0.0, min(100.0, score))

    @staticmethod
    def _count_syllables(text: str) -> int:
        """Estimate syllable count (simplified)"""
        vowels = "aeiouy"
        syllable_count = 0
        previous_was_vowel = False

        for char in text.lower():
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel

        # Subtract silent e
        if text.lower().endswith("e"):
            syllable_count -= 1

        return max(1, syllable_count)

    @staticmethod
    def _get_top_terms(text: str, limit: int = 10) -> List[Dict]:
        """Get top occurring terms (stop words excluded)"""
        import re

        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "was", "are", "been", "be", "have",
            "has", "had", "do", "does", "did", "will", "would", "could", "should",
            "may", "might", "must", "can", "it", "this", "that", "these", "those",
        }

        # Extract words
        words = re.findall(r"\b\w+\b", text.lower())

        # Filter stop words and count
        filtered_words = [w for w in words if w not in stop_words and len(w) > 2]
        word_freq = {}

        for word in filtered_words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # Sort by frequency
        top_terms = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:limit]

        return [{"term": term, "frequency": freq} for term, freq in top_terms]


analytics_service = AnalyticsService()
