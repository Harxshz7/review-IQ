# GEMINI.md - Review-IQ Project Context

This document provides instructional context for AI agents working on the **Review-IQ** project.

## 🧠 Project Overview
**Review-IQ** is an AI-powered customer review intelligence platform designed to transform raw reviews into actionable business insights. It was built for **Hack Malenadu '26**.

### Main Features:
- **Smart Column Detection:** Automatically identifies relevant columns (review text, product name, date) from uploaded CSV files.
- **Multilingual NLP:** Detects 50+ languages and translates non-English reviews into English.
- **Bot & Sarcasm Detection:** Uses TF-IDF similarity and short-review filtering to flag potential bots or ambiguous reviews.
- **AI-Powered Scoring:** Uses **Google Gemini 1.5 Flash** (with Groq Llama 3.1 fallback) to score six key product features: Battery, Build, Packaging, Delivery, Price, and Support.
- **Trend Detection:** Identifies complaint spikes using a sliding window algorithm and classifies their severity.
- **AI Action Cards:** Generates business recommendations based on detected trends.
- **Real-time Analysis:** Uses Server-Sent Events (SSE) to stream analysis progress to the frontend.
- **Professional Reports:** Generates 5-page PDF reports with professional dark-themed visualizations.

## 🏗 Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS + Recharts + Framer Motion |
| **Backend** | Python 3.11+ + FastAPI + Uvicorn + SQLite (SQLAlchemy) |
| **AI/LLM** | Google Gemini 1.5 Flash + Groq Llama 3.1 |
| **NLP** | `langdetect`, `deep-translator`, `scikit-learn` |
| **Auth** | JWT (`python-jose`) + bcrypt (`passlib`) |

## 🚀 Building and Running

### Backend
1.  **Environment Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```
2.  **Configuration:**
    Copy `.env.example` to `.env` and fill in:
    - `GEMINI_API_KEY`
    - `GROQ_API_KEY`
3.  **Data Generation (Optional):**
    ```bash
    python synthetic_data.py
    ```
4.  **Run Server:**
    ```bash
    python main.py
    ```
    API will be available at `http://localhost:8000/docs`.

### Frontend
1.  **Installation:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Frontend will be available at `http://localhost:5173`.

## 📁 Key Files and Directories
- `backend/main.py`: The entry point for the FastAPI application, containing routes and the SSE streaming pipeline.
- `backend/ai_engine.py`: Handles interactions with Gemini and Groq for review analysis.
- `backend/trend_engine.py`: Implements the sliding window algorithm for trend detection.
- `backend/pdf_generator.py`: Logic for generating professional PDF reports using `reportlab`.
- `backend/column_detector.py`: Heuristics and logic for mapping CSV columns to internal models.
- `frontend/src/App.jsx`: Main React entry point.
- `frontend/src/context/`: Contains React contexts for Auth, Product data, and Toasts.
- `frontend/src/pages/`: Contains the main page components (Dashboard, Upload, Trends, etc.).

## 🛠 Development Conventions
- **Backend:** Uses FastAPI with Pydantic for request/response validation. Database interactions are handled via SQLAlchemy ORM.
- **Frontend:** Follows a component-based architecture using React functional components and hooks. Tailwind CSS is used for styling.
- **Real-time Communication:** The analysis pipeline uses Server-Sent Events (SSE) for streaming updates from the backend to the frontend.
- **Error Handling:** Centralized error handling is primarily implemented via FastAPI's `HTTPException`.
- **Testing:** Currently, there is no formal test suite directory (e.g., `tests/`). TODO: Implement unit and integration tests for AI scoring and trend engines.
