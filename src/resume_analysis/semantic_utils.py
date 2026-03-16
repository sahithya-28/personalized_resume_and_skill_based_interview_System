from __future__ import annotations

from functools import lru_cache

import numpy as np


@lru_cache(maxsize=1)
def _load_sentence_transformer():
    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
    except Exception:
        return None


def encode_texts(texts: list[str]) -> np.ndarray:
    if not texts:
        return np.zeros((0, 0), dtype=float)

    model = _load_sentence_transformer()
    if model is not None:
        try:
            vectors = model.encode(texts, normalize_embeddings=True)
            return np.asarray(vectors, dtype=float)
        except Exception:
            pass

    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(texts).toarray()
    return _normalize_rows(np.asarray(matrix, dtype=float))


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    if vec_a.size == 0 or vec_b.size == 0:
        return 0.0
    denominator = float(np.linalg.norm(vec_a) * np.linalg.norm(vec_b))
    if denominator == 0.0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / denominator)


def rank_similarity(query: str, candidates: dict[str, str]) -> list[dict]:
    texts = [query] + list(candidates.values())
    vectors = encode_texts(texts)
    query_vector = vectors[0]
    results = []
    for index, label in enumerate(candidates.keys(), start=1):
        score = cosine_similarity(query_vector, vectors[index])
        results.append({"label": label, "score": round(score, 4)})
    return sorted(results, key=lambda item: item["score"], reverse=True)


def _normalize_rows(matrix: np.ndarray) -> np.ndarray:
    if matrix.size == 0:
        return matrix
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0.0] = 1.0
    return matrix / norms
