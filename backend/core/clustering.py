"""
Hybrid Authorship Clustering
============================
Fixed version - uses AgglomerativeClustering + real silhouette scoring
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score as sil_score
from sklearn.decomposition import PCA


def cluster_paragraphs(style_vectors: list, paragraphs: list = None) -> dict:
    n = len(style_vectors)

    # Not enough paragraphs to cluster
    if n < 4:
        return {
            "labels": [0] * n,
            "estimated_authors": 1,
            "silhouette_score": 0.0,
            "flagged_indices": []
        }

    # ── Step 1: Clean and scale the 391-dim stylometric vectors ──
    X_style = np.array(style_vectors, dtype=np.float64)
    X_style = np.nan_to_num(X_style)
    X_style_scaled = StandardScaler().fit_transform(X_style)

    # ── Step 2: TF-IDF on raw text (increased from 100 to 500) ──
    if paragraphs and len(paragraphs) == n:
        vectorizer = TfidfVectorizer(
            max_features=500,          # was 100 — too low
            stop_words='english',
            ngram_range=(1, 2),        # bigrams capture phrase style
            analyzer='char_wb',        # character n-grams = best for stylometry
            sublinear_tf=True
        )
        X_tfidf = vectorizer.fit_transform(paragraphs).toarray()
        X_tfidf_scaled = StandardScaler().fit_transform(X_tfidf)

        # ── Step 3: Combine features with weights ──
        # Semantic (BERT) carries most signal, TF-IDF adds lexical detail
        X_combined = np.hstack([
            X_style_scaled * 0.80,     # 391-dim BERT + manual features
            X_tfidf_scaled * 0.20      # 500-dim TF-IDF
        ])
    else:
        X_combined = X_style_scaled

    # ── Step 4: Reduce dimensions for better clustering ──
    # 891 dimensions is too many for small paragraph counts
    # PCA to 50 dims removes noise while keeping style signal
    n_components = min(50, n - 1, X_combined.shape[1])
    pca = PCA(n_components=n_components, random_state=42)
    X_reduced = pca.fit_transform(X_combined)

    # ── Step 5: Find best K using real silhouette score ──
    best_k = 2
    best_score = -1
    score_map = {}
    max_k = min(5, n - 1)

    for k in range(2, max_k + 1):
        model = AgglomerativeClustering(
            n_clusters=k,
            linkage='ward'             # ward = best for stylometry clusters
        )
        labels_try = model.fit_predict(X_reduced)

        # Need at least 2 samples per cluster for silhouette
        unique, counts = np.unique(labels_try, return_counts=True)
        if len(unique) < 2 or any(c < 2 for c in counts):
            continue

        score = sil_score(X_reduced, labels_try)
        score_map[k] = round(float(score), 4)

        if score > best_score:
            best_score = score
            best_k = k

    # ── Step 6: Final clustering with best K ──
    final_model = AgglomerativeClustering(
        n_clusters=best_k,
        linkage='ward'
    )
    labels = final_model.fit_predict(X_reduced).tolist()

    # ── Step 7: Find dominant cluster (main author) ──
    from collections import Counter
    cluster_counts = Counter(labels)
    dominant_cluster = cluster_counts.most_common(1)[0][0]

    # Flag paragraphs NOT belonging to dominant author cluster
    flagged = [i for i, l in enumerate(labels) if l != dominant_cluster]

    # ── Step 8: Only report multi-author if silhouette confirms it ──
    # Low silhouette = clusters are weak = likely single author
    CONFIDENCE_THRESHOLD = 0.05
    if best_score < CONFIDENCE_THRESHOLD:
        # Clusters are not meaningful — treat as single author
        labels = [0] * n
        flagged = []
        estimated_authors = 1
        best_score = float(best_score)
    else:
        estimated_authors = best_k

    return {
        "labels": labels,
        "estimated_authors": estimated_authors,
        "silhouette_score": round(float(best_score), 4),
        "flagged_indices": flagged,
        "all_k_scores": score_map,
        "dominant_cluster": int(dominant_cluster) if not flagged else 0,
        "confidence": _confidence_label(best_score)
    }


def _confidence_label(score: float) -> str:
    if score >= 0.60:
        return "High"
    elif score >= 0.40:
        return "Medium"
    elif score >= 0.25:
        return "Low"
    else:
        return "Insufficient signal"