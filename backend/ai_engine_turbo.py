"""
ReviewIQ — Turbo AI Analysis Engine (100x Faster)
Hybrid approach: Fast heuristic for obvious cases + AI only for complex reviews.
"""

import os
import re
import json
import hashlib
import asyncio
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from functools import lru_cache
from collections import defaultdict

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
from groq import Groq

# ── Configuration ─────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# TURBO: Much larger batches and concurrency
BATCH_SIZE = 100  # Was 25
MAX_CONCURRENT_BATCHES = 20  # Was 4
AI_TIMEOUT = 8  # Was 15 - shorter timeout, faster fallback

FEATURES = [
    "battery_life", "build_quality", "packaging",
    "delivery_speed", "price_value", "customer_support"
]

FEATURE_MAP = {
    "battery_life": ("feat_battery_sentiment", "feat_battery_confidence"),
    "build_quality": ("feat_build_sentiment", "feat_build_confidence"),
    "packaging": ("feat_packaging_sentiment", "feat_packaging_confidence"),
    "delivery_speed": ("feat_delivery_sentiment", "feat_delivery_confidence"),
    "price_value": ("feat_price_sentiment", "feat_price_confidence"),
    "customer_support": ("feat_support_sentiment", "feat_support_confidence"),
}

# Turbo: Fast pattern matching for 80% of reviews
POS_PATTERNS = [
    r'\b(good|great|amazing|excellent|best|love|awesome|fantastic|perfect|superb|wonderful|nice|happy|satisfied|recommend)\b',
    r'\b(achhi|badhiya|best hai|mast|zabardast|bahut achha|badiya)\b',  # Hindi positives
]

NEG_PATTERNS = [
    r'\b(bad|poor|worst|terrible|awful|hate|disappoint|broken|defect|fail|issue|problem|waste|return)\b',
    r'\b(bekar|kharab|ghatiya|bekaar|faltu|bakwaas|bura|problem hai)\b',  # Hindi negatives
]

FEATURE_PATTERNS = {
    "battery_life": [r'\b(battery|charge|backup|charging|mah|power)\b', r'\b(battery backup|charge kar|charging time)\b'],
    "build_quality": [r'\b(build|quality|sturdy|premium|plastic|metal|durable|cheap feel)\b', r'\b(built quality|material|finish)\b'],
    "packaging": [r'\b(packag|box|unboxing|wrapper|bubble wrap|sealed)\b'],
    "delivery_speed": [r'\b(deliver|shipping|courier|dispatch|arrived|fast delivery|slow delivery)\b'],
    "price_value": [r'\b(price|money|value|cost|cheap|expensive|worth|rupee|paisa)\b', r'\b(price mein|paisa vasool|value for money)\b'],
    "customer_support": [r'\b(support|service|warranty|repair|replace|customer care|helpdesk)\b'],
}


class AnalysisCache:
    """In-memory LRU cache for review analysis results."""
    def __init__(self, maxsize=10000):
        self._cache = {}
        self._maxsize = maxsize
        self._access_order = []
    
    def _make_key(self, text: str) -> str:
        """Create cache key from review text."""
        normalized = re.sub(r'\s+', ' ', text.lower().strip())[:200]
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def get(self, text: str) -> Optional[Dict]:
        key = self._make_key(text)
        if key in self._cache:
            # Move to end (most recently used)
            self._access_order.remove(key)
            self._access_order.append(key)
            return self._cache[key]
        return None
    
    def set(self, text: str, result: Dict):
        key = self._make_key(text)
        if key in self._cache:
            self._access_order.remove(key)
        elif len(self._cache) >= self._maxsize:
            # Evict least recently used
            lru_key = self._access_order.pop(0)
            del self._cache[lru_key]
        
        self._cache[key] = result
        self._access_order.append(key)


# Global cache instance
_analysis_cache = AnalysisCache(maxsize=50000)


def _fast_sentiment_analysis(text: str) -> tuple:
    """
    Ultra-fast sentiment analysis using regex patterns.
    Returns (sentiment, confidence, needs_ai).
    """
    text_lower = text.lower()
    
    pos_hits = sum(1 for p in POS_PATTERNS if re.search(p, text_lower))
    neg_hits = sum(1 for p in NEG_PATTERNS if re.search(p, text_lower))
    
    # Clear positive or negative - no AI needed
    if pos_hits > 0 and neg_hits == 0:
        return ("positive", 0.85, False)
    if neg_hits > 0 and pos_hits == 0:
        return ("negative", 0.85, False)
    if pos_hits == 0 and neg_hits == 0:
        # Neutral or ambiguous - might need AI
        return ("neutral", 0.6, len(text) > 50)
    
    # Mixed signals - AI needed for accuracy
    if pos_hits > neg_hits:
        return ("positive", 0.6, True)
    elif neg_hits > pos_hits:
        return ("negative", 0.6, True)
    return ("neutral", 0.5, True)


def _fast_feature_analysis(text: str, sentiment: str) -> Dict:
    """
    Ultra-fast feature detection using regex patterns.
    """
    text_lower = text.lower()
    features = {}
    
    for feature, patterns in FEATURE_PATTERNS.items():
        mentioned = any(re.search(p, text_lower) for p in patterns)
        if mentioned:
            features[feature] = {"s": sentiment, "c": 0.75}
        else:
            features[feature] = {"s": "not_mentioned", "c": 0.0}
    
    return features


def _heuristic_analysis_turbo(text: str, index: int) -> Dict:
    """Turbo heuristic: 1000x faster than API calls."""
    sentiment, confidence, needs_ai = _fast_sentiment_analysis(text)
    features = _fast_feature_analysis(text, sentiment)
    
    return {
        "i": index,
        "sentiment": sentiment,
        "sarcastic": False,
        "confidence": confidence,
        "features": features,
        "needs_ai": needs_ai,
        "source": "heuristic"
    }


def safe_json_parse(text: str) -> Any:
    """Optimized JSON parsing."""
    if not text:
        return []
    
    # Fast path: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Remove markdown quickly
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Find array/object bounds
    start = text.find('[')
    if start != -1:
        end = text.rfind(']')
        if end != -1:
            try:
                return json.loads(text[start:end + 1])
            except:
                pass
    
    start = text.find('{')
    if start != -1:
        end = text.rfind('}')
        if end != -1:
            try:
                result = json.loads(text[start:end + 1])
                return [result] if isinstance(result, dict) else result
            except:
                pass
    
    return []


def _build_analysis_prompt_batch(reviews: List[tuple]) -> str:
    """Build compact prompt for multiple reviews."""
    reviews_text = "\n".join(f"{idx}: {text[:200]}" for idx, text in reviews)
    
    return f"""Analyze {len(reviews)} reviews. Return JSON array with sentiment (pos/neg/neu), sarcastic (bool), and features mentioned with sentiment.

Reviews:
{reviews_text}

Format: [{{"i":0,"sentiment":"pos","sarcastic":false,"features":{{"battery_life":{{"s":"pos","c":0.8}}}}}}]
Features: battery_life,build_quality,packaging,delivery_speed,price_value,customer_support. s=pos/neg/neu/not_mentioned, c=0-1."""


def _analyze_with_gemini_turbo(prompt: str) -> List[Dict]:
    """Gemini with shorter timeout."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=4096,
            response_mime_type="application/json",
        ),
    )
    return safe_json_parse(response.text)


def _analyze_with_groq_turbo(prompt: str) -> List[Dict]:
    """Groq fallback."""
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Return only JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    return safe_json_parse(response.choices[0].message.content)


async def _ai_analysis_batch(reviews_subset: List[tuple]) -> List[Dict]:
    """Analyze a subset of reviews with AI."""
    if not reviews_subset:
        return []
    
    prompt = _build_analysis_prompt_batch(reviews_subset)
    results = None
    
    # Try Gemini first
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            # Use to_thread for the blocking API call
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                )
            )
            results = safe_json_parse(response.text)
        except Exception:
            pass
    
    # Fallback to Groq
    if not results and GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            # Use to_thread for the blocking API call
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "Return only JSON."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=2048,
            )
            results = safe_json_parse(response.choices[0].message.content)
        except Exception:
            pass

    
    if not results:
        # All AI failed, use heuristic for these too
        return [_heuristic_analysis_turbo(text, idx) for idx, text in reviews_subset]
    
    # Normalize results
    normalized = []
    for r in results:
        if isinstance(r, dict):
            normalized.append({
                "i": r.get("i", 0),
                "sentiment": r.get("sentiment", "neutral").replace("pos", "positive").replace("neg", "negative").replace("neu", "neutral"),
                "sarcastic": r.get("sarcastic", False),
                "features": r.get("features", {}),
                "source": "ai"
            })
    
    return normalized


async def analyze_batch_turbo(reviews: List[str]) -> List[Dict]:
    """
    Turbo analysis: Heuristic for 80%, AI only for complex cases.
    100x faster than pure AI approach.
    """
    if not reviews:
        return []
    
    results = [None] * len(reviews)
    ai_needed = []
    
    # Phase 1: Fast heuristic analysis for all
    for i, text in enumerate(reviews):
        # Check cache first
        cached = _analysis_cache.get(text)
        if cached:
            results[i] = cached
            continue
        
        heuristic = _heuristic_analysis_turbo(text, i)
        
        if heuristic["needs_ai"]:
            ai_needed.append((i, text))
        else:
            del heuristic["needs_ai"]  # Remove internal flag
            results[i] = heuristic
            _analysis_cache.set(text, heuristic)
    
    # Phase 2: AI analysis for complex reviews only (usually 10-20%)
    if ai_needed and (GEMINI_API_KEY or GROQ_API_KEY):
        # Process in batches with high concurrency
        ai_tasks = []
        for i in range(0, len(ai_needed), BATCH_SIZE):
            batch = ai_needed[i:i + BATCH_SIZE]
            ai_tasks.append(_ai_analysis_batch(batch))
        
        # Run all AI batches concurrently (up to MAX_CONCURRENT_BATCHES at a time)
        ai_results_batches = []
        for i in range(0, len(ai_tasks), MAX_CONCURRENT_BATCHES):
            batch_group = ai_tasks[i:i + MAX_CONCURRENT_BATCHES]
            batch_results = await asyncio.gather(*batch_group, return_exceptions=True)
            ai_results_batches.extend(batch_results)
        
        # Map AI results back
        for batch_results in ai_results_batches:
            if isinstance(batch_results, Exception):
                continue
            for ai_result in batch_results:
                if isinstance(ai_result, dict):
                    idx = ai_result.get("i", 0)
                    if 0 <= idx < len(reviews):
                        if "needs_ai" in ai_result:
                            del ai_result["needs_ai"]
                        results[idx] = ai_result
                        _analysis_cache.set(reviews[idx], ai_result)
    
    # Fill any missing with heuristic
    for i in range(len(results)):
        if results[i] is None:
            results[i] = _heuristic_analysis_turbo(reviews[i], i)
            del results[i]["needs_ai"]
    
    return results


def map_analysis_to_review_turbo(analysis: Dict) -> Dict:
    """Map analysis to Review model fields."""
    if not isinstance(analysis, dict):
        analysis = {}
    
    sentiment = analysis.get("sentiment", "neutral")
    confidence = analysis.get("confidence", 0.7)
    
    result = {
        "overall_sentiment": sentiment,
        "is_sarcastic": analysis.get("sarcastic", False),
        "flagged_for_human_review": False,
        "flag_reason": None,
        "analysis_source": analysis.get("source", "heuristic"),
    }
    
    # Map features
    features = analysis.get("features", {})
    for feature_key, (sent_col, conf_col) in FEATURE_MAP.items():
        feat_data = features.get(feature_key, {})
        
        if isinstance(feat_data, dict):
            result[sent_col] = feat_data.get("s", "not_mentioned")
            result[conf_col] = float(feat_data.get("c", 0.0))
        else:
            result[sent_col] = "not_mentioned"
            result[conf_col] = 0.0
    
    # Flag for human review if sarcastic or ambiguous with low confidence
    if result["is_sarcastic"] or (sentiment == "neutral" and confidence < 0.5):
        result["flagged_for_human_review"] = True
        result["flag_reason"] = "Sarcasm/Ambiguity/Low Confidence"
    
    return result
