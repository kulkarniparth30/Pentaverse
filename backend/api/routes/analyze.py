"""
Analyze Route
=============
Triggers the full forensic analysis pipeline on an uploaded document.

Endpoint:
    POST /analyze/{file_id}

Pipeline Steps:
    1. Parse document → extract text + citations (PDF/DOCX/TXT)
    2. Segment text → paragraph chunks
    3. Stylometry → feature vectors per paragraph
    4. Clustering → KMeans authorship detection
    5. Citation forensics → anomaly detection
    6. Source tracing → match flagged paragraphs to arXiv/S2
    7. Build report → assemble final JSON

Response:
    {
        "file_id": "abc123-...",
        "status": "completed",
        "report": { ... }        # Full forensic report
    }
"""

import os
import glob
from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse

from core.pdf_parser import parse_document
from core.segmenter import segment_text
from core.stylometry import extract_style_features
from core.clustering import cluster_paragraphs
from core.citation_forensics import analyze_citations
from core.source_tracer import trace_sources
from core.ai_detector import batch_detect_ai
from core.report_builder import build_report
from core.summary_generator import generate_summaries

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# In-memory report storage (replace with DB in production)
reports_store: dict = {}


def _find_uploaded_file(file_id: str) -> str:
    """Find the uploaded file regardless of extension."""
    # Try common extensions
    for ext in [".pdf", ".docx", ".doc", ".txt"]:
        path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(path):
            return path

    # Glob fallback
    matches = glob.glob(os.path.join(UPLOAD_DIR, f"{file_id}.*"))
    if matches:
        return matches[0]

    return ""


@router.post("/analyze/{file_id}", response_model=AnalysisResponse)
def analyze_paper(file_id: str):
    """
    Run the full ForensIQ analysis pipeline on an uploaded document.

    Supports: PDF, DOCX, TXT

    Args:
        file_id: UUID returned from /upload endpoint.

    Returns:
        AnalysisResponse with complete forensic report.
    """
    # Verify file exists
    file_path = _find_uploaded_file(file_id)
    if not file_path:
        raise HTTPException(
            status_code=404,
            detail=f"File with id '{file_id}' not found. Upload first via POST /upload."
        )

    ext = os.path.splitext(file_path)[1].lower()
    print(f"\n[Pipeline] Analyzing {ext.upper()} file: {file_id}")

    try:
        # Step 1: Parse document (PDF / DOCX / TXT)
        parsed = parse_document(file_path)

        # Step 2: Segment into paragraphs
        paragraphs = segment_text(parsed["text"])

        if not paragraphs:
            raise HTTPException(
                status_code=422,
                detail="Could not extract enough text from the document. "
                       "Ensure the file contains at least a few paragraphs of text."
            )

        print(f"[Pipeline] Extracted {len(paragraphs)} paragraphs from {parsed.get('page_count', '?')} pages")

        # Step 3: Extract stylometric features for each paragraph
        style_vectors = [extract_style_features(p) for p in paragraphs]

        # Step 3b: AI detection - ONE batch call for ALL paragraphs
        ai_probs = batch_detect_ai(paragraphs)

        # Step 4: Cluster paragraphs by writing style
        cluster_result = cluster_paragraphs(style_vectors, paragraphs)

        # Step 5: Analyze citations for anomalies
        citation_anomalies = analyze_citations(parsed["citations"])

        # Step 6: Trace sources for flagged paragraphs
        flagged_indices = cluster_result.get("flagged_indices", [])
        source_matches = []
        for idx in flagged_indices:
            matches = trace_sources(paragraphs[idx])
            source_matches.extend(
                [{"paragraph_id": idx, **match} for match in matches]
            )

        # Step 7: Build final report
        report = build_report(
            paragraphs=paragraphs,
            style_vectors=style_vectors,
            ai_probs=ai_probs,
            cluster_result=cluster_result,
            citation_anomalies=citation_anomalies,
            source_matches=source_matches,
        )

        # Step 8: Generate LLM summaries (Groq → Gemini → Grok fallback)
        try:
            summaries = generate_summaries(report)
            report.update(summaries)
            print(f"[Pipeline] LLM summaries generated successfully")
        except Exception as e:
            print(f"[Pipeline] Summary generation failed (non-fatal): {e}")

        # Store report in Supabase
        filename = os.path.basename(file_path)
        name_path = f"{file_path}.name"
        if os.path.exists(name_path):
            with open(name_path, "r", encoding="utf-8") as f:
                filename = f.read().strip()
                
        try:
            from core.db import get_db
            supabase = get_db()
            if supabase:
                # Remove any existing record for this file to prevent duplicates
                supabase.table("analysis_history").delete().eq("file_id", file_id).execute()
                
                supabase.table("analysis_history").insert({
                    "file_id": file_id,
                    "filename": filename,
                    "status": "completed",
                    "report": report
                }).execute()
                print(f"[Pipeline] Report saved to Supabase successfully")
            else:
                print(f"[Pipeline] Supabase not configured. Falling back to memory storage.")
                reports_store[file_id] = report
        except Exception as e:
            print(f"[Pipeline] Failed to save to Supabase: {e}")
            reports_store[file_id] = report

        return AnalysisResponse(
            file_id=file_id,
            status="completed",
            report=report,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {str(e)}"
        )
