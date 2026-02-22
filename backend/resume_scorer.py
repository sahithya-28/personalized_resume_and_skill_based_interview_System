from __future__ import annotations

import sys
from pathlib import Path

from docx import Document

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from src.resume_parser.section_detector import detect_sections
from src.resume_parser.skill_extractor import extract_skills
from src.resume_parser.text_extractor import extract_text_from_pdf
from src.vulnerability_engine.gap_detector import detect_year_gaps
from src.vulnerability_engine.vulnerability_rules import detect_vulnerabilities


def _extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text)


def extract_text_from_file(path: str) -> str:
    suffix = Path(path).suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix == ".docx":
        return _extract_text_from_docx(path)
    raise ValueError("Only PDF and DOCX files are supported")


def _section_score(section_text: str) -> int:
    content = (section_text or "").strip()
    if not content:
        return 0
    length = len(content)
    if length >= 180:
        return 100
    if length >= 80:
        return 75
    return 50


def analyze_resume_text(text: str) -> dict:
    sections = detect_sections(text)
    combined_skill_text = (sections.get("skills", "") + "\n" + text).strip()
    skills = extract_skills(combined_skill_text)
    gaps = detect_year_gaps(sections.get("education", ""))
    vulnerabilities = detect_vulnerabilities(sections, skills, gaps)

    category_scores = {
        "education": _section_score(sections.get("education", "")),
        "skills": min(100, max(0, len(skills) * 10)) if skills else 0,
        "projects": _section_score(sections.get("projects", "")),
        "experience": _section_score(sections.get("experience", "")),
    }

    average_score = sum(category_scores.values()) / len(category_scores)
    penalty = min(20, len(vulnerabilities) * 5)
    overall_score = int(max(0, round(average_score - penalty)))

    return {
        "overall_score": overall_score,
        "category_scores": category_scores,
        "skills": skills,
        "sections": sections,
        "vulnerabilities": vulnerabilities,
    }
