"""
Report Route
============
Retrieves a completed forensic analysis report.

Endpoint:
    GET /report/{file_id}

Response:
    Full forensic report JSON (see schemas.ForensicReport)
"""

from fastapi import APIRouter, HTTPException
from models.schemas import ForensicReport

router = APIRouter()


@router.get("/report/{file_id}", response_model=ForensicReport)
async def get_report(file_id: str):
    """
    Fetch a completed forensic analysis report.

    Args:
        file_id: UUID of the analyzed paper.

    Returns:
        ForensicReport JSON with all analysis results.
    """
    # Try Supabase first
    from core.db import get_db
    supabase = get_db()
    
    if supabase:
        try:
            response = supabase.table("analysis_history").select("report").eq("file_id", file_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]["report"]
        except Exception as e:
            print(f"[Report] Error fetching from Supabase: {e}")

    # Fallback to in-memory store
    from api.routes.analyze import reports_store
    if file_id in reports_store:
        return reports_store[file_id]

    raise HTTPException(
        status_code=404,
        detail=f"Report for file '{file_id}' not found. Run POST /analyze/{file_id} first."
    )
