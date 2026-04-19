"""
Summary Generator — Load-Balanced (Groq + Gemini + Grok)
=========================================================
Uses Groq API (PRIMARY) for summaries — ultra-fast Llama 3.3 70B inference.
Falls back to Gemini, then Grok (xAI) if Groq is unavailable.

Load Distribution Strategy:
  - Gemini API  → AI text detection (ai_detector.py)
  - Groq API    → Summary generation (PRIMARY - this file) + AI cross-validation
  - Grok API    → Summary generation (FALLBACK)
  - RoBERTa     → Local model, zero API cost
  - Heuristics  → Local analysis, zero API cost

Owner: Backend Dev
Dependencies: requests, python-dotenv
"""

import os
import re
import json
import requests as _requests
from dotenv import load_dotenv

load_dotenv()

_GEMINI_KEYS = [k.strip() for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]
_GROK_KEY = os.getenv("GROK_API_KEY", "")
_GROQ_KEY = os.getenv("GROQ_API_KEY", "")

_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
_GROK_API_URL = "https://api.x.ai/v1/chat/completions"
_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _call_groq(prompt: str) -> str | None:
    """Call Groq API (Llama 3.3 70B) — ultra-fast inference."""
    if not _GROQ_KEY:
        return None

    try:
        resp = _requests.post(
            _GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {_GROQ_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 2000
            },
            timeout=30
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[SummaryGen] Groq error: {e}")
        return None


def _call_gemini(prompt: str) -> str | None:
    """Try each Gemini API key until one works."""
    if not _GEMINI_KEYS:
        return None

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2000}
    }

    for key in _GEMINI_KEYS:
        try:
            resp = _requests.post(
                f"{_GEMINI_API_URL}?key={key}",
                json=payload, timeout=30
            )
            resp.raise_for_status()
            raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            return raw
        except _requests.exceptions.HTTPError:
            if resp.status_code == 429:
                print(f"[SummaryGen] Gemini rate limited on key ...{key[-4:]}, trying next...")
                continue
            print(f"[SummaryGen] Gemini HTTP error: {resp.status_code}")
            return None
        except Exception as e:
            print(f"[SummaryGen] Gemini error: {e}")
            return None
    return None


def _call_grok(prompt: str) -> str | None:
    """Call the Grok (xAI) API as a last-resort fallback."""
    if not _GROK_KEY:
        return None

    try:
        resp = _requests.post(
            _GROK_API_URL,
            headers={
                "Authorization": f"Bearer {_GROK_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "grok-3-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 2000
            },
            timeout=30
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[SummaryGen] Grok error: {e}")
        return None


def _call_llm(prompt: str) -> str | None:
    """
    Try LLMs in order: Groq (fastest) → Gemini → Grok (fallback).
    This distributes load away from Gemini which is busy with AI detection.
    """
    # 1. Groq is PRIMARY for summaries (ultra-fast Llama 3.3 70B)
    result = _call_groq(prompt)
    if result:
        print("[SummaryGen] Using Groq (Llama 3.3 70B) for summary generation")
        return result

    # 2. Gemini as secondary
    print("[SummaryGen] Groq unavailable, trying Gemini...")
    result = _call_gemini(prompt)
    if result:
        print("[SummaryGen] Using Gemini (fallback) for summary generation")
        return result

    # 3. Grok (xAI) as last resort
    print("[SummaryGen] Gemini unavailable, trying Grok...")
    result = _call_grok(prompt)
    if result:
        print("[SummaryGen] Using Grok (last-resort) for summary generation")
        return result

    return None


def generate_summaries(report: dict) -> dict:
    """
    Generate all 4 summary fields using LLM and return them as a dict.
    This enriches the report with natural-language forensic analysis.

    Returns dict with keys:
        - forensic_summary
        - ai_detection_summary
        - stylometry_inconsistencies_summary
        - likely_ai_tool
    """
    # Build context from report data
    n_paras = len(report.get("paragraphs", []))
    ai_prob = report.get("overall_ai_probability", 0)
    ai_pct = round(ai_prob * 100)
    risk = report.get("overall_risk_score", 0)
    authors = report.get("estimated_authors", 1)
    clusters = report.get("clusters", [])
    paragraphs = report.get("paragraphs", [])

    # Per-paragraph AI scores summary
    para_scores = []
    for p in paragraphs[:15]:  # Limit to first 15 for prompt size
        para_scores.append(f"P{p['id']+1}: AI={round(p.get('ai_probability',0)*100)}%")

    # Cluster style descriptions
    cluster_desc = []
    for c in clusters:
        s = c.get("avg_style", {})
        cluster_desc.append(
            f"Cluster {c['cluster_id']} ({c['paragraph_count']} paragraphs): "
            f"avg_sent_len={s.get('avg_sentence_length',0):.1f}, "
            f"TTR={s.get('type_token_ratio',0):.2f}, "
            f"passive_voice={s.get('passive_voice_ratio',0):.2f}, "
            f"noun_verb_ratio={s.get('noun_verb_ratio',0):.2f}, "
            f"complexity={s.get('sentence_complexity',0):.2f}"
        )

    prompt = f"""You are an expert forensic document analyst. Analyze the following forensic report data and generate a structured JSON response.

DOCUMENT STATISTICS:
- Total paragraphs: {n_paras}
- Overall AI probability: {ai_pct}%
- Overall risk score: {risk}/100
- Estimated distinct authors: {authors}
- Number of style clusters: {len(clusters)}

PER-PARAGRAPH AI SCORES:
{chr(10).join(para_scores)}

CLUSTER STYLE PROFILES:
{chr(10).join(cluster_desc) if cluster_desc else "Single author detected"}

CITATION ANOMALIES:
- Score: {report.get('citation_anomalies', {}).get('score', 0)}
- Temporal anomaly: {report.get('citation_anomalies', {}).get('temporal_anomaly', False)}
- Topic mismatch: {report.get('citation_anomalies', {}).get('topic_mismatch', False)}

SOURCE MATCHES: {len(report.get('source_matches', []))} potential matches found

Generate a JSON object with EXACTLY these 4 keys (no markdown fences):

1. "forensic_summary": A 3-5 sentence professional forensic summary describing the document's style clusters, writing consistency, integrity score, and the most suspicious paragraphs. Mention specific cluster labels (Style A, Style B, etc.) and their characteristics (formal/informal tone, vocabulary richness, sentence length, passive voice usage, transition density, hedging frequency).

2. "ai_detection_summary": A 4-6 sentence detailed analysis of the AI-generated content patterns. Mention the overall AI score, identify the most suspicious paragraph by number, describe specific AI indicators found (formulaic structures, meta-commentary transitions like "Therefore" and "Furthermore", unnaturally consistent sentence lengths, generic academic vocabulary). Discuss the blend of human and AI signals. End with a confidence assessment.

3. "stylometry_inconsistencies_summary": Either "No Inconsistencies", "Minor Inconsistencies", "Moderate Inconsistencies", or "Major Inconsistencies" - followed by a 2-3 sentence explanation of the style shifts between clusters, describing how specific stylometric features differ.

4. "likely_ai_tool": Based on the AI probability and writing patterns, predict the most likely AI tool. Return ONLY one of: "ChatGPT", "GPT-4", "Claude", "Gemini", "None Detected", or "Unknown". If AI probability is below 25%, return "None Detected".

Return ONLY the raw JSON object. No explanation, no markdown."""

    raw = _call_llm(prompt)
    if not raw:
        print("[SummaryGen] All LLM calls failed, using defaults")
        return _default_summaries(report)

    try:
        # Strip markdown fences
        clean = re.sub(r'```\w*\n?', '', raw).strip()
        # Find JSON object
        obj_match = re.search(r'\{[\s\S]*\}', clean)
        if obj_match:
            result = json.loads(obj_match.group())
            print(f"[SummaryGen] Successfully generated summaries via LLM")
            return {
                "forensic_summary": result.get("forensic_summary", ""),
                "ai_detection_summary": result.get("ai_detection_summary", ""),
                "stylometry_inconsistencies_summary": result.get("stylometry_inconsistencies_summary", ""),
                "likely_ai_tool": result.get("likely_ai_tool", "Unknown"),
            }
    except json.JSONDecodeError as e:
        print(f"[SummaryGen] JSON parse error: {e}")

    return _default_summaries(report)


def _default_summaries(report: dict) -> dict:
    """Fallback summaries when the LLM is unavailable."""
    ai_pct = round(report.get("overall_ai_probability", 0) * 100)
    authors = report.get("estimated_authors", 1)
    risk = report.get("overall_risk_score", 0)

    # Determine inconsistency level
    if authors >= 4:
        inconsistency = "Major Inconsistencies"
    elif authors >= 3:
        inconsistency = "Moderate Inconsistencies"
    elif authors >= 2:
        inconsistency = "Minor Inconsistencies"
    else:
        inconsistency = "No Inconsistencies"

    # Determine likely tool
    if ai_pct >= 60:
        tool = "ChatGPT"
    elif ai_pct >= 40:
        tool = "Unknown"
    else:
        tool = "None Detected"

    return {
        "forensic_summary": (
            f"The document contains {len(report.get('paragraphs', []))} paragraphs with "
            f"{authors} distinct writing style(s) detected. The overall integrity risk score is "
            f"{risk}/100. {'The style clusters show measurable differences in vocabulary richness, '
            'sentence complexity, and passive voice usage.' if authors > 1 else 'The writing style is consistent throughout the document.'}"
        ),
        "ai_detection_summary": (
            f"The overall AI score for the document is {ai_pct}%. "
            f"{'The text shows patterns consistent with AI-generated content including formulaic structures '
            'and consistent sentence lengths.' if ai_pct >= 40 else 'The text appears predominantly human-written '
            'with natural variation in style and structure.'}"
        ),
        "stylometry_inconsistencies_summary": inconsistency,
        "likely_ai_tool": tool,
    }
