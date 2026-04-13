from __future__ import annotations

import re
import sys
from pathlib import Path

from docx import Document

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.src.resume_analysis import build_advanced_resume_report
from backend.src.resume_analysis.normalizer import normalize_resume_schema
from backend.src.resume_parser.text_extractor import extract_text_from_pdf
from backend.src.vulnerability_engine.gap_detector import detect_year_gaps
from backend.src.vulnerability_engine.vulnerability_rules import detect_vulnerabilities


DEFAULT_ATS_KEYWORDS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "fastapi", "django", "flask",
    "sql", "mysql", "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "rest api",
    "machine learning", "data analysis", "html", "css", "leadership", "communication", "problem solving",
]

ATS_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "of", "on",
    "or", "that", "the", "to", "with", "using", "use", "build", "built", "develop", "developer",
    "development", "engineer", "engineering", "role", "job", "candidate", "experience", "work",
    "knowledge", "ability", "strong", "good", "plus", "preferred", "required", "responsible",
}

ACTION_VERBS = {
    "developed", "built", "implemented", "designed", "created", "optimized", "deployed", "integrated",
    "automated", "led", "improved", "delivered", "launched", "engineered", "analyzed",
}

SECTION_PATTERNS = {
    "education": [r"\beducation\b", r"\bacademic\b", r"\bqualification\b"],
    "skills": [r"\bskills\b", r"\btechnical skills\b", r"\btechnologies\b", r"\btools\b"],
    "projects": [r"\bprojects?\b", r"\bacademic projects?\b", r"\bpersonal projects?\b"],
    "experience": [r"\bexperience\b", r"\bwork experience\b", r"\bemployment\b", r"\binternships?\b"],
}


def _extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text)


def _extract_text_from_txt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="ignore").strip()


def extract_text_from_file(path: str) -> str:
    suffix = Path(path).suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix == ".docx":
        return _extract_text_from_docx(path)
    if suffix == ".txt":
        return _extract_text_from_txt(path)
    raise ValueError("Only PDF, DOCX, and TXT files are supported")


def calculate_ats_score(text: str, job_description: str | None = None) -> int:
    scorecard = calculate_ats_scorecard(text, job_description=job_description)
    return int(scorecard.get("ats_score", 0))


def analyze_resume_text(text: str, job_description: str | None = None) -> dict:
    advanced = build_advanced_resume_report(text, job_description=job_description)
    ats_scorecard = calculate_ats_scorecard(text, job_description=job_description)

    parsed_data = advanced.get("parsed_data", {})
    sections = parsed_data.get("sections", {})
    structured_sections = parsed_data.get("structured_sections", [])
    skills = advanced.get("skill_extraction", {}).get("detected_skills", [])
    gaps = detect_year_gaps(sections.get("education", ""))
    vulnerabilities = detect_vulnerabilities(sections, skills, gaps)

    resume_score = advanced.get("resume_score", {})
    score_breakdown = resume_score.get("breakdown", {})
    completeness = advanced.get("section_completeness", {}).get("required", {})
    evidence = advanced.get("skill_verification", {})
    role_prediction = advanced.get("resume_profile_classification", {})
    candidate_type = advanced.get("candidate_type_prediction", {})
    strong_or_moderate = sum(
        1 for item in evidence.values() if item.get("status") in {"Strong Evidence", "Moderate Evidence"}
    )
    normalized_resume = normalize_resume_schema(
        parsed_data=parsed_data,
        sections=sections,
        structured_sections=structured_sections,
        skills=skills,
        project_analysis=advanced.get("project_analysis", []),
        raw_text=advanced.get("preprocessing", {}).get("cleaned_text", text),
    )

    return {
        "overall_score": int(ats_scorecard.get("ats_score", 0)),
        "analysis_score": int(resume_score.get("total", 0)),
        "ats_score": int(ats_scorecard.get("ats_score", 0)),
        "ats_breakdown": ats_scorecard.get("breakdown", {}),
        "breakdown": ats_scorecard.get("breakdown", {}),
        "category_scores": {
            "education": 100 if completeness.get("education") else 0,
            "skills": min(100, strong_or_moderate * 10 + (20 if skills else 0)),
            "projects": 100 if completeness.get("projects") else 0,
            "experience": 100 if completeness.get("experience") else 0,
        },
        "skills": skills,
        "sections": sections,
        "structured_sections": structured_sections,
        "normalized_resume": normalized_resume,
        "predicted_role": role_prediction.get("predicted_profile", ""),
        "experience_level": candidate_type.get("predicted_category", ""),
        "role_scores": {
            item.get("profile", ""): item.get("score", 0)
            for item in role_prediction.get("scores", [])
            if item.get("profile")
        },
        "suggestions": advanced.get("improvement_suggestions", []),
        "vulnerabilities": vulnerabilities,
        **advanced,
    }


def calculate_ats_scorecard(resume_text: str, job_description: str | None = None) -> dict:
    resume_text = str(resume_text or "").strip()
    if not resume_text:
        return {
            "ats_score": 0,
            "breakdown": {
                "keyword_score": 0,
                "section_score": 0,
                "content_score": 0,
                "formatting_score": 0,
            },
            "suggestions": ["Add resume content before running ATS scoring."],
            "matched_keywords": [],
            "missing_keywords": [],
            "keywords_used": [],
        }

    keywords_used = _extract_target_keywords(job_description)
    keyword_result = _score_keyword_matching(resume_text, keywords_used)
    section_result = _score_section_completeness(resume_text)
    content_result = _score_content_quality(resume_text)
    formatting_result = _score_formatting(resume_text)

    ats_score = round(
        (keyword_result["score"] * 0.4)
        + (section_result["score"] * 0.2)
        + (content_result["score"] * 0.2)
        + (formatting_result["score"] * 0.2)
    )

    suggestions = _build_ats_suggestions(
        keyword_result,
        section_result,
        content_result,
        formatting_result,
        has_job_description=bool(str(job_description or "").strip()),
    )

    return {
        "ats_score": int(max(0, min(100, ats_score))),
        "breakdown": {
            "keyword_score": keyword_result["score"],
            "section_score": section_result["score"],
            "content_score": content_result["score"],
            "formatting_score": formatting_result["score"],
        },
        "suggestions": suggestions,
        "matched_keywords": keyword_result["matched_keywords"],
        "missing_keywords": keyword_result["missing_keywords"],
        "keywords_used": keywords_used,
    }


def _extract_target_keywords(job_description: str | None) -> list[str]:
    text = str(job_description or "").strip()
    if not text:
        return sorted(DEFAULT_ATS_KEYWORDS)

    normalized = _normalize_text(text)
    candidates: set[str] = set()

    for phrase in DEFAULT_ATS_KEYWORDS:
        if _contains_phrase(normalized, phrase):
            candidates.add(phrase)

    tokens = re.findall(r"[a-z][a-z+#./-]{1,}", normalized)
    for token in tokens:
        if token not in ATS_STOPWORDS and len(token) > 2:
            candidates.add(token)

    bigrams = [
        f"{left} {right}"
        for left, right in zip(tokens, tokens[1:])
        if left not in ATS_STOPWORDS and right not in ATS_STOPWORDS
    ]
    for phrase in bigrams:
        if len(phrase) > 5:
            candidates.add(phrase)

    prioritized = sorted(candidates, key=lambda item: (-_keyword_priority(item), item))
    return prioritized[:20] or sorted(DEFAULT_ATS_KEYWORDS)


def _score_keyword_matching(resume_text: str, keywords: list[str]) -> dict:
    normalized_resume = _normalize_text(resume_text)
    matched_keywords = [keyword for keyword in keywords if _contains_phrase(normalized_resume, keyword)]
    total_keywords = len(keywords)
    score = round((len(matched_keywords) / total_keywords) * 100) if total_keywords else 0

    return {
        "score": int(max(0, min(100, score))),
        "matched_keywords": matched_keywords,
        "missing_keywords": [keyword for keyword in keywords if keyword not in matched_keywords],
        "total_keywords": total_keywords,
    }


def _score_section_completeness(resume_text: str) -> dict:
    normalized_resume = _normalize_text(resume_text)
    present_sections = []
    missing_sections = []

    for section, patterns in SECTION_PATTERNS.items():
        if any(re.search(pattern, normalized_resume, flags=re.IGNORECASE) for pattern in patterns):
            present_sections.append(section)
        else:
            missing_sections.append(section)

    total_sections = len(SECTION_PATTERNS)
    score = round((len(present_sections) / total_sections) * 100) if total_sections else 0
    return {
        "score": int(max(0, min(100, score))),
        "present_sections": present_sections,
        "missing_sections": missing_sections,
    }


def _score_content_quality(resume_text: str) -> dict:
    normalized_resume = _normalize_text(resume_text)
    resume_lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    bullet_lines = [line for line in resume_lines if re.match(r"^[-*•]", line)]

    has_action_verbs = any(re.search(rf"\b{re.escape(verb)}\b", normalized_resume) for verb in ACTION_VERBS)
    has_numeric_values = bool(re.search(r"\b\d+(?:\.\d+)?%?\b", resume_text))
    average_bullet_length = (
        sum(len(re.findall(r"\w+", line)) for line in bullet_lines) / len(bullet_lines)
        if bullet_lines else 0.0
    )

    score = 0
    if has_action_verbs:
        score += 40
    if has_numeric_values:
        score += 35
    if bullet_lines and 8 <= average_bullet_length <= 22:
        score += 25
    elif bullet_lines:
        score += 12

    return {
        "score": int(max(0, min(100, score))),
        "has_action_verbs": has_action_verbs,
        "has_numeric_values": has_numeric_values,
        "average_bullet_length": round(average_bullet_length, 2),
        "bullet_count": len(bullet_lines),
    }


def _score_formatting(resume_text: str) -> dict:
    words = re.findall(r"\b\w+\b", resume_text)
    word_count = len(words)
    lines = [line.rstrip() for line in resume_text.splitlines() if line.strip()]
    bullet_lines = [line for line in lines if re.match(r"^[-*•]", line.strip())]
    heading_lines = _extract_heading_lines(lines)
    consistent_headings = _has_consistent_headings(heading_lines)

    score = 100
    if word_count > 1400:
        score -= 35
    elif word_count > 1000:
        score -= 15

    if not bullet_lines:
        score -= 25

    if not heading_lines:
        score -= 20
    elif not consistent_headings:
        score -= 15

    if len(lines) < 8:
        score -= 10

    return {
        "score": int(max(0, min(100, score))),
        "word_count": word_count,
        "bullet_count": len(bullet_lines),
        "heading_count": len(heading_lines),
        "consistent_headings": consistent_headings,
    }


def _build_ats_suggestions(
    keyword_result: dict,
    section_result: dict,
    content_result: dict,
    formatting_result: dict,
    *,
    has_job_description: bool,
) -> list[str]:
    suggestions: list[str] = []

    if section_result["missing_sections"]:
        missing = ", ".join(section.title() for section in section_result["missing_sections"])
        suggestions.append(f"Add missing sections like {missing}.")

    if keyword_result["score"] < 70:
        if has_job_description:
            suggestions.append("Improve keyword matching with the job role by adding relevant tools, skills, and responsibilities.")
        else:
            suggestions.append("Add more role-relevant technical keywords such as languages, frameworks, databases, and tools.")

    if not content_result["has_numeric_values"]:
        suggestions.append("Include measurable achievements with numbers, percentages, or impact metrics.")

    if not content_result["has_action_verbs"]:
        suggestions.append("Use action verbs in bullet points, such as developed, built, implemented, or designed.")

    if content_result["bullet_count"] == 0:
        suggestions.append("Convert long paragraphs into concise bullet points for better ATS readability.")
    elif content_result["average_bullet_length"] and content_result["average_bullet_length"] > 22:
        suggestions.append("Shorten bullet points so each one is easier to scan and understand.")

    if formatting_result["word_count"] > 1400:
        suggestions.append("Reduce resume length to keep it within roughly two pages.")

    if formatting_result["heading_count"] == 0 or not formatting_result["consistent_headings"]:
        suggestions.append("Use clear and consistent section headings like Education, Skills, Projects, and Experience.")

    if not suggestions:
        suggestions.append("Resume is ATS-friendly overall. Fine-tune keywords and quantified impact for even better matching.")

    deduped: list[str] = []
    seen = set()
    for item in suggestions:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:8]


def _normalize_text(text: str) -> str:
    normalized = str(text or "").lower()
    normalized = normalized.replace("&", " and ")
    normalized = re.sub(r"[^a-z0-9+#./%\s-]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def _contains_phrase(text: str, phrase: str) -> bool:
    pattern = rf"(?<![a-z0-9]){re.escape(phrase.lower()).replace(r'\\ ', r'\\s+')}(?![a-z0-9])"
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def _keyword_priority(keyword: str) -> tuple[int, int]:
    priority = 0
    if keyword in DEFAULT_ATS_KEYWORDS:
        priority += 3
    if " " in keyword:
        priority += 1
    return priority, len(keyword)


def _extract_heading_lines(lines: list[str]) -> list[str]:
    headings: list[str] = []
    for line in lines:
        stripped = line.strip().rstrip(":")
        if not stripped:
            continue
        word_count = len(stripped.split())
        if word_count > 4:
            continue
        if stripped.isupper() or stripped.istitle() or stripped.lower() in SECTION_PATTERNS:
            headings.append(stripped)
    return headings


def _has_consistent_headings(headings: list[str]) -> bool:
    if len(headings) <= 1:
        return bool(headings)
    uppercase_count = sum(1 for item in headings if item.isupper())
    title_count = sum(1 for item in headings if item.istitle())
    dominant = max(uppercase_count, title_count)
    return (dominant / len(headings)) >= 0.6
