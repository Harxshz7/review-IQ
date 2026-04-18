"""
ReviewIQ — PDF Report Generator
Professional dark-themed PDF reports using ReportLab.
"""

import io
from datetime import datetime
from typing import Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from models import Review, Alert, ActionCard, Batch
import json


# ── Color Palette ──────────────────────────────────────────────────────────
DARK_BG = colors.HexColor("#0D1117")
CARD_BG = colors.HexColor("#111827")
ELEVATED = colors.HexColor("#1F2937")
TEAL = colors.HexColor("#00C896")
BLUE = colors.HexColor("#3B82F6")
AMBER = colors.HexColor("#F59E0B")
RED = colors.HexColor("#EF4444")
TEXT_WHITE = colors.HexColor("#F1F5F9")
TEXT_MUTED = colors.HexColor("#94A3B8")
BORDER = colors.HexColor("#1E293B")

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 50


def _draw_bg(c: canvas.Canvas):
    """Draw dark background on current page."""
    c.setFillColor(DARK_BG)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)


def _draw_header(c: canvas.Canvas, y: float, text: str, size: int = 18) -> float:
    """Draw a section header."""
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", size)
    c.drawString(MARGIN, y, text)
    y -= 5
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    return y - 20


def _draw_text(c: canvas.Canvas, x: float, y: float, text: str,
               color=TEXT_WHITE, size: int = 10, font: str = "Helvetica") -> float:
    """Draw text and return new y position."""
    c.setFillColor(color)
    c.setFont(font, size)

    # Word wrap
    max_width = PAGE_WIDTH - MARGIN * 2 - (x - MARGIN)
    words = text.split()
    line = ""
    for word in words:
        test_line = f"{line} {word}".strip()
        if c.stringWidth(test_line, font, size) > max_width:
            c.drawString(x, y, line)
            y -= size + 4
            line = word
        else:
            line = test_line
    if line:
        c.drawString(x, y, line)
        y -= size + 4
    return y


def _draw_card(c: canvas.Canvas, x: float, y: float, w: float, h: float):
    """Draw a dark card background."""
    c.setFillColor(CARD_BG)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)


def generate_report(product_name: str, user_id: int, db: Session) -> bytes:
    """
    Generate a comprehensive PDF report for a product.

    Pages:
    1. Cover page with product name and key stats
    2. Executive summary + action cards
    3. Feature intelligence table
    4. Active alerts
    5. Flagged reviews + bot summary

    Returns: PDF as bytes
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    reviews = (
        db.query(Review)
        .filter(Review.product_name == product_name, Review.user_id == user_id)
        .all()
    )
    alerts = (
        db.query(Alert)
        .filter(Alert.product_name == product_name, Alert.user_id == user_id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    action_cards = (
        db.query(ActionCard)
        .filter(ActionCard.product_name == product_name, ActionCard.user_id == user_id)
        .order_by(ActionCard.created_at.desc())
        .all()
    )

    total = len(reviews)
    positive = sum(1 for r in reviews if r.overall_sentiment == "positive")
    negative = sum(1 for r in reviews if r.overall_sentiment == "negative")
    neutral = sum(1 for r in reviews if r.overall_sentiment in ("neutral", "ambiguous"))
    bots = sum(1 for r in reviews if r.is_bot_suspected)
    flagged = sum(1 for r in reviews if r.flagged_for_human_review)
    critical_alerts = sum(1 for a in alerts if a.severity == "critical" and not a.is_resolved)

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 1: Cover
    # ═══════════════════════════════════════════════════════════════════════
    _draw_bg(c)

    # Logo area
    c.setFillColor(TEAL)
    c.circle(PAGE_WIDTH / 2 - 60, PAGE_HEIGHT - 180, 8, fill=1)
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(PAGE_WIDTH / 2 - 45, PAGE_HEIGHT - 195, "ReviewIQ")

    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 230, "AI-Powered Review Intelligence Report")

    # Product name
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 320, product_name)

    # Generated date
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 350,
                        f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}")

    # Stats grid
    stats_y = PAGE_HEIGHT - 450
    stats = [
        ("Total Reviews", str(total), TEAL),
        ("Positive", str(positive), colors.HexColor("#10B981")),
        ("Negative", str(negative), RED),
        ("Bots Detected", str(bots), AMBER),
    ]

    card_w = 110
    start_x = (PAGE_WIDTH - (card_w * 4 + 30)) / 2
    for i, (label, value, color) in enumerate(stats):
        x = start_x + i * (card_w + 10)
        _draw_card(c, x, stats_y, card_w, 70)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(x + card_w / 2, stats_y + 40, value)
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 9)
        c.drawCentredString(x + card_w / 2, stats_y + 15, label)

    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH / 2, 40, "ReviewIQ Intelligence Platform — Powered by Google Gemini AI")
    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 2: Executive Summary + Action Cards
    # ═══════════════════════════════════════════════════════════════════════
    _draw_bg(c)
    y = PAGE_HEIGHT - MARGIN

    y = _draw_header(c, y, "Executive Summary")

    summary_text = (
        f"Analysis of {total} reviews for {product_name}. "
        f"Overall sentiment: {positive} positive ({round(positive/max(total,1)*100,1)}%), "
        f"{negative} negative ({round(negative/max(total,1)*100,1)}%), "
        f"{neutral} neutral/ambiguous. "
        f"{bots} suspected bot reviews detected and excluded from analysis. "
        f"{flagged} reviews flagged for human review. "
        f"{len(alerts)} trend alerts generated, {critical_alerts} critical."
    )
    y = _draw_text(c, MARGIN, y, summary_text, TEXT_WHITE, 11)
    y -= 15

    # Action Cards
    if action_cards:
        y = _draw_header(c, y, "AI Action Cards", 14)
        for card in action_cards[:3]:
            if y < 150:
                c.showPage()
                _draw_bg(c)
                y = PAGE_HEIGHT - MARGIN

            urgency_color = RED if card.urgency == "immediate" else AMBER if card.urgency == "this_week" else BLUE
            _draw_card(c, MARGIN - 5, y - 80, PAGE_WIDTH - MARGIN * 2 + 10, 85)

            # Urgency bar
            c.setFillColor(urgency_color)
            c.rect(MARGIN - 5, y - 80, 4, 85, fill=1, stroke=0)

            c.setFillColor(TEXT_WHITE)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(MARGIN + 10, y - 5, card.title[:80])

            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 9)
            if card.issue_summary:
                y_text = _draw_text(c, MARGIN + 10, y - 20, card.issue_summary[:200], TEXT_MUTED, 9)

            # Urgency badge
            c.setFillColor(urgency_color)
            c.setFont("Helvetica-Bold", 8)
            c.drawRightString(PAGE_WIDTH - MARGIN, y - 5, card.urgency.upper())

            y -= 95

    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 3: Feature Intelligence
    # ═══════════════════════════════════════════════════════════════════════
    _draw_bg(c)
    y = PAGE_HEIGHT - MARGIN

    y = _draw_header(c, y, "Feature Intelligence")

    features = {
        "Battery Life": ("feat_battery_sentiment", "feat_battery_confidence"),
        "Build Quality": ("feat_build_sentiment", "feat_build_confidence"),
        "Packaging": ("feat_packaging_sentiment", "feat_packaging_confidence"),
        "Delivery Speed": ("feat_delivery_sentiment", "feat_delivery_confidence"),
        "Price Value": ("feat_price_sentiment", "feat_price_confidence"),
        "Customer Support": ("feat_support_sentiment", "feat_support_confidence"),
    }

    # Table header
    cols = [MARGIN, MARGIN + 120, MARGIN + 200, MARGIN + 280, MARGIN + 360]
    headers = ["Feature", "Positive", "Negative", "Neutral", "Avg Conf."]
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 10)
    for i, h in enumerate(headers):
        c.drawString(cols[i], y, h)
    y -= 5
    c.setStrokeColor(BORDER)
    c.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y -= 18

    non_bot_reviews = [r for r in reviews if not r.is_bot_suspected]

    for feat_name, (sent_col, conf_col) in features.items():
        mentioned = [r for r in non_bot_reviews if getattr(r, sent_col) != "not_mentioned"]
        total_m = len(mentioned)

        if total_m == 0:
            pos_pct = neg_pct = neu_pct = 0
            avg_conf = 0
        else:
            pos = sum(1 for r in mentioned if getattr(r, sent_col) == "positive")
            neg = sum(1 for r in mentioned if getattr(r, sent_col) == "negative")
            neu = total_m - pos - neg
            pos_pct = round(pos / total_m * 100, 1)
            neg_pct = round(neg / total_m * 100, 1)
            neu_pct = round(neu / total_m * 100, 1)
            avg_conf = round(sum(getattr(r, conf_col) for r in mentioned) / total_m * 100, 1)

        c.setFillColor(TEXT_WHITE)
        c.setFont("Helvetica", 10)
        c.drawString(cols[0], y, feat_name)

        c.setFillColor(colors.HexColor("#10B981"))
        c.drawString(cols[1], y, f"{pos_pct}%")

        c.setFillColor(RED)
        c.drawString(cols[2], y, f"{neg_pct}%")

        c.setFillColor(TEXT_MUTED)
        c.drawString(cols[3], y, f"{neu_pct}%")

        c.setFillColor(BLUE)
        c.drawString(cols[4], y, f"{avg_conf}%")

        y -= 22

    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 4: Active Alerts
    # ═══════════════════════════════════════════════════════════════════════
    _draw_bg(c)
    y = PAGE_HEIGHT - MARGIN

    y = _draw_header(c, y, "Active Alerts")

    if not alerts:
        y = _draw_text(c, MARGIN, y, "No active alerts detected.", TEXT_MUTED, 12)
    else:
        for alert in alerts[:8]:
            if y < 120:
                c.showPage()
                _draw_bg(c)
                y = PAGE_HEIGHT - MARGIN

            sev_color = {
                "critical": RED,
                "high": AMBER,
                "medium": BLUE,
                "low": TEXT_MUTED,
            }.get(alert.severity, TEXT_MUTED)

            _draw_card(c, MARGIN - 5, y - 50, PAGE_WIDTH - MARGIN * 2 + 10, 55)
            c.setFillColor(sev_color)
            c.rect(MARGIN - 5, y - 50, 4, 55, fill=1, stroke=0)

            c.setFillColor(TEXT_WHITE)
            c.setFont("Helvetica-Bold", 10)
            feat_display = alert.feature_name.replace("_", " ").title()
            c.drawString(MARGIN + 10, y - 5, f"{feat_display} — {alert.severity.upper()}")

            c.setFillColor(sev_color)
            c.setFont("Helvetica-Bold", 9)
            c.drawRightString(PAGE_WIDTH - MARGIN, y - 5,
                             f"{alert.previous_percentage}% → {alert.current_percentage}%")

            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 9)
            desc = alert.description[:120] if alert.description else ""
            c.drawString(MARGIN + 10, y - 22, desc)

            c.setFont("Helvetica", 8)
            c.drawString(MARGIN + 10, y - 38,
                        f"Type: {alert.alert_type} | Classification: {alert.classification} | Affected: {alert.affected_count}")

            y -= 65

    c.showPage()

    # ═══════════════════════════════════════════════════════════════════════
    # PAGE 5: Flagged Reviews + Bot Summary
    # ═══════════════════════════════════════════════════════════════════════
    _draw_bg(c)
    y = PAGE_HEIGHT - MARGIN

    y = _draw_header(c, y, "Flagged Reviews & Bot Detection")

    # Bot summary
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "Bot Detection Summary")
    y -= 18

    bot_reviews = [r for r in reviews if r.is_bot_suspected]
    y = _draw_text(c, MARGIN, y,
                   f"{len(bot_reviews)} out of {total} reviews ({round(len(bot_reviews)/max(total,1)*100,1)}%) "
                   f"were flagged as suspected bot activity. These reviews are excluded from trend analysis.",
                   TEXT_MUTED, 10)
    y -= 15

    # Flagged reviews
    y = _draw_header(c, y, "Flagged for Human Review", 14)

    flagged_reviews = [r for r in reviews if r.flagged_for_human_review and not r.is_bot_suspected]
    if not flagged_reviews:
        y = _draw_text(c, MARGIN, y, "No reviews flagged for human review.", TEXT_MUTED, 10)
    else:
        for review in flagged_reviews[:10]:
            if y < 100:
                c.showPage()
                _draw_bg(c)
                y = PAGE_HEIGHT - MARGIN

            _draw_card(c, MARGIN - 5, y - 40, PAGE_WIDTH - MARGIN * 2 + 10, 45)

            c.setFillColor(AMBER)
            c.setFont("Helvetica-Bold", 9)
            reason = review.flag_reason or "Manual review needed"
            c.drawString(MARGIN + 5, y - 8, f"⚑ {reason}")

            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 8)
            text_preview = (review.review_text[:100] + "...") if len(review.review_text) > 100 else review.review_text
            c.drawString(MARGIN + 5, y - 24, text_preview)

            c.setFillColor(TEXT_MUTED)
            c.setFont("Helvetica", 7)
            c.drawRightString(PAGE_WIDTH - MARGIN, y - 8, review.overall_sentiment or "")

            y -= 52

    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH / 2, 40, "ReviewIQ Intelligence Platform — Confidential Report")

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.read()
