from __future__ import annotations

import re

from .semantic_utils import cosine_similarity, encode_texts
from .skill_catalog import SKILL_ALIASES, SKILL_TAXONOMY

WEIGHTS = {
    "Skills": 30.0,
    "Experience": 25.0,
    "Impact": 20.0,
    "Projects": 15.0,
    "Resume Quality": 10.0,
}

ACTION_VERBS = {
    "achieved", "automated", "boosted", "built", "created", "decreased", "delivered", "designed", "developed",
    "drove", "enhanced", "generated", "grew", "implemented", "improved", "increased", "launched", "led",
    "optimized", "reduced", "resolved", "saved", "scaled", "shipped", "streamlined",
}

METRIC_PATTERNS = [
    r"\b\d+(?:\.\d+)?\s?%",
    r"\b\d+(?:\.\d+)?\s?(?:x|k|m|b)\b",
    r"\b\d+(?:,\d{3})*(?:\.\d+)?\s?(?:users|customers|clients|teams|projects|hours|days|weeks|months|years)\b",
    r"\b(?:by|from|to)\s+\d+(?:\.\d+)?",
]

RESULT_PATTERNS = [
    r"\b(resulting in|leading to|which led to|thereby|so that|and reduced|and increased|and improved)\b",
    r"\b(revenue|latency|performance|throughput|efficiency|cost|uptime|retention|conversion|accuracy|coverage)\b",
]


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


def extract_skills(text: str) -> list[str]:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return []

    found: set[str] = set()
    for skill in _all_known_skills():
        canonical = SKILL_ALIASES.get(skill, skill)
        pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
        if re.search(pattern, normalized_text):
            found.add(canonical)

    return sorted(found)


def compute_jd_similarity(resume_text: str, job_description: str | None = None) -> dict:
    if not job_description or not str(job_description).strip():
        return {
            "score": 0.0,
            "method": "not_provided",
            "resume_skills": extract_skills(resume_text),
            "jd_skills": [],
            "common_skills": [],
            "missing_skills": [],
            "skill_overlap": 0.0,
        }

    cleaned_resume = str(resume_text or "").strip()
    cleaned_jd = str(job_description or "").strip()
    vectors = encode_texts([cleaned_resume, cleaned_jd])
    similarity = cosine_similarity(vectors[0], vectors[1]) if len(vectors) >= 2 else 0.0

    resume_skills = extract_skills(cleaned_resume)
    jd_skills = extract_skills(cleaned_jd)
    common_skills = sorted(set(resume_skills) & set(jd_skills))
    missing_skills = sorted(set(jd_skills) - set(resume_skills))
    overlap = (len(common_skills) / len(jd_skills)) if jd_skills else 0.0

    return {
        "score": round(max(0.0, min(1.0, similarity)) * 100, 2),
        "method": "semantic_similarity",
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "common_skills": common_skills,
        "missing_skills": missing_skills[:10],
        "skill_overlap": round(overlap * 100, 2),
    }


def detect_impact(sentences: list[str]) -> dict:
    impact_sentences = []
    action_metric_result = 0
    action_and_metric = 0

    for sentence in sentences:
        lowered = sentence.lower()
        has_action = any(re.search(rf"\b{re.escape(verb)}\b", lowered) for verb in ACTION_VERBS)
        has_metric = any(re.search(pattern, lowered) for pattern in METRIC_PATTERNS)
        has_result = any(re.search(pattern, lowered) for pattern in RESULT_PATTERNS)

        if has_action and has_metric:
            action_and_metric += 1
        if has_action and has_metric and has_result:
            action_metric_result += 1

        if has_action or has_metric or has_result:
            impact_sentences.append(
                {
                    "sentence": sentence,
                    "has_action_verb": has_action,
                    "has_metric": has_metric,
                    "has_result_signal": has_result,
                }
            )

    quantified_results = [item["sentence"] for item in impact_sentences if item["has_metric"]]
    return {
        "count": len(impact_sentences),
        "sentences": [item["sentence"] for item in impact_sentences[:8]],
        "has_quantified_results": bool(quantified_results),
        "quantified_sentences": quantified_results[:8],
        "action_metric_count": action_and_metric,
        "action_metric_result_count": action_metric_result,
    }


def detect_achievements(sentences: list[str]) -> dict:
    return detect_impact(sentences)


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
    resume_or_contact: str | dict,
    completeness: dict | None = None,
    evidence: dict[str, dict] | None = None,
    quality: dict | None = None,
    achievements: dict | None = None,
    *,
    resume_text: str | None = None,
    job_description: str | None = None,
    skill_count: int = 0,
    project_analysis: list[dict] | None = None,
    career_timeline: dict | None = None,
    candidate_type: dict | None = None,
    ml_strength: dict | None = None,
) -> dict:
    if isinstance(resume_or_contact, str):
        resume_text = resume_or_contact
        contact_validation = {"checks": {"email": False, "phone": False, "linkedin": False, "github": False}, "suggestions": []}
        completeness = completeness or {"required": {}}
        evidence = evidence or {}
        quality = quality or {"readability_score": 0.0, "average_sentence_length": 0.0, "feedback": []}
        achievements = achievements or {"count": 0, "has_quantified_results": False, "action_metric_count": 0, "action_metric_result_count": 0}
    else:
        contact_validation = resume_or_contact
        completeness = completeness or {"required": {}}
        evidence = evidence or {}
        quality = quality or {"readability_score": 0.0, "average_sentence_length": 0.0, "feedback": []}
        achievements = achievements or {"count": 0, "has_quantified_results": False, "action_metric_count": 0, "action_metric_result_count": 0}

    project_analysis = project_analysis or []
    career_timeline = career_timeline or {"timeline": [], "total_years_experience": 0.0}
    candidate_type = candidate_type or {"predicted_category": "Fresher"}
    ml_strength = ml_strength or {"score": 0.0}
    resume_text = str(resume_text or "")

    strong_evidence = sum(1 for item in evidence.values() if item.get("status") == "Strong Evidence")
    moderate_evidence = sum(1 for item in evidence.values() if item.get("status") == "Moderate Evidence")
    avg_complexity = (
        sum(project.get("complexity_score", 0.0) for project in project_analysis) / max(len(project_analysis), 1)
        if project_analysis else 0.0
    )
    years_experience = float(career_timeline.get("total_years_experience", 0.0))
    jd_match = compute_jd_similarity(resume_text, job_description)

    raw_skills = (
        min(skill_count, 12) * 3.0
        + strong_evidence * 4.0
        + moderate_evidence * 2.0
        + (jd_match["skill_overlap"] * 0.18 if jd_match["jd_skills"] else 0.0)
        + (jd_match["score"] * 0.10 if jd_match["jd_skills"] else 0.0)
    )
    raw_experience = (
        (10.0 if completeness["required"].get("experience") else 0.0)
        + min(years_experience, 10.0) * 3.5
        + (4.0 if len(career_timeline.get("timeline", [])) >= 2 else 0.0)
        + (3.0 if candidate_type.get("predicted_category") == "Experienced" else 0.0)
        + (float(ml_strength.get("score", 0.0)) * 5.0)
    )
    if candidate_type.get("predicted_category") == "Fresher":
        raw_experience += 3.0 if completeness["required"].get("education") else 0.0

    raw_impact = (
        achievements["count"] * 2.5
        + achievements.get("action_metric_count", 0) * 4.0
        + achievements.get("action_metric_result_count", 0) * 6.0
        + (4.0 if achievements.get("has_quantified_results") else 0.0)
    )
    raw_projects = (
        len(project_analysis) * 6.0
        + avg_complexity * 3.0
        + (3.0 if completeness["required"].get("projects") else 0.0)
    )
    raw_quality = (
        (quality["readability_score"] / 100.0) * 5.0
        + max(0.0, 3.0 - max(0.0, quality["average_sentence_length"] - 20.0) * 0.20)
        + min(2.0, sum(1 for field in ("email", "phone", "linkedin", "github") if contact_validation["checks"].get(field)) * 0.5)
    )

    legacy_breakdown = {
        "Skills": round(_scale_to_weight(raw_skills, WEIGHTS["Skills"], max_raw=75.0), 2),
        "Experience": round(_scale_to_weight(raw_experience, WEIGHTS["Experience"], max_raw=55.0), 2),
        "Impact": round(_scale_to_weight(raw_impact, WEIGHTS["Impact"], max_raw=45.0), 2),
        "Projects": round(_scale_to_weight(raw_projects, WEIGHTS["Projects"], max_raw=35.0), 2),
        "Resume Quality": round(_scale_to_weight(raw_quality, WEIGHTS["Resume Quality"], max_raw=10.0), 2),
    }
    normalized_breakdown = {
        "skills": legacy_breakdown["Skills"],
        "experience": legacy_breakdown["Experience"],
        "impact": legacy_breakdown["Impact"],
        "projects": legacy_breakdown["Projects"],
        "quality": legacy_breakdown["Resume Quality"],
        "jd_match": jd_match["score"],
    }
    total = int(min(100, round(sum(legacy_breakdown.values()))))

    return {
        "total": total,
        "breakdown": legacy_breakdown,
        "weighted_breakdown": normalized_breakdown,
        "jd_match_score": jd_match["score"],
        "jd_skill_overlap": jd_match["skill_overlap"],
        "jd_missing_skills": jd_match["missing_skills"],
        "jd_common_skills": jd_match["common_skills"],
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
    jd_match_score: float = 0.0,
    jd_missing_skills: list[str] | None = None,
) -> list[str]:
    score_breakdown = score_breakdown or {}
    project_analysis = project_analysis or []
    adaptive_analysis = adaptive_analysis or {}
    jd_missing_skills = jd_missing_skills or []

    ranked: list[tuple[int, str]] = []
    ranked.extend((12, item) for item in contact_validation["suggestions"])

    if score_breakdown.get("Skills", WEIGHTS["Skills"]) < 18:
        missing = ", ".join(jd_missing_skills[:4])
        ranked.append((100, f"Add more relevant skills like {missing}." if missing else "Add more relevant technical skills and align them with the target role."))
    if score_breakdown.get("Experience", WEIGHTS["Experience"]) < 15:
        ranked.append((95, "Strengthen the experience section with clearer ownership, scope, and outcomes."))
    if score_breakdown.get("Impact", WEIGHTS["Impact"]) < 12 or not achievements.get("has_quantified_results"):
        ranked.append((98, "Include measurable achievements such as improved performance by 30% or reduced processing time by 20%."))
    if score_breakdown.get("Projects", WEIGHTS["Projects"]) < 9:
        ranked.append((90, "Add stronger project bullets that mention technologies used, implementation details, and outcomes."))
    if score_breakdown.get("Resume Quality", WEIGHTS["Resume Quality"]) < 6:
        ranked.append((84, "Improve wording with stronger action verbs and shorter, cleaner bullet points."))
    if jd_match_score and jd_match_score < 65:
        ranked.append((96, "Align your resume more closely with job description keywords and responsibilities."))

    for section, present in completeness["required"].items():
        if not present:
            ranked.append((82 if section == "experience" else 72, f"Add a stronger {section.title()} section."))

    for skill, item in evidence.items():
        if item.get("status") == "Limited Evidence":
            ranked.append((78, item["suggestion"]))

    ranked.extend((60, item) for item in quality["feedback"])

    if project_analysis and all(not project.get("detected_components") for project in project_analysis):
        ranked.append((74, "Expand project bullets to mention APIs, databases, deployment, architecture, or measurable outcomes."))

    if similarity_scores:
        best = similarity_scores[0]
        if best["score"] < 0.68:
            ranked.append((70, "Tailor your resume toward a specific target role so the strongest projects and skills align more clearly."))

    if adaptive_analysis.get("predicted_candidate_type") == "Fresher":
        ranked.append((66, "For fresher profiles, highlight projects, internships, certifications, and relevant coursework more explicitly."))
    elif adaptive_analysis.get("predicted_candidate_type") == "Experienced":
        ranked.append((66, "For experienced profiles, emphasize leadership scope, architecture decisions, and business impact."))

    deduped: list[str] = []
    seen = set()
    for _, item in sorted(ranked, key=lambda entry: (-entry[0], entry[1])):
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:12]


def _all_known_skills() -> set[str]:
    skills: set[str] = set(SKILL_ALIASES.keys())
    skills.update(SKILL_ALIASES.values())
    for category in SKILL_TAXONOMY.values():
        skills.update(item.lower() for item in category.keys())
    return skills


def _normalize_text(text: str) -> str:
    value = str(text or "").lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9+#./\s-]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _scale_to_weight(raw_score: float, weight: float, *, max_raw: float) -> float:
    if max_raw <= 0:
        return 0.0
    bounded = max(0.0, min(raw_score, max_raw))
    return min(weight, (bounded / max_raw) * weight)


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
