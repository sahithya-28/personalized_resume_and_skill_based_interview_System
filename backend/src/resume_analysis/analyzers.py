from __future__ import annotations

import re

from .skill_catalog import INTERVIEW_TOPIC_MAP, SKILL_ALIASES, SKILL_CATALOG


def extract_and_categorize_skills(text: str) -> tuple[list[str], dict[str, list[str]], dict[str, int]]:
    lower = text.lower()
    categorized: dict[str, list[str]] = {}
    frequencies: dict[str, int] = {}

    for category, skills in SKILL_CATALOG.items():
        found: list[str] = []
        for raw_skill in skills:
            skill = SKILL_ALIASES.get(raw_skill.lower(), raw_skill.lower())
            mentions = _count_skill_occurrences(lower, skill)
            if mentions:
                canonical = _display_skill(skill)
                found.append(canonical)
                frequencies[canonical] = frequencies.get(canonical, 0) + mentions
        if found:
            categorized[category] = sorted(set(found))

    all_skills = sorted(categorized_skill for skills in categorized.values() for categorized_skill in skills)
    return all_skills, categorized, frequencies


def verify_skills(skills: list[str], sections: dict[str, str]) -> dict[str, dict]:
    projects = (sections.get("projects") or "").lower()
    experience = (sections.get("experience") or "").lower()
    achievements = (sections.get("achievements") or "").lower()
    skills_block = (sections.get("skills") or "").lower()

    verification: dict[str, dict] = {}
    for skill in skills:
        low = skill.lower()
        evidence: list[str] = []
        if _skill_in_text(low, projects):
            evidence.append("projects")
        if _skill_in_text(low, experience):
            evidence.append("experience")
        if _skill_in_text(low, achievements):
            evidence.append("achievements")

        if evidence:
            confidence = round(min(1.0, 0.5 + 0.2 * len(evidence)), 2)
            verification[skill] = {
                "status": "Verified",
                "confidence": confidence,
                "evidence": evidence,
                "note": f"Mentioned in {', '.join(evidence)}",
            }
        elif _skill_in_text(low, skills_block):
            verification[skill] = {
                "status": "Weak claim",
                "confidence": 0.35,
                "evidence": ["skills"],
                "note": "Mentioned only in skills section",
            }
        else:
            verification[skill] = {
                "status": "Unverified",
                "confidence": 0.15,
                "evidence": [],
                "note": "No supporting context found",
            }
    return verification


def analyze_skill_strength(skill_frequency: dict[str, int]) -> dict:
    strengths: dict[str, dict] = {}
    primary: list[str] = []
    secondary: list[str] = []

    for skill, count in sorted(skill_frequency.items(), key=lambda x: (-x[1], x[0])):
        if count >= 4:
            level = "Strong"
            primary.append(skill)
        elif count >= 2:
            level = "Moderate"
            secondary.append(skill)
        else:
            level = "Weak"
        strengths[skill] = {"mentions": count, "strength": level}

    return {
        "by_skill": strengths,
        "primary_skills": primary,
        "secondary_skills": secondary,
    }


def extract_projects(projects_text: str, known_skills: list[str]) -> list[dict]:
    text = projects_text.strip()
    if not text:
        return []

    blocks = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    projects: list[dict] = []
    for block in blocks:
        lines = [line.strip(" -\t") for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        title = _extract_project_title(lines[0])
        techs = [skill for skill in known_skills if _skill_in_text(skill.lower(), block.lower())]
        description = " ".join(lines[1:]).strip() if len(lines) > 1 else lines[0]
        projects.append(
            {
                "project_name": title,
                "technologies": techs,
                "description": description,
            }
        )
    return projects[:10]


def validate_contact_info(contact: dict[str, str]) -> dict:
    checks = {
        "email": bool(contact.get("email")),
        "phone": bool(contact.get("phone")),
        "linkedin": bool(contact.get("linkedin")),
        "github": bool(contact.get("github")),
    }
    missing = [field for field, ok in checks.items() if not ok]
    suggestions = [f"Add {field.title()} to contact section." for field in missing]
    return {"checks": checks, "missing": missing, "suggestions": suggestions}


def section_completeness(sections: dict[str, str]) -> dict:
    required = ["education", "skills", "projects", "experience", "certifications"]
    completeness = {name: bool((sections.get(name) or "").strip()) for name in required}
    present = sum(1 for value in completeness.values() if value)
    score = round((present / len(required)) * 100, 2)
    return {"required": completeness, "score": score}


def compute_resume_score(contact_validation: dict, sections: dict[str, str]) -> dict:
    contact_points = _contact_points(contact_validation)
    education_points = 20 if (sections.get("education") or "").strip() else 0
    skills_points = 20 if (sections.get("skills") or "").strip() else 0
    project_points = 20 if (sections.get("projects") or "").strip() else 0
    experience_points = 20 if (sections.get("experience") or "").strip() else 0
    cert_points = 10 if (sections.get("certifications") or "").strip() else 0

    breakdown = {
        "Contact Information": contact_points,
        "Education": education_points,
        "Skills": skills_points,
        "Projects": project_points,
        "Experience": experience_points,
        "Certifications": cert_points,
    }
    total = int(sum(breakdown.values()))
    return {"total": total, "breakdown": breakdown}


def keyword_density(total_tokens: list[str], skill_frequency: dict[str, int]) -> dict:
    total_words = len(total_tokens)
    technical_keywords = int(sum(skill_frequency.values()))
    density = round((technical_keywords / total_words) * 100, 2) if total_words else 0.0
    feedback = "Good technical density."
    if density < 8:
        feedback = "Low technical density. Add concrete technologies and implementation details."
    elif density > 30:
        feedback = "Very high keyword density. Ensure claims are supported by project context."

    return {
        "total_words": total_words,
        "technical_keywords": technical_keywords,
        "technical_density": density,
        "feedback": feedback,
    }


def suggest_interview_topics(skills: list[str]) -> list[str]:
    topics: list[str] = []
    seen = set()
    for skill in skills:
        for topic in INTERVIEW_TOPIC_MAP.get(skill.lower(), []):
            if topic not in seen:
                seen.add(topic)
                topics.append(topic)
    if not topics and skills:
        topics = [f"{skill} fundamentals and real-world use-cases" for skill in skills[:5]]
    return topics[:12]


def generate_improvement_suggestions(
    sections: dict[str, str],
    contact_validation: dict,
    skill_verification: dict[str, dict],
    projects: list[dict],
) -> list[str]:
    suggestions: list[str] = []
    if contact_validation["missing"]:
        suggestions.extend(contact_validation["suggestions"])

    if not (sections.get("experience") or "").strip():
        suggestions.append("Add internship or experience details with impact and ownership.")

    achievements_text = (sections.get("achievements") or "") + "\n" + (sections.get("experience") or "")
    if not re.search(r"\b\d+%|\b\d+\+?|\b\d+\s*(users|clients|projects|months|years)\b", achievements_text.lower()):
        suggestions.append("Add quantified achievements (percent improvement, user scale, delivery metrics).")

    weak_claims = [skill for skill, item in skill_verification.items() if item["status"] != "Verified"]
    if weak_claims:
        suggestions.append(f"Support these skills with project/experience context: {', '.join(weak_claims[:6])}.")

    if projects and all(not p.get("technologies") for p in projects):
        suggestions.append("Mention tools and frameworks used in each project.")

    if projects and not any("github.com/" in (p.get("description") or "").lower() for p in projects):
        suggestions.append("Add GitHub repository links for major projects.")

    if not (sections.get("certifications") or "").strip():
        suggestions.append("Add certifications relevant to your target role.")

    return list(dict.fromkeys(suggestions))[:10]


def build_visualization_payload(
    categorized_skills: dict[str, list[str]],
    score: dict,
    completeness: dict,
    strength: dict,
) -> dict:
    return {
        "skill_distribution": {
            "labels": list(categorized_skills.keys()),
            "values": [len(values) for values in categorized_skills.values()],
        },
        "score_breakdown": {
            "labels": list(score["breakdown"].keys()),
            "values": list(score["breakdown"].values()),
        },
        "section_completeness": {
            "labels": list(completeness["required"].keys()),
            "values": [1 if v else 0 for v in completeness["required"].values()],
        },
        "skill_strength": {
            "labels": list(strength["by_skill"].keys())[:12],
            "values": [item["mentions"] for item in list(strength["by_skill"].values())[:12]],
        },
    }


def _count_skill_occurrences(text: str, skill: str) -> int:
    escaped = re.escape(skill).replace(r"\ ", r"\s+")
    pattern = rf"(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])"
    return len(re.findall(pattern, text, flags=re.IGNORECASE))


def _display_skill(skill: str) -> str:
    if skill in {"c++", "c#", "sql", "aws", "gcp", "nlp", "oop", "ci/cd"}:
        return skill.upper()
    return " ".join(word.capitalize() for word in skill.split())


def _skill_in_text(skill: str, text: str) -> bool:
    escaped = re.escape(skill).replace(r"\ ", r"\s+")
    pattern = rf"(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])"
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def _extract_project_title(line: str) -> str:
    line = line.strip()
    marker = re.match(r"(?i)project\s*[:\-]\s*(.+)", line)
    if marker:
        return marker.group(1).strip()
    parts = [part.strip() for part in re.split(r"[|:]", line) if part.strip()]
    return parts[0] if parts else line


def _contact_points(contact_validation: dict) -> int:
    checks = contact_validation.get("checks", {})
    mandatory = ["email", "phone"]
    optional = ["linkedin", "github"]
    points = 0
    points += sum(3 for key in mandatory if checks.get(key))
    points += sum(2 for key in optional if checks.get(key))
    return min(10, points)
