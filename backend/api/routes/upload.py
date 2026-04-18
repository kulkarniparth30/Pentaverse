"""
Upload Route
============
Handles PDF file uploads and returns a unique file_id for tracking.

Endpoint:
    POST /upload

Request:
    - file: UploadFile (multipart/form-data) — PDF only, max 50MB

Response:
    {
        "file_id": "abc123-...",
        "filename": "paper.pdf",
        "size_bytes": 1024000,
        "status": "uploaded"
    }
"""

import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import UploadResponse

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024  # Convert to bytes


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file for forensic analysis.

    Validates:
        - File is a PDF (by content type)
        - File size is within limits

    Returns:
        UploadResponse with unique file_id for subsequent analysis.
    """
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted."
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB."
        )

    # Generate unique file ID
    file_id = str(uuid.uuid4())

    # Save file to uploads directory
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(content)

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        size_bytes=len(content),
        status="uploaded"
    )
