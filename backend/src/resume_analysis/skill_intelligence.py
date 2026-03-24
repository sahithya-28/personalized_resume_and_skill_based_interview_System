from __future__ import annotations

import re

from .semantic_utils import cosine_similarity, encode_texts
from .skill_catalog import IDEAL_PROFILE_TEXT, INTERVIEW_TOPIC_MAP, SKILL_ALIASES, SKILL_TAXONOMY, TECH_PATTERN_ALIASES


ACTION_WORDS = {
    "built", "developed", "implemented", "created", "optimized", "designed", "deployed",
    "integrated", "containerized", "automated", "trained", "analyzed", "led",
}


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
        evidence_locations: list[str] = []
        contexts = contextual_usage.get(skill, [])

        for section_name in ("skills", "projects", "experience", "achievements"):
            if _contains_phrase((sections.get(section_name) or "").lower(), low):
                evidence_locations.append(section_name)

        status = "Limited Evidence"
        if any(loc in evidence_locations for loc in ("projects", "experience")):
            status = "Strong Evidence"
        elif contexts or any(loc in evidence_locations for loc in ("achievements",)):
            status = "Moderate Evidence"

        confidence = {
            "Strong Evidence": 0.9,
            "Moderate Evidence": 0.65,
            "Limited Evidence": 0.35,
        }[status]

        suggestion = ""
        if status == "Limited Evidence":
            suggestion = f"Add a project or experience bullet showing how you used {skill}."
        elif status == "Moderate Evidence":
            suggestion = f"Strengthen {skill} by adding quantified implementation details."

        output[skill] = {
            "status": status,
            "confidence": confidence,
            "locations": sorted(set(evidence_locations)),
            "contexts": contexts[:4],
            "suggestion": suggestion,
        }
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
    blocks = [part.strip() for part in re.split(r"\n\s*\n", project_text) if part.strip()]
    projects: list[dict] = []
    for block in blocks:
        lines = [line.strip(" -\t") for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        header_offset = 1 if lines[0].strip().lower() in {"projects", "project"} and len(lines) > 1 else 0
        name = _extract_title(lines[header_offset])
        description_lines = lines[header_offset + 1:] if len(lines) > header_offset + 1 else [lines[header_offset]]
        description = " ".join(description_lines).strip()
        technologies = [skill for skill in skills if _contains_phrase(block.lower(), skill.lower())]
        projects.append({"project_name": name, "technologies": technologies, "description": description})
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
