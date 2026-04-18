"""
Text Segmenter
==============
Splits extracted text into paragraph-level chunks for stylometric analysis.

Input:  Full body text (string)
Output: List of paragraph strings (min 50 words each)

Owner: Backend Dev 1
Dependencies: None (pure Python)
"""

import re


def segment_text(text: str, min_words: int = 50) -> list:
    """
    Split document text into meaningful paragraph chunks.

    Strategy:
        1. Split by double newlines (standard paragraph breaks)
        2. Merge short paragraphs with their neighbors
        3. Filter out paragraphs below minimum word threshold

    Args:
        text: Full body text extracted from PDF.
        min_words: Minimum number of words for a valid paragraph.

    Returns:
        List of paragraph strings, each with >= min_words words.
    """
    # Normalize whitespace
    text = re.sub(r'\r\n', '\n', text)

    # Split on double newlines (paragraph boundaries)
    raw_paragraphs = re.split(r'\n\s*\n', text)

    # Clean each paragraph
    cleaned = []
    for p in raw_paragraphs:
        p = re.sub(r'\s+', ' ', p).strip()
        if p:
            cleaned.append(p)

    # Merge short paragraphs with their neighbors
    merged = _merge_short_paragraphs(cleaned, min_words)

    # Final filter: only keep paragraphs meeting minimum length
    result = [p for p in merged if len(p.split()) >= min_words]

    return result


def _merge_short_paragraphs(paragraphs: list, min_words: int) -> list:
    """
    Merge paragraphs that are too short with adjacent paragraphs.

    This prevents headings, short transitions, and fragmented text
    from becoming standalone analysis units.
    """
    if not paragraphs:
        return []

    merged = [paragraphs[0]]

    for p in paragraphs[1:]:
        if len(merged[-1].split()) < min_words:
            # Previous paragraph is too short — merge
            merged[-1] = merged[-1] + " " + p
        else:
            merged.append(p)

    return merged
