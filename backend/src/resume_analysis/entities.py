from __future__ import annotations

import re

from .skill_catalog import CERTIFICATION_HINTS, JOB_TITLE_HINTS, SKILL_ALIASES, SKILL_TAXONOMY


def extract_entities(text: str, sections: dict[str, str], doc: object | None = None) -> dict:
    entities = {
        "skills": [],
        "organizations": [],
        "universities": [],
        "job_titles": [],
        "certifications": [],
    }

    if doc is not None and hasattr(doc, "ents"):
        for ent in doc.ents:
            label = getattr(ent, "label_", "")
            value = ent.text.strip()
            if not value:
                continue
            lowered = value.lower()
            if label == "ORG":
                entities["organizations"].append(value)
                if "university" in lowered or "college" in lowered or "institute" in lowered:
                    entities["universities"].append(value)
            if label in {"PERSON", "ORG"}:
                for title in JOB_TITLE_HINTS:
                    if title in lowered:
                        entities["job_titles"].append(value)

    full_text = text.lower()
    for category in SKILL_TAXONOMY.values():
        for raw_skill in category:
            skill = SKILL_ALIASES.get(raw_skill, raw_skill)
            if _contains_phrase(full_text, skill):
                entities["skills"].append(_display(skill))

    for line in text.splitlines():
        lowered = line.lower()
        if any(word in lowered for word in ("university", "college", "institute")):
            entities["universities"].append(line.strip())
        for title in JOB_TITLE_HINTS:
            if title in lowered:
                entities["job_titles"].append(title.title())
        if _looks_like_certification_line(line):
            entities["certifications"].append(line.strip())

    certification_sections = "\n".join(
        str(sections.get(name) or "")
        for name in ("certifications", "courses", "training", "programs", "achievements")
    )
    achievement_sections = "\n".join(
        str(sections.get(name) or "")
        for name in ("achievements", "activities", "hackathons", "participation")
    )
    for line in certification_sections.splitlines():
        cleaned = line.strip()
        if _looks_like_certification_line(cleaned):
            entities["certifications"].append(cleaned)

    for line in achievement_sections.splitlines():
        cleaned = line.strip()
        lowered = cleaned.lower()
        if cleaned and any(token in lowered for token in ("hackathon", "competition", "participated", "winner", "finalist", "ranked")):
            entities["organizations"].append(cleaned)

    return {key: _dedupe(values) for key, values in entities.items()}


def _contains_phrase(text: str, phrase: str) -> bool:
    pattern = rf"(?<![A-Za-z0-9]){re.escape(phrase).replace(r'\\ ', r'\\s+')}(?![A-Za-z0-9])"
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def _display(skill: str) -> str:
    if skill in {"c++", "c#", "sql", "aws", "gcp", "nlp", "oop", "ci/cd"}:
        return skill.upper()
    return " ".join(part.capitalize() for part in skill.split())


def _dedupe(values: list[str]) -> list[str]:
    output: list[str] = []
    seen = set()
    for value in values:
        clean = value.strip()
        if not clean:
            continue
        key = clean.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(clean)
    return output


def _looks_like_certification_line(line: str) -> bool:
    cleaned = str(line or "").strip()
    lowered = cleaned.lower()
    if not cleaned:
        return False
    if "certifications and achievements" in lowered or cleaned.isupper():
        return False
    if "@" in lowered or "linkedin" in lowered or "github" in lowered:
        return False
    certification_tokens = (
        "certification", "certifications", "certified", "course", "courses", "training",
        "bootcamp", "workshop", "program", "completed mlops", "nxtwave",
    )
    return any(token in lowered for token in certification_tokens)
