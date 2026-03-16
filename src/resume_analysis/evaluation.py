from __future__ import annotations

import re


def validate_contact_info(parsed: dict) -> dict:
    checks = {
        "email": bool(parsed.get("email")),
        "phone": bool(parsed.get("phone")),
        "linkedin": bool(parsed.get("linkedin")),
        "github": bool(parsed.get("github")),
    }
    missing = [name for name, present in checks.items() if not present]
    return {
        "checks": checks,
        "missing": missing,
        "suggestions": [f"Add {item.title()} in the resume header." for item in missing],
    }


def section_completeness(sections: dict[str, str]) -> dict:
    required = ["education", "skills", "projects", "experience", "certifications"]
    status = {section: bool((sections.get(section) or "").strip()) for section in required}
    score = round((sum(1 for present in status.values() if present) / len(required)) * 100, 2)
    return {"required": status, "score": score}


def detect_achievements(sentences: list[str]) -> dict:
    achievement_sentences = [
        sentence for sentence in sentences
        if re.search(r"\b\d+%|\b\d+\+?|\b(increased|reduced|improved|saved|grew|boosted)\b", sentence.lower())
    ]
    return {
        "count": len(achievement_sentences),
        "sentences": achievement_sentences[:8],
        "has_quantified_results": bool(achievement_sentences),
    }


def analyze_writing_quality(sentences: list[str]) -> dict:
    word_count = sum(len(re.findall(r"[A-Za-z0-9]+", sentence)) for sentence in sentences)
    avg_sentence_length = round(word_count / max(len(sentences), 1), 2)
    passive = [
        sentence for sentence in sentences
        if re.search(r"\b(was|were|is|are|been|being)\b\s+\w+ed\b", sentence.lower())
    ]
    readability = round(max(0.0, min(100.0, _flesch_reading_ease(" ".join(sentences)))), 2)
    feedback: list[str] = []
    if readability < 35:
        feedback.append("Resume is dense. Simplify some bullets and shorten long sentences.")
    if avg_sentence_length > 24:
        feedback.append("Average sentence length is high. Use tighter impact bullets.")
    if passive:
        feedback.append("Reduce passive voice and prefer action-led bullets.")
    if not feedback:
        feedback.append("Writing quality is clear and concise.")
    return {
        "readability_score": readability,
        "average_sentence_length": avg_sentence_length,
        "passive_voice_sentences": passive[:5],
        "feedback": feedback,
    }


def keyword_density(tokens: list[str], technical_keyword_count: int) -> dict:
    total_words = len(tokens)
    density = round((technical_keyword_count / total_words) * 100, 2) if total_words else 0.0
    feedback = "Good technical density."
    if density < 8:
        feedback = "Add more concrete technologies, tools, and implementation terms."
    elif density > 30:
        feedback = "Technical density is high; ensure every claim is backed by project context."
    return {
        "total_words": total_words,
        "technical_keywords": technical_keyword_count,
        "technical_density": density,
        "feedback": feedback,
    }


def compute_resume_score(
    contact_validation: dict,
    completeness: dict,
    evidence: dict[str, dict],
    quality: dict,
    achievements: dict,
    *,
    skill_count: int = 0,
    project_analysis: list[dict] | None = None,
    career_timeline: dict | None = None,
    candidate_type: dict | None = None,
    ml_strength: dict | None = None,
) -> dict:
    project_analysis = project_analysis or []
    career_timeline = career_timeline or {"timeline": [], "total_years_experience": 0.0}
    candidate_type = candidate_type or {"predicted_category": "Fresher"}
    ml_strength = ml_strength or {"score": 0.0}

    strong_evidence = sum(1 for item in evidence.values() if item["status"] == "Strong Evidence")
    moderate_evidence = sum(1 for item in evidence.values() if item["status"] == "Moderate Evidence")
    avg_complexity = (
        sum(project.get("complexity_score", 0.0) for project in project_analysis) / max(len(project_analysis), 1)
        if project_analysis else 0.0
    )
    years_experience = float(career_timeline.get("total_years_experience", 0.0))

    impact_score = min(
        20.0,
        6.0
        + achievements["count"] * 2.5
        + (4.0 if achievements["has_quantified_results"] else 0.0),
    )
    skills_score = min(
        20.0,
        4.0
        + min(skill_count, 10) * 0.9
        + strong_evidence * 1.6
        + moderate_evidence * 0.8,
    )
    experience_score = min(
        20.0,
        3.0
        + (6.0 if completeness["required"].get("experience") else 0.0)
        + min(years_experience, 8.0) * 1.2
        + (3.0 if len(career_timeline.get("timeline", [])) >= 2 else 0.0)
        + (2.0 if candidate_type.get("predicted_category") == "Experienced" else 0.0),
    )
    if candidate_type.get("predicted_category") == "Fresher":
        experience_score = min(20.0, experience_score + (4.0 if completeness["required"].get("education") else 0.0))

    projects_score = min(
        20.0,
        2.0
        + len(project_analysis) * 3.5
        + avg_complexity * 1.8,
    )
    quality_score = min(
        20.0,
        4.0
        + (quality["readability_score"] / 100.0) * 8.0
        + max(0.0, 4.0 - max(0.0, quality["average_sentence_length"] - 18.0) * 0.25)
        + min(4.0, sum(1 for field in ("email", "phone", "linkedin", "github") if contact_validation["checks"].get(field))),
    )

    breakdown = {
        "Impact": round(max(0.0, impact_score), 2),
        "Skills": round(max(0.0, skills_score), 2),
        "Experience": round(max(0.0, experience_score), 2),
        "Projects": round(max(0.0, projects_score), 2),
        "Resume Quality": round(max(0.0, quality_score), 2),
    }
    total = int(min(100, round(sum(breakdown.values()))))
    return {
        "total": total,
        "breakdown": breakdown,
        "ml_estimated_strength": round(float(ml_strength.get("score", 0.0)) * 100, 2),
    }


def generate_improvement_suggestions(
    contact_validation: dict,
    completeness: dict,
    evidence: dict[str, dict],
    quality: dict,
    achievements: dict,
    similarity_scores: list[dict],
    *,
    score_breakdown: dict[str, float] | None = None,
    project_analysis: list[dict] | None = None,
    adaptive_analysis: dict | None = None,
) -> list[str]:
    score_breakdown = score_breakdown or {}
    project_analysis = project_analysis or []
    adaptive_analysis = adaptive_analysis or {}

    ranked: list[tuple[int, str]] = []
    ranked.extend((9, item) for item in contact_validation["suggestions"])

    if score_breakdown.get("Experience", 20) < 12:
        ranked.append((100, "Add internship or work experience to demonstrate practical application of your skills."))
    if score_breakdown.get("Impact", 20) < 12 or not achievements["has_quantified_results"]:
        ranked.append((95, "Add quantified achievements to demonstrate measurable impact."))
    if score_breakdown.get("Projects", 20) < 12:
        ranked.append((92, "Add detailed project descriptions including technologies used, architecture, and outcomes."))
    if score_breakdown.get("Resume Quality", 20) < 12:
        ranked.append((88, "Shorten long sentences and use stronger action verbs to improve readability."))
    if score_breakdown.get("Skills", 20) < 12:
        ranked.append((90, "Add context explaining how each skill was applied in projects or experience."))

    for section, present in completeness["required"].items():
        if not present:
            ranked.append((84 if section == "experience" else 72, f"Add a stronger {section.title()} section."))

    for skill, item in evidence.items():
        if item["status"] == "Limited Evidence":
            ranked.append((80, item["suggestion"]))

    ranked.extend((65, item) for item in quality["feedback"])

    if project_analysis and all(not project.get("detected_components") for project in project_analysis):
        ranked.append((75, "Expand project bullets to mention APIs, databases, authentication, deployment, or architecture choices."))

    if similarity_scores:
        best = similarity_scores[0]
        if best["score"] < 0.68:
            ranked.append((78, "Resume does not strongly align with a target profile. Tailor projects and skills toward your intended role."))

    if adaptive_analysis.get("predicted_candidate_type") == "Fresher":
        ranked.append((70, "For fresher profiles, highlight projects, internships, certifications, and relevant coursework more explicitly."))
    elif adaptive_analysis.get("predicted_candidate_type") == "Experienced":
        ranked.append((70, "For experienced profiles, emphasize leadership scope, architecture decisions, and measurable business outcomes."))

    deduped: list[str] = []
    seen = set()
    for _, item in sorted(ranked, key=lambda entry: (-entry[0], entry[1])):
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:12]


def _flesch_reading_ease(text: str) -> float:
    sentences = max(1, len(re.split(r"[.!?]+", text)))
    words = re.findall(r"[A-Za-z0-9]+", text)
    word_count = max(1, len(words))
    syllables = sum(_syllable_count(word) for word in words)
    return 206.835 - 1.015 * (word_count / sentences) - 84.6 * (syllables / word_count)


def _syllable_count(word: str) -> int:
    word = word.lower()
    groups = re.findall(r"[aeiouy]+", word)
    return max(1, len(groups))
