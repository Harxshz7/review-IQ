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

BATCH_SIZE = 8
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
    """Build the Gemini prompt for review analysis."""
    count = len(reviews)
    reviews_numbered = "\n".join(
        f"{i}. \"{review}\"" for i, review in enumerate(reviews)
    )

    return f"""You are a product intelligence analyst for an e-commerce platform.

Analyze the following {count} customer reviews and return ONLY a raw JSON array.
No explanation. No markdown. No code blocks. Start with [ end with ].

Reviews:
{reviews_numbered}

Return array, one object per review:
[{{
  "review_index": 0,
  "language_detected": "english",
  "translated_text": "same as input if english, else english translation",
  "overall_sentiment": "positive",
  "is_sarcastic": false,
  "is_bot_suspected": false,
  "features": {{
    "battery_life":     {{"sentiment": "positive", "confidence": 0.9}},
    "build_quality":    {{"sentiment": "not_mentioned", "confidence": 0.0}},
    "packaging":        {{"sentiment": "not_mentioned", "confidence": 0.0}},
    "delivery_speed":   {{"sentiment": "not_mentioned", "confidence": 0.0}},
    "price_value":      {{"sentiment": "not_mentioned", "confidence": 0.0}},
    "customer_support": {{"sentiment": "not_mentioned", "confidence": 0.0}}
  }},
  "flagged_for_human_review": false,
  "flag_reason": null
}}]

Rules:
- overall_sentiment: positive|negative|neutral|ambiguous
- feature sentiment: positive|negative|neutral|not_mentioned
- is_sarcastic=true → flagged_for_human_review=true always
- ambiguous overall → flagged_for_human_review=true always
- Only score features mentioned in the review
- Return ONLY the JSON array. Nothing else."""


def _analyze_with_gemini(prompt: str) -> List[Dict]:
    """Call Gemini 1.5 Flash for review analysis."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=4096,
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


def analyze_batch(reviews: List[str]) -> List[Dict]:
    """
    Analyze a batch of reviews using Gemini with Groq fallback.

    Args:
        reviews: List of review text strings (max BATCH_SIZE)

    Returns:
        List of analysis result dicts, one per review
    """
    if not reviews:
        return []

    prompt = _build_analysis_prompt(reviews)

    # Try Gemini first, fallback to Groq on any exception
    try:
        results = _analyze_with_gemini(prompt)
    except Exception as e:
        print(f"⚠️  Gemini failed ({e}), falling back to Groq...")
        try:
            results = _analyze_with_groq(prompt)
        except Exception as e2:
            print(f"❌ Groq also failed ({e2}). Returning defaults.")
            return [_default_analysis(i) for i in range(len(reviews))]

    # Validate and pad results if needed
    if not isinstance(results, list):
        results = [results] if isinstance(results, dict) else []

    # Ensure we have one result per review
    while len(results) < len(reviews):
        results.append(_default_analysis(len(results)))

    return results[:len(reviews)]


def _default_analysis(index: int) -> Dict:
    """Return a default analysis when AI fails."""
    return {
        "review_index": index,
        "language_detected": "english",
        "translated_text": "",
        "overall_sentiment": "neutral",
        "is_sarcastic": False,
        "is_bot_suspected": False,
        "features": {
            "battery_life": {"sentiment": "not_mentioned", "confidence": 0.0},
            "build_quality": {"sentiment": "not_mentioned", "confidence": 0.0},
            "packaging": {"sentiment": "not_mentioned", "confidence": 0.0},
            "delivery_speed": {"sentiment": "not_mentioned", "confidence": 0.0},
            "price_value": {"sentiment": "not_mentioned", "confidence": 0.0},
            "customer_support": {"sentiment": "not_mentioned", "confidence": 0.0},
        },
        "flagged_for_human_review": False,
        "flag_reason": None,
    }


def map_analysis_to_review(analysis: Dict) -> Dict:
    """
    Map AI analysis results to Review model field names.

    Returns a dict compatible with Review model columns.
    """
    result = {
        "overall_sentiment": analysis.get("overall_sentiment", "neutral"),
        "is_sarcastic": analysis.get("is_sarcastic", False),
        "flagged_for_human_review": analysis.get("flagged_for_human_review", False),
        "flag_reason": analysis.get("flag_reason"),
    }

    # Map feature sentiments
    features = analysis.get("features", {})
    for feature_key, (sent_col, conf_col) in FEATURE_MAP.items():
        feat_data = features.get(feature_key, {})
        if isinstance(feat_data, dict):
            result[sent_col] = feat_data.get("sentiment", "not_mentioned")
            result[conf_col] = float(feat_data.get("confidence", 0.0))
        else:
            result[sent_col] = "not_mentioned"
            result[conf_col] = 0.0

    # Ensure sarcastic always gets flagged
    if result["is_sarcastic"]:
        result["flagged_for_human_review"] = True
        if not result["flag_reason"]:
            result["flag_reason"] = "Sarcasm detected"

    # Ensure ambiguous always gets flagged
    if result["overall_sentiment"] == "ambiguous":
        result["flagged_for_human_review"] = True
        if not result["flag_reason"]:
            result["flag_reason"] = "Ambiguous sentiment"

    return result
