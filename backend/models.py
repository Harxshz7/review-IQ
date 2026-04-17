"""
ReviewIQ — SQLAlchemy ORM Models
All tables for the ReviewIQ intelligence platform.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), default="General")
    review_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    original_language = Column(String(50), default="english")
    overall_sentiment = Column(String(20), default="neutral")  # positive/negative/neutral/ambiguous
    is_sarcastic = Column(Boolean, default=False)
    is_bot_suspected = Column(Boolean, default=False)
    flagged_for_human_review = Column(Boolean, default=False)
    flag_reason = Column(String(255), nullable=True)

    # Feature sentiments & confidences
    feat_battery_sentiment = Column(String(20), default="not_mentioned")
    feat_battery_confidence = Column(Float, default=0.0)
    feat_build_sentiment = Column(String(20), default="not_mentioned")
    feat_build_confidence = Column(Float, default=0.0)
    feat_packaging_sentiment = Column(String(20), default="not_mentioned")
    feat_packaging_confidence = Column(Float, default=0.0)
    feat_delivery_sentiment = Column(String(20), default="not_mentioned")
    feat_delivery_confidence = Column(Float, default=0.0)
    feat_price_sentiment = Column(String(20), default="not_mentioned")
    feat_price_confidence = Column(Float, default=0.0)
    feat_support_sentiment = Column(String(20), default="not_mentioned")
    feat_support_confidence = Column(Float, default=0.0)

    submitted_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String(20), default="csv")  # csv/json/text


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    source = Column(String(20), default="csv")
    total_reviews = Column(Integer, default=0)
    processed_reviews = Column(Integer, default=0)
    bot_count = Column(Integer, default=0)
    flagged_count = Column(Integer, default=0)
    status = Column(String(20), default="processing")  # processing/completed/failed
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    feature_name = Column(String(100), nullable=False)
    alert_type = Column(String(50), default="emerging")  # emerging/anomaly/praise_spike
    severity = Column(String(20), default="medium")  # low/medium/high/critical
    description = Column(Text, nullable=True)
    previous_percentage = Column(Float, default=0.0)
    current_percentage = Column(Float, default=0.0)
    affected_count = Column(Integer, default=0)
    classification = Column(String(50), default="isolated")  # isolated/recurring/systemic
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), default="General")
    total_reviews = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)


class ActionCard(Base):
    __tablename__ = "action_cards"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    title = Column(String(500), nullable=False)
    issue_summary = Column(Text, nullable=True)
    what_happened = Column(Text, nullable=True)
    who_affected = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)  # JSON string — list of 3 action strings
    estimated_impact = Column(Text, nullable=True)
    urgency = Column(String(20), default="monitor")  # immediate/this_week/monitor
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
