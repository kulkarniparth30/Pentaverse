"""
ForensIQ Backend — FastAPI Entry Point
=======================================
Serves the ForensIQ analysis pipeline via REST API.

Endpoints:
    POST /upload          → Upload PDF
    POST /analyze/{id}    → Run full forensic analysis
    GET  /report/{id}     → Fetch completed report
    GET  /health          → Health check
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import upload, analyze, report

# Load environment variables
load_dotenv()

app = FastAPI(
    title="ForensIQ API",
    description="Academic Integrity Analyzer — detects multi-author stitching, citation anomalies, and source matches.",
    version="1.0.0",
)

# CORS configuration — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(upload.router, tags=["Upload"])
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(report.router, tags=["Report"])

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "forensiq-api"}
