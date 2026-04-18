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


def build_report(paragraphs, style_vectors, cluster_result, citation_anomalies, source_matches) -> dict:
    n = len(paragraphs)
    labels = cluster_result.get("labels", [0]*n)
    estimated_authors = cluster_result.get("estimated_authors", 1)
    flagged_set = set(cluster_result.get("flagged_indices", []))

    # Build paragraph results
    para_results = []
    for i in range(n):
        sv = style_vectors[i] if i < len(style_vectors) else [0.0]*7
        para_results.append(ParagraphResult(
            id=i,
            text_preview=paragraphs[i][:200],
            cluster=labels[i] if i < len(labels) else 0,
            style_stats=StyleStats(
                avg_sentence_length=sv[0], type_token_ratio=sv[1],
                avg_word_length=sv[2], punctuation_density=sv[3],
                passive_voice_ratio=sv[4], noun_verb_ratio=sv[5],
                sentence_complexity=sv[6],
            ),
            flagged=i in flagged_set,
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

    # Overall risk score (0-100)
    risk = _compute_risk_score(estimated_authors, ca.score, cluster_result.get("silhouette_score", 0), len(flagged_set), n)

    report = ForensicReport(
        overall_risk_score=round(risk, 1),
        estimated_authors=estimated_authors,
        paragraphs=para_results,
        clusters=clusters,
        citation_anomalies=ca,
        source_matches=sm,
    )
    return report.model_dump()


def _compute_risk_score(authors, citation_score, silhouette, n_flagged, n_total):
    score = 0.0
    if authors > 1:
        score += min((authors - 1) * 20, 40)
    score += citation_score * 30
    if n_total > 0:
        score += (n_flagged / n_total) * 20
    score += min(silhouette * 10, 10)
    return min(score, 100.0)
