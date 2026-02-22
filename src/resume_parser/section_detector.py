import re
from src.utils.text_cleaner import clean_text

SECTION_HEADERS = {
    "education": ["education", "academic", "qualification"],
    "skills": ["skills", "technical skills", "tools", "technologies"],
    "projects": ["projects", "project", "academic projects"],
    "experience": ["experience", "internship", "work experience"],
}

def detect_sections(text: str) -> dict:
    text = clean_text(text)
    lines = text.split("\n")

    sections = {k: "" for k in SECTION_HEADERS.keys()}
    current_section = None

    for line in lines:
        lower = line.strip().lower()

        found_section = None
        for sec, keywords in SECTION_HEADERS.items():
            for kw in keywords:
                if re.fullmatch(rf"{kw}", lower):
                    found_section = sec
                    break
            if found_section:
                break

        if found_section:
            current_section = found_section
            continue

        if current_section:
            sections[current_section] += line + "\n"

    for k in sections:
        sections[k] = sections[k].strip()

    return sections
