from __future__ import annotations

import math
import re
from functools import lru_cache

from .semantic_utils import rank_similarity
from .skill_catalog import IDEAL_PROFILE_TEXT, JOB_TITLE_HINTS, SKILL_TAXONOMY

COMPLEXITY_COMPONENTS: dict[str, list[str]] = {
    "REST APIs": ["rest api", "restful", "endpoint", "api gateway"],
    "Authentication": ["auth", "authentication", "authorization", "oauth", "jwt", "login"],
    "Database": ["mysql", "postgresql", "mongodb", "database", "sql", "redis"],
    "Backend Framework": ["spring", "django", "flask", "fastapi", "express", "node.js"],
    "Frontend": ["react", "angular", "vue", "frontend", "ui"],
    "Cloud / DevOps": ["docker", "kubernetes", "aws", "azure", "gcp", "pipeline", "ci/cd"],
    "Distributed Systems": ["microservices", "distributed", "queue", "stream", "scalable"],
    "Data / ML": ["machine learning", "model", "prediction", "nlp", "analytics"],
}

ROLE_PROFILE_HINTS: dict[str, list[str]] = {
    "Backend Developer": ["rest api", "spring boot", "fastapi", "sql", "microservices", "backend"],
    "Data Scientist": ["machine learning", "pandas", "sklearn", "tensorflow", "statistics", "nlp"],
    "Machine Learning Engineer": ["tensorflow", "pytorch", "mlops", "model deployment", "feature engineering", "machine learning"],
    "AI Engineer": ["llm", "generative ai", "rag", "nlp", "ai agent", "prompt engineering"],
    "Frontend Developer": ["react", "javascript", "typescript", "css", "frontend", "ui"],
    "DevOps Engineer": ["docker", "kubernetes", "aws", "terraform", "jenkins", "linux"],
}

ROLE_SCORING_RULES: dict[str, dict[str, list[str] | float]] = {
    "Data Scientist": {
        "skills": ["python", "machine learning", "data analysis", "pandas", "numpy", "statistics", "sklearn", "tensorflow", "pytorch"],
        "projects": ["machine learning", "model", "prediction", "classification", "analytics", "data", "visualization"],
        "summary": ["data scientist", "data analysis", "machine learning", "statistics", "nlp"],
        "experience": ["data scientist", "data analyst", "ml engineer", "research"],
    },
    "Machine Learning Engineer": {
        "skills": ["python", "machine learning", "tensorflow", "pytorch", "keras", "mlops", "feature engineering", "model deployment", "fastapi", "flask"],
        "projects": ["model", "deployment", "mlops", "training", "inference", "pipeline", "feature engineering", "tensorflow", "pytorch"],
        "summary": ["machine learning engineer", "ml engineer", "model deployment", "mlops", "training pipeline"],
        "experience": ["machine learning engineer", "ml engineer", "ai engineer", "data scientist"],
    },
    "AI Engineer": {
        "skills": ["python", "nlp", "deep learning", "transformers", "llm", "generative ai", "rag", "prompt engineering", "tensorflow", "pytorch"],
        "projects": ["llm", "generative ai", "nlp", "chatbot", "transformer", "rag", "agent", "deep learning"],
        "summary": ["ai engineer", "generative ai", "llm", "nlp", "artificial intelligence"],
        "experience": ["ai engineer", "ml engineer", "nlp engineer", "research engineer"],
    },
    "Backend Developer": {
        "skills": ["java", "spring boot", "node.js", "api", "apis", "database", "sql", "mysql", "postgresql", "system design", "backend", "flask", "fastapi", "django"],
        "projects": ["spring boot", "rest api", "backend", "authentication", "database", "system", "microservices"],
        "summary": ["backend developer", "backend", "api", "server-side", "databases"],
        "experience": ["backend developer", "software engineer", "java developer", "api developer"],
    },
    "Frontend Developer": {
        "skills": ["html", "css", "javascript", "react", "typescript", "ui", "ux", "frontend", "angular", "vue"],
        "projects": ["frontend", "ui", "responsive", "component", "react", "javascript", "css", "website"],
        "summary": ["frontend developer", "frontend", "ui", "ux", "responsive design"],
        "experience": ["frontend developer", "ui developer", "react developer", "web developer"],
    },
    "DevOps Engineer": {
        "skills": ["docker", "kubernetes", "ci/cd", "aws", "linux", "terraform", "jenkins", "cloud", "deployment", "monitoring"],
        "projects": ["docker", "kubernetes", "pipeline", "deployment", "cloud", "infrastructure", "automation"],
        "summary": ["devops engineer", "cloud", "infrastructure", "automation", "deployment"],
        "experience": ["devops engineer", "site reliability", "platform engineer", "cloud engineer"],
    },
}

STRICT_DEVOPS_TOOLS = {
    "docker",
    "kubernetes",
    "ci/cd",
    "aws",
    "linux",
    "terraform",
    "jenkins",
}

STRONG_DATA_SCIENCE_PROJECT_TERMS = {
    "machine learning",
    "deep learning",
    "lstm",
    "tensorflow",
    "keras",
    "pandas",
    "numpy",
    "data analysis",
    "prediction",
    "classification",
}


def estimate_project_complexity(projects: list[dict]) -> list[dict]:
    enriched: list[dict] = []
    for project in projects:
        text = f"{project.get('project_name', '')} {project.get('description', '')} {' '.join(project.get('technologies', []))}".lower()
        components = [
            name
            for name, keywords in COMPLEXITY_COMPONENTS.items()
            if any(keyword in text for keyword in keywords)
        ]
        score = len(components) * 1.6
        if any(keyword in text for keyword in ("microservices", "distributed", "pipeline", "kubernetes")):
            score += 1.2
        if any(keyword in text for keyword in ("oauth", "jwt", "encryption", "authentication")):
            score += 0.8

        level = "Low"
        if score >= 7:
            level = "High"
        elif score >= 4:
            level = "Medium-High"
        elif score >= 2:
            level = "Medium"

        enriched.append(
            {
                **project,
                "detected_components": components,
                "complexity_score": round(score, 2),
                "complexity_level": level,
            }
        )
    return enriched


def build_knowledge_graph(candidate_name: str, skills: list[str], projects: list[dict], entities: dict) -> dict:
    nodes: list[dict] = []
    edges: list[dict] = []

    def add_node(node_id: str, label: str, node_type: str) -> None:
        if not any(node["id"] == node_id for node in nodes):
            nodes.append({"id": node_id, "label": label, "type": node_type})

    candidate_id = "candidate"
    add_node(candidate_id, candidate_name or "Candidate", "candidate")

    for skill in skills:
        skill_id = f"skill::{skill.lower()}"
        add_node(skill_id, skill, "skill")
        edges.append({"source": candidate_id, "target": skill_id, "relation": "has_skill"})

    for organization in entities.get("organizations", []):
        org_id = f"org::{organization.lower()}"
        add_node(org_id, organization, "organization")
        edges.append({"source": candidate_id, "target": org_id, "relation": "associated_with"})

    for project in projects:
        project_name = project.get("project_name") or "Project"
        project_id = f"project::{project_name.lower()}"
        add_node(project_id, project_name, "project")
        edges.append({"source": candidate_id, "target": project_id, "relation": "worked_on"})
        for tech in project.get("technologies", []):
            tech_id = f"skill::{tech.lower()}"
            add_node(tech_id, tech, "skill")
            edges.append({"source": project_id, "target": tech_id, "relation": "uses"})
        for component in project.get("detected_components", []):
            component_id = f"component::{component.lower()}"
            add_node(component_id, component, "component")
            edges.append({"source": project_id, "target": component_id, "relation": "includes"})

    graph_payload = {"nodes": nodes, "edges": edges}

    try:
        import networkx as nx

        graph = nx.Graph()
        for node in nodes:
            graph.add_node(node["id"], **node)
        for edge in edges:
            graph.add_edge(edge["source"], edge["target"], relation=edge["relation"])
        positions = nx.spring_layout(graph, seed=42) if graph.number_of_nodes() else {}
        graph_payload["layout"] = {
            node_id: {"x": round(float(pos[0]), 4), "y": round(float(pos[1]), 4)}
            for node_id, pos in positions.items()
        }
    except Exception:
        graph_payload["layout"] = {}

    return graph_payload


def infer_related_concepts(sentences: list[str], detected_skills: list[str]) -> list[dict]:
    concept_definitions = {
        "Backend Engineering": "designing backend services, APIs, database backed systems, and server side architecture",
        "System Design": "designing scalable architectures, distributed systems, and reliable technical platforms",
        "Microservices": "building independently deployable services, APIs, and service based platforms",
        "Deployment / DevOps": "deploying applications, containerizing services, and managing cloud environments",
        "Data Science": "analyzing data, building predictive models, and training machine learning systems",
    }

    ranked = rank_similarity(" ".join(sentences[:20]), concept_definitions)
    existing = {skill.lower() for skill in detected_skills}
    concepts = []
    for item in ranked:
        if item["score"] < 0.23:
            continue
        if item["label"].lower() in existing:
            continue
        concepts.append({"concept": item["label"], "similarity": round(item["score"], 4)})
    return concepts[:6]


def extract_career_timeline(sections: dict[str, str], entities: dict, doc: object | None = None) -> dict:
    experience_text = (sections.get("experience") or "") + "\n" + (sections.get("internships") or "")
    if not experience_text.strip():
        return {"timeline": [], "total_years_experience": 0.0}

    lines = [line.strip(" -\t") for line in experience_text.splitlines() if line.strip()]
    timeline = []

    for index, line in enumerate(lines):
        years = re.findall(r"(20\d{2}|19\d{2})", line)
        date_range = _extract_date_range(line)
        title = _find_job_title(line)
        organization = _find_organization(line, entities.get("organizations", []))

        if not years and date_range is None and not title:
            continue

        start_year = int(years[0]) if years else (date_range[0] if date_range else None)
        end_year = int(years[-1]) if len(years) > 1 else (date_range[1] if date_range else start_year)
        if end_year is None:
            end_year = start_year

        if not title and index + 1 < len(lines):
            title = _find_job_title(lines[index + 1])
        timeline.append(
            {
                "year": start_year,
                "end_year": end_year,
                "role": title or "Role not identified",
                "organization": organization or "Organization not identified",
                "entry_type": "Internship" if "intern" in line.lower() or "intern" in (title or "").lower() else "Experience",
                "source": line,
            }
        )

    timeline = sorted(
        [item for item in timeline if item["year"] is not None],
        key=lambda item: (item["year"], item["end_year"] or item["year"]),
    )

    total_years = 0.0
    for item in timeline:
        end_year = item["end_year"] or item["year"]
        total_years += max(0, (end_year - item["year"]) + 1)

    return {"timeline": timeline, "total_years_experience": round(total_years, 1)}


def build_adaptive_analysis(candidate_type: dict, timeline: dict, achievements: dict, projects: list[dict], sections: dict[str, str]) -> dict:
    predicted = candidate_type.get("predicted_category", "Fresher")
    focus_areas = []
    if predicted == "Fresher":
        focus_areas = ["Projects", "Technical skills", "Internships", "Education", "Certifications"]
        narrative = "Analysis prioritized project quality, skill evidence, internships, and academic signals because the candidate appears to be early-career."
    else:
        focus_areas = ["Work experience", "Career progression", "Technical leadership", "Architecture exposure", "Impact statements"]
        narrative = "Analysis prioritized work history, leadership scope, architecture exposure, and measurable business impact because the candidate appears to have professional experience."

    return {
        "predicted_candidate_type": predicted,
        "focus_areas": focus_areas,
        "narrative": narrative,
        "timeline_strength": "Strong" if len(timeline.get("timeline", [])) >= 2 else "Limited",
        "impact_signal": "Strong" if achievements.get("has_quantified_results") else "Needs improvement",
        "project_signal": "Strong" if any(project.get("complexity_score", 0) >= 4 for project in projects) else "Moderate",
        "experience_section_present": bool((sections.get("experience") or "").strip()),
    }


def estimate_ml_resume_strength(
    *,
    skill_count: int,
    project_count: int,
    avg_project_complexity: float,
    technical_keyword_density: float,
    achievement_count: int,
    experience_years: float,
    strong_evidence_count: int,
    completeness_score: float,
) -> dict:
    features = [[
        float(skill_count),
        float(project_count),
        float(avg_project_complexity),
        float(technical_keyword_density),
        float(achievement_count),
        float(experience_years),
        float(strong_evidence_count),
        float(completeness_score),
    ]]
    model = _get_strength_regressor()
    score = float(model.predict(features)[0])
    bounded = max(0.0, min(1.0, score))
    return {
        "score": round(bounded, 4),
        "label": "Strong" if bounded >= 0.75 else "Moderate" if bounded >= 0.55 else "Needs Improvement",
        "features": {
            "skill_count": skill_count,
            "project_count": project_count,
            "avg_project_complexity": round(avg_project_complexity, 2),
            "technical_keyword_density": round(technical_keyword_density, 2),
            "achievement_count": achievement_count,
            "experience_years": round(experience_years, 2),
            "strong_evidence_count": strong_evidence_count,
            "completeness_score": round(completeness_score, 2),
        },
    }


def compare_resume_to_profiles(text: str) -> list[dict]:
    results = rank_similarity(text, IDEAL_PROFILE_TEXT)
    normalized = []
    if not results:
        return normalized

    min_score = min(item["score"] for item in results)
    max_score = max(item["score"] for item in results)
    span = max(max_score - min_score, 1e-9)
    for item in results:
        scaled = 0.45 + ((item["score"] - min_score) / span) * 0.5
        normalized.append({"profile": item["label"], "score": round(scaled, 4)})
    return normalized


def score_resume_roles(
    *,
    sections: dict[str, str],
    skills: list[str],
    projects: list[dict],
    summary_text: str,
    timeline: dict,
) -> dict:
    normalized_skills = {str(skill or "").strip().lower() for skill in skills if str(skill or "").strip()}
    normalized_skills_blob = " ".join(sorted(normalized_skills))
    project_blob = " ".join(
        f"{project.get('project_name', '')} {project.get('description', '')} {' '.join(project.get('technologies', []))}"
        for project in projects
    ).lower()
    summary_blob = str(summary_text or sections.get("summary") or "").lower()
    experience_blob = str(sections.get("experience") or "").lower()
    internship_blob = str(sections.get("internships") or "").lower()
    combined_experience_blob = f"{experience_blob} {internship_blob}".strip()
    devops_evidence_present = any(tool in normalized_skills_blob for tool in STRICT_DEVOPS_TOOLS) or any(
        tool in project_blob or tool in combined_experience_blob for tool in STRICT_DEVOPS_TOOLS
    )
    strong_data_science_project_signal = any(term in project_blob for term in STRONG_DATA_SCIENCE_PROJECT_TERMS)

    raw_scores: dict[str, float] = {}
    for role, rules in ROLE_SCORING_RULES.items():
        score = 0.0

        for keyword in rules["skills"]:
            if keyword in normalized_skills or any(keyword in skill for skill in normalized_skills):
                score += 8.0

        for keyword in rules["projects"]:
            if keyword in project_blob:
                score += 14.0

        for keyword in rules["summary"]:
            if keyword in summary_blob:
                score += 4.0

        for keyword in rules["experience"]:
            if keyword in combined_experience_blob:
                score += 14.0

        if role == "Backend Developer" and any(word in experience_blob for word in ("api", "backend", "spring", "database")):
            score += 8.0
        if role == "Frontend Developer" and any(word in project_blob for word in ("ui", "frontend", "react", "css")):
            score += 8.0
        if role == "Data Scientist" and any(word in project_blob for word in ("analysis", "model", "prediction", "dataset")):
            score += 8.0
        if role == "Machine Learning Engineer" and any(word in project_blob for word in ("deployment", "pipeline", "training", "inference", "model")):
            score += 10.0
        if role == "AI Engineer" and any(word in project_blob for word in ("nlp", "llm", "generative ai", "transformer", "agent", "rag")):
            score += 12.0
        if role == "DevOps Engineer" and any(word in project_blob for word in ("docker", "deployment", "cloud", "pipeline")):
            score += 8.0
        if role == "Data Scientist" and strong_data_science_project_signal:
            score += 22.0
        if role == "Machine Learning Engineer" and strong_data_science_project_signal:
            score += 16.0
        if role == "Backend Developer" and any(word in project_blob for word in ("flask", "express", "rest api", "database", "mysql", "postgresql")):
            score += 12.0
        if role == "DevOps Engineer" and not devops_evidence_present:
            score = min(score, 8.0)
        if role == "DevOps Engineer" and devops_evidence_present:
            score += 18.0

        raw_scores[role] = score

    max_score = max(raw_scores.values()) if raw_scores else 0.0
    normalized_scores: dict[str, int] = {}
    for role, score in raw_scores.items():
        baseline = 12 if score > 0 else 0
        normalized = round((score / max_score) * 88 + baseline) if max_score > 0 else 0
        normalized_scores[role] = int(max(0, min(100, normalized)))

    ranked = sorted(normalized_scores.items(), key=lambda item: (-item[1], item[0]))
    if ranked:
        leader_role, leader_score = ranked[0]
        normalized_scores[leader_role] = max(leader_score, min(100, leader_score + 3))

    role_scores = [{"profile": role, "score": score} for role, score in sorted(normalized_scores.items(), key=lambda item: (-item[1], item[0]))]
    return {
        "predicted_profile": role_scores[0]["profile"] if role_scores else "Backend Developer",
        "confidence": role_scores[0]["score"] if role_scores else 0,
        "scores": role_scores,
        "method": "content_weighted_scoring",
    }


def predict_candidate_type(text: str, sections: dict[str, str], timeline: dict) -> dict:
    experience_years = timeline.get("total_years_experience", 0.0)
    has_experience = bool((sections.get("experience") or "").strip())
    internship_only = "intern" in (sections.get("experience") or "").lower() and experience_years < 1.0

    experienced_score = 0.15
    if has_experience:
        experienced_score += 0.25
    experienced_score += min(0.55, experience_years * 0.18)
    if internship_only:
        experienced_score -= 0.2

    experienced_score = max(0.05, min(0.95, experienced_score))
    fresher_score = round(max(0.05, min(0.95, 1.0 - experienced_score)), 4)
    experienced_score = round(max(0.05, min(0.95, experienced_score)), 4)

    scores = sorted(
        [
            {"category": "Fresher", "probability": round(fresher_score, 4)},
            {"category": "Experienced", "probability": round(experienced_score, 4)},
        ],
        key=lambda item: item["probability"],
        reverse=True,
    )
    return {
        "predicted_category": scores[0]["category"],
        "confidence": scores[0]["probability"],
        "scores": scores,
        "user_override_allowed": True,
        "method": "timeline_weighted_scoring",
    }


@lru_cache(maxsize=1)
def _get_strength_regressor():
    from sklearn.ensemble import RandomForestRegressor

    training_rows = []
    training_targets = []
    for skill_count in (3, 6, 10, 14):
        for project_count in (0, 1, 2, 4):
            for experience_years in (0, 1, 3, 6):
                avg_project_complexity = 1 + project_count * 1.2
                density = min(28, 4 + skill_count * 1.1 + project_count * 1.5)
                achievement_count = 0 if experience_years == 0 else min(5, math.ceil(experience_years / 2))
                strong_evidence = min(skill_count, project_count * 2 + max(0, int(experience_years)))
                completeness = min(100, 30 + project_count * 15 + skill_count * 3 + experience_years * 5)
                target = min(
                    1.0,
                    0.18
                    + skill_count * 0.02
                    + project_count * 0.09
                    + avg_project_complexity * 0.04
                    + density * 0.008
                    + achievement_count * 0.04
                    + experience_years * 0.035
                    + strong_evidence * 0.015
                    + completeness * 0.0025,
                )
                training_rows.append([
                    float(skill_count),
                    float(project_count),
                    float(avg_project_complexity),
                    float(density),
                    float(achievement_count),
                    float(experience_years),
                    float(strong_evidence),
                    float(completeness),
                ])
                training_targets.append(target)

    model = RandomForestRegressor(n_estimators=120, random_state=42)
    model.fit(training_rows, training_targets)
    return model


def _extract_date_range(text: str) -> tuple[int | None, int | None] | None:
    match = re.search(r"(20\d{2}|19\d{2})\s*(?:-|to|–)\s*(present|current|20\d{2}|19\d{2})", text.lower())
    if not match:
        return None
    start = int(match.group(1))
    end_raw = match.group(2)
    end = start if end_raw in {"present", "current"} else int(end_raw)
    return start, end


def _find_job_title(text: str) -> str | None:
    lowered = text.lower()
    for title in JOB_TITLE_HINTS:
        if title in lowered:
            return title.title()
    return None


def _find_organization(text: str, organizations: list[str]) -> str | None:
    lowered = text.lower()
    for organization in organizations:
        if organization.lower() in lowered:
            return organization
    match = re.search(r"\bat\s+([A-Z][A-Za-z0-9&.\- ]+)", text)
    if match:
        return match.group(1).strip()
    return None
