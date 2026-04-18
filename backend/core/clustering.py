"""
KMeans Clustering
=================
Clusters paragraphs by writing style to detect multi-author stitching.

Input:  List of style vectors (7 floats each)
Output: { labels, estimated_authors, silhouette_score, flagged_indices }

Owner: Backend Dev 1
Dependencies: scikit-learn, numpy
"""

import numpy as np
from collections import Counter
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score as sil_score


def cluster_paragraphs(style_vectors: list) -> dict:
    n = len(style_vectors)
    if n < 4:
        return {"labels": [0]*n, "estimated_authors": 1, "silhouette_score": 0.0, "flagged_indices": []}

    X = np.array(style_vectors, dtype=np.float64)
    X_scaled = StandardScaler().fit_transform(X)

    best_k, best_sc, best_labels = 1, -1.0, [0]*n
    for k in range(2, min(5, n)):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        if len(set(labels)) < 2:
            continue
        sc = sil_score(X_scaled, labels)
        if sc > best_sc:
            best_sc, best_k, best_labels = sc, k, labels.tolist()

    if best_sc < 0.25:
        return {"labels": [0]*n, "estimated_authors": 1, "silhouette_score": best_sc, "flagged_indices": []}

    dominant = Counter(best_labels).most_common(1)[0][0]
    flagged = [i for i, l in enumerate(best_labels) if l != dominant]

    return {"labels": best_labels, "estimated_authors": best_k, "silhouette_score": round(best_sc, 4), "flagged_indices": flagged}
