"""
Citation Forensics
==================
Analyzes citation patterns for anomalies indicating academic fraud.

Input:  List of citation strings
Output: {
    "temporal_anomaly": bool,
    "topic_mismatch": bool,
    "self_citation_anomaly": bool,
    "score": float (0-1),
    "details": str
}

Checks:
    1. Year distribution — are citations from wildly different eras?
    2. Topic clustering — do citations shift topic mid-paper?
    3. Self-citation patterns — suspicious self-citation density?

Owner: Backend Dev 1
Dependencies: spaCy, re
"""

import re
import random
import requests
from collections import Counter
from typing import List
import spacy

nlp = spacy.load("en_core_web_sm")


def analyze_citations(citations: List[str]) -> dict:
    """
    Run forensic analysis on a paper's citation list.

    Args:
        citations: List of raw citation strings extracted from References.

    Returns:
        Dictionary with anomaly flags and overall score.
    """
    if not citations or len(citations) < 3:
        return {
            "temporal_anomaly": False,
            "topic_mismatch": False,
            "self_citation_anomaly": False,
            "hallucinated_citations": [],
            "score": 0.0,
            "details": "Insufficient citations for analysis.",
        }

    # Extract years from citations
    years = _extract_years(citations)

    # Check 1: Temporal anomaly
    temporal_anomaly, temporal_detail = _check_temporal_anomaly(years)

    # Check 2: Topic mismatch
    topic_mismatch, topic_detail = _check_topic_mismatch(citations)

    # Check 3: Self-citation anomaly
    self_citation_anomaly, self_detail = _check_self_citations(citations)

    # Check 4: Hallucinated citations via Crossref (verify a random sample of max 3)
    sample_size = min(3, len(citations))
    sampled_citations = random.sample(citations, sample_size)
    hallucinated_citations = _verify_citations_crossref(sampled_citations)

    # Compute overall anomaly score (0–1)
    score = _compute_score(temporal_anomaly, topic_mismatch, self_citation_anomaly, len(hallucinated_citations) > 0)

    details_list = filter(None, [
        temporal_detail, 
        topic_detail, 
        self_detail, 
        f"Found {len(hallucinated_citations)} hallucinated citations" if hallucinated_citations else ""
    ])
    details = " | ".join(details_list)

    return {
        "temporal_anomaly": temporal_anomaly,
        "topic_mismatch": topic_mismatch,
        "self_citation_anomaly": self_citation_anomaly,
        "hallucinated_citations": hallucinated_citations,
        "score": round(score, 2),
        "details": details or "No anomalies detected.",
    }

def _verify_citations_crossref(citations: List[str]) -> List[str]:
    """
    Check if citations exist using the free Crossref API.
    Returns a list of citations that could not be verified (likely hallucinated).
    """
    hallucinated = []
    headers = {"User-Agent": "ForensIQ/1.0 (mailto:admin@forensiq.local)"}
    
    for citation in citations:
        # Strip numbers/brackets from start of citation to improve search relevance
        clean_citation = re.sub(r'^\[\d+\]\s*|^\d+\.\s*', '', citation).strip()
        if not clean_citation:
            continue
            
        try:
            url = f"https://api.crossref.org/works?query.bibliographic={requests.utils.quote(clean_citation)}&rows=1"
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("message", {}).get("items", [])
                
                # If no items returned, it's highly suspicious
                if not items:
                    hallucinated.append(citation)
                    continue
                    
                # Crossref returns a relevance score. If the top match score is very low,
                # it means the citation is likely made up and crossref just found a weak partial match.
                top_match = items[0]
                if top_match.get("score", 0) < 20.0:
                    hallucinated.append(citation)
            else:
                # If API fails, we can't definitively call it a hallucination. Skip.
                pass
        except Exception:
            # On network error/timeout, fail gracefully
            pass
            
    return hallucinated


def _extract_years(citations: List[str]) -> List[int]:
    """Extract publication years from citation strings."""
    years = []
    for citation in citations:
        # Match 4-digit years between 1900-2099
        matches = re.findall(r'\b(19|20)\d{2}\b', citation)
        for m in matches:
            year = int(m) if len(m) == 4 else int(re.search(r'(19|20)\d{2}', citation).group())
            years.append(year)

    # Re-extract properly
    years = []
    for citation in citations:
        found = re.findall(r'\b((?:19|20)\d{2})\b', citation)
        years.extend([int(y) for y in found])

    return years


def _check_temporal_anomaly(years: List[int]) -> tuple:
    """
    Check if citation years are unusually spread or clustered.

    Flag if: year range > 30 years AND distribution is bimodal
    (suggests merging work from different decades).
    """
    if len(years) < 3:
        return False, ""

    year_range = max(years) - min(years)
    avg_year = sum(years) / len(years)

    # Check for bimodal distribution: significant gap in the middle
    sorted_years = sorted(years)
    max_gap = 0
    for i in range(1, len(sorted_years)):
        gap = sorted_years[i] - sorted_years[i-1]
        max_gap = max(max_gap, gap)

    if year_range > 30 and max_gap > 15:
        return True, f"Temporal gap: {year_range}yr range with {max_gap}yr gap"

    return False, ""


def _check_topic_mismatch(citations: List[str]) -> tuple:
    """
    Check if citations in different halves of the paper cite different topics.

    Split citations into first half vs second half and compare
    dominant keywords.
    """
    if len(citations) < 6:
        return False, ""

    mid = len(citations) // 2
    first_half = " ".join(citations[:mid])
    second_half = " ".join(citations[mid:])

    # Extract key nouns from each half
    first_keywords = _extract_keywords(first_half)
    second_keywords = _extract_keywords(second_half)

    # Compute overlap
    if not first_keywords or not second_keywords:
        return False, ""

    overlap = first_keywords & second_keywords
    total = first_keywords | second_keywords

    overlap_ratio = len(overlap) / len(total) if total else 1.0

    if overlap_ratio < 0.15:  # Less than 15% keyword overlap
        return True, f"Topic mismatch: {overlap_ratio:.0%} keyword overlap between halves"

    return False, ""


def _extract_keywords(text: str) -> set:
    """Extract significant nouns from text as topic keywords."""
    doc = nlp(text[:5000])  # Limit for performance
    keywords = set()

    for token in doc:
        if token.pos_ in ("NOUN", "PROPN") and len(token.text) > 3 and not token.is_stop:
            keywords.add(token.lemma_.lower())

    return keywords


def _check_self_citations(citations: List[str]) -> tuple:
    """
    Check for suspicious self-citation patterns.

    Flag if: any single author name appears in > 40% of citations.
    """
    # Extract first author surnames (rough heuristic)
    author_names = []
    for citation in citations:
        # Grab first word that looks like a surname
        words = citation.split()
        if words:
            name = re.sub(r'[^a-zA-Z]', '', words[0])
            if name and len(name) > 2:
                author_names.append(name.lower())

    if not author_names:
        return False, ""

    counter = Counter(author_names)
    most_common_name, most_common_count = counter.most_common(1)[0]

    ratio = most_common_count / len(citations)
    if ratio > 0.4:
        return True, f"Self-citation: '{most_common_name}' in {ratio:.0%} of citations"

    return False, ""


def _compute_score(temporal: bool, topic: bool, self_cite: bool, has_hallucinations: bool) -> float:
    """Compute weighted anomaly score from 0 to 1."""
    score = 0.0
    if temporal:
        score += 0.35
    if topic:
        score += 0.40
    if self_cite:
        score += 0.25
    if has_hallucinations:
        score += 0.60  # Very high penalty for hallucinated citations
    return min(score, 1.0)
