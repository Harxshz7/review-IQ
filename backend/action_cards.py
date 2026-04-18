"""
ReviewIQ — Action Cards Generator
Uses Gemini AI to generate actionable business decisions from alerts.
In ULTRA_MODE (default), skips API calls entirely for instant generation.
"""

import json
import concurrent.futures
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from models import Alert, ActionCard
from ai_engine import safe_json_parse

import google.generativeai as genai
from groq import Groq
import os

# Respect ULTRA_MODE - skip all API calls when enabled
ULTRA_MODE = os.getenv("ULTRA_MODE", "true").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Action card API timeout (seconds) - short so we don't block the stream
ACTION_CARD_TIMEOUT = 5


def _build_action_prompt(alert: Alert) -> str:
    """Build the Gemini prompt for action card generation."""
    return f"""You are a senior product manager. A data system detected this issue:
Product: {alert.product_name}
Feature: {alert.feature_name.replace('_', ' ').title()}
Severity: {alert.severity.upper()}
Previous complaint rate: {alert.previous_percentage}%
Current complaint rate: {alert.current_percentage}%
Affected reviews: {alert.affected_count}
Classification: {alert.classification}
Description: {alert.description}

Return ONLY a JSON object (no markdown, no code blocks):
{{
  "title": "Brief action title",
  "issue_summary": "1-2 sentence summary of the issue",
  "what_happened": "Detailed explanation of what the data shows",
  "who_affected": "Description of affected customer segments",
  "recommended_actions": ["action1", "action2", "action3"],
  "estimated_impact": "Expected business impact if not addressed",
  "urgency": "immediate"
}}

Rules:
- urgency must be: immediate | this_week | monitor
- recommended_actions must be exactly 3 specific, actionable steps
- Keep all text concise and business-focused
- Return ONLY the JSON object"""


def _parse_action_response(text: str) -> Dict:
    """Parse action card response from LLM."""
    result = safe_json_parse(text)
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    elif isinstance(result, dict):
        return result
    return {}


def generate_action_card(alert: Alert, user_id: int, db: Session) -> Optional[Dict[str, Any]]:
    """
    Generate an AI-powered action card for a detected alert.
    In ULTRA_MODE (default=true), uses instant heuristic generation — no API calls.
    In non-ultra mode, tries Gemini/Groq with a short timeout to avoid blocking.

    Args:
        alert: Alert model instance
        user_id: Current user ID
        db: Database session

    Returns:
        Action card dict or None if generation fails
    """
    action_data = None

    # ULTRA MODE: Skip all API calls for instant generation
    if ULTRA_MODE:
        print("⚡ Ultra mode: using heuristic action card (instant)")
        action_data = _default_action_card(alert)
    else:
        prompt = _build_action_prompt(alert)

        # Try Gemini with strict timeout
        if GEMINI_API_KEY:
            def _call_gemini():
                model = genai.GenerativeModel("gemini-1.5-flash")
                return model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,
                        max_output_tokens=2048,
                    ),
                )
            try:
                with concurrent.futures.ThreadPoolExecutor() as ex:
                    future = ex.submit(_call_gemini)
                    response = future.result(timeout=ACTION_CARD_TIMEOUT)
                action_data = _parse_action_response(response.text)
            except Exception as e:
                print(f"⚠️  Gemini action card failed/timed out ({type(e).__name__}), trying Groq...")

        # Fallback to Groq with strict timeout
        if not action_data and GROQ_API_KEY:
            def _call_groq():
                client = Groq(api_key=GROQ_API_KEY)
                return client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": "You are a senior product manager. Return only valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                )
            try:
                with concurrent.futures.ThreadPoolExecutor() as ex:
                    future = ex.submit(_call_groq)
                    response = future.result(timeout=ACTION_CARD_TIMEOUT)
                action_data = _parse_action_response(response.choices[0].message.content)
            except Exception as e2:
                print(f"❌ Groq action card also failed ({type(e2).__name__}).")

    # Fallback to default if both fail
    if not action_data:
        action_data = _default_action_card(alert)

    # Save to DB
    recommended_actions = action_data.get("recommended_actions", [])
    if isinstance(recommended_actions, list):
        recommended_actions_json = json.dumps(recommended_actions)
    else:
        recommended_actions_json = json.dumps([str(recommended_actions)])

    card = ActionCard(
        alert_id=alert.id,
        user_id=user_id,
        product_name=alert.product_name,
        title=action_data.get("title", f"Action Required: {alert.feature_name}"),
        issue_summary=action_data.get("issue_summary", alert.description),
        what_happened=action_data.get("what_happened", ""),
        who_affected=action_data.get("who_affected", ""),
        recommended_actions=recommended_actions_json,
        estimated_impact=action_data.get("estimated_impact", ""),
        urgency=action_data.get("urgency", "monitor"),
        is_dismissed=False,
    )
    db.add(card)
    db.flush()
    db.refresh(card)

    return {
        "id": card.id,
        "alert_id": card.alert_id,
        "product_name": card.product_name,
        "title": card.title,
        "issue_summary": card.issue_summary,
        "what_happened": card.what_happened,
        "who_affected": card.who_affected,
        "recommended_actions": recommended_actions,
        "estimated_impact": card.estimated_impact,
        "urgency": card.urgency,
        "severity": alert.severity,
        "previous_percentage": alert.previous_percentage,
        "current_percentage": alert.current_percentage,
        "created_at": card.created_at.isoformat() if card.created_at else None,
    }


def _default_action_card(alert: Alert) -> Dict:
    """Generate a default action card when AI is unavailable."""
    feature_display = alert.feature_name.replace("_", " ").title()
    severity_map = {
        "critical": "immediate",
        "high": "immediate",
        "medium": "this_week",
        "low": "monitor",
    }

    return {
        "title": f"⚠️ {feature_display} Issue Detected — {alert.severity.upper()}",
        "issue_summary": alert.description,
        "what_happened": (
            f"Our trend detection system identified a significant change in "
            f"{feature_display.lower()} sentiment. Complaint rate moved from "
            f"{alert.previous_percentage}% to {alert.current_percentage}%."
        ),
        "who_affected": (
            f"Approximately {alert.affected_count} customers in recent reviews "
            f"have reported issues. Classification: {alert.classification}."
        ),
        "recommended_actions": [
            f"Investigate root cause of {feature_display.lower()} complaints immediately.",
            f"Reach out to affected customers with resolution or compensation.",
            f"Implement quality checks to prevent future {feature_display.lower()} issues.",
        ],
        "estimated_impact": (
            f"If unaddressed, this {alert.classification} issue could lead to "
            f"increased return rates and negative brand perception."
        ),
        "urgency": severity_map.get(alert.severity, "monitor"),
    }
