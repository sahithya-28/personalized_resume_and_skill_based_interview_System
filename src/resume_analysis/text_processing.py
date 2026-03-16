from __future__ import annotations

import re


def clean_resume_text(text: str) -> str:
    value = text or ""
    value = value.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore")
    value = value.replace("\r", "\n")
    value = re.sub(r"[^\x20-\x7E\n\t]", " ", value)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"•", "\n- ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    value = re.sub(r"[^\w\s@:+#./,%()-]", " ", value)
    value = re.sub(r"[ ]{2,}", " ", value)
    return value.strip()


def fallback_sentence_split(text: str) -> list[str]:
    normalized = clean_resume_text(text)
    sentences = re.split(r"(?<=[.!?])\s+|\n+", normalized)
    return [sentence.strip() for sentence in sentences if sentence.strip()]


def fallback_tokenize(text: str) -> list[str]:
    cleaned = clean_resume_text(text).lower()
    return re.findall(r"[a-z0-9+#./-]+", cleaned)
