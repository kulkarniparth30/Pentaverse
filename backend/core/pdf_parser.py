"""
PDF Parser
==========
Extracts text and citations from academic PDF files using PyMuPDF.

Input:  Path to a PDF file
Output: {
    "text": str,          # Full document text (body only)
    "citations": [str],   # List of citation strings from References section
    "page_count": int
}

Owner: Backend Dev 1
Dependencies: PyMuPDF (fitz)
"""

import re
import fitz  # PyMuPDF


def parse_pdf(file_path: str) -> dict:
    """
    Parse a PDF file and extract body text + citations.

    Args:
        file_path: Absolute path to the PDF file.

    Returns:
        Dictionary with keys: text, citations, page_count
    """
    doc = fitz.open(file_path)

    full_text = ""
    for page in doc:
        full_text += page.get_text("text") + "\n"

    doc.close()

    # Split body text from references section
    body_text, citations = _split_references(full_text)

    return {
        "text": body_text.strip(),
        "citations": citations,
        "page_count": len(doc),
    }


def _split_references(text: str) -> tuple:
    """
    Separate the main body text from the References/Bibliography section.

    Heuristic: Look for common reference section headers and split there.

    Returns:
        (body_text, list_of_citation_strings)
    """
    # Common patterns for reference section headers
    ref_patterns = [
        r'\n\s*References\s*\n',
        r'\n\s*REFERENCES\s*\n',
        r'\n\s*Bibliography\s*\n',
        r'\n\s*BIBLIOGRAPHY\s*\n',
        r'\n\s*Works Cited\s*\n',
    ]

    split_pos = len(text)
    for pattern in ref_patterns:
        match = re.search(pattern, text)
        if match:
            split_pos = min(split_pos, match.start())

    body_text = text[:split_pos]
    ref_text = text[split_pos:]

    # Parse individual citations from reference section
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
