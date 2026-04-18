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
    # Import the shared store from analyze route
    from api.routes.analyze import reports_store

    if file_id not in reports_store:
        raise HTTPException(
            status_code=404,
            detail=f"Report for file '{file_id}' not found. Run POST /analyze/{file_id} first."
        )

    return reports_store[file_id]
