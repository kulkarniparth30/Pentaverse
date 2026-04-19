# ForensIQ – Academic Integrity & AI Detection Analyzer

> A hybrid forensic tool that detects AI-generated content, multi-author stitching, citation anomalies, and potential plagiarism in academic papers.

![ForensIQ Banner](https://img.shields.io/badge/ForensIQ-Academic%20Integrity-blueviolet?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

---

## 🧠 What It Does

ForensIQ analyzes academic PDF papers and detects:

1. **AI Generation Detection** — Analyzes text using Gemini to detect AI-generated content, giving confidence scores on human vs. AI origin.
2. **Multi-Author Stitching** — Identifies if a paper was written by multiple authors with different writing styles via stylometric clustering (KMeans).
3. **Citation Anomalies** — Detects temporal mismatches, topic inconsistencies, and suspicious self-citation patterns in references.
4. **Source Tracing** — Matches flagged paragraphs against arXiv and Semantic Scholar papers using sentence embeddings.
5. **Smart Summarization** — Uses Groq/Grok to generate high-level document summaries and key takeaways.
6. **Forensic Tracking** — Saves all previous analyses and their reports to Supabase so you can review history at any time.

---

## 🏗️ Architecture

```text
┌─────────────┐     POST /upload      ┌──────────────────┐
│   React UI  │ ──────────────────────►│   FastAPI Server  │
│  (Frontend) │     GET /report/{id}   │    (Backend)      │
│             │ ◄──────────────────────│                   │
└──────┬──────┘                        └────────┬─────────┘
       │                                        │
       │(Auth & History)                        │(Analysis Pipeline)
       ▼                                        ▼
┌─────────────┐                        ┌──────────────────┐
│  Supabase   │◄───────────────────────┤ Gemini / Groq    │
│ (PostgreSQL)│      (Saves data)      │ (LLM APIs)       │
└─────────────┘                        └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Environment Variables

Create a `.env` file in the `backend` and `frontend` directories with the following keys:

**Backend (`backend/.env`)**:
```env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env` - if applicable)**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:8000`.

---

## 📁 Project Structure

```text
forensiq/
├── backend/
│   ├── main.py                   # FastAPI entry point
│   ├── api/
│   │   └── routes/               # Endpoints (upload, analyze, report, history)
│   ├── core/
│   │   ├── ai_detector.py        # Gemini AI detection integration
│   │   ├── summary_generator.py  # Groq summary integration
│   │   ├── db.py                 # Supabase client wrapper
│   │   ├── pdf_parser.py         # PyMuPDF text extraction
│   │   ├── stylometry.py         # Style feature extraction
│   │   ├── clustering.py         # KMeans on style vectors
│   │   └── report_builder.py     # Final forensic report assembly
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components (Charts, Auth, Tabs)
│   │   ├── pages/                # HomePage, Login, Signup, Analysis, History
│   │   ├── services/             # API & Supabase clients
│   │   └── App.jsx               # Routes
├── samples/                      # Sample PDF papers for testing
└── README.md
```

---

## 🔌 API Contract

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | `/upload`          | Upload PDF, returns `file_id`  |
| POST   | `/upload-text`     | Upload raw text                |
| POST   | `/analyze/{id}`    | Run full hybrid pipeline       |
| GET    | `/report/{id}`     | Fetch forensic report JSON     |
| GET    | `/history`         | Get user analysis history      |
| DELETE | `/history/{id}`    | Soft delete analysis history   |
| GET    | `/health`          | Health check                   |

---

## 🧪 Demo Flow

1. Sign up / Log in to ForensIQ.
2. Upload a sample stitched PDF or paste text.
3. View the multi-tabbed forensic report containing:
   - **AI Detection:** Donut charts and sentence-level AI scoring.
   - **Stylometry:** Scatter plots of authorship clusters.
   - **Source Tracing:** Highlights matched sources from Semantic Scholar.
   - **Summary:** Quick LLM-generated summaries of the document.
4. Navigate to the History page to view or delete past reports.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
