from __future__ import annotations


def generate_resume_summary(sentences: list[str], top_n: int = 3) -> dict:
    if not sentences:
        return {"summary_sentences": [], "summary_text": ""}

    tokenized = [_normalize(sentence) for sentence in sentences]
    frequencies: dict[str, int] = {}
    for tokens in tokenized:
        for token in tokens:
            frequencies[token] = frequencies.get(token, 0) + 1

    scored: list[tuple[float, str]] = []
    for sentence, tokens in zip(sentences, tokenized):
        if not tokens:
            continue
        score = sum(frequencies[token] for token in tokens) / len(tokens)
        scored.append((score, sentence))

    selected = [sentence for _, sentence in sorted(scored, key=lambda item: item[0], reverse=True)[:top_n]]
    ordered = [sentence for sentence in sentences if sentence in selected]
    return {
        "summary_sentences": ordered,
        "summary_text": " ".join(ordered),
    }


def _normalize(sentence: str) -> list[str]:
    return [token.lower() for token in sentence.split() if len(token) > 2]
