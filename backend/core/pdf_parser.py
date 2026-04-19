"""
Document Parser
===============
Extracts text and citations from academic documents.
Supports: PDF (PyMuPDF), DOCX (python-docx), TXT (plain text).

Input:  Path to a document file
Output: {
    "text": str,          # Full document text (body only)
    "citations": [str],   # List of citation strings from References section
    "page_count": int
}

Owner: Backend Dev 1
Dependencies: PyMuPDF (fitz), python-docx
"""

import os
import re
import fitz  # PyMuPDF

try:
    from docx import Document as DocxDocument  # python-docx
except ImportError:
    DocxDocument = None  # type: ignore


def parse_document(file_path: str) -> dict:
    """
    Parse any supported document format and extract body text + citations.

    Auto-detects format by file extension. Delegates to appropriate parser.

    Args:
        file_path: Absolute path to the document file.

    Returns:
        Dictionary with keys: text, citations, page_count
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _parse_docx(file_path)
    elif ext == ".txt":
        return _parse_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


# ── PDF Parser ───────────────────────────────────────────────────────────────

def _parse_pdf(file_path: str) -> dict:
    """Parse PDF using PyMuPDF."""
    doc = fitz.open(file_path)

    full_text = ""
    for page in doc:
        blocks = page.get_text("blocks")
        for b in blocks:
            if b[6] == 0:  # text block (not image)
                block_text = b[4]
                clean_block = re.sub(r'\s+', ' ', block_text).strip()
                if len(clean_block) > 3:
                    full_text += clean_block + "\n\n"

    page_count = len(doc)
    doc.close()

    body_text, citations = _split_references(full_text)

    return {
        "text": body_text.strip(),
        "citations": citations,
        "page_count": page_count,
    }


# ── DOCX Parser ──────────────────────────────────────────────────────────────

def _parse_docx(file_path: str) -> dict:
    """Parse DOCX/DOC using python-docx."""
    if DocxDocument is None:
        raise ImportError(
            "python-docx is required for DOCX support. "
            "Install it: pip install python-docx"
        )

    doc = DocxDocument(file_path)

    full_text = ""
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            full_text += text + "\n\n"

    # Estimate page count (rough: ~3000 chars per page)
    char_count = len(full_text)
    page_count = max(1, char_count // 3000)

    body_text, citations = _split_references(full_text)

    return {
        "text": body_text.strip(),
        "citations": citations,
        "page_count": page_count,
    }


# ── TXT Parser ───────────────────────────────────────────────────────────────

def _parse_txt(file_path: str) -> dict:
    """Parse plain text file."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

    full_text = None
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                full_text = f.read()
            break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if full_text is None:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            full_text = f.read()

    # Estimate page count
    char_count = len(full_text)
    page_count = max(1, char_count // 3000)

    body_text, citations = _split_references(full_text)

    return {
        "text": body_text.strip(),
        "citations": citations,
        "page_count": page_count,
    }


# ── Shared: Reference Splitting ──────────────────────────────────────────────

def _split_references(text: str) -> tuple:
    """
    Separate the main body text from the References/Bibliography section.

    Heuristic: Look for common reference section headers and split there.

    Returns:
        (body_text, list_of_citation_strings)
    """
    ref_patterns = [
        r'(?im)^[ \t]*(?:[0-9]+\.?\s*)?(references|bibliography|works cited)[ \t]*$',
    ]

    split_pos = len(text)
    for pattern in ref_patterns:
        match = re.search(pattern, text)
        if match:
            split_pos = min(split_pos, match.start())

    body_text = text[:split_pos]
    ref_text = text[split_pos:]

    citations = _extract_citations(ref_text)

    return body_text, citations


def _extract_citations(ref_text: str) -> list:
    """
    Extract individual citation entries from the references section.

    Heuristic: Split by numbered references [1], [2] etc.
    or by line breaks followed by author-year patterns.

    Returns:
        List of citation strings.
    """
    if not ref_text.strip():
        return []

    # Try numbered references first: [1], [2], etc.
    numbered = re.split(r'\[\d+\]\s*', ref_text)
    numbered = [c.strip() for c in numbered if c.strip() and len(c.strip()) > 10]

    if numbered:
        return numbered

    # Fallback: split by blank lines or newlines with author-like patterns
    lines = ref_text.strip().split('\n')
    citations = []
    current = ""

    for line in lines:
        line = line.strip()
        if not line:
            if current:
                citations.append(current)
                current = ""
        else:
            current += " " + line if current else line

    if current:
        citations.append(current)

    # Filter out very short entries (likely noise)
    citations = [c for c in citations if len(c) > 20]

    return citations


# ── Legacy alias for backward compatibility ──────────────────────────────────
parse_pdf = parse_document
