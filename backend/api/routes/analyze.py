"""
Analyze Route
=============
Triggers the full forensic analysis pipeline on an uploaded PDF.

Endpoint:
    POST /analyze/{file_id}

Pipeline Steps:
    1. Parse PDF → extract text + citations
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
from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse

from core.pdf_parser import parse_pdf
from core.segmenter import segment_text
from core.stylometry import extract_style_features
from core.clustering import cluster_paragraphs
from core.citation_forensics import analyze_citations
from core.source_tracer import trace_sources
from core.report_builder import build_report

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# In-memory report storage (replace with DB in production)
reports_store: dict = {}


@router.post("/analyze/{file_id}", response_model=AnalysisResponse)
async def analyze_paper(file_id: str):
    """
    Run the full ForensIQ analysis pipeline on an uploaded PDF.

    Args:
        file_id: UUID returned from /upload endpoint.

    Returns:
        AnalysisResponse with complete forensic report.
    """
    # Verify file exists
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File with id '{file_id}' not found. Upload first via POST /upload."
        )

    try:
        # Step 1: Parse PDF
        parsed = parse_pdf(file_path)

        # Step 2: Segment into paragraphs
        paragraphs = segment_text(parsed["text"])

        # Step 3: Extract stylometric features for each paragraph
        style_vectors = [extract_style_features(p) for p in paragraphs]

        # Step 4: Cluster paragraphs by writing style
        cluster_result = cluster_paragraphs(style_vectors)

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
            cluster_result=cluster_result,
            citation_anomalies=citation_anomalies,
            source_matches=source_matches,
        )

        # Store report for later retrieval
        reports_store[file_id] = report

        return AnalysisResponse(
            file_id=file_id,
            status="completed",
            report=report,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis pipeline failed: {str(e)}"
        )
