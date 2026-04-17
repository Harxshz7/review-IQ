"""
ReviewIQ — Review Preprocessor
Cleans, deduplicates, translates, and detects bots in review data.
"""

import re
from functools import lru_cache
from typing import List, Dict, Any

from langdetect import detect, LangDetectException
from deep_translator import GoogleTranslator
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def _strip_emojis(text: str) -> str:
    """Remove emojis and special unicode characters from text."""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F900-\U0001F9FF"  # supplemental
        "\U0001FA00-\U0001FA6F"  # chess symbols
        "\U0001FA70-\U0001FAFF"  # symbols extended
        "\U00002702-\U000027B0"  # dingbats
        "\U0000FE00-\U0000FE0F"  # variation selectors
        "\U0000200D"             # zero width joiner
        "\U000000A9"             # copyright
        "\U000000AE"             # registered
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text).strip()


def _detect_language(text: str) -> str:
    """Detect the language of a text string."""
    try:
        if len(text.strip()) < 3:
            return "english"
        lang = detect(text)
        return lang
    except LangDetectException:
        return "english"


@lru_cache(maxsize=500)
def _translate_text(text: str, source_lang: str) -> str:
    """Translate text to English. Cached to avoid redundant API calls."""
    try:
        if source_lang in ("en", "english"):
            return text
        translator = GoogleTranslator(source="auto", target="en")
        result = translator.translate(text)
        return result if result else text
    except Exception:
        return text


def _detect_bots(reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect bot reviews using TF-IDF cosine similarity.
    Reviews with >0.82 similarity to any other review → suspected bot.
    Reviews with word count < 4 → suspected bot.
    """
    if len(reviews) < 2:
        return reviews

    texts = [r.get("clean_text", r.get("review_text", "")) for r in reviews]

    # Short review detection
    for i, text in enumerate(texts):
        word_count = len(text.split())
        if word_count < 3:
            reviews[i]["is_bot_suspected"] = True

    # TF-IDF cosine similarity
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000,
            min_df=1,
        )
        tfidf_matrix = vectorizer.fit_transform(texts)
        sim_matrix = cosine_similarity(tfidf_matrix)

        for i in range(len(reviews)):
            for j in range(i + 1, len(reviews)):
                if sim_matrix[i][j] > 0.90:
                    reviews[i]["is_bot_suspected"] = True
                    reviews[j]["is_bot_suspected"] = True
    except Exception:
        pass

    return reviews


def preprocess_reviews(reviews_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Full preprocessing pipeline for a list of reviews.

    Steps:
    1. Strip emojis
    2. Exact deduplication (case-insensitive)
    3. Language detection + translation
    4. Bot detection (TF-IDF similarity + short review check)

    Args:
        reviews_list: List of dicts with at least 'review_text' key

    Returns:
        {
            clean: List[Dict],     # processed reviews
            bot_count: int,
            duplicate_count: int,
            language_stats: Dict,  # {lang: count}
            flagged_count: int,
        }
    """
    if not reviews_list:
        return {
            "clean": [],
            "bot_count": 0,
            "duplicate_count": 0,
            "language_stats": {},
            "flagged_count": 0,
        }

    # Step 1 & 2: Clean emojis and deduplicate
    seen = set()
    unique_reviews = []
    duplicate_count = 0

    for review in reviews_list:
        text = review.get("review_text", "").strip()
        if not text:
            continue

        cleaned_text = _strip_emojis(text)
        if not cleaned_text:
            continue

        lower_key = cleaned_text.lower().strip()
        if lower_key in seen:
            duplicate_count += 1
            continue
        seen.add(lower_key)

        review["review_text"] = cleaned_text
        review["clean_text"] = cleaned_text
        review["is_bot_suspected"] = False
        unique_reviews.append(review)

    # Step 3: Language detection and translation
    language_stats = {}
    for review in unique_reviews:
        text = review["clean_text"]
        lang = _detect_language(text)
        review["original_language"] = lang
        language_stats[lang] = language_stats.get(lang, 0) + 1

        if lang not in ("en", "english"):
            translated = _translate_text(text, lang)
            review["translated_text"] = translated
            review["clean_text"] = translated
        else:
            review["translated_text"] = text
            review["original_language"] = "english"

    # Normalize language stats keys
    normalized_stats = {}
    for lang, count in language_stats.items():
        if lang == "en":
            lang = "english"
        normalized_stats[lang] = normalized_stats.get(lang, 0) + count

    # Step 4: Bot detection
    unique_reviews = _detect_bots(unique_reviews)

    bot_count = sum(1 for r in unique_reviews if r.get("is_bot_suspected", False))
    flagged_count = sum(1 for r in unique_reviews if r.get("flagged_for_human_review", False))

    return {
        "clean": unique_reviews,
        "bot_count": bot_count,
        "duplicate_count": duplicate_count,
        "language_stats": normalized_stats,
        "flagged_count": flagged_count,
    }
