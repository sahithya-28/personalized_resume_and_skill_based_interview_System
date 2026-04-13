from __future__ import annotations

import re

from .semantic_utils import cosine_similarity, encode_texts
from .skill_catalog import IDEAL_PROFILE_TEXT, INTERVIEW_TOPIC_MAP, SKILL_ALIASES, SKILL_TAXONOMY, TECH_PATTERN_ALIASES


ACTION_WORDS = {
    "built", "developed", "implemented", "created", "optimized", "designed", "deployed",
    "integrated", "containerized", "automated", "trained", "analyzed", "led",
}

ACTION_WORD_PATTERN = re.compile(
    r"\b(Built|Developed|Designed|Implemented|Created|Optimized|Integrated|Automated|Engineered|"
    r"Trained|Analyzed|Led|Focused|Leveraged|Applied|Improved|Evaluated)\b"
)
DATE_RANGE_PATTERN = re.compile(
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[–-]\s*"
    r"(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4})\b\.?$",
    re.IGNORECASE,
)


def extract_skills_with_semantics(sentences: list[str], sections: dict[str, str], doc: object | None = None) -> dict:
    direct_matches: dict[str, dict] = {}
    sentence_docs = _build_sentence_docs(doc)
    for sentence in sentences:
        lowered = sentence.lower()
        location = _detect_sentence_location(sentence, sections)
        sentence_doc = sentence_docs.get(sentence.lower())
        for category, skills in SKILL_TAXONOMY.items():
            for raw_skill in skills:
                skill = SKILL_ALIASES.get(raw_skill, raw_skill)
                if _contains_phrase(lowered, skill):
                    _update_match(direct_matches, skill, category, sentence, location, "direct", sentence_doc=sentence_doc)

                for alias_phrase in TECH_PATTERN_ALIASES.get(skill, []):
                    if alias_phrase in lowered:
                        _update_match(direct_matches, skill, category, sentence, location, "semantic", sentence_doc=sentence_doc)

    semantic_matches = semantic_skill_matching(sentences)
    for match in semantic_matches:
        skill = match["skill"]
        category = _find_skill_category(skill)
        sentence_doc = sentence_docs.get(match["sentence"].lower())
        _update_match(direct_matches, skill, category, match["sentence"], match["location"], "semantic", match["score"], sentence_doc=sentence_doc)

    categorized: dict[str, list[str]] = {}
    frequencies: dict[str, int] = {}
    contextual: dict[str, list[dict]] = {}

    for skill, item in direct_matches.items():
        display = _display(skill)
        categorized.setdefault(item["category"], []).append(display)
        frequencies[display] = len(item["sentences"])
        contextual[display] = item["contexts"]

    for category, values in categorized.items():
        categorized[category] = sorted(set(values))

    detected_skills = sorted({value for values in categorized.values() for value in values})
    return {
        "detected_skills": detected_skills,
        "categorized_skills": categorized,
        "frequencies": frequencies,
        "contextual_usage": contextual,
    }


def build_skill_evidence(skills: list[str], sections: dict[str, str], contextual_usage: dict[str, list[dict]]) -> dict[str, dict]:
    output: dict[str, dict] = {}
    for skill in skills:
        low = skill.lower()
        contexts = contextual_usage.get(skill, [])
        evidence_entry = _build_verified_skill_entry(skill, low, sections, contexts)
        if evidence_entry is None:
            continue
        output[skill] = evidence_entry
    return output


def analyze_skill_strength(skill_frequency: dict[str, int]) -> dict:
    strengths: dict[str, dict] = {}
    primary: list[str] = []
    secondary: list[str] = []
    for skill, count in sorted(skill_frequency.items(), key=lambda item: (-item[1], item[0])):
        label = "Weak"
        if count >= 4:
            label = "Strong"
            primary.append(skill)
        elif count >= 2:
            label = "Moderate"
            secondary.append(skill)
        strengths[skill] = {"mentions": count, "strength": label}
    return {
        "by_skill": strengths,
        "primary_skills": primary,
        "secondary_skills": secondary,
    }


def extract_projects(project_text: str, skills: list[str]) -> list[dict]:
    cleaned_project_text = str(project_text or "").strip()
    if not cleaned_project_text:
        return []

    raw_lines = [line.strip(" -\t") for line in cleaned_project_text.splitlines() if line.strip()]
    if not raw_lines:
        return []

    header = raw_lines[0].lower().rstrip(":")
    if header not in {"projects", "project", "project experience", "academic projects", "personal projects"}:
        return []

    bounded_lines = _trim_project_section_lines(raw_lines[1:])
    blocks = _split_project_blocks("\n".join(bounded_lines))
    projects: list[dict] = []
    for block in blocks:
        lines = [line.strip(" -\t") for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        name, inline_detail = _split_project_heading(lines[0])
        if not _is_valid_project_title(name):
            continue
        description_lines = ([inline_detail] if inline_detail else []) + lines[1:]
        bullets = _build_project_bullets(description_lines)
        if len(bullets) < 2:
            continue
        technologies = _extract_project_technologies(lines, skills)
        projects.append({"project_name": name, "technologies": technologies, "description": " ".join(bullets)})
    return projects[:10]


def suggest_interview_topics(skills: list[str]) -> list[str]:
    topics: list[str] = []
    seen = set()
    for skill in skills:
        for topic in INTERVIEW_TOPIC_MAP.get(skill.lower(), []):
            if topic not in seen:
                seen.add(topic)
                topics.append(topic)
    if not topics:
        topics = [f"{skill} fundamentals and real-world application questions" for skill in skills[:6]]
    return topics[:12]


def profile_similarity_analysis(text: str) -> list[dict]:
    texts = [text] + list(IDEAL_PROFILE_TEXT.values())
    labels = ["resume"] + list(IDEAL_PROFILE_TEXT.keys())
    matrix = encode_texts(texts)
    resume_vector = matrix[0]
    raw_scores = []
    for index, label in enumerate(labels[1:], start=1):
        score = cosine_similarity(resume_vector, matrix[index])
        raw_scores.append({"profile": label, "raw_score": score})

    if not raw_scores:
        return []

    min_score = min(item["raw_score"] for item in raw_scores)
    max_score = max(item["raw_score"] for item in raw_scores)
    span = max(max_score - min_score, 1e-9)

    results = []
    for item in raw_scores:
        normalized = 45 + ((item["raw_score"] - min_score) / span) * 50
        results.append({"profile": item["profile"], "score": round(normalized, 2)})
    return sorted(results, key=lambda item: item["score"], reverse=True)


def semantic_skill_matching(sentences: list[str]) -> list[dict]:
    candidates: list[dict] = []
    skill_defs = [(skill, definition) for category in SKILL_TAXONOMY.values() for skill, definition in category.items()]
    if not sentences or not skill_defs:
        return candidates

    all_texts = sentences + [definition for _, definition in skill_defs]
    vectors = encode_texts(all_texts)
    sentence_vectors = vectors[:len(sentences)]
    definition_vectors = vectors[len(sentences):]

    for sentence_index, sentence in enumerate(sentences):
        location = "general"
        lowered = sentence.lower()
        if "project" in lowered:
            location = "projects"
        elif "experience" in lowered or "intern" in lowered:
            location = "experience"
        for def_index, (skill, _) in enumerate(skill_defs):
            score = cosine_similarity(sentence_vectors[sentence_index], definition_vectors[def_index])
            if score >= 0.58 and not _contains_phrase(lowered, skill):
                candidates.append(
                    {
                        "skill": skill,
                        "score": round(score, 3),
                        "sentence": sentence,
                        "location": location,
                    }
                )
    deduped: dict[tuple[str, str], dict] = {}
    for item in candidates:
        key = (item["skill"], item["sentence"])
        if key not in deduped or item["score"] > deduped[key]["score"]:
            deduped[key] = item
    return list(deduped.values())[:30]


def _update_match(
    matches: dict[str, dict],
    skill: str,
    category: str,
    sentence: str,
    location: str,
    source: str,
    score: float | None = None,
    sentence_doc: object | None = None,
) -> None:
    payload = matches.setdefault(
        skill,
        {
            "category": category,
            "sentences": [],
            "contexts": [],
        },
    )
    payload["sentences"].append(sentence)
    payload["contexts"].append(
        {
            "sentence": sentence,
            "location": location,
            "source": source,
            "context": infer_context(sentence),
            "action": infer_skill_action(skill, sentence, sentence_doc),
            "score": round(score, 3) if score is not None else None,
        }
    )


def _build_verified_skill_entry(
    skill: str,
    low: str,
    sections: dict[str, str],
    contexts: list[dict],
) -> dict | None:
    evidence_candidates: list[dict] = []
    section_priority = {"projects": 4, "experience": 3, "certifications": 2, "achievements": 2, "general": 1, "skills": 0}
    skills_section_text = str(sections.get("skills") or "")

    for context in contexts:
        location = str(context.get("location") or "general").lower()
        sentence = str(context.get("sentence") or "").strip()
        if not sentence:
            continue
        if location not in {"projects", "experience", "certifications", "achievements"}:
            continue
        evidence_candidates.append(
            {
                "location": location,
                "sentence": sentence,
                "priority": section_priority.get(location, 1),
            }
        )

    for section_name in ("projects", "experience", "certifications", "achievements"):
        section_text = str(sections.get(section_name) or "")
        if not section_text or not _contains_phrase(section_text.lower(), low):
            continue
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", section_text):
            cleaned = sentence.strip(" -\t")
            if cleaned and _contains_phrase(cleaned.lower(), low):
                evidence_candidates.append(
                    {
                        "location": section_name,
                        "sentence": cleaned,
                        "priority": section_priority.get(section_name, 1),
                    }
                )

    if not evidence_candidates:
        if _contains_phrase(skills_section_text.lower(), low):
            return {
                "status": "Limited Evidence",
                "confidence": 0.35,
                "confidence_label": "low",
                "locations": ["skills"],
                "contexts": [],
                "source_section": "skills",
                "evidence_text": "Mentioned in technical skills section.",
                "suggestion": f"Add a project, certification, or experience bullet showing how you used {skill}.",
            }
        return None

    best = max(
        evidence_candidates,
        key=lambda item: (item["priority"], len(item["sentence"])),
    )
    locations = sorted({item["location"] for item in evidence_candidates if item["location"] != "skills"})
    if not locations:
        return None

    status = "Strong Evidence" if best["priority"] >= 3 else "Moderate Evidence"
    confidence = 0.92 if best["priority"] >= 4 else 0.84 if best["priority"] >= 3 else 0.68
    confidence_label = "high" if confidence >= 0.85 else "medium"
    suggestion = ""
    if status == "Moderate Evidence":
        suggestion = f"Strengthen {skill} with a project or experience bullet that includes measurable outcomes."

    return {
        "status": status,
        "confidence": confidence,
        "confidence_label": confidence_label,
        "locations": locations,
        "contexts": contexts[:4],
        "source_section": best["location"],
        "evidence_text": _truncate_evidence(best["sentence"]),
        "suggestion": suggestion,
    }


def infer_context(sentence: str) -> str:
    lowered = sentence.lower()
    if any(word in lowered for word in ("api", "backend", "service")):
        return "Backend Development"
    if any(word in lowered for word in ("frontend", "ui", "component")):
        return "Frontend Development"
    if any(word in lowered for word in ("model", "classification", "prediction", "analysis")):
        return "Data / Machine Learning"
    if any(word in lowered for word in ("deploy", "container", "cloud", "pipeline")):
        return "DevOps / Deployment"
    return "General Engineering"


def infer_skill_action(skill: str, sentence: str, sentence_doc: object | None = None) -> str:
    if sentence_doc is not None:
        for token in sentence_doc:
            token_text = getattr(token, "text", "").lower()
            if token_text == skill.lower():
                head = getattr(token, "head", None)
                lemma = getattr(head, "lemma_", "").lower() if head is not None else ""
                if lemma:
                    return lemma
        for token in sentence_doc:
            if getattr(token, "pos_", "") == "VERB":
                lemma = getattr(token, "lemma_", "").lower()
                if lemma in ACTION_WORDS:
                    return lemma

    lowered = sentence.lower()
    for word in ACTION_WORDS:
        if word in lowered:
            return word
    return "used"


def _extract_title(line: str) -> str:
    marker = re.match(r"(?i)project\s*[:\-]\s*(.+)", line.strip())
    if marker:
        return marker.group(1).strip()
    parts = [part.strip() for part in re.split(r"[|:]", line) if part.strip()]
    return parts[0] if parts else line.strip()


def _split_project_heading(line: str) -> tuple[str, str]:
    cleaned = str(line or "").strip().strip("•")
    if not cleaned:
        return "", ""

    base_title = _strip_project_date(_extract_title(cleaned))
    match = re.match(
        r"^(?P<title>.+?)(?:[.:\-]\s*|\s+)(?P<detail>(?:Built|Developed|Designed|Implemented|Created|Optimized|"
        r"Integrated|Automated|Engineered|Trained|Analyzed|Led|Focused|Leveraged|Applied|Improved|Evaluated).*)$",
        base_title,
        flags=re.IGNORECASE,
    )
    if match:
        return match.group("title").strip(" .:-"), match.group("detail").strip()

    return base_title.strip(" .:-"), ""


def _strip_project_date(text: str) -> str:
    cleaned = str(text or "").strip()
    while True:
        updated = DATE_RANGE_PATTERN.sub("", cleaned).strip(" .:-")
        if updated == cleaned:
            break
        cleaned = updated
    return cleaned


def _detect_sentence_location(sentence: str, sections: dict[str, str]) -> str:
    lowered = sentence.lower()
    for section_name, section_text in sections.items():
        if lowered and lowered in (section_text or "").lower():
            return section_name
    return "general"


def _find_skill_category(skill: str) -> str:
    for category, skills in SKILL_TAXONOMY.items():
        if skill in skills:
            return category
    return "Concepts"


def _contains_phrase(text: str, phrase: str) -> bool:
    pattern = rf"(?<![A-Za-z0-9]){re.escape(phrase).replace(r'\\ ', r'\\s+')}(?![A-Za-z0-9])"
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def _display(skill: str) -> str:
    if skill in {"c++", "c#", "sql", "aws", "gcp", "nlp", "oop", "ci/cd"}:
        return skill.upper()
    return " ".join(part.capitalize() for part in skill.split())


def _build_sentence_docs(doc: object | None) -> dict[str, object]:
    if doc is None or not hasattr(doc, "sents"):
        return {}
    output: dict[str, object] = {}
    for sent in doc.sents:
        text = sent.text.strip().lower()
        if text:
            output[text] = sent
    return output


def _split_project_blocks(project_text: str) -> list[str]:
    lines = [line.strip(" -\t") for line in str(project_text or "").splitlines() if line.strip()]
    if not lines:
        return []

    blocks: list[list[str]] = []
    current: list[str] = []
    current_has_detail = False
    for line in lines:
        if line.lower().rstrip(":") in {"projects", "project", "project experience", "academic projects", "personal projects"}:
            continue
        title_candidate, inline_detail = _split_project_heading(line)
        is_title = _is_valid_project_title(title_candidate) and _looks_like_project_title(line)
        if is_title and current and current_has_detail:
            blocks.append(current)
            current = [line]
            current_has_detail = bool(inline_detail)
            continue
        if is_title:
            if current:
                blocks.append(current)
            current = [line]
            current_has_detail = bool(inline_detail)
            continue
        if not current:
            current = [line]
        else:
            current.append(line)
        if _looks_like_project_detail(line):
            current_has_detail = True

    if current:
        blocks.append(current)

    return ["\n".join(block) for block in blocks if block]


def _trim_project_section_lines(lines: list[str]) -> list[str]:
    trimmed: list[str] = []
    stop_headers = {
        "certifications",
        "certifications and activities",
        "certifications and achievements",
        "activities",
        "achievements",
        "skills",
        "education",
        "experience",
        "summary",
    }
    for line in lines:
        lowered = line.lower().rstrip(":")
        if lowered in stop_headers:
            break
        trimmed.append(line)
    return trimmed


def _looks_like_project_title(line: str) -> bool:
    cleaned = str(line or "").strip()
    title_candidate, inline_detail = _split_project_heading(cleaned)
    lowered = cleaned.lower()
    normalized_title = title_candidate.lower()
    if not cleaned or not title_candidate:
        return False
    if lowered.startswith("tech stack") or normalized_title.startswith("tech stack"):
        return False
    if cleaned.startswith("•"):
        return False
    if "@" in lowered or "linkedin" in lowered or "github" in lowered or re.search(r"\d{10}", lowered):
        return False
    if normalized_title.startswith(("summary", "education", "skills", "certifications", "experience")):
        return False
    if "activities" in normalized_title or "achievements" in normalized_title:
        return False
    if cleaned.endswith(".") and not inline_detail:
        return False
    if any(token in normalized_title for token in ("engineered", "developed", "designed", "architected", "conducted", "provided", "improved", "automated", "reduced")):
        return False
    words = title_candidate.split()
    if 1 <= len(words) <= 12 and (any(char.isupper() for char in title_candidate) or re.search(r"[A-Z][a-z]+[A-Z]", title_candidate)):
        return True
    return False


def _is_valid_project_title(title: str) -> bool:
    cleaned = str(title or "").strip()
    lowered = cleaned.lower()
    if not cleaned:
        return False
    word_count = len(cleaned.split())
    if not (1 <= word_count <= 12):
        return False
    if word_count == 1 and not (re.search(r"[A-Z][a-z]+[A-Z]", cleaned) or len(cleaned) >= 10):
        return False
    if "@" in lowered or "linkedin" in lowered or "github" in lowered:
        return False
    if cleaned.count("(") != cleaned.count(")"):
        return False
    if "," in cleaned and len(cleaned.split()) <= 3:
        return False
    if cleaned.endswith("."):
        return False
    if lowered.startswith(("implemented", "developed", "designed", "engineered", "summary", "education", "skills", "certifications", "experience")):
        return False
    return True


def _build_project_bullets(lines: list[str]) -> list[str]:
    bullets: list[str] = []
    seen = set()
    for line in lines:
        cleaned = str(line or "").strip(" -\t")
        lowered = cleaned.lower()
        if not cleaned or lowered.startswith("tech stack"):
            continue
        if "@" in lowered or "linkedin" in lowered or "github" in lowered:
            continue
        if _looks_like_project_title(cleaned):
            continue
        if _looks_like_section_header(cleaned):
            break
        normalized_line = re.sub(
            r"\b(app|system|platform|dashboard|website|project)\s+(?=(Built|Developed|Designed|Implemented|Engineered|Automated|Created|Optimized)\b)",
            r"\1. ",
            cleaned,
            flags=re.IGNORECASE,
        )
        parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", normalized_line)
        for part in parts:
            bullet = part.strip(" -\t")
            bullet_lower = bullet.lower()
            if not bullet or len(bullet.split()) < 3:
                continue
            if _looks_like_project_title(bullet):
                continue
            if bullet_lower in seen:
                continue
            seen.add(bullet_lower)
            bullets.append(_normalize_project_bullet(bullet))
    return bullets[:5]


def _normalize_project_bullet(text: str) -> str:
    words = str(text or "").split()
    trimmed = " ".join(words[:20]).rstrip(",.;:")
    if not trimmed:
        return ""
    first = trimmed.split()[0].lower()
    if first in ACTION_WORDS:
        return trimmed[0].upper() + trimmed[1:]
    if re.match(r"(?i)^(engineered|developed|designed|implemented|architected|automated|created|optimized|improved|conducted|provided)\b", trimmed):
        return trimmed[0].upper() + trimmed[1:]
    return f"Implemented {trimmed[0].lower() + trimmed[1:]}"


def _extract_project_technologies(lines: list[str], skills: list[str]) -> list[str]:
    detected: list[str] = []
    for line in lines:
        cleaned = str(line or "").strip()
        lowered = cleaned.lower()
        if lowered.startswith("tech stack"):
            tech_part = cleaned.split(":", 1)[1] if ":" in cleaned else cleaned
            for piece in [part.strip(" .") for part in re.split(r"[,/|]", tech_part) if part.strip()]:
                if piece not in detected:
                    detected.append(piece)

    combined = " ".join(lines).lower()
    for skill in skills:
        if _contains_phrase(combined, skill.lower()) and skill not in detected:
            detected.append(skill)
    return detected[:8]


def _looks_like_section_header(text: str) -> bool:
    lowered = str(text or "").strip().lower().rstrip(":")
    return lowered in {
        "certifications",
        "certifications and activities",
        "certifications and achievements",
        "activities",
        "skills",
        "education",
        "experience",
        "summary",
        "achievements",
    }


def _looks_like_project_detail(text: str) -> bool:
    lowered = str(text or "").strip().lower()
    return bool(lowered) and (
        lowered.startswith(("built", "developed", "designed", "implemented", "refactored", "improved", "integrated", "created", "engineered", "tested"))
        or lowered.startswith("tech stack")
        or lowered.startswith("•")
    )


def _truncate_evidence(text: str) -> str:
    words = str(text or "").split()
    if len(words) <= 18:
        return " ".join(words)
    return " ".join(words[:18]).rstrip(",.;:") + "..."
