from __future__ import annotations

import re

from .ml_models import predict_section_labels
from .text_processing import clean_resume_text

HEADER_HINTS = {
    "education": ["education", "academic", "qualification"],
    "skills": ["skills", "technical skills", "technologies", "tools"],
    "projects": ["projects", "project experience", "academic projects"],
    "experience": ["experience", "work experience", "employment", "internship", "internships"],
    "certifications": [
        "certifications", "licenses", "credentials", "certificates", "courses", "training",
        "programs", "certifications and achievements", "achievements and certifications",
        "certifications & achievements", "achievements & certifications",
    ],
    "achievements": [
        "achievements", "awards", "accomplishments", "activities", "hackathons", "participation",
        "certifications and achievements", "achievements and certifications",
        "certifications & achievements", "achievements & certifications",
    ],
    "summary": ["summary", "objective", "profile"],
}


def parse_resume(text: str) -> dict:
    clean = clean_resume_text(text)
    contact = extract_contact_info(clean)
    blocks = split_resume_blocks(clean)
    predicted = predict_section_labels(blocks)
    sections = build_sections(blocks, predicted)
    structured_sections = build_structured_sections(blocks, predicted)
    return {
        **contact,
        "sections": sections,
        "structured_sections": structured_sections,
        "section_predictions": predicted,
    }


def extract_contact_info(text: str) -> dict[str, str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}", text)
    linkedin_match = re.search(r"(https?://)?(www\.)?linkedin\.com/[^\s]+", text, flags=re.IGNORECASE)
    github_match = re.search(r"(https?://)?(www\.)?github\.com/[^\s]+", text, flags=re.IGNORECASE)
    return {
        "name": _guess_name(lines),
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "linkedin": linkedin_match.group(0) if linkedin_match else "",
        "github": github_match.group(0) if github_match else "",
    }


def split_resume_blocks(text: str) -> list[str]:
    blocks = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if len(blocks) > 1:
        return blocks

    lines = [line.rstrip() for line in text.splitlines() if line.strip()]
    if not lines:
        return []

    grouped: list[str] = []
    current: list[str] = []
    for line in lines:
        stripped = line.strip()
        if _match_header_line(stripped):
            if current:
                grouped.append("\n".join(current).strip())
            current = [stripped]
            continue
        if not current:
            current = [stripped]
        else:
            current.append(stripped)

    if current:
        grouped.append("\n".join(current).strip())

    return grouped or [line.strip() for line in lines]


def build_sections(blocks: list[str], predictions: list[dict]) -> dict[str, str]:
    sections = {name: "" for name in HEADER_HINTS}
    for block, item in zip(blocks, predictions):
        if _is_contact_block(block) and not _has_explicit_header(block.splitlines()):
            continue
        section = _override_from_header(block, item["label"])
        current = sections.get(section, "")
        sections[section] = f"{current}\n{block}".strip()
    return {key: value.strip() for key, value in sections.items()}


def build_structured_sections(blocks: list[str], predictions: list[dict]) -> list[dict]:
    structured_sections: list[dict] = []

    for block, item in zip(blocks, predictions):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        if _is_contact_block(block) and not _has_explicit_header(lines):
            continue

        section_key = _override_from_header(block, item["label"])
        detected_title = _extract_section_title(lines, section_key)
        content_lines = _extract_section_content(lines, detected_title)

        if structured_sections and not _has_explicit_header(lines):
            last = structured_sections[-1]
            if last.get("key") == section_key:
                last["content"].extend(content_lines or lines)
                continue

        structured_sections.append(
            {
                "key": section_key,
                "title": detected_title,
                "content": content_lines or lines,
            }
        )

    return structured_sections


def _override_from_header(block: str, predicted_label: str) -> str:
    first_line = block.splitlines()[0].strip().lower()
    normalized = _normalize_header(first_line)
    for section, headers in HEADER_HINTS.items():
        if normalized in {_normalize_header(header) for header in headers}:
            return section
    return predicted_label


def _extract_section_title(lines: list[str], section_key: str) -> str:
    first_line = lines[0].strip()
    normalized = _normalize_header(first_line.lower())
    if normalized in {_normalize_header(item) for values in HEADER_HINTS.values() for item in values}:
        return re.sub(r"[:\-\s]+$", "", first_line).strip() or section_key.title()
    return section_key.title()


def _extract_section_content(lines: list[str], title: str) -> list[str]:
    if not lines:
        return []
    normalized_title = _normalize_header(title.lower())
    first_line_normalized = _normalize_header(lines[0].strip().lower())
    if first_line_normalized == normalized_title and len(lines) > 1:
        return lines[1:]
    return lines


def _has_explicit_header(lines: list[str]) -> bool:
    if not lines:
        return False
    first_line = _normalize_header(lines[0].strip().lower())
    for headers in HEADER_HINTS.values():
        if first_line in {_normalize_header(header) for header in headers}:
            return True
    return False


def _match_header_line(line: str) -> bool:
    normalized = _normalize_header(str(line or "").lower())
    if not normalized:
        return False
    alias_set = {_normalize_header(item) for values in HEADER_HINTS.values() for item in values}
    return normalized in alias_set


def _is_contact_block(block: str) -> bool:
    lowered = str(block or "").lower()
    contact_signals = ("@", "linkedin", "github", "+91", "+1", "telangana", "hyderabad")
    return sum(1 for token in contact_signals if token in lowered) >= 2


def _guess_name(lines: list[str]) -> str:
    for line in lines[:8]:
        low = line.lower()
        if "@" in line or "linkedin.com" in low or "github.com" in low:
            continue
        if re.search(r"\d", line):
            continue
        words = [w for w in re.split(r"\s+", line) if w]
        if 1 < len(words) <= 4 and all(re.fullmatch(r"[A-Za-z.'-]+", word) for word in words):
            return " ".join(word.capitalize() for word in words)
    return ""


def _normalize_header(value: str) -> str:
    normalized = str(value or "").lower().replace("&", " and ")
    normalized = re.sub(r"[:\-\s]+$", "", normalized)
    normalized = re.sub(r"[^a-z\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()
