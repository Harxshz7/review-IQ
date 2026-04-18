"""
ReviewIQ — Smart Column Detector
Auto-detects review_text, product_name, and date columns in uploaded data.
"""

from typing import Optional
import pandas as pd
from datetime import datetime

REVIEW_CANDIDATES = [
    "review_text", "review", "text", "body", "comment", "content",
    "description", "feedback", "opinion", "message",
]

PRODUCT_CANDIDATES = [
    "product_name", "product", "title", "name", "item", "item_name",
]

DATE_CANDIDATES = [
    "submitted_at", "date", "created_at", "timestamp", "review_date",
    "created", "posted_at", "posted", "time",
]


def _find_best_match(columns: list, candidates: list) -> Optional[str]:
    """Find the best column match from a list of candidates."""
    lower_cols = {c.lower().strip(): c for c in columns}

    # Exact match first
    for candidate in candidates:
        if candidate in lower_cols:
            return lower_cols[candidate]

    # Partial match (column contains candidate)
    for candidate in candidates:
        for col_lower, col_original in lower_cols.items():
            if candidate in col_lower or col_lower in candidate:
                return col_original

    return None


def detect_columns(df: pd.DataFrame) -> dict:
    """
    Auto-detect which columns map to review_text, product_name, and date.

    Returns:
        {
            review_col: str | None,
            product_col: str | None,
            date_col: str | None,
            confidence: "high" | "low",
            needs_mapping: bool,
            all_columns: list[str]
        }
    """
    columns = list(df.columns)

    review_col = _find_best_match(columns, REVIEW_CANDIDATES)
    product_col = _find_best_match(columns, PRODUCT_CANDIDATES)
    date_col = _find_best_match(columns, DATE_CANDIDATES)

    # Determine confidence
    found_count = sum(1 for c in [review_col, product_col, date_col] if c is not None)

    if review_col is not None and found_count >= 2:
        confidence = "high"
        needs_mapping = False
    elif review_col is not None:
        confidence = "low"
        needs_mapping = False
    else:
        confidence = "low"
        needs_mapping = True

    # Fallback: if only one text column exists, auto-detect as review
    if review_col is None:
        text_cols = [c for c in columns if df[c].dtype == "object"]
        if len(text_cols) == 1:
            review_col = text_cols[0]
            needs_mapping = False
            confidence = "low"

    return {
        "review_col": review_col,
        "product_col": product_col,
        "date_col": date_col,
        "confidence": confidence,
        "needs_mapping": needs_mapping,
        "all_columns": columns,
    }


def normalize_dataframe(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    """
    Normalize a DataFrame to standard column names using the provided mapping.

    Args:
        df: Original DataFrame
        mapping: {
            review_col: str,        # required
            product_col: str|None,  # optional
            date_col: str|None      # optional
        }

    Returns:
        Cleaned DataFrame with columns: review_text, product_name, submitted_at, category
    """
    result = pd.DataFrame()

    # Review text (required)
    review_col = mapping.get("review_col")
    if review_col and review_col in df.columns:
        result["review_text"] = df[review_col].astype(str).str.strip()
    else:
        raise ValueError("Review text column is required but not found.")

    # Product name (optional)
    product_col = mapping.get("product_col")
    if product_col and product_col in df.columns:
        result["product_name"] = df[product_col].astype(str).str.strip()
    else:
        result["product_name"] = "Unknown Product"

    # Date (optional)
    date_col = mapping.get("date_col")
    if date_col and date_col in df.columns:
        try:
            result["submitted_at"] = pd.to_datetime(df[date_col], errors="coerce")
        except Exception:
            result["submitted_at"] = datetime.utcnow()
        result["submitted_at"] = result["submitted_at"].fillna(datetime.utcnow())
    else:
        result["submitted_at"] = datetime.utcnow()

    # Category (check if exists in original)
    if "category" in df.columns:
        result["category"] = df["category"].astype(str).str.strip()
    else:
        result["category"] = "General"

    # Drop rows where review_text is empty or NaN
    result = result[result["review_text"].str.len() > 0]
    result = result[result["review_text"] != "nan"]
    result = result.reset_index(drop=True)

    return result
