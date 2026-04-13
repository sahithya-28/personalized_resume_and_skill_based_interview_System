from __future__ import annotations

from .entities import extract_entities
from .evaluation import (
    analyze_writing_quality,
    compute_resume_score,
    detect_achievements,
    generate_improvement_suggestions,
    keyword_density,
    section_completeness,
    validate_contact_info,
)
from .intelligence import (
    build_adaptive_analysis,
    build_knowledge_graph,
    compare_resume_to_profiles,
    estimate_ml_resume_strength,
    estimate_project_complexity,
    extract_career_timeline,
    infer_related_concepts,
    predict_candidate_type,
    score_resume_roles,
)
from .nlp_pipeline import build_nlp_artifacts
from .parser import parse_resume
from .skill_intelligence import (
    analyze_skill_strength,
    build_skill_evidence,
    extract_projects,
    extract_skills_with_semantics,
    profile_similarity_analysis,
    suggest_interview_topics,
)
from .suggestions import generate_resume_analysis_suggestions
from .summarization import generate_resume_summary


def build_advanced_resume_report(text: str, job_description: str | None = None) -> dict:
    artifacts = build_nlp_artifacts(text)
    parsed = parse_resume(artifacts.cleaned_text)
    sections = parsed.get("sections", {})

    entities = extract_entities(artifacts.cleaned_text, sections, artifacts.doc)
    skill_data = extract_skills_with_semantics(artifacts.sentences, sections, artifacts.doc)
    evidence = build_skill_evidence(skill_data["detected_skills"], sections, skill_data["contextual_usage"])
    strength = analyze_skill_strength(skill_data["frequencies"])

    raw_projects = extract_projects(sections.get("projects", ""), skill_data["detected_skills"])
    projects = estimate_project_complexity(raw_projects)

    contact_validation = validate_contact_info(parsed)
    completeness = section_completeness(sections)
    achievements = detect_achievements(artifacts.sentences)
    writing_quality = analyze_writing_quality(artifacts.sentences)
    density = keyword_density(artifacts.filtered_tokens, sum(skill_data["frequencies"].values()))
    interview_topics = suggest_interview_topics(skill_data["detected_skills"])
    summary = generate_resume_summary(artifacts.sentences)
    related_concepts = infer_related_concepts(artifacts.sentences, skill_data["detected_skills"])
    career_timeline = extract_career_timeline(sections, entities, artifacts.doc)
    profile_classification = score_resume_roles(
        sections=sections,
        skills=skill_data["detected_skills"],
        projects=projects,
        summary_text=summary["summary_text"],
        timeline=career_timeline,
    )
    similarity_scores = compare_resume_to_profiles(artifacts.cleaned_text)
    legacy_similarity_scores = profile_similarity_analysis(artifacts.cleaned_text)
    candidate_type = predict_candidate_type(artifacts.cleaned_text, sections, career_timeline)
    adaptive_analysis = build_adaptive_analysis(candidate_type, career_timeline, achievements, projects, sections)

    avg_project_complexity = (
        sum(project.get("complexity_score", 0.0) for project in projects) / max(len(projects), 1)
        if projects else 0.0
    )
    ml_strength = estimate_ml_resume_strength(
        skill_count=len(skill_data["detected_skills"]),
        project_count=len(projects),
        avg_project_complexity=avg_project_complexity,
        technical_keyword_density=density["technical_density"],
        achievement_count=achievements["count"],
        experience_years=career_timeline["total_years_experience"],
        strong_evidence_count=sum(1 for item in evidence.values() if item["status"] == "Strong Evidence"),
        completeness_score=completeness["score"],
    )

    resume_score = compute_resume_score(
        contact_validation,
        completeness,
        evidence,
        writing_quality,
        achievements,
        resume_text=artifacts.cleaned_text,
        job_description=job_description,
        skill_count=len(skill_data["detected_skills"]),
        project_analysis=projects,
        career_timeline=career_timeline,
        candidate_type=candidate_type,
        ml_strength=ml_strength,
    )

    rule_based_suggestions = generate_improvement_suggestions(
        contact_validation,
        completeness,
        evidence,
        writing_quality,
        achievements,
        similarity_scores,
        score_breakdown=resume_score["breakdown"],
        project_analysis=projects,
        adaptive_analysis=adaptive_analysis,
        jd_match_score=resume_score.get("jd_match_score", 0.0),
        jd_missing_skills=resume_score.get("jd_missing_skills", []),
        predicted_role=profile_classification.get("predicted_profile", ""),
        sections=sections,
        certifications=entities.get("certifications", []),
    )

    try:
        suggestions = generate_resume_analysis_suggestions(
            resume_text=artifacts.cleaned_text,
            predicted_role=profile_classification.get("predicted_profile", ""),
            experience_level=candidate_type.get("predicted_category", ""),
            skills=skill_data["detected_skills"],
            projects=projects,
            certifications=entities.get("certifications", []),
            weaknesses=build_weaknesses(completeness, evidence, density, projects, sections),
            fallback_suggestions=rule_based_suggestions,
        )
    except Exception:
        suggestions = rule_based_suggestions

    knowledge_graph = build_knowledge_graph(parsed.get("name", ""), skill_data["detected_skills"], projects, entities)

    visualization = build_visualization_payload(
        skill_data["categorized_skills"],
        resume_score,
        completeness,
        strength,
        evidence,
        profile_classification,
        similarity_scores,
        projects,
        candidate_type,
    )
    overview = build_overview(resume_score, profile_classification, skill_data, projects, density, candidate_type, ml_strength)
    strengths = build_strengths(skill_data, evidence, completeness, related_concepts)
    weaknesses = build_weaknesses(completeness, evidence, density, projects, sections)
    analysis = build_analysis_payload(
        skill_data,
        evidence,
        projects,
        entities,
        profile_classification,
        similarity_scores,
        visualization,
        sections,
        related_concepts,
        career_timeline,
        candidate_type,
        adaptive_analysis,
        knowledge_graph,
    )

    return {
        "overview": overview,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "analysis": analysis,
        "recommendations": suggestions,
        "preprocessing": {
            "engine": artifacts.engine,
            "cleaned_text": artifacts.cleaned_text,
            "tokens": artifacts.tokens[:200],
            "filtered_tokens": artifacts.filtered_tokens[:200],
            "lemmas": artifacts.lemmas[:200],
            "sentences": artifacts.sentences[:50],
            "pos_tags": artifacts.pos_tags[:120],
            "token_count": len(artifacts.tokens),
        },
        "parsed_data": parsed,
        "entities": entities,
        "skill_extraction": {
            "detected_skills": skill_data["detected_skills"],
            "categorized_skills": skill_data["categorized_skills"],
            "contextual_usage": skill_data["contextual_usage"],
            "related_concepts": related_concepts,
            "semantic_matching_enabled": True,
        },
        "skill_verification": evidence,
        "skill_strength_analysis": strength,
        "project_analysis": projects,
        "project_complexity_analysis": projects,
        "achievement_detection": achievements,
        "contact_validation": contact_validation,
        "section_completeness": completeness,
        "writing_quality": writing_quality,
        "resume_profile_classification": profile_classification,
        "resume_similarity_analysis": similarity_scores,
        "legacy_resume_similarity_analysis": legacy_similarity_scores,
        "resume_score": resume_score,
        "keyword_density": density,
        "interview_preparation_topics": interview_topics,
        "resume_summary": summary,
        "career_timeline": career_timeline,
        "knowledge_graph": knowledge_graph,
        "candidate_type_prediction": candidate_type,
        "adaptive_analysis": adaptive_analysis,
        "ml_resume_strength": ml_strength,
        "improvement_suggestions": suggestions,
        "visualization": visualization,
        "final_report": {
            "resume_score": resume_score["total"],
            "predicted_profile": profile_classification["predicted_profile"],
            "best_profile_match": similarity_scores[0] if similarity_scores else None,
            "summary": summary["summary_text"],
            "candidate_type": candidate_type["predicted_category"],
        },
    }


def build_overview(
    resume_score: dict,
    profile_classification: dict,
    skill_data: dict,
    projects: list[dict],
    density: dict,
    candidate_type: dict,
    ml_strength: dict,
) -> dict:
    return {
        "resume_score": resume_score["total"],
        "predicted_career_profile": profile_classification["predicted_profile"],
        "role_probabilities": profile_classification["scores"],
        "detected_skills_count": len(skill_data["detected_skills"]),
        "projects_detected_count": len(projects),
        "technical_keyword_density": density["technical_density"],
        "candidate_type": candidate_type["predicted_category"],
        "candidate_type_scores": candidate_type["scores"],
        "resume_strength_score": ml_strength["score"],
    }


def build_strengths(skill_data: dict, evidence: dict[str, dict], completeness: dict, related_concepts: list[dict]) -> list[dict]:
    strong_skills = skill_data["detected_skills"][:8]
    strong_evidence = [skill for skill, item in evidence.items() if item["status"] == "Strong Evidence"][:8]
    well_defined_sections = [section.title() for section, present in completeness["required"].items() if present]
    concept_items = [item["concept"] for item in related_concepts[:5]]

    strength_items: list[dict] = []
    if strong_skills:
        strength_items.append({"title": "Core skills", "items": strong_skills})
    if strong_evidence:
        strength_items.append({"title": "Skills with strong evidence", "items": strong_evidence})
    if concept_items:
        strength_items.append({"title": "Inferred engineering concepts", "items": concept_items})
    if well_defined_sections:
        strength_items.append({"title": "Well-defined resume sections", "items": well_defined_sections})
    return strength_items


def build_weaknesses(
    completeness: dict,
    evidence: dict[str, dict],
    density: dict,
    projects: list[dict],
    sections: dict[str, str],
) -> list[dict]:
    missing_sections = [section.title() for section, present in completeness["required"].items() if not present]
    weak_skills = [skill for skill, item in evidence.items() if item["status"] == "Limited Evidence"]
    weakness_items: list[dict] = []
    if missing_sections:
        weakness_items.append({"title": "Missing sections", "items": missing_sections})
    if weak_skills:
        weakness_items.append({"title": "Skills with weak evidence", "items": weak_skills[:8]})
    if density["technical_density"] < 8:
        weakness_items.append({"title": "Low technical density", "items": [density["feedback"]]})
    if not projects:
        weakness_items.append({"title": "Missing projects", "items": ["No projects detected. Adding project descriptions can improve resume strength."]})
    if not (sections.get("experience") or "").strip():
        weakness_items.append({"title": "Missing experience", "items": ["No experience detected. Adding internship or work experience improves credibility."]})
    return weakness_items


def build_analysis_payload(
    skill_data: dict,
    evidence: dict[str, dict],
    projects: list[dict],
    entities: dict,
    profile_classification: dict,
    similarity_scores: list[dict],
    visualization: dict,
    sections: dict[str, str],
    related_concepts: list[dict],
    career_timeline: dict,
    candidate_type: dict,
    adaptive_analysis: dict,
    knowledge_graph: dict,
) -> dict:
    return {
        "skill_analysis": {
            "graph": visualization["skill_strength"],
            "evidence_table": [
                {
                    "skill": skill,
                    "strength": skill_data["frequencies"].get(skill, 0),
                    "evidence": item.get("evidence_text") or item["status"],
                    "confidence": item.get("confidence_label", ""),
                    "source_section": item.get("source_section", ""),
                    "locations": item.get("locations", []),
                    "contexts": item.get("contexts", []),
                }
                for skill, item in evidence.items()
            ],
            "related_concepts": related_concepts,
            "empty_message": "No skills detected. Add a technical skills section with supporting project context."
            if not skill_data["detected_skills"] else "",
        },
        "project_analysis": {
            "projects": projects,
            "empty_message": "No projects detected. Adding project descriptions can improve resume strength."
            if not projects else "",
        },
        "entity_extraction": {
            "skills": entities.get("skills", []),
            "universities": entities.get("universities", []),
            "certifications": entities.get("certifications", []),
            "empty_messages": {
                "certifications": "No certifications detected. Add relevant certifications if available."
                if not entities.get("certifications") and not (sections.get("certifications") or "").strip() else "",
            },
        },
        "career_profile_analysis": {
            "prediction": profile_classification,
            "chart": visualization["career_profile_scores"],
        },
        "similarity_analysis": {
            "scores": similarity_scores,
            "chart": visualization["profile_similarity_scores"],
        },
        "career_timeline_analysis": career_timeline,
        "candidate_type_analysis": candidate_type,
        "adaptive_analysis": adaptive_analysis,
        "knowledge_graph": knowledge_graph,
    }


def build_visualization_payload(
    categorized_skills: dict[str, list[str]],
    score: dict,
    completeness: dict,
    strength: dict,
    evidence: dict[str, dict],
    profile_classification: dict,
    similarity_scores: list[dict],
    projects: list[dict],
    candidate_type: dict,
) -> dict:
    evidence_count = {"Strong Evidence": 0, "Moderate Evidence": 0, "Limited Evidence": 0}
    for item in evidence.values():
        evidence_count[item["status"]] = evidence_count.get(item["status"], 0) + 1

    return {
        "skill_distribution": {
            "labels": list(categorized_skills.keys()),
            "values": [len(values) for values in categorized_skills.values()],
        },
        "section_coverage": {
            "labels": list(completeness["required"].keys()),
            "values": [1 if value else 0 for value in completeness["required"].values()],
        },
        "evidence_strength": {
            "labels": list(evidence_count.keys()),
            "values": list(evidence_count.values()),
        },
        "score_breakdown": {
            "labels": list(score["breakdown"].keys()),
            "values": list(score["breakdown"].values()),
        },
        "skill_strength": {
            "labels": list(strength["by_skill"].keys())[:12],
            "values": [item["mentions"] for item in list(strength["by_skill"].values())[:12]],
        },
        "career_profile_scores": {
            "labels": [item["profile"] for item in profile_classification["scores"]],
            "values": [item["score"] for item in profile_classification["scores"]],
        },
        "profile_similarity_scores": {
            "labels": [item["profile"] for item in similarity_scores],
            "values": [round(item["score"] * 100, 2) for item in similarity_scores],
        },
        "project_complexity_scores": {
            "labels": [project["project_name"] for project in projects],
            "values": [project["complexity_score"] for project in projects],
        },
        "candidate_type_scores": {
            "labels": [item["category"] for item in candidate_type["scores"]],
            "values": [round(item["probability"] * 100, 2) for item in candidate_type["scores"]],
        },
    }
