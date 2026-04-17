"""
ReviewIQ — Trend Detection Engine
Sliding window algorithm to detect emerging complaint spikes & anomalies.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict

from sqlalchemy.orm import Session
from models import Review, Alert

FEATURES = {
    "battery_life": ("feat_battery_sentiment", "feat_battery_confidence"),
    "build_quality": ("feat_build_sentiment", "feat_build_confidence"),
    "packaging": ("feat_packaging_sentiment", "feat_packaging_confidence"),
    "delivery_speed": ("feat_delivery_sentiment", "feat_delivery_confidence"),
    "price_value": ("feat_price_sentiment", "feat_price_confidence"),
    "customer_support": ("feat_support_sentiment", "feat_support_confidence"),
}

WINDOW_SIZE = 50


def detect_trends(product_name: str, user_id: int, batch_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Detect emerging trends using a sliding window algorithm.

    1. Fetch non-bot reviews sorted by submitted_at ASC
    2. If total < 20: return []
    3. current_window = last 50. previous_window = 50 before that.
    4. For each of 6 features, calculate negative percentage delta.
    5. Generate alerts for significant changes.

    Returns list of alert dicts.
    """
    reviews = (
        db.query(Review)
        .filter(
            Review.product_name == product_name,
            Review.user_id == user_id,
            Review.is_bot_suspected == False,
        )
        .order_by(Review.submitted_at.asc())
        .all()
    )

    if len(reviews) < 20:
        return []

    # Define windows
    total = len(reviews)
    current_start = max(0, total - WINDOW_SIZE)
    current_window = reviews[current_start:]

    previous_end = current_start
    previous_start = max(0, previous_end - WINDOW_SIZE)
    previous_window = reviews[previous_start:previous_end] if previous_end > 0 else []

    if not previous_window:
        return []

    alerts = []

    for feature_name, (sent_col, conf_col) in FEATURES.items():
        # Count mentioned reviews in each window
        curr_mentioned = [r for r in current_window if getattr(r, sent_col) != "not_mentioned"]
        prev_mentioned = [r for r in previous_window if getattr(r, sent_col) != "not_mentioned"]

        # Skip if too few mentions in current window
        if len(curr_mentioned) < 3:
            continue

        # Calculate negative percentages
        curr_negative = [r for r in curr_mentioned if getattr(r, sent_col) == "negative"]
        prev_negative = [r for r in prev_mentioned if getattr(r, sent_col) == "negative"]

        curr_neg_pct = (len(curr_negative) / len(curr_mentioned) * 100) if curr_mentioned else 0
        prev_neg_pct = (len(prev_negative) / len(prev_mentioned) * 100) if prev_mentioned else 0

        delta = curr_neg_pct - prev_neg_pct

        # Determine severity
        severity = None
        alert_type = "emerging"

        if delta > 35:
            severity = "critical"
        elif delta > 25:
            severity = "high"
        elif delta > 15:
            severity = "medium"

        # Anomaly detection: positive sentiment collapse
        curr_positive = [r for r in curr_mentioned if getattr(r, sent_col) == "positive"]
        prev_positive = [r for r in prev_mentioned if getattr(r, sent_col) == "positive"]
        curr_pos_pct = (len(curr_positive) / len(curr_mentioned) * 100) if curr_mentioned else 0
        prev_pos_pct = (len(prev_positive) / len(prev_mentioned) * 100) if prev_mentioned else 0

        if prev_pos_pct > 60 and curr_pos_pct < 40 and severity is None:
            severity = "high"
            alert_type = "anomaly"

        # Praise spike detection
        if curr_pos_pct > prev_pos_pct + 30 and severity is None:
            severity = "low"
            alert_type = "praise_spike"

        if severity is None:
            continue

        # Classification based on affected count
        affected_count = len(curr_negative)
        if affected_count <= 2:
            classification = "isolated"
        elif affected_count <= 4:
            classification = "recurring"
        else:
            classification = "systemic"

        # Upgrade severity for systemic issues
        if classification == "systemic":
            if severity == "medium":
                severity = "high"
            elif severity == "high":
                severity = "critical"

        description = (
            f"{feature_name.replace('_', ' ').title()} complaints changed from "
            f"{prev_neg_pct:.1f}% to {curr_neg_pct:.1f}% "
            f"(+{delta:.1f}pp). {affected_count} affected reviews. "
            f"Classification: {classification}."
        )

        # Save alert to DB
        alert = Alert(
            batch_id=batch_id,
            user_id=user_id,
            product_name=product_name,
            feature_name=feature_name,
            alert_type=alert_type,
            severity=severity,
            description=description,
            previous_percentage=round(prev_neg_pct, 1),
            current_percentage=round(curr_neg_pct, 1),
            affected_count=affected_count,
            classification=classification,
            is_resolved=False,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        alerts.append({
            "id": alert.id,
            "product_name": product_name,
            "feature_name": feature_name,
            "alert_type": alert_type,
            "severity": severity,
            "description": description,
            "previous_percentage": round(prev_neg_pct, 1),
            "current_percentage": round(curr_neg_pct, 1),
            "affected_count": affected_count,
            "classification": classification,
        })

    return alerts


def get_time_series(product_name: str, user_id: int, db: Session) -> Dict[str, Any]:
    """
    Get per-feature per-date sentiment percentages for trend charts.

    Returns: {
        dates: [str],
        features: {
            feature_name: {
                positive: [float],
                negative: [float],
                neutral: [float]
            }
        }
    }
    """
    reviews = (
        db.query(Review)
        .filter(
            Review.product_name == product_name,
            Review.user_id == user_id,
            Review.is_bot_suspected == False,
        )
        .order_by(Review.submitted_at.asc())
        .all()
    )

    if not reviews:
        return {"dates": [], "features": {}}

    # Group by date
    date_groups = defaultdict(list)
    for r in reviews:
        date_key = r.submitted_at.strftime("%Y-%m-%d") if r.submitted_at else "unknown"
        date_groups[date_key].append(r)

    dates = sorted(date_groups.keys())
    features_data = {}

    for feature_name, (sent_col, _) in FEATURES.items():
        positive_pcts = []
        negative_pcts = []
        neutral_pcts = []

        for date in dates:
            day_reviews = date_groups[date]
            mentioned = [r for r in day_reviews if getattr(r, sent_col) != "not_mentioned"]

            if not mentioned:
                positive_pcts.append(0)
                negative_pcts.append(0)
                neutral_pcts.append(0)
                continue

            total = len(mentioned)
            pos = sum(1 for r in mentioned if getattr(r, sent_col) == "positive")
            neg = sum(1 for r in mentioned if getattr(r, sent_col) == "negative")
            neu = total - pos - neg

            positive_pcts.append(round(pos / total * 100, 1))
            negative_pcts.append(round(neg / total * 100, 1))
            neutral_pcts.append(round(neu / total * 100, 1))

        features_data[feature_name] = {
            "positive": positive_pcts,
            "negative": negative_pcts,
            "neutral": neutral_pcts,
        }

    return {"dates": dates, "features": features_data}


def calculate_health_score(product_name: str, user_id: int, db: Session) -> int:
    """
    Calculate a 0-100 product health score.

    Based on:
    - Overall sentiment distribution (40%)
    - Feature sentiment health (40%)
    - Alert severity impact (20%)
    """
    reviews = (
        db.query(Review)
        .filter(
            Review.product_name == product_name,
            Review.user_id == user_id,
            Review.is_bot_suspected == False,
        )
        .all()
    )

    if not reviews:
        return 100

    total = len(reviews)

    # Overall sentiment score (40 points max)
    positive_count = sum(1 for r in reviews if r.overall_sentiment == "positive")
    negative_count = sum(1 for r in reviews if r.overall_sentiment == "negative")
    sentiment_ratio = positive_count / total if total > 0 else 0.5
    sentiment_score = sentiment_ratio * 40

    # Feature health score (40 points max)
    feature_scores = []
    for feature_name, (sent_col, _) in FEATURES.items():
        mentioned = [r for r in reviews if getattr(r, sent_col) != "not_mentioned"]
        if not mentioned:
            feature_scores.append(1.0)
            continue
        feat_pos = sum(1 for r in mentioned if getattr(r, sent_col) == "positive")
        feat_ratio = feat_pos / len(mentioned)
        feature_scores.append(feat_ratio)

    avg_feature_score = sum(feature_scores) / len(feature_scores) if feature_scores else 0.5
    feature_score = avg_feature_score * 40

    # Alert impact (20 points max — deducted)
    alerts = (
        db.query(Alert)
        .filter(
            Alert.product_name == product_name,
            Alert.user_id == user_id,
            Alert.is_resolved == False,
        )
        .all()
    )

    alert_penalty = 0
    for alert in alerts:
        if alert.severity == "critical":
            alert_penalty += 8
        elif alert.severity == "high":
            alert_penalty += 5
        elif alert.severity == "medium":
            alert_penalty += 3
        elif alert.severity == "low":
            alert_penalty += 1

    alert_score = max(0, 20 - alert_penalty)

    total_score = int(sentiment_score + feature_score + alert_score)
    return max(0, min(100, total_score))
