"""
Report Builder
==============
Assembles the final ForensicReport from all analysis module outputs.

Owner: Backend Dev 1
"""

from models.schemas import (
    ForensicReport, ParagraphResult, StyleStats,
    CitationAnomalies, SourceMatch, ClusterInfo,
)
from collections import Counter
import numpy as np


def build_report(paragraphs, style_vectors, ai_probs, cluster_result, citation_anomalies, source_matches) -> dict:
    n = len(paragraphs)
    labels = cluster_result.get("labels", [0]*n)
    estimated_authors = cluster_result.get("estimated_authors", 1)
    flagged_set = set(cluster_result.get("flagged_indices", []))

    # Build paragraph results
    para_results = []
    for i in range(n):
        sv = style_vectors[i] if i < len(style_vectors) else [0.0]*7
        ai_p = ai_probs[i] if i < len(ai_probs) else 0.0
        para_results.append(ParagraphResult(
            id=i,
            text_preview=paragraphs[i][:200],
            full_text=paragraphs[i],
            cluster=labels[i] if i < len(labels) else 0,
            style_stats=StyleStats(
                avg_sentence_length=sv[0], type_token_ratio=sv[1],
                avg_word_length=sv[2], punctuation_density=sv[3],
                passive_voice_ratio=sv[4], noun_verb_ratio=sv[5],
                sentence_complexity=sv[6],
            ),
            flagged=i in flagged_set,
            ai_probability=round(ai_p, 4),
        ))

    # Build cluster info
    cluster_counts = Counter(labels)
    clusters = []
    for cid, count in sorted(cluster_counts.items()):
        indices = [i for i, l in enumerate(labels) if l == cid]
        vecs = np.array([style_vectors[i] for i in indices])
        avg = vecs.mean(axis=0).tolist()
        clusters.append(ClusterInfo(
            cluster_id=cid, paragraph_count=count,
            avg_style=StyleStats(
                avg_sentence_length=avg[0], type_token_ratio=avg[1],
                avg_word_length=avg[2], punctuation_density=avg[3],
                passive_voice_ratio=avg[4], noun_verb_ratio=avg[5],
                sentence_complexity=avg[6],
            ),
        ))

    # Citation anomalies
    ca = CitationAnomalies(**citation_anomalies)

    # Source matches
    sm = [SourceMatch(**m) for m in source_matches]

    # Overall AI Probability
    overall_ai_probability = sum(ai_probs) / n if n > 0 else 0.0

    # Overall risk score (0-100)
    risk = _compute_risk_score(
        estimated_authors,
        ca.score,
        cluster_result.get("silhouette_score", 0),
        len(flagged_set),
        n,
        overall_ai_probability,
        len(ca.hallucinated_citations) > 0
    )

    report = ForensicReport(
        overall_risk_score=round(risk, 1),
        overall_ai_probability=round(overall_ai_probability, 4),
        estimated_authors=estimated_authors,
        paragraphs=para_results,
        clusters=clusters,
        citation_anomalies=ca,
        source_matches=sm,
    )
    return report.model_dump()


def _compute_risk_score(authors, citation_score, silhouette, n_flagged, n_total, overall_ai, has_hallucinations=False):
    """
    Compute a 0-100 forensic risk score.
    Multi-author stitching is treated as PRIMARY signal, not AI.

    Tiers:
        0-25  → Low Risk
        26-50 → Moderate Risk
        51-75 → High Risk
        76-100 → Critical Risk
    """

    # ── Component 1: Multi-Author Stitching (PRIMARY signal) ─────────────────
    # This is the core PS2 signal — must dominate the score
    if authors >= 5:
        author_score = 85.0
    elif authors == 4:
        author_score = 70.0
    elif authors == 3:
        author_score = 55.0
    elif authors == 2:
        author_score = 40.0
    else:
        author_score = 0.0

    # ── Component 2: Silhouette confidence boost ──────────────────────────────
    # Strong cluster separation = more confident about multi-author detection
    if silhouette >= 0.60:
        silhouette_boost = 15.0
    elif silhouette >= 0.40:
        silhouette_boost = 8.0
    elif silhouette >= 0.25:
        silhouette_boost = 3.0
    else:
        silhouette_boost = 0.0

    # ── Component 3: Flagged paragraph ratio ─────────────────────────────────
    # More flagged paragraphs = higher suspicion
    flag_score = 0.0
    if n_total > 0:
        flag_ratio = n_flagged / n_total
        flag_score = flag_ratio * 20.0

    # ── Component 4: Citation anomalies ──────────────────────────────────────
    citation_component = citation_score * 10.0
    if has_hallucinations:
        citation_component += 35.0  # Massive penalty for fake citations

    # ── Component 5: AI Generation (secondary signal) ────────────────────────
    # AI content is an additional red flag, not the primary one
    ai_score = 0.0
    if overall_ai >= 0.70:
        ai_score = 25.0
    elif overall_ai >= 0.50:
        ai_score = 18.0
    elif overall_ai >= 0.30:
        ai_score = 10.0
    elif overall_ai >= 0.15:
        ai_score = 5.0

    # ── Final score ───────────────────────────────────────────────────────────
    combined = (
        author_score
        + silhouette_boost
        + flag_score
        + citation_component
        + ai_score
    )
    return round(min(100.0, combined), 1)