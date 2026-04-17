# 🧠 ReviewIQ — AI-Powered Customer Review Intelligence

> **Hack Malenadu '26** | Transform raw customer reviews into actionable business intelligence in seconds.

ReviewIQ is an AI-powered platform that ingests customer reviews (CSV/JSON/text), cleans and translates multilingual data, detects bot activity, scores 6 product features per review using Google Gemini AI, and surfaces emerging complaint trends through a premium dark dashboard — complete with real-time streaming analysis and automated action cards.

## ⚡ Key Features

- **Smart Column Detection** — Auto-detects review, product, and date columns
- **Multilingual NLP** — Detects 50+ languages, translates non-English reviews
- **Bot Detection** — TF-IDF cosine similarity + short review filtering  
- **6-Feature AI Scoring** — Battery, Build, Packaging, Delivery, Price, Support
- **Sliding Window Trends** — Detects complaint spikes with severity classification
- **AI Action Cards** — Gemini generates business decisions with 3 recommended actions
- **Live SSE Streaming** — Watch analysis progress in real-time
- **PDF Reports** — 5-page dark-themed professional reports
- **Sarcasm Detection** — Flags ambiguous and sarcastic reviews for human review

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 + FastAPI + Uvicorn |
| AI | Google Gemini 1.5 Flash + Groq Llama 3.1 (fallback) |
| Database | SQLite + SQLAlchemy |
| NLP | langdetect + deep-translator + scikit-learn |
| Frontend | React 18 + Vite + TailwindCSS |
| Charts | Recharts |
| Animation | Framer Motion |
| Auth | JWT (python-jose) + bcrypt (passlib) |

## 🚀 Quick Start

### Option 1: One-Command Start (Recommended)

Use the provided script to start both backend and frontend automatically:

**Linux / macOS:**
```bash
# Make script executable (first time only)
chmod +x start.sh

# Start both services
./start.sh
```

**Windows (Command Prompt):**
```cmd
start.bat
```

**Windows (PowerShell):**
```powershell
# First time only - allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Start both services
.\start.ps1
```

This will:
- Auto-check and setup virtual environment if missing
- Auto-install frontend dependencies if missing
- Start backend on `http://localhost:8000`
- Start frontend on `http://localhost:5173`
- Show colored logs from both services
- Press `Ctrl+C` to stop both services cleanly (Linux/Mac) or close CMD windows (Windows)

---

### Option 2: Manual Setup

If you prefer to run services separately:

#### 1. Backend Setup

**Linux / macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and GROQ_API_KEY

# Generate demo data
python synthetic_data.py

# Run server
python main.py
```

**Windows:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt

# Copy and fill environment variables
copy .env.example .env
# Edit .env with your GEMINI_API_KEY and GROQ_API_KEY

# Generate demo data
python synthetic_data.py

# Run server
python main.py
```

#### 2. Frontend Setup

**Linux / macOS / Windows:**
```bash
cd frontend
npm install
npm run dev
```

### Open the App

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📊 Demo Flow

1. Register a new account
2. Go to **Upload** → drag & drop `backend/reviewiq_demo_data.csv`
3. Watch SSE streaming analysis in real-time
4. Dashboard shows CRITICAL alert: **Packaging complaints jumped from 8% → 42%**
5. AI-generated Action Card with 3 business recommendations
6. Download PDF report

> *"A human catches this in 3 days. ReviewIQ in 47 seconds."*

## 📁 Project Structure

```
reviewiq/
├── start.sh                 # Linux/macOS start script (recommended)
├── start.bat                # Windows CMD start script
├── start.ps1                # Windows PowerShell start script
├── package.json             # Root npm config with concurrent scripts
├── backend/
│   ├── main.py              # FastAPI routes + SSE streaming
│   ├── models.py            # SQLAlchemy ORM models
│   ├── database.py          # SQLite connection
│   ├── auth.py              # JWT authentication
│   ├── ai_engine.py         # Gemini + Groq AI analysis
│   ├── preprocessor.py      # NLP preprocessing pipeline
│   ├── trend_engine.py      # Sliding window trend detection
│   ├── action_cards.py      # AI action card generation
│   ├── column_detector.py   # Smart column auto-detection
│   ├── pdf_generator.py     # ReportLab PDF generation
│   └── synthetic_data.py    # Demo data generator
└── frontend/
    └── src/
        ├── context/         # Auth, Product, Toast providers
        ├── hooks/           # useCountUp, useAuth
        ├── components/      # 13 reusable UI components
        └── pages/           # 7 page components
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| POST | `/api/upload/csv-stream` | SSE streaming CSV analysis |
| POST | `/api/upload/json-stream` | SSE streaming JSON analysis |
| POST | `/api/upload/text-stream` | SSE streaming text analysis |
| GET | `/api/dashboard/{product}` | Full dashboard data |
| GET | `/api/reviews/{product}` | Paginated reviews |
| GET | `/api/trends/{product}` | Trend time series |
| GET | `/api/alerts/{product}` | Alert list |
| GET | `/api/report/{product}` | PDF download |
| GET | `/api/action-cards/{product}` | AI action cards |

## 👥 Team

Built with ❤️ for Hack Malenadu '26

---

*Powered by Google Gemini AI*
