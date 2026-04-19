from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()

@router.get("/history")
async def get_history() -> List[Dict[str, Any]]:
    """
    Fetch all past forensic analyses from Supabase.
    Filters out 'deleted' status and ensures only 1 unique entry per file_id.
    """
    from core.db import get_db
    supabase = get_db()

    if not supabase:
        from api.routes.analyze import reports_store
        history = []
        for file_id, report in reports_store.items():
            history.append({
                "file_id": file_id,
                "filename": report.get("filename", "Unknown File"),
                "status": "completed",
                "created_at": None
            })
        return history

    try:
        response = supabase.table("analysis_history").select("file_id, filename, status, created_at").neq("status", "deleted").order("created_at", desc=True).execute()
        
        # Filter duplicates in-memory to ensure exactly 1 unique file_id
        unique_history = []
        seen_ids = set()
        for row in response.data:
            if row["file_id"] not in seen_ids:
                unique_history.append(row)
                seen_ids.add(row["file_id"])
                
        return unique_history
    except Exception as e:
        print(f"[History] Error fetching from Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@router.delete("/history/{file_id}")
async def delete_history(file_id: str):
    """Soft-delete a history record by file_id due to RLS."""
    from core.db import get_db
    supabase = get_db()
    if not supabase:
        from api.routes.analyze import reports_store
        if file_id in reports_store:
            del reports_store[file_id]
        return {"status": "deleted"}
    try:
        supabase.table("analysis_history").update({"status": "deleted"}).eq("file_id", file_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        print(f"[History] Error deleting from Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete history")
