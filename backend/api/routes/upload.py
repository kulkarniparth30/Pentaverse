"""
Upload Route
============
Handles document file uploads (PDF, DOCX, TXT) and returns a unique file_id.

Endpoint:
    POST /upload

Request:
    - file: UploadFile (multipart/form-data) — PDF, DOCX, or TXT, max 50MB

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
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import UploadResponse

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024

# Supported file types
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "text/plain": ".txt",
}

# Fallback: detect by extension when MIME type is generic
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document file for forensic analysis.

    Supported formats: PDF, DOCX, DOC, TXT

    Validates:
        - File is an accepted format (by content type or extension)
        - File size is within limits

    Returns:
        UploadResponse with unique file_id for subsequent analysis.
    """
    # Determine file extension
    original_name = file.filename or "unknown"
    _, ext = os.path.splitext(original_name.lower())

    # Validate file type by MIME type or extension fallback
    if file.content_type in ALLOWED_TYPES:
        ext = ALLOWED_TYPES[file.content_type]
    elif ext in ALLOWED_EXTENSIONS:
        pass  # Extension is valid even if MIME is generic
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}' ({ext}). "
                   f"Accepted: PDF, DOCX, TXT."
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

    # Save file with proper extension
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    with open(file_path, "wb") as f:
        f.write(content)

    # Save original filename for history
    with open(f"{file_path}.name", "w", encoding="utf-8") as f:
        f.write(file.filename or "unknown")

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        size_bytes=len(content),
        status="uploaded"
    )


@router.post("/upload-text", response_model=UploadResponse)
async def upload_text(payload: dict):
    """
    Upload raw text for forensic analysis (pasted text).

    Request body:
        { "text": "..." }

    Returns:
        UploadResponse with unique file_id for subsequent analysis.
    """
    text = payload.get("text", "").strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text content is empty. Please paste some text."
        )

    if len(text) < 100:
        raise HTTPException(
            status_code=400,
            detail="Text is too short for meaningful analysis. Please provide at least 100 characters."
        )

    content = text.encode("utf-8")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Text exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB."
        )

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.txt")
    with open(file_path, "wb") as f:
        f.write(content)

    with open(f"{file_path}.name", "w", encoding="utf-8") as f:
        f.write("pasted-text.txt")

    return UploadResponse(
        file_id=file_id,
        filename="pasted-text.txt",
        size_bytes=len(content),
        status="uploaded"
    )
