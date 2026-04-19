"""
Source Tracer — Triple Source (No Extra Keys Needed)
=====================================================
Matches flagged paragraphs against academic sources via 3 providers:
  1. arXiv API       — Free, no key
  2. Semantic Scholar — Free tier (better with S2_API_KEY)
  3. OpenAlex        — Free, no key, 250M+ works

Input:  Flagged paragraph text
Output: Top 3 matching papers with similarity scores

Owner: Backend Dev 1
Dependencies: sentence-transformers, requests
"""

import os
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

    # Fetch from ALL 3 free sources in parallel-ish
    arxiv_results = _search_arxiv(keywords, max_results=10)
    s2_results = _search_semantic_scholar(keywords, max_results=10)
    openalex_results = _search_openalex(keywords, max_results=10)
    
    # Combine results from all providers
    all_results = arxiv_results + s2_results + openalex_results
    if not all_results:
        return []

    model = _get_model()
    para_emb = model.encode(paragraph, convert_to_tensor=True)
    abstracts = [r["abstract"] for r in all_results]
    abs_embs = model.encode(abstracts, convert_to_tensor=True)
    scores = util.cos_sim(para_emb, abs_embs)[0]

    # Use a dictionary to loosely deduplicate by title
    unique_matches = {}
    ranked = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)
    
    results = []
    for idx, score in ranked:
        if len(results) >= top_k:
            break
            
        paper = all_results[idx]
        title_lower = paper["title"].lower()
        
        if title_lower not in unique_matches:
            unique_matches[title_lower] = True
            results.append({
                "matched_paper": paper["title"],
                "arxiv_link": paper.get("arxiv_link"),
                "semantic_scholar_link": paper.get("semantic_scholar_link"),
                "similarity": round(score, 4),
            })
            
    return results


def _search_semantic_scholar(query: str, max_results: int = 10) -> list:
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": max_results,
        "fields": "title,abstract,url"
    }
    headers = {}
    api_key = os.getenv("S2_API_KEY")
    if api_key:
        headers["x-api-key"] = api_key

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        results = []
        for item in data.get("data", []):
            abstract = item.get("abstract")
            if abstract:  # Skip papers without abstracts since we need them for embedding
                results.append({
                    "title": item.get("title", "Unknown Title"),
                    "abstract": abstract,
                    "arxiv_link": None,
                    "semantic_scholar_link": item.get("url"),
                })
        return results
    except Exception as e:
        print(f"Semantic Scholar API error: {e}")
        return []


def _extract_query_keywords(text: str, n: int = 7) -> str:
    words = re.findall(r'[a-zA-Z]{5,}', text.lower())
    stopwords = {"which","would","about","their","these","could","where","there","other"}
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
                "arxiv_link": link.group(1).strip() if link else "",
                "semantic_scholar_link": None,
            })
    return results


def _search_openalex(query: str, max_results: int = 10) -> list:
    """Search OpenAlex — FREE, no API key needed, 250M+ works."""
    url = "https://api.openalex.org/works"
    params = {
        "search": query,
        "per_page": max_results,
        "select": "title,doi,id",
        "mailto": "forensiq@example.com",  # Polite pool — faster responses
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("results", []):
            title = item.get("display_name") or item.get("title")
            if not title:
                continue

            # OpenAlex doesn't return abstracts in search, so use title as proxy
            # The embedding similarity will still work for matching
            openalex_url = item.get("id", "")  # e.g., https://openalex.org/W123
            doi = item.get("doi", "")

            results.append({
                "title": title,
                "abstract": title,  # Use title for embedding (OpenAlex search doesn't return abstracts)
                "arxiv_link": doi if doi else None,
                "semantic_scholar_link": openalex_url if openalex_url else None,
            })
        print(f"[OpenAlex] Found {len(results)} results for '{query}'")
        return results
    except Exception as e:
        print(f"[OpenAlex] API error: {e}")
        return []
