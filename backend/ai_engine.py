"""
ReviewIQ — AI Analysis Engine
Google Gemini 1.5 Flash (primary) with Groq llama-3.1-8b-instant fallback.
Scores 6 product features per review with sentiment analysis.
"""

import os
import re
import json
from typing import List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
from groq import Groq

# ── Configure APIs ─────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

BATCH_SIZE = 25
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


def safe_json_parse(text: str) -> Any:
    """
    Safely parse JSON from LLM responses.
    Strips markdown code blocks, finds the JSON array, and parses it.
    """
    if not text:
        return []

    # Remove markdown code blocks
    cleaned = re.sub(r'```json\s*', '', text)
    cleaned = re.sub(r'```\s*', '', cleaned)
    cleaned = cleaned.strip()

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find JSON array bounds
    start = cleaned.find('[')
    end = cleaned.rfind(']')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            pass

    # Find JSON object bounds
    start = cleaned.find('{')
    end = cleaned.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            result = json.loads(cleaned[start:end + 1])
            return [result] if isinstance(result, dict) else result
        except json.JSONDecodeError:
            pass

    return []


def _build_analysis_prompt(reviews: List[str]) -> str:
    """Build a comprehensive Gemini prompt for multi-language review analysis."""
    count = len(reviews)
    reviews_text = "\n".join(f"{i}: {r}" for i, r in enumerate(reviews))

    return f"""Analyze {count} product reviews for sentiment and feature-specific feedback.
You must handle reviews in English and other languages (Hindi, Kannada, etc.) by understanding the context.

Rules:
- sentiment: positive | negative | neutral | ambiguous
- features to track: battery_life, build_quality, packaging, delivery_speed, price_value, customer_support
- feature sentiment (s): positive | negative | neutral | not_mentioned
- feature confidence (c): 0.0 to 1.0

Return ONLY a valid JSON array of objects. Do not include any other text.

Reviews:
{reviews_text}

Required JSON Format:
[
  {{
    "i": 0,
    "sentiment": "positive",
    "sarcastic": false,
    "features": {{
      "battery_life": {{"s": "positive", "c": 0.9}},
      "build_quality": {{"s": "not_mentioned", "c": 0.0}},
      "packaging": {{"s": "not_mentioned", "c": 0.0}},
      "delivery_speed": {{"s": "not_mentioned", "c": 0.0}},
      "price_value": {{"s": "not_mentioned", "c": 0.0}},
      "customer_support": {{"s": "not_mentioned", "c": 0.0}}
    }}
  }}
]"""


def _analyze_with_gemini(prompt: str) -> List[Dict]:
    """Call Gemini 1.5 Flash for review analysis with JSON mode."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )
    return safe_json_parse(response.text)


def _analyze_with_groq(prompt: str) -> List[Dict]:
    """Fallback: Call Groq llama-3.1-8b-instant for review analysis."""
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a product review analyst. Return only valid JSON arrays."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
    return safe_json_parse(response.choices[0].message.content)


import concurrent.futures

def _heuristic_analysis(text: str, index: int) -> Dict:
    """A simple keyword-based fallback when AI analysis fails."""
    text_lower = text.lower()
    
    # Simple sentiment heuristic
    pos_words = ["good", "great", "amazing", "excellent", "best", "love", "achhi", "badhiya", "superb"]
    neg_words = ["bad", "poor", "worst", "hate", "bekar", "kharab", "stuck", "broken", "fail"]
    
    pos_score = sum(1 for w in pos_words if w in text_lower)
    neg_score = sum(1 for w in neg_words if w in text_lower)
    
    sentiment = "neutral"
    if pos_score > neg_score: sentiment = "positive"
    elif neg_score > pos_score: sentiment = "negative"
    
    # Feature keywords
    feature_keywords = {
        "battery_life": ["battery", "charge", "backup", "charging", "mah"],
        "build_quality": ["build", "quality", "feel", "sturdy", "premium", "plastic", "stuck", "keys", "button"],
        "packaging": ["package", "packaging", "box", "unboxing", "wrap"],
        "delivery_speed": ["delivery", "delivered", "shipping", "fast", "slow", "days", "courier"],
        "price_value": ["price", "money", "value", "cost", "cheap", "expensive", "paisa", "rupee", "worth"],
        "customer_support": ["support", "service", "customer", "team", "help", "response", "warranty"],
    }
    
    features = {}
    for feat, keywords in feature_keywords.items():
        if any(kw in text_lower for kw in keywords):
            features[feat] = {"s": sentiment, "c": 0.5}
        else:
            features[feat] = {"s": "not_mentioned", "c": 0.0}
            
    return {
        "i": index,
        "sentiment": sentiment,
        "sarcastic": False,
        "features": features
    }


def analyze_batch(reviews: List[str]) -> List[Dict]:
    """
    Analyze a batch of reviews using Gemini with Groq fallback and timeout.
    Uses a heuristic fallback if both AI services fail.
    """
    if not reviews:
        return []

    prompt = _build_analysis_prompt(reviews)
    results = None

    # Use a ThreadPoolExecutor to enforce a timeout on the AI calls
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Step 1: Try Gemini with a 15-second timeout
        if GEMINI_API_KEY:
            future = executor.submit(_analyze_with_gemini, prompt)
            try:
                results = future.result(timeout=15)
            except Exception as e:
                print(f"⚠️  Gemini failed or timed out ({e}), falling back to Groq...")
        
        # Step 2: Try Groq with a 10-second timeout if Gemini failed
        if (not results) and GROQ_API_KEY:
            future = executor.submit(_analyze_with_groq, prompt)
            try:
                results = future.result(timeout=10)
            except Exception as e2:
                print(f"❌ Groq also failed or timed out ({e2}).")

    # Step 3: Heuristic Fallback if both failed
    if not results:
        print("💡 Using heuristic fallback for analysis.")
        return [_heuristic_analysis(r, i) for i, r in enumerate(reviews)]

    # Validate and pad results if needed
    if not isinstance(results, list):
        results = [results] if isinstance(results, dict) else []

    # Ensure we have one result per review
    while len(results) < len(reviews):
        idx = len(results)
        results.append(_heuristic_analysis(reviews[idx], idx))

    return results[:len(reviews)]


def _default_analysis(index: int) -> Dict:
    """Return a default analysis when AI fails."""
    return {
        "i": index,
        "sentiment": "neutral",
        "sarcastic": False,
        "features": {
            "battery_life": {"s": "not_mentioned", "c": 0.0},
            "build_quality": {"s": "not_mentioned", "c": 0.0},
            "packaging": {"s": "not_mentioned", "c": 0.0},
            "delivery_speed": {"s": "not_mentioned", "c": 0.0},
            "price_value": {"s": "not_mentioned", "c": 0.0},
            "customer_support": {"s": "not_mentioned", "c": 0.0},
        },
    }


def map_analysis_to_review(analysis: Dict) -> Dict:
    """
    Map AI analysis results to Review model field names.
    Handles both object and string formats for feature data.
    """
    if not isinstance(analysis, dict):
        return map_analysis_to_review(_default_analysis(0))

    result = {
        "overall_sentiment": analysis.get("sentiment", "neutral"),
        "is_sarcastic": analysis.get("sarcastic", False),
        "flagged_for_human_review": False,
        "flag_reason": None,
    }

    # Map feature sentiments
    features = analysis.get("features", {})
    for feature_key, (sent_col, conf_col) in FEATURE_MAP.items():
        feat_data = features.get(feature_key, {})
        
        if isinstance(feat_data, dict):
            # Try new short keys first (s/c), then old ones
            result[sent_col] = feat_data.get("s", feat_data.get("sentiment", "not_mentioned"))
            try:
                result[conf_col] = float(feat_data.get("c", feat_data.get("confidence", 0.0)))
            except (ValueError, TypeError):
                result[conf_col] = 0.0
        elif isinstance(feat_data, str):
            # Robustness: LLM returned just a string sentiment
            result[sent_col] = feat_data if feat_data in ["positive", "negative", "neutral", "not_mentioned"] else "not_mentioned"
            result[conf_col] = 0.7 if result[sent_col] != "not_mentioned" else 0.0
        else:
            result[sent_col] = "not_mentioned"
            result[conf_col] = 0.0

    # Business Logic for flagging
    if result["is_sarcastic"] or result["overall_sentiment"] == "ambiguous":
        result["flagged_for_human_review"] = True
        result["flag_reason"] = "Sarcasm/Ambiguity"

    return result
