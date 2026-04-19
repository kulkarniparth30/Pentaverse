"""
AI Text Detector - Quad Engine (Batch Mode)
=============================================
Combines FOUR detection strategies for maximum accuracy.

Engine 1 - Gemini API (PRIMARY):
    Sends ALL paragraphs in ONE API call to avoid rate limiting.
    Uses Gemini 2.5 Flash to classify each paragraph.

Engine 2 - Groq API (SECONDARY):
    Ultra-fast LLM inference using Llama 3.3 70B.
    Provides a second LLM opinion for cross-validation.

Engine 3 - HuggingFace RoBERTa:
    Local model fine-tuned on ChatGPT-3.5 text.

Engine 4 - Statistical Heuristics:
    5-signal ensemble: burstiness, AI phrases, opener repetition,
    bigram repetition, passive voice overuse.

Owner: Backend Dev
Dependencies: requests, transformers, NLTK, python-dotenv
"""

import os
import re
import statistics
import string
import json
import time

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from dotenv import load_dotenv
load_dotenv()

from transformers import pipeline
import nltk
import requests as _requests

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)

from nltk.tokenize import sent_tokenize, word_tokenize

# ── Engine 1: Gemini API (Batch Mode) ────────────────────────────────────────

_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
_GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def _gemini_batch_scores(paragraphs: list[str]) -> list[float]:
    """
    Send ALL paragraphs to Gemini in ONE API call.
    Returns a list of AI probabilities (0.0-1.0), one per paragraph.
    Returns list of -1.0 if Gemini is unavailable.
    """
    if not _GEMINI_KEY or not paragraphs:
        return [-1.0] * len(paragraphs)

    try:
        # Build numbered paragraph list for the prompt
        para_text = ""
        for i, p in enumerate(paragraphs):
            snippet = p[:500]  # Limit each to 500 chars
            para_text += f"\n[Paragraph {i+1}]: {snippet}\n"

        prompt = f"""You are an expert AI-generated text detector with 99% accuracy. 
Analyze each paragraph below and determine the probability it was written by an AI model (ChatGPT, GPT-4, Claude, Gemini, etc.).

IMPORTANT CONTEXT: This text may be from a formal academic paper (e.g., IEEE). Do NOT falsely flag human-written academic text as AI simply because it is formal, uses passive voice, or has a structured flow.

True AI-generated text indicators:
- Hallucinated or perfectly generic filler that lacks deep technical substance
- Unnaturally perfectly balanced sentence structures (no human variation)
- "AI tone" (e.g., "It is crucial to navigate the multifaceted landscape...")
- Over-reliance on generic transition words compared to actual technical content

There are {len(paragraphs)} paragraphs to analyze:
{para_text}

Return ONLY a raw JSON array of numbers. Each number is the AI probability (0.0 to 1.0) for that paragraph. Do NOT use markdown formatting like ```json.
Example for 3 paragraphs: [0.85, 0.92, 0.30]

Return the raw array now:"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.05, "maxOutputTokens": 1000}
        }

        keys = [k.strip() for k in _GEMINI_KEY.split(",") if k.strip()]
        if not keys:
            return [-1.0] * len(paragraphs)

        raw = None
        for key in keys:
            for attempt in range(3):  # Retry up to 3 times with backoff
                try:
                    resp = _requests.post(
                        f"{_GEMINI_API_URL}?key={key}",
                        json=payload, timeout=30
                    )
                    resp.raise_for_status()
                    raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    break  # Success!
                except _requests.exceptions.HTTPError as e:
                    if resp.status_code == 429:
                        wait = (attempt + 1) * 10  # 10s, 20s, 30s backoff
                        print(f"[Gemini Batch] Rate limited (attempt {attempt+1}/3), waiting {wait}s...")
                        time.sleep(wait)
                        continue  # Retry same key
                    else:
                        print(f"[Gemini Batch] HTTP Error: {e}")
                        return [-1.0] * len(paragraphs)
                except Exception as e:
                    print(f"[Gemini Batch] Connection Error: {e}")
                    return [-1.0] * len(paragraphs)
            if raw:
                break  # Got a result, stop trying keys

        if not raw:
            print("[Gemini Batch] All API keys failed or rate-limited.")
            return [-1.0] * len(paragraphs)

        print(f"[Gemini Batch] Raw response: {raw[:300]}")

        # Strip markdown code fences (Gemini wraps in ```json ... ```)
        clean = re.sub(r'```\w*\n?', '', raw).strip()

        # Parse JSON array from response
        arr_match = re.search(r'\[[\d\s,.\n]+\]', clean)
        if arr_match:
            scores = json.loads(arr_match.group())
            result = []
            for i in range(len(paragraphs)):
                if i < len(scores):
                    val = float(scores[i])
                    result.append(round(max(0.0, min(1.0, val)), 4))
                else:
                    result.append(0.5)
            print(f"[Gemini Batch] Parsed scores: {result}")
            return result

        # Fallback: try to find individual numbers
        numbers = re.findall(r'0\.\d+|1\.0|0\.0', raw)
        if numbers:
            result = []
            for i in range(len(paragraphs)):
                if i < len(numbers):
                    result.append(round(float(numbers[i]), 4))
                else:
                    result.append(0.5)
            print(f"[Gemini Batch] Fallback parsed: {result}")
            return result

        print(f"[Gemini Batch] Could not parse response")
        return [-1.0] * len(paragraphs)

    except Exception as e:
        print(f"[Gemini Batch] Error: {e}")
        return [-1.0] * len(paragraphs)


# ── Engine 2: Groq API (Batch Mode) ─────────────────────────────────────────

_GROQ_KEY = os.getenv("GROQ_API_KEY", "")
_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _groq_batch_scores(paragraphs: list[str]) -> list[float]:
    """
    Send ALL paragraphs to Groq (Llama 3.3 70B) in ONE API call.
    Ultra-fast inference provides a second LLM opinion for cross-validation.
    Returns a list of AI probabilities (0.0-1.0), one per paragraph.
    Returns list of -1.0 if Groq is unavailable.
    """
    if not _GROQ_KEY or not paragraphs:
        return [-1.0] * len(paragraphs)

    try:
        para_text = ""
        for i, p in enumerate(paragraphs):
            snippet = p[:400]
            para_text += f"\n[Paragraph {i+1}]: {snippet}\n"

        prompt = f"""You are an expert AI-generated text detector. Analyze each paragraph below and determine the probability it was written by an AI model (ChatGPT, GPT-4, Claude, Gemini, etc.).

IMPORTANT: Do NOT falsely flag formal academic or technical writing (like IEEE papers) as AI just because it uses passive voice, formal transitions, or complex vocabulary. Look for true AI traits: generic fluff, unnatural perfect balance, and lack of deep technical substance.

There are {len(paragraphs)} paragraphs:
{para_text}

Return ONLY a raw JSON array of numbers (0.0 to 1.0), one per paragraph. No explanation, no markdown.
Example: [0.85, 0.30, 0.92]"""

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.05,
            "max_tokens": 1000,
        }

        resp = _requests.post(
            _GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {_GROQ_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()
        print(f"[Groq Batch] Raw response: {raw[:300]}")

        # Strip markdown fences
        clean = re.sub(r'```\w*\n?', '', raw).strip()

        # Parse JSON array
        arr_match = re.search(r'\[[\d\s,.\n]+\]', clean)
        if arr_match:
            scores = json.loads(arr_match.group())
            result = []
            for i in range(len(paragraphs)):
                if i < len(scores):
                    val = float(scores[i])
                    result.append(round(max(0.0, min(1.0, val)), 4))
                else:
                    result.append(0.5)
            print(f"[Groq Batch] Parsed scores: {result}")
            return result

        # Fallback
        numbers = re.findall(r'0\.\d+|1\.0|0\.0', raw)
        if numbers:
            result = []
            for i in range(len(paragraphs)):
                if i < len(numbers):
                    result.append(round(float(numbers[i]), 4))
                else:
                    result.append(0.5)
            print(f"[Groq Batch] Fallback parsed: {result}")
            return result

        print(f"[Groq Batch] Could not parse response")
        return [-1.0] * len(paragraphs)

    except Exception as e:
        print(f"[Groq Batch] Error: {e}")
        return [-1.0] * len(paragraphs)


# ── Engine 3: HuggingFace RoBERTa ───────────────────────────────────────────

_roberta = None

def _get_roberta():
    global _roberta
    if _roberta is None:
        print("Loading HuggingFace AI Detector (chatgpt-detector-roberta)...")
        _roberta = pipeline(
            "text-classification",
            model="Hello-SimpleAI/chatgpt-detector-roberta",
            truncation=True,
            max_length=512,
        )
        print("HuggingFace AI Detector loaded.")
    return _roberta


def _roberta_score(text: str) -> float:
    """RoBERTa model score for ChatGPT-style AI text."""
    try:
        classifier = _get_roberta()
        result = classifier(text)[0]
        label = str(result["label"]).lower()
        score = result["score"]
        if "chatgpt" in label or "fake" in label or "ai" in label:
            return round(score, 4)
        else:
            # Human label: AI probability = 1 - human_confidence
            # No artificial floor — let the model differentiate
            return round(1.0 - score, 4)
    except Exception as e:
        print(f"RoBERTa engine error: {e}")
        return -1.0


# ── Engine 4: Statistical Heuristics ────────────────────────────────────────

_AI_PHRASES = [
    r"\bit is worth noting\b", r"\bit is important to note\b",
    r"\bit should be noted\b", r"\bit is (crucial|essential|vital) to\b",
    r"\bin conclusion\b", r"\bto conclude\b",
    r"\bfurthermore\b", r"\bmoreover\b", r"\badditionally\b",
    r"\bin (summary|summary,)\b", r"\bto summarize\b",
    r"\boverall,?\b", r"\bin addition,?\b", r"\bconsequently,?\b",
    r"\bsignificant(ly)?\b", r"\bsubstantial(ly)?\b",
    r"\bcomprehensive(ly)?\b", r"\brobust(ly)?\b",
    r"\bstate-of-the-art\b", r"\bcutting-edge\b",
    r"\bdemonstrate(s|d)?\b", r"\bfacilitate(s|d)?\b",
    r"\bleverage(s|d)?\b", r"\bunderscore(s)?\b",
    r"\bhighlight(s|ed)?\b", r"\bemphasize(s|d)?\b",
    r"\bplay(s|ed)? a (crucial|pivotal|significant|key|critical) role\b",
    r"\bnovel approach\b", r"\bproposed (method|framework|approach|system)\b",
    r"\bthis (study|paper|work|research) (aims|proposes|presents|introduces)\b",
    r"\bin this (study|paper|work|research)\b",
    r"\bhas been (widely|extensively|frequently|commonly)\b",
    r"\bexperimental results (show|demonstrate|confirm|reveal)\b",
    r"\bthis (highlights|demonstrates|suggests|indicates|shows|reveals)\b",
    r"\bpave(s|d)? the way\b", r"\bsheds? (light|new light)\b",
    r"\bbridge(s|d)? the gap\b",
]
_AI_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _AI_PHRASES]
_FILLER = [
    re.compile(r"\bas (previously|mentioned|noted|discussed|stated)\b", re.I),
    re.compile(r"\bwith (this|that|these) in mind\b", re.I),
    re.compile(r"\bto (this|that) end\b", re.I),
    re.compile(r"\btaken together\b", re.I),
    re.compile(r"\bit is (also )?(worth )?(noting|mentioning|highlighting)\b", re.I),
]


def _heuristic_score(text: str) -> float:
    """5-signal heuristic ensemble for modern AI text."""
    try:
        sentences = sent_tokenize(text)
        words = word_tokenize(text)
        alpha = [w for w in words if w.isalpha()]
        if len(alpha) < 5 or len(sentences) < 2:
            return 0.0

        lengths = [len(s.split()) for s in sentences if s.strip()]
        mean_l = statistics.mean(lengths) if lengths else 1
        try:
            cv = statistics.stdev(lengths) / mean_l if mean_l > 0 else 1
        except statistics.StatisticsError:
            cv = 1
        s1 = max(0.0, min(1.0, 1.0 - (cv / 0.50)))

        wc = len(alpha)
        hits = sum(len(p.findall(text)) for p in _AI_PATTERNS)
        hits += sum(len(p.findall(text)) for p in _FILLER)
        s2 = min(1.0, (hits / (wc / 100)) / 3.5)

        openers = [s.strip().split()[0].lower().rstrip(string.punctuation)
                   for s in sentences if s.strip().split()]
        s3 = max(0.0, min(1.0, 1.2 - (len(set(openers)) / len(openers) / 0.55))) if openers else 0.3

        bigrams = [(alpha[i].lower(), alpha[i+1].lower()) for i in range(len(alpha)-1)]
        s4 = max(0.0, min(1.0, 1.5 - (len(set(bigrams)) / len(bigrams) / 0.60))) if bigrams else 0.3

        passive_re = re.compile(r"\b(is|are|was|were|be|been|being|has been|have been|had been) \w+ed\b", re.I)
        s5 = min(1.0, sum(1 for s in sentences if passive_re.search(s)) / len(sentences) / 0.50)

        weights = [0.22, 0.38, 0.15, 0.15, 0.10]
        raw = sum(w * s for w, s in zip(weights, [s1, s2, s3, s4, s5]))
        high = sum(1 for s in [s1, s2, s3, s4, s5] if s > 0.50)
        if high >= 4:
            raw = min(1.0, raw * 1.40)
        elif high >= 3:
            raw = min(1.0, raw * 1.20)
        return round(raw, 4)
    except Exception:
        return 0.0


# ── Batch Detection (called from analyze.py) ────────────────────────────────

def batch_detect_ai(paragraphs: list[str]) -> list[float]:
    """
    Quad-engine AI detection for a BATCH of paragraphs.

    Makes ONE Gemini API call + ONE Groq API call for all paragraphs,
    then combines with per-paragraph RoBERTa + heuristic scores.

    Returns a list of AI probabilities (0.0-1.0), one per paragraph.
    """
    if not paragraphs:
        return []

    n = len(paragraphs)

    print(f"\n{'='*60}")
    print(f"[Quad Engine] Analyzing {n} paragraphs...")
    print(f"{'='*60}")

    # Engine 1: ONE Gemini call for ALL paragraphs
    gemini_scores = _gemini_batch_scores(paragraphs)

    # Engine 2: ONE Groq call for ALL paragraphs (cross-validation)
    groq_scores = _groq_batch_scores(paragraphs)

    # Engine 3 & 4: Per-paragraph RoBERTa + Heuristics
    final_scores = []
    for i, text in enumerate(paragraphs):
        if not text or len(text.strip()) < 30:
            final_scores.append(0.0)
            continue

        g = gemini_scores[i]
        q = groq_scores[i]

        # ── All 4 engines now active ──
        r = _roberta_score(text)
        h = _heuristic_score(text)

        snippet = text[:50].replace('\n', ' ')
        print(f"  P{i+1}: G={g:.2f} Q={q:.2f} R={r:.2f} H={h:.2f}", end="")

        # ── Weighted combination of all available engines ──
        engines = []
        weights = []

        gemini_available = g >= 0
        groq_available = q >= 0
        roberta_available = r >= 0

        if gemini_available:
            engines.append(g)
            weights.append(0.40)  # Gemini (primary)
        if groq_available:
            engines.append(q)
            # Groq gets more weight when Gemini is down
            weights.append(0.45 if not gemini_available else 0.25)
        if roberta_available:
            engines.append(r)
            weights.append(0.20)  # RoBERTa
        engines.append(h)
        weights.append(0.15)      # Heuristics always available

        # Normalize weights to sum to 1.0
        total_w = sum(weights)
        combined = sum(e * (w / total_w) for e, w in zip(engines, weights))

        # Agreement boost: if multiple LLMs agree on high AI, boost confidence
        llm_scores = [s for s in [g, q] if s >= 0]
        if len(llm_scores) == 2:
            if all(s > 0.6 for s in llm_scores):
                combined = min(1.0, combined * 1.10)  # Both LLMs agree: high AI
            elif all(s < 0.3 for s in llm_scores):
                combined = combined * 0.90  # Both LLMs agree: human

        combined = round(max(0.0, min(1.0, combined)), 4)
        print(f" -> {combined:.2f}")
        final_scores.append(combined)

    avg = sum(final_scores) / n if n > 0 else 0
    print(f"{'='*60}")
    print(f"[Quad Engine] Average AI probability: {avg:.2%}")
    print(f"{'='*60}\n")

    return final_scores


# Legacy single-paragraph function (still works as fallback)
def detect_ai_probability(text: str) -> float:
    """Single paragraph detection - used as fallback."""
    return batch_detect_ai([text])[0] if text else 0.0