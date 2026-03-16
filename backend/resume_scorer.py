from __future__ import annotations

import sys
from pathlib import Path

from docx import Document

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from src.resume_analysis import build_advanced_resume_report
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


def analyze_resume_text(text: str) -> dict:
    advanced = build_advanced_resume_report(text)

    parsed_data = advanced.get("parsed_data", {})
    sections = parsed_data.get("sections", {})
    skills = advanced.get("skill_extraction", {}).get("detected_skills", [])
    gaps = detect_year_gaps(sections.get("education", ""))
    vulnerabilities = detect_vulnerabilities(sections, skills, gaps)

    resume_score = advanced.get("resume_score", {})
    score_breakdown = resume_score.get("breakdown", {})
    completeness = advanced.get("section_completeness", {}).get("required", {})
    evidence = advanced.get("skill_verification", {})
    strong_or_moderate = sum(
        1 for item in evidence.values() if item.get("status") in {"Strong Evidence", "Moderate Evidence"}
    )

    return {
        "overall_score": int(resume_score.get("total", 0)),
        "category_scores": {
            "education": 100 if completeness.get("education") else 0,
            "skills": min(100, strong_or_moderate * 10 + (20 if skills else 0)),
            "projects": 100 if completeness.get("projects") else 0,
            "experience": 100 if completeness.get("experience") else 0,
        },
        "skills": skills,
        "sections": sections,
        "vulnerabilities": vulnerabilities,
        **advanced,
    }
