<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

<h1 align="center">🧠 Review-IQ</h1>
<p align="center"><b>AI-Powered Customer Review Intelligence Platform</b></p>
<p align="center">
  Transform raw customer reviews into actionable business insights in seconds.<br/>
  Built for <b>Hack Malenadu '26</b>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Smart Column Detection** | Auto-maps review text, product name & date columns from any CSV/JSON |
| 🌍 **Multilingual NLP** | Detects 50+ languages and translates non-English reviews to English |
| 🤖 **Bot & Sarcasm Detection** | TF-IDF cosine similarity + short-review filtering flags suspicious reviews |
| 🎯 **6-Feature AI Scoring** | Battery · Build · Packaging · Delivery · Price · Support |
| 📈 **Trend Detection** | Sliding-window algorithm identifies complaint spikes with severity tiers |
| 💡 **AI Strategy Cards** | Gemini generates prioritized business action recommendations |
| ⚡ **Real-time SSE Streaming** | Watch the analysis pipeline progress live in-browser |
| 📄 **PDF Reports** | Downloadable 5-page dark-themed professional reports |
| 🔌 **Retailer API Connect** | Connect external retailer review APIs and fetch reviews in real-time |

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 · Vite · TailwindCSS · Recharts · Framer Motion · Lucide |
| **Backend** | Python 3.11+ · FastAPI · Uvicorn · SQLAlchemy · SQLite |
| **AI / LLM** | Google Gemini 1.5 Flash · Groq Llama 3.1 (fallback) |
| **NLP** | langdetect · deep-translator · scikit-learn |
| **Auth** | JWT (`python-jose`) · bcrypt (`passlib`) |
| **Reports** | ReportLab |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### One-Command Start (Recommended)

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Launch both backend & frontend
./start.sh
```

<details>
<summary><b>Windows users</b></summary>

**Command Prompt:**
```cmd
start.bat
```

**PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start.ps1
```
</details>

The script will:
- Create a Python virtual environment if missing
- Install frontend dependencies if missing
- Start the backend on **http://localhost:8000**
- Start the frontend on **http://localhost:5173**
- `Ctrl+C` stops both services cleanly

---

### Manual Setup

<details>
<summary><b>Step-by-step instructions</b></summary>

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env → add your GEMINI_API_KEY and GROQ_API_KEY

python main.py                  # Starts on http://localhost:8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev                     # Starts on http://localhost:5173
```
</details>

---

## ⚙️ Environment Variables

Create `backend/.env` from the provided example:

```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> **Note:** In ULTRA mode (default), no API keys are needed — analysis runs entirely offline using heuristic scoring.

---

## 🔥 Processing Modes

| Mode | Speed | Accuracy | API Calls | Best For |
|------|:-----:|:--------:|:---------:|----------|
| **ULTRA** (default) | ⚡ 1000× | ~85–90% | None | Bulk processing, demos, offline use |
| **TURBO** | 🚀 100× | ~90–95% | Some | Hybrid when selective AI is needed |
| **STANDARD** | 🐢 1× | ~95–98% | All | Maximum accuracy |

Switch modes in `backend/.env`:

```env
# ULTRA (default) — fastest, no external API calls
ULTRA_MODE=true

# TURBO — hybrid
ULTRA_MODE=false
TURBO_MODE=true

# STANDARD — full AI pipeline
ULTRA_MODE=false
TURBO_MODE=false
```

---

## 📊 Demo Flow

1. Register & log in
2. Navigate to **Upload** → drag & drop `reviewiq_rich_demo.csv`
3. Watch the SSE streaming analysis in real-time
4. Dashboard surfaces alerts (e.g. *"Packaging complaints 8% → 42%"*)
5. Open **Strategy** → view AI-generated action cards
6. Download a PDF report from the dashboard

> *"A human catches this in 3 days. Review-IQ does it in 47 seconds."*

---

## 📁 Project Structure

```
review-IQ/
├── start.sh / start.bat / start.ps1    # One-command launchers
├── package.json                        # Root npm config
│
├── backend/
│   ├── main.py                # FastAPI app — routes, SSE pipeline
│   ├── models.py              # SQLAlchemy ORM models
│   ├── database.py            # SQLite engine & session
│   ├── auth.py                # JWT authentication helpers
│   │
│   ├── ai_engine.py           # Gemini + Groq scoring (standard)
│   ├── ai_engine_turbo.py     # Hybrid AI scoring (turbo)
│   ├── ai_engine_ultra.py     # Regex heuristic scoring (ultra)
│   │
│   ├── preprocessor.py        # NLP preprocessing (standard)
│   ├── preprocessor_turbo.py  # Fast preprocessing (turbo)
│   ├── preprocessor_ultra.py  # Instant preprocessing (ultra)
│   │
│   ├── trend_engine.py        # Sliding-window trends (standard)
│   ├── trend_engine_turbo.py  # SQL-based trends (turbo/ultra)
│   │
│   ├── action_cards.py        # AI action card generation
│   ├── column_detector.py     # Smart CSV column auto-detection
│   ├── pdf_generator.py       # ReportLab PDF report builder
│   ├── synthetic_data.py      # Demo data generator
│   │
│   ├── reviews_api.php        # PHP retailer review endpoint
│   ├── .env.example           # Environment variable template
│   └── requirements.txt       # Python dependencies
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx            # Router & protected routes
        ├── main.jsx           # React entry point
        ├── index.css          # Global styles & design tokens
        │
        ├── context/
        │   ├── AuthContext.jsx      # Authentication state
        │   ├── ProductContext.jsx    # Product selection state
        │   ├── RoleContext.jsx       # Role-based access
        │   └── ToastContext.jsx      # Notification system
        │
        ├── pages/
        │   ├── Dashboard.jsx        # Main intelligence dashboard
        │   ├── Upload.jsx           # File upload & streaming
        │   ├── Trends.jsx           # Temporal trend analysis
        │   ├── Reviews.jsx          # Paginated review browser
        │   ├── Alerts.jsx           # Alert management
        │   ├── Strategy.jsx         # AI action cards center
        │   ├── RetailerConnect.jsx  # External API connections
        │   ├── Login.jsx            # Authentication
        │   └── Register.jsx         # User registration
        │
        └── components/
            ├── Sidebar.jsx          # Navigation sidebar
            ├── TopBar.jsx           # Product selector header
            ├── StatCard.jsx         # Metric display cards
            ├── FeatureCard.jsx      # Feature score cards
            ├── TrendChart.jsx       # Recharts trend graphs
            ├── ActionCard.jsx       # AI recommendation cards
            ├── AlertBanner.jsx      # Critical alert ribbons
            ├── ReviewTable.jsx      # Review data table
            ├── ReviewDrawer.jsx     # Review detail drawer
            ├── UploadPanel.jsx      # Drag & drop uploader
            ├── ColumnMapper.jsx     # Column mapping UI
            ├── LiveSourcesFixed.jsx # Retailer API status
            ├── SkeletonLoader.jsx   # Loading placeholders
            └── Toast.jsx            # Toast notifications
```

---

## 🔑 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login → JWT token |
| `GET` | `/api/auth/me` | Current user info |

### Upload & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/detect-columns` | Auto-detect CSV/JSON columns |
| `POST` | `/api/upload/csv-stream` | Upload CSV → SSE analysis stream |
| `POST` | `/api/upload/json-stream` | Upload JSON → SSE analysis stream |
| `POST` | `/api/upload/text-stream` | Paste text → SSE analysis stream |

### Data & Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List user's products |
| `GET` | `/api/dashboard/{product}` | Full dashboard payload |
| `GET` | `/api/reviews/{product}` | Paginated & filterable reviews |
| `GET` | `/api/trends/{product}` | Time-series trend data |
| `GET` | `/api/alerts/{product}` | Active alert list |
| `POST` | `/api/alerts/{id}/resolve` | Resolve an alert |
| `GET` | `/api/action-cards/{product}` | AI strategy cards |
| `POST` | `/api/action-cards/{id}/dismiss` | Dismiss a card |
| `GET` | `/api/report/{product}` | Download PDF report |

### Retailer API Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/retailer/connect` | Register external API |
| `GET` | `/api/retailer/list` | List connected APIs |
| `DELETE` | `/api/retailer/{id}` | Remove an API connection |
| `GET` | `/api/retailer/{id}/fetch` | SSE stream: fetch reviews from API |
| `GET` | `/api/retailer/{id}/status` | Connection health check |

---

## 👥 Team

Built with ❤️ for **Hack Malenadu '26**

---

<p align="center"><sub>Powered by Google Gemini AI</sub></p>
