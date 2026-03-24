from __future__ import annotations

import re
from typing import Any


SKILL_KEYWORDS = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node.js",
    "node",
    "fastapi",
    "flask",
    "django",
    "spring boot",
    "spring",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "git",
    "github",
    "html",
    "css",
    "tailwind",
    "c++",
    "c",
    "c#",
]

SECTION_ALIASES = {
    "projects": ["projects", "project experience", "academic projects", "personal projects"],
    "skills": ["skills", "technical skills", "core skills", "tools and languages"],
}


def clean_resume_text(text: str) -> str:
    cleaned = text.replace("\r", "\n")
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def parse_resume_text(text: str) -> dict[str, Any]:
    cleaned_text = clean_resume_text(text)
    lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]

    return {
        "name": extract_name(lines),
        "email": extract_email(cleaned_text),
        "phone": extract_phone(cleaned_text),
        "skills": extract_skills(cleaned_text),
        "projects": extract_projects(cleaned_text),
    }


def extract_email(text: str) -> str:
    match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s().-]{8,}\d)", text)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def extract_name(lines: list[str]) -> str:
    for line in lines[:8]:
        if "@" in line:
            continue
        if re.search(r"\d", line):
            continue
        if len(line.split()) < 2 or len(line.split()) > 5:
            continue
        if line.lower() in flatten_aliases():
            continue
        return line
    return ""


def extract_skills(text: str) -> list[str]:
    lowered_text = text.lower()
    found_skills: list[str] = []

    for skill in SKILL_KEYWORDS:
        pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
        if re.search(pattern, lowered_text):
            found_skills.append(skill.title() if skill.islower() else skill)

    return deduplicate(found_skills)


def extract_projects(text: str) -> list[dict[str, str]]:
    project_section = extract_section(text, "projects")
    if not project_section:
        return []

    blocks = [block.strip() for block in re.split(r"\n\s*\n", project_section) if block.strip()]
    projects: list[dict[str, str]] = []

    for block in blocks:
        lines = [line.strip("•- ").strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue

        title = lines[0]
        description = " ".join(lines[1:]).strip()

        if not description and len(title.split()) > 8:
            description = title
            title = "Project"

        projects.append(
            {
                "title": title,
                "description": description,
            }
        )

    if projects:
        return projects

    fallback_lines = [line.strip() for line in project_section.splitlines() if line.strip()]
    if not fallback_lines:
        return []

    return [{"title": fallback_lines[0], "description": " ".join(fallback_lines[1:]).strip()}]


def extract_section(text: str, section_key: str) -> str:
    aliases = SECTION_ALIASES.get(section_key, [])
    if not aliases:
        return ""

    lines = text.splitlines()
    start_index: int | None = None

    for index, raw_line in enumerate(lines):
        normalized = normalize_heading(raw_line)
        if normalized in aliases:
            start_index = index + 1
            break

    if start_index is None:
        return ""

    collected: list[str] = []
    for raw_line in lines[start_index:]:
        normalized = normalize_heading(raw_line)
        if normalized and normalized in flatten_aliases() and normalized not in aliases:
            break
        collected.append(raw_line)

    return "\n".join(collected).strip()


def normalize_heading(line: str) -> str:
    return re.sub(r"[^a-z\s]", "", line.lower()).strip()


def flatten_aliases() -> set[str]:
    return {alias for aliases in SECTION_ALIASES.values() for alias in aliases}


def deduplicate(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    for value in values:
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(value)

    return ordered
