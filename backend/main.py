"""
ReviewIQ — Main FastAPI Application
All routes, SSE streaming pipeline, authentication, and data endpoints.
"""

from dotenv import load_dotenv
load_dotenv()

import os
import io
import json
import asyncio
from datetime import datetime
from typing import Optional, AsyncGenerator

import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel

from database import init_db, get_db
from models import User, Review, Batch, Alert, Product, ActionCard
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, oauth2_scheme
)
from column_detector import detect_columns, normalize_dataframe
from preprocessor import preprocess_reviews
from ai_engine import analyze_batch, map_analysis_to_review, BATCH_SIZE
from trend_engine import detect_trends, get_time_series, calculate_health_score
from action_cards import generate_action_card
from pdf_generator import generate_report

# ── App Setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="ReviewIQ", version="1.0.0", description="AI-Powered Review Intelligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── Pydantic Schemas ───────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ColumnMapping(BaseModel):
    review_col: str
    product_col: Optional[str] = None
    date_col: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check existing email
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=get_password_hash(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive JWT token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id)})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    """Get current user info."""
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# UPLOAD & SSE STREAMING ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/upload/detect-columns")
async def detect_columns_route(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Parse uploaded file and detect column mappings."""
    content = await file.read()

    try:
        if file.filename.endswith(".json"):
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame([data])
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    detection = detect_columns(df)
    preview = df.head(3).to_dict(orient="records")

    return {
        **detection,
        "preview": preview,
        "total_rows": len(df),
    }


async def run_analysis_pipeline(
    df: pd.DataFrame,
    user_id: int,
    source: str,
    db: Session,
) -> AsyncGenerator[str, None]:
    """
    Core SSE streaming pipeline.
    Processes reviews through: parse → preprocess → AI analysis → trends → action cards.
    Yields SSE events at each stage.
    """
    total = len(df)

    # Get unique products
    products = df["product_name"].unique().tolist()

    # Create batch
    batch = Batch(
        user_id=user_id,
        product_name=", ".join(products),
        category=df["category"].iloc[0] if "category" in df.columns else "General",
        source=source,
        total_reviews=total,
        status="processing",
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Event 1: Parsed
    yield json.dumps({
        "type": "parsed",
        "total": total,
        "batch_id": batch.id,
        "products": products,
    })
    await asyncio.sleep(0)

    # Step 2: Preprocess
    reviews_list = df.to_dict(orient="records")
    preprocess_result = await asyncio.to_thread(preprocess_reviews, reviews_list)
    clean_reviews = preprocess_result["clean"]

    # Event 2: Preprocessed
    yield json.dumps({
        "type": "preprocessed",
        "total": len(clean_reviews),
        "bot_count": preprocess_result["bot_count"],
        "duplicate_count": preprocess_result["duplicate_count"],
        "language_stats": preprocess_result["language_stats"],
        "flagged_count": preprocess_result["flagged_count"],
    })
    await asyncio.sleep(0)

    batch.bot_count = preprocess_result["bot_count"]
    batch.flagged_count = preprocess_result["flagged_count"]
    db.commit()

    # Step 3: Parallel AI Analysis in batches
    processed = 0
    # Process up to 4 batches concurrently to maximize speed without hitting rate limits
    concurrent_batches = 4
    
    for i in range(0, len(clean_reviews), BATCH_SIZE * concurrent_batches):
        batch_tasks = []
        batch_data_list = []
        
        # Prepare concurrent batch tasks
        for k in range(concurrent_batches):
            start_idx = i + (k * BATCH_SIZE)
            if start_idx >= len(clean_reviews):
                break
                
            batch_reviews = clean_reviews[start_idx : start_idx + BATCH_SIZE]
            texts = [r.get("clean_text", r.get("review_text", "")) for r in batch_reviews]
            
            batch_data_list.append(batch_reviews)
            batch_tasks.append(asyncio.to_thread(analyze_batch, texts))
            
        if not batch_tasks:
            break
            
        # Execute multiple AI calls in parallel
        try:
            all_batch_results = await asyncio.gather(*batch_tasks)
        except Exception as e:
            print(f"Parallel AI error: {e}")
            all_batch_results = [[{"overall_sentiment": "neutral", "features": {}} for _ in b] for b in batch_data_list]

        # Save results to DB
        for batch_idx, (batch_reviews, ai_results) in enumerate(zip(batch_data_list, all_batch_results)):
            latest_reviews = []
            for review_data, ai_result in zip(batch_reviews, ai_results):
                mapped = map_analysis_to_review(ai_result)
                
                # Merge bot/preprocess data
                if review_data.get("is_bot_suspected", False):
                    mapped["is_bot_suspected"] = True
                
                # ... same saving logic ...
                product_name = review_data.get("product_name", "Unknown Product")
                category = review_data.get("category", "General")
                submitted_at = review_data.get("submitted_at")
                if not isinstance(submitted_at, datetime):
                    submitted_at = datetime.utcnow()

                review = Review(
                    batch_id=batch.id,
                    user_id=user_id,
                    product_name=product_name,
                    category=category,
                    review_text=review_data.get("review_text", ""),
                    translated_text=review_data.get("translated_text", ""),
                    original_language=review_data.get("original_language", "english"),
                    submitted_at=submitted_at,
                    source=source,
                    **mapped,
                )
                db.add(review)
                latest_reviews.append({
                    "review_text": review_data.get("review_text", "")[:100],
                    "sentiment": mapped.get("overall_sentiment", "neutral"),
                    "language": review_data.get("original_language", "english"),
                    "is_bot": mapped.get("is_bot_suspected", False),
                })
            
            db.commit()
            processed += len(batch_reviews)
            batch.processed_reviews = processed
            db.commit()

            # SSE Progress Update
            yield json.dumps({
                "type": "batch_done",
                "processed": processed,
                "total": len(clean_reviews),
                "percent": round(processed / len(clean_reviews) * 100, 1),
                "latest_reviews": latest_reviews,
            })
            await asyncio.sleep(0)

    # Step 4: Ensure products exist
    for product_name in products:
        existing = db.query(Product).filter(
            Product.user_id == user_id,
            Product.name == product_name,
        ).first()

        product_reviews_count = db.query(Review).filter(
            Review.user_id == user_id,
            Review.product_name == product_name,
        ).count()

        if existing:
            existing.total_reviews = product_reviews_count
            existing.last_updated = datetime.utcnow()
        else:
            product_category = df[df["product_name"] == product_name]["category"].iloc[0] if "category" in df.columns else "General"
            new_product = Product(
                user_id=user_id,
                name=product_name,
                category=product_category,
                total_reviews=product_reviews_count,
            )
            db.add(new_product)
        db.commit()

    # Step 5: Trend Detection
    yield json.dumps({
        "type": "trends_analyzing",
        "message": "Analyzing trends and detecting anomalies...",
    })
    await asyncio.sleep(0)

    all_alerts = []
    all_action_cards = []

    for product_name in products:
        alerts = await asyncio.to_thread(detect_trends, product_name, user_id, batch.id, db)
        all_alerts.extend(alerts)

        # Generate action cards for significant alerts
        for alert_data in alerts:
            if alert_data["severity"] in ("critical", "high"):
                alert_obj = db.query(Alert).filter(Alert.id == alert_data["id"]).first()
                if alert_obj:
                    card = await asyncio.to_thread(
                        generate_action_card, alert_obj, user_id, db
                    )
                    if card:
                        all_action_cards.append(card)

    # Update batch status
    batch.status = "completed"
    db.commit()

    # Event 5: Complete
    yield json.dumps({
        "type": "complete",
        "alerts_count": len(all_alerts),
        "alerts": all_alerts,
        "action_cards": all_action_cards,
        "products": products,
    })


@app.post("/api/upload/csv-stream")
async def upload_csv_stream(
    file: UploadFile = File(...),
    review_col: str = Form(None),
    product_col: str = Form(None),
    date_col: str = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload CSV and stream analysis results via SSE."""
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    mapping = {
        "review_col": review_col,
        "product_col": product_col,
        "date_col": date_col,
    }

    # Auto-detect if no mapping provided
    if not review_col:
        detection = detect_columns(df)
        mapping = {
            "review_col": detection["review_col"],
            "product_col": detection["product_col"],
            "date_col": detection["date_col"],
        }

    if not mapping["review_col"]:
        raise HTTPException(status_code=400, detail="Could not detect review text column")

    df = normalize_dataframe(df, mapping)

    return EventSourceResponse(run_analysis_pipeline(df, user.id, "csv", db))


@app.post("/api/upload/json-stream")
async def upload_json_stream(
    file: UploadFile = File(...),
    review_col: str = Form(None),
    product_col: str = Form(None),
    date_col: str = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload JSON and stream analysis results via SSE."""
    content = await file.read()

    try:
        data = json.loads(content.decode("utf-8"))
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = pd.DataFrame([data])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse JSON: {str(e)}")

    mapping = {
        "review_col": review_col,
        "product_col": product_col,
        "date_col": date_col,
    }

    if not review_col:
        detection = detect_columns(df)
        mapping = {
            "review_col": detection["review_col"],
            "product_col": detection["product_col"],
            "date_col": detection["date_col"],
        }

    if not mapping["review_col"]:
        raise HTTPException(status_code=400, detail="Could not detect review text column")

    df = normalize_dataframe(df, mapping)

    return EventSourceResponse(run_analysis_pipeline(df, user.id, "json", db))


@app.post("/api/upload/text-stream")
async def upload_text_stream(
    text: str = Form(...),
    product_name: str = Form("Unknown Product"),
    category: str = Form("General"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze pasted text reviews via SSE streaming."""
    # Split by newlines to get individual reviews
    lines = [line.strip() for line in text.strip().split("\n") if line.strip()]

    if not lines:
        raise HTTPException(status_code=400, detail="No review text provided")

    df = pd.DataFrame({
        "review_text": lines,
        "product_name": product_name,
        "category": category,
        "submitted_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    })

    return EventSourceResponse(run_analysis_pipeline(df, user.id, "text", db))


# ═══════════════════════════════════════════════════════════════════════════
# DATA ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/products")
def get_products(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all products for the current user."""
    products = (
        db.query(Product)
        .filter(Product.user_id == user.id)
        .order_by(Product.last_updated.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "total_reviews": p.total_reviews,
            "last_updated": p.last_updated.isoformat() if p.last_updated else None,
        }
        for p in products
    ]


@app.get("/api/dashboard/{product_name}")
def get_dashboard(
    product_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete dashboard data for a product."""
    reviews = (
        db.query(Review)
        .filter(Review.product_name == product_name, Review.user_id == user.id)
        .all()
    )

    if not reviews:
        raise HTTPException(status_code=404, detail="No reviews found for this product")

    total = len(reviews)
    non_bot = [r for r in reviews if not r.is_bot_suspected]
    positive = sum(1 for r in non_bot if r.overall_sentiment == "positive")
    negative = sum(1 for r in non_bot if r.overall_sentiment == "negative")
    neutral = sum(1 for r in non_bot if r.overall_sentiment in ("neutral", "ambiguous"))
    bots = sum(1 for r in reviews if r.is_bot_suspected)
    flagged = sum(1 for r in reviews if r.flagged_for_human_review)

    # Active alerts
    alerts = (
        db.query(Alert)
        .filter(Alert.product_name == product_name, Alert.user_id == user.id, Alert.is_resolved == False)
        .order_by(Alert.severity.desc(), Alert.created_at.desc())
        .all()
    )

    # Feature breakdown
    features = {}
    feature_cols = {
        "battery_life": ("feat_battery_sentiment", "feat_battery_confidence"),
        "build_quality": ("feat_build_sentiment", "feat_build_confidence"),
        "packaging": ("feat_packaging_sentiment", "feat_packaging_confidence"),
        "delivery_speed": ("feat_delivery_sentiment", "feat_delivery_confidence"),
        "price_value": ("feat_price_sentiment", "feat_price_confidence"),
        "customer_support": ("feat_support_sentiment", "feat_support_confidence"),
    }

    for feat_name, (sent_col, conf_col) in feature_cols.items():
        mentioned = [r for r in non_bot if getattr(r, sent_col) != "not_mentioned"]
        total_m = len(mentioned)
        if total_m == 0:
            features[feat_name] = {
                "positive": 0, "negative": 0, "neutral": 0,
                "total_mentioned": 0, "avg_confidence": 0,
            }
            continue

        pos = sum(1 for r in mentioned if getattr(r, sent_col) == "positive")
        neg = sum(1 for r in mentioned if getattr(r, sent_col) == "negative")
        neu = total_m - pos - neg
        avg_conf = sum(getattr(r, conf_col) for r in mentioned) / total_m

        features[feat_name] = {
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "total_mentioned": total_m,
            "positive_pct": round(pos / total_m * 100, 1),
            "negative_pct": round(neg / total_m * 100, 1),
            "neutral_pct": round(neu / total_m * 100, 1),
            "avg_confidence": round(avg_conf, 2),
        }

    # Language breakdown
    lang_stats = {}
    for r in reviews:
        lang = r.original_language or "english"
        lang_stats[lang] = lang_stats.get(lang, 0) + 1

    # Health score
    health = calculate_health_score(product_name, user.id, db)

    # Recent reviews
    recent = (
        db.query(Review)
        .filter(Review.product_name == product_name, Review.user_id == user.id)
        .order_by(Review.submitted_at.desc())
        .limit(10)
        .all()
    )

    # Action cards
    action_cards = (
        db.query(ActionCard)
        .filter(
            ActionCard.product_name == product_name,
            ActionCard.user_id == user.id,
            ActionCard.is_dismissed == False,
        )
        .order_by(ActionCard.created_at.desc())
        .all()
    )

    return {
        "product_name": product_name,
        "total_reviews": total,
        "sentiment": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "positive_pct": round(positive / max(len(non_bot), 1) * 100, 1),
            "negative_pct": round(negative / max(len(non_bot), 1) * 100, 1),
            "neutral_pct": round(neutral / max(len(non_bot), 1) * 100, 1),
        },
        "bots_detected": bots,
        "flagged_count": flagged,
        "health_score": health,
        "features": features,
        "language_stats": lang_stats,
        "alerts": [
            {
                "id": a.id,
                "feature_name": a.feature_name,
                "severity": a.severity,
                "alert_type": a.alert_type,
                "description": a.description,
                "previous_percentage": a.previous_percentage,
                "current_percentage": a.current_percentage,
                "affected_count": a.affected_count,
                "classification": a.classification,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "action_cards": [
            {
                "id": c.id,
                "alert_id": c.alert_id,
                "title": c.title,
                "issue_summary": c.issue_summary,
                "what_happened": c.what_happened,
                "who_affected": c.who_affected,
                "recommended_actions": json.loads(c.recommended_actions) if c.recommended_actions else [],
                "estimated_impact": c.estimated_impact,
                "urgency": c.urgency,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in action_cards
        ],
        "recent_reviews": [
            {
                "id": r.id,
                "review_text": r.review_text,
                "translated_text": r.translated_text,
                "original_language": r.original_language,
                "overall_sentiment": r.overall_sentiment,
                "is_sarcastic": r.is_sarcastic,
                "is_bot_suspected": r.is_bot_suspected,
                "flagged_for_human_review": r.flagged_for_human_review,
                "flag_reason": r.flag_reason,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            }
            for r in recent
        ],
    }


@app.get("/api/reviews/{product_name}")
def get_reviews(
    product_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated reviews for a product."""
    query = db.query(Review).filter(
        Review.product_name == product_name,
        Review.user_id == user.id,
    )

    if filter and filter != "all":
        if filter == "positive":
            query = query.filter(Review.overall_sentiment == "positive")
        elif filter == "negative":
            query = query.filter(Review.overall_sentiment == "negative")
        elif filter == "neutral":
            query = query.filter(Review.overall_sentiment.in_(["neutral", "ambiguous"]))
        elif filter == "flagged":
            query = query.filter(Review.flagged_for_human_review == True)
        elif filter == "bots":
            query = query.filter(Review.is_bot_suspected == True)
        elif filter == "sarcastic":
            query = query.filter(Review.is_sarcastic == True)

    if search:
        query = query.filter(Review.review_text.ilike(f"%{search}%"))

    total = query.count()
    reviews = (
        query.order_by(Review.submitted_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "reviews": [
            {
                "id": r.id,
                "review_text": r.review_text,
                "translated_text": r.translated_text,
                "original_language": r.original_language,
                "overall_sentiment": r.overall_sentiment,
                "is_sarcastic": r.is_sarcastic,
                "is_bot_suspected": r.is_bot_suspected,
                "flagged_for_human_review": r.flagged_for_human_review,
                "flag_reason": r.flag_reason,
                "product_name": r.product_name,
                "category": r.category,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
                "features": {
                    "battery_life": {"sentiment": r.feat_battery_sentiment, "confidence": r.feat_battery_confidence},
                    "build_quality": {"sentiment": r.feat_build_sentiment, "confidence": r.feat_build_confidence},
                    "packaging": {"sentiment": r.feat_packaging_sentiment, "confidence": r.feat_packaging_confidence},
                    "delivery_speed": {"sentiment": r.feat_delivery_sentiment, "confidence": r.feat_delivery_confidence},
                    "price_value": {"sentiment": r.feat_price_sentiment, "confidence": r.feat_price_confidence},
                    "customer_support": {"sentiment": r.feat_support_sentiment, "confidence": r.feat_support_confidence},
                },
            }
            for r in reviews
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@app.get("/api/trends/{product_name}")
def get_trends(
    product_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get trend data and time series for a product."""
    time_series = get_time_series(product_name, user.id, db)
    health = calculate_health_score(product_name, user.id, db)

    alerts = (
        db.query(Alert)
        .filter(Alert.product_name == product_name, Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return {
        "time_series": time_series,
        "health_score": health,
        "alerts": [
            {
                "id": a.id,
                "feature_name": a.feature_name,
                "severity": a.severity,
                "alert_type": a.alert_type,
                "description": a.description,
                "previous_percentage": a.previous_percentage,
                "current_percentage": a.current_percentage,
                "affected_count": a.affected_count,
                "classification": a.classification,
                "is_resolved": a.is_resolved,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
    }


@app.get("/api/alerts/{product_name}")
def get_alerts(
    product_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all alerts for a product."""
    alerts = (
        db.query(Alert)
        .filter(Alert.product_name == product_name, Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    # Get associated action cards
    alert_ids = [a.id for a in alerts]
    action_cards = (
        db.query(ActionCard)
        .filter(ActionCard.alert_id.in_(alert_ids))
        .all()
    ) if alert_ids else []

    card_map = {}
    for c in action_cards:
        card_map[c.alert_id] = {
            "id": c.id,
            "title": c.title,
            "issue_summary": c.issue_summary,
            "what_happened": c.what_happened,
            "who_affected": c.who_affected,
            "recommended_actions": json.loads(c.recommended_actions) if c.recommended_actions else [],
            "estimated_impact": c.estimated_impact,
            "urgency": c.urgency,
        }

    return [
        {
            "id": a.id,
            "feature_name": a.feature_name,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "description": a.description,
            "previous_percentage": a.previous_percentage,
            "current_percentage": a.current_percentage,
            "affected_count": a.affected_count,
            "classification": a.classification,
            "is_resolved": a.is_resolved,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "action_card": card_map.get(a.id),
        }
        for a in alerts
    ]


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an alert as resolved."""
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    db.commit()
    return {"status": "resolved", "id": alert_id}


@app.get("/api/action-cards/{product_name}")
def get_action_cards(
    product_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get action cards for a product."""
    cards = (
        db.query(ActionCard)
        .filter(
            ActionCard.product_name == product_name,
            ActionCard.user_id == user.id,
        )
        .order_by(ActionCard.created_at.desc())
        .all()
    )

    result = []
    for c in cards:
        # Get associated alert
        alert = db.query(Alert).filter(Alert.id == c.alert_id).first() if c.alert_id else None
        result.append({
            "id": c.id,
            "alert_id": c.alert_id,
            "product_name": c.product_name,
            "title": c.title,
            "issue_summary": c.issue_summary,
            "what_happened": c.what_happened,
            "who_affected": c.who_affected,
            "recommended_actions": json.loads(c.recommended_actions) if c.recommended_actions else [],
            "estimated_impact": c.estimated_impact,
            "urgency": c.urgency,
            "is_dismissed": c.is_dismissed,
            "severity": alert.severity if alert else "medium",
            "previous_percentage": alert.previous_percentage if alert else 0,
            "current_percentage": alert.current_percentage if alert else 0,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return result


@app.post("/api/action-cards/{card_id}/dismiss")
def dismiss_action_card(
    card_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss an action card."""
    card = db.query(ActionCard).filter(ActionCard.id == card_id, ActionCard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Action card not found")

    card.is_dismissed = True
    db.commit()
    return {"status": "dismissed", "id": card_id}


@app.get("/api/report/{product_name}")
def get_report(
    product_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and download PDF report."""
    pdf_bytes = generate_report(product_name, user.id, db)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ReviewIQ_{product_name}_Report.pdf"'
        },
    )


# ═══════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
