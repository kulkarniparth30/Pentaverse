"""
Source Tracer
=============
Matches flagged paragraphs against academic sources via arXiv API.

Input:  Flagged paragraph text
Output: Top 3 matching papers with similarity scores

Owner: Backend Dev 1
Dependencies: sentence-transformers, requests
"""

import re
import requests
from sentence_transformers import SentenceTransformer, util

# Load model once
_model = None

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def trace_sources(paragraph: str, top_k: int = 3) -> list:
    keywords = _extract_query_keywords(paragraph)
    if not keywords:
        return []

    arxiv_results = _search_arxiv(keywords, max_results=10)
    if not arxiv_results:
        return []

    model = _get_model()
    para_emb = model.encode(paragraph, convert_to_tensor=True)
    abstracts = [r["abstract"] for r in arxiv_results]
    abs_embs = model.encode(abstracts, convert_to_tensor=True)
    scores = util.cos_sim(para_emb, abs_embs)[0]

    ranked = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)
    results = []
    for idx, score in ranked[:top_k]:
        paper = arxiv_results[idx]
        results.append({
            "matched_paper": paper["title"],
            "arxiv_link": paper["link"],
            "semantic_scholar_link": None,
            "similarity": round(score, 4),
        })
    return results


def _extract_query_keywords(text: str, n: int = 5) -> str:
    words = re.findall(r'[a-zA-Z]{4,}', text.lower())
    stopwords = {"this","that","with","from","have","been","their","which","would","about","into","more","than","also","each","other","were","they","some","these","could","when","what","will","does","only"}
    filtered = [w for w in words if w not in stopwords]
    from collections import Counter
    common = Counter(filtered).most_common(n)
    return " ".join(w for w, _ in common)


def _search_arxiv(query: str, max_results: int = 10) -> list:
    url = "http://export.arxiv.org/api/query"
    params = {"search_query": f"all:{query}", "start": 0, "max_results": max_results}
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        return _parse_arxiv_xml(resp.text)
    except Exception:
        return []


def _parse_arxiv_xml(xml_text: str) -> list:
    results = []
    entries = re.findall(r'<entry>(.*?)</entry>', xml_text, re.DOTALL)
    for entry in entries:
        title = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
        abstract = re.search(r'<summary>(.*?)</summary>', entry, re.DOTALL)
        link = re.search(r'<id>(.*?)</id>', entry)
        if title and abstract:
            results.append({
                "title": re.sub(r'\s+', ' ', title.group(1)).strip(),
                "abstract": re.sub(r'\s+', ' ', abstract.group(1)).strip(),
                "link": link.group(1).strip() if link else "",
            })
    return results
