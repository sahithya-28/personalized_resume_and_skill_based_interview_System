from __future__ import annotations

import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DEFAULT_GROQ_MODELS = (
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
)


def _get_groq_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured on the backend.")
    return api_key


def _get_groq_models() -> list[str]:
    configured = os.getenv("GROQ_MODEL", "").strip()
    models = [configured] if configured else []
    for model in DEFAULT_GROQ_MODELS:
        if model not in models:
            models.append(model)
    return models


def _call_groq(prompt: str) -> str:
    api_key = _get_groq_api_key()
    last_error: RuntimeError | None = None
    url = "https://api.groq.com/openai/v1/chat/completions"

    for model in _get_groq_models():
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You improve resumes. Return concise, practical bullet points only.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": 0.3,
            "max_tokens": 300,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "smart-interview-system/1.0",
                    "Accept": "application/json",
                },
                timeout=45,
            )
            if response.status_code >= 400:
                detail = response.text[:1200]
                last_error = RuntimeError(f"Groq API request failed with status {response.status_code}: {detail}")
                if response.status_code in {400, 404}:
                    continue
                raise last_error
            data = response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"Groq API request failed: {exc}") from exc
        except ValueError as exc:
            raise RuntimeError(f"Groq API returned non-JSON content: {exc}") from exc
        except Exception as exc:
            if isinstance(exc, RuntimeError):
                raise
            last_error = RuntimeError(f"Groq API request failed: {exc}")
            if "403" in str(exc):
                continue
            raise last_error from exc

        choices = data.get("choices") or []
        if not choices:
            last_error = RuntimeError("Groq API returned no choices.")
            continue

        message = choices[0].get("message") or {}
        content = str(message.get("content", "")).strip()
        if content:
            return content

        last_error = RuntimeError("Groq API returned an empty response.")

    if last_error is not None:
        raise last_error
    raise RuntimeError("Groq API request could not be completed.")


def _call_groq_with_config(
    *,
    prompt: str,
    system_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 300,
) -> str:
    api_key = _get_groq_api_key()
    last_error: RuntimeError | None = None
    url = "https://api.groq.com/openai/v1/chat/completions"

    for model in _get_groq_models():
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "smart-interview-system/1.0",
                    "Accept": "application/json",
                },
                timeout=45,
            )
            if response.status_code >= 400:
                detail = response.text[:1200]
                last_error = RuntimeError(f"Groq API request failed with status {response.status_code}: {detail}")
                if response.status_code in {400, 404}:
                    continue
                raise last_error
            data = response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"Groq API request failed: {exc}") from exc
        except ValueError as exc:
            raise RuntimeError(f"Groq API returned non-JSON content: {exc}") from exc
        except Exception as exc:
            if isinstance(exc, RuntimeError):
                raise
            last_error = RuntimeError(f"Groq API request failed: {exc}")
            if "403" in str(exc):
                continue
            raise last_error from exc

        choices = data.get("choices") or []
        if not choices:
            last_error = RuntimeError("Groq API returned no choices.")
            continue

        message = choices[0].get("message") or {}
        content = str(message.get("content", "")).strip()
        if content:
            return content

        last_error = RuntimeError("Groq API returned an empty response.")

    if last_error is not None:
        raise last_error
    raise RuntimeError("Groq API request could not be completed.")


def _extract_json_object(content: str) -> dict:
    text = str(content or "").strip()
    if not text:
        raise RuntimeError("Empty JSON response from Groq.")

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError("Groq response did not contain a JSON object.")

    candidate = text[start:end + 1]
    parsed = json.loads(candidate)
    if not isinstance(parsed, dict):
        raise RuntimeError("Groq response JSON was not an object.")
    return parsed


def _coerce_string_list(value: object, *, limit: int = 5) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    seen = set()
    for item in value:
        text = str(item or "").strip()
        lower = text.lower()
        if not text or lower in seen:
            continue
        seen.add(lower)
        cleaned.append(text)
    return cleaned[:limit]


def _fallback_skill_evaluation(skill: str, score: float, total_questions: int, answers: list[dict]) -> dict:
    safe_total = max(int(total_questions or 0), 0)
    correct_count = max(0, min(int(round(score or 0)), safe_total))
    percentage = (correct_count / safe_total * 100.0) if safe_total else 0.0

    if percentage < 40:
        performance_level = "Beginner"
    elif percentage < 70:
        performance_level = "Intermediate"
    else:
        performance_level = "Advanced"

    correct_answers = [item for item in answers if item.get("correct")]
    incorrect_answers = [item for item in answers if not item.get("correct")]

    strength_topics = []
    for item in correct_answers[:3]:
        topic = str(item.get("question") or "").strip()
        if topic:
            strength_topics.append(topic)

    weakness_topics = []
    for item in incorrect_answers[:3]:
        topic = str(item.get("question") or "").strip()
        if topic:
            weakness_topics.append(topic)

    summary = (
        f"The {skill} verification result is {correct_count} out of {safe_total}, which places the performance at {performance_level.lower()} level. "
        f"The answers show {'solid' if performance_level == 'Advanced' else 'partial' if performance_level == 'Intermediate' else 'limited'} command of core {skill} concepts."
    )

    strengths = strength_topics or [
        f"Answered some {skill} questions with enough relevant points to demonstrate baseline familiarity."
    ]
    weaknesses = weakness_topics or [
        f"Several {skill} answers lacked enough correct detail to show consistent conceptual depth."
    ]

    if performance_level == "Beginner":
        suggestions = [
            f"Strengthen your {skill} fundamentals by revisiting the concepts behind these missed questions and rewriting each answer in your own words.",
            f"Practice short {skill} explanations that define the concept, explain why it matters, and include one concrete example or use case.",
            f"Work on answering {skill} questions with clearer structure so each response covers definition, behavior, and common edge cases.",
        ]
    elif performance_level == "Intermediate":
        suggestions = [
            f"Improve your {skill} answers by adding deeper reasoning, tradeoffs, and implementation details instead of only high-level definitions.",
            f"Review the missed {skill} topics and practice answering them with examples, internal behavior, and common pitfalls interviewers usually probe.",
            f"Focus on making each {skill} response more precise by connecting concepts to real coding scenarios or debugging situations.",
        ]
    else:
        suggestions = [
            f"Push your {skill} answers further by adding advanced tradeoffs, performance considerations, and edge-case handling in interview explanations.",
            f"Practice explaining {skill} concepts with production-style examples so strong fundamentals translate into senior-level interview clarity.",
            f"Refine your {skill} responses by contrasting similar concepts and highlighting when one approach is better than another.",
        ]

    return {
        "performance_level": performance_level,
        "summary": summary,
        "strengths": _coerce_string_list(strengths, limit=5),
        "weaknesses": _coerce_string_list(weaknesses, limit=5),
        "improvement_suggestions": _coerce_string_list(suggestions, limit=5),
    }


def generate_skill_verification_evaluation(
    *,
    skill: str,
    score: float,
    total_questions: int,
    answers: list[dict],
) -> dict:
    safe_skill = str(skill or "").strip() or "Skill"
    safe_total = max(int(total_questions or 0), 0)
    safe_score = max(0.0, min(float(score or 0.0), float(safe_total)))
    prepared_answers = []

    for item in answers or []:
        if not isinstance(item, dict):
            continue
        prepared_answers.append(
            {
                "question": str(item.get("question") or "").strip(),
                "user_answer": str(item.get("user_answer") or item.get("answer") or "").strip(),
                "correct": bool(item.get("correct")),
            }
        )

    percentage = (safe_score / safe_total * 100.0) if safe_total else 0.0
    if percentage < 40:
        performance_hint = "Beginner"
    elif percentage < 70:
        performance_hint = "Intermediate"
    else:
        performance_hint = "Advanced"

    prompt = f"""Evaluate this interview verification result for the skill "{safe_skill}".

Return ONLY valid JSON with this exact structure:
{{
  "performance_level": "Beginner | Intermediate | Advanced",
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "improvement_suggestions": []
}}

Rules:
- Use the score thresholds: 0-40 Beginner, 40-70 Intermediate, 70-100 Advanced.
- Summary must be 2-3 lines and skill-specific.
- Strengths must mention concepts answered well.
- Weaknesses must mention missing or incorrect concepts.
- Improvement suggestions must be actionable and specific to {safe_skill}.
- Do not use generic advice like "practice more".
- Do not add markdown or explanation outside JSON.

Interview result:
- Skill: {safe_skill}
- Correct answers: {safe_score}
- Total questions: {safe_total}
- Percentage: {round(percentage, 2)}
- Expected performance hint: {performance_hint}

Answers:
{json.dumps(prepared_answers[:12], ensure_ascii=True)}
"""

    try:
        content = _call_groq_with_config(
            prompt=prompt,
            system_prompt="You are an AI interview evaluator. Return only strict JSON with constructive, skill-specific feedback.",
            temperature=0.2,
            max_tokens=700,
        )
        parsed = _extract_json_object(content)
        evaluation = {
            "performance_level": str(parsed.get("performance_level") or performance_hint).strip() or performance_hint,
            "summary": str(parsed.get("summary") or "").strip(),
            "strengths": _coerce_string_list(parsed.get("strengths"), limit=5),
            "weaknesses": _coerce_string_list(parsed.get("weaknesses"), limit=5),
            "improvement_suggestions": _coerce_string_list(parsed.get("improvement_suggestions"), limit=5),
        }

        if not evaluation["summary"] or not evaluation["strengths"] or not evaluation["weaknesses"] or not evaluation["improvement_suggestions"]:
            raise RuntimeError("Groq evaluation response was incomplete.")
        return evaluation
    except Exception:
        return _fallback_skill_evaluation(safe_skill, safe_score, safe_total, prepared_answers)


def _parse_suggestion_lines(content: str, *, limit: int = 6) -> list[str]:
    suggestions = []
    current = ""
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("- "):
            if current:
                suggestions.append(current.strip())
            current = line[2:].strip()
        elif line.startswith("* "):
            if current:
                suggestions.append(current.strip())
            current = line[2:].strip()
        elif len(line) > 5 and line[0].isdigit() and line[1] in [".", ")"]:
            if current:
                suggestions.append(current.strip())
            current = line[2:].strip()
        elif current:
            current = f"{current} {line}".strip()
        else:
            current = line

    if current:
        suggestions.append(current.strip())

    cleaned = []
    seen = set()
    for item in suggestions:
        text = str(item or "").strip(" -")
        lower = text.lower()
        if not text:
            continue
        if lower in {"no changes needed.", "no changes needed", "missing skills:", "suggestions:"}:
            continue
        if len(text) < 20:
            continue
        if lower in seen:
            continue
        seen.add(lower)
        cleaned.append(text)

    if cleaned:
        return cleaned[:limit]

    fallback = [part.strip() for part in content.split("\n") if part.strip()]
    return [item for item in fallback if len(item) >= 20][:limit]


def generate_ats_improvement_suggestions(resume_text: str) -> list[str]:
    if not resume_text or not str(resume_text).strip():
        raise RuntimeError("No resume text extracted")

    prompt = f"""You are reviewing a resume for ATS quality and recruiter readability.

Return exactly 4 clear, personalized suggestions.

Rules:
- Each suggestion must be a complete sentence of 18 to 35 words.
- Each suggestion must refer to a specific improvement area in the resume, such as summary, projects, skills, experience, measurable impact, or formatting.
- Do not write headings like "Missing skills:" or filler text like "No changes needed."
- Do not split one idea across multiple lines.
- Do not give generic advice such as "Add more keywords."
- Prefer actionable suggestions like adding metrics, clarifying project outcomes, adding deployment details, or improving section content.
- Output only 4 bullet points.

Example style:
- Strengthen your project bullets by adding measurable outcomes such as model accuracy, latency reduction, or number of users impacted.
- Add production-ready implementation details, such as deploying your backend or machine learning project through a Flask or FastAPI API.

Resume:
{resume_text}
"""

    try:
        content = _call_groq(prompt)
        return _parse_suggestion_lines(content, limit=6)
    except Exception as exc:
        raise RuntimeError(f"Groq API failed: {exc}") from exc


def generate_resume_analysis_suggestions(
    *,
    resume_text: str,
    predicted_role: str,
    experience_level: str,
    skills: list[str],
    projects: list[dict],
    certifications: list[str],
    weaknesses: list[dict],
    fallback_suggestions: list[str],
) -> list[str]:
    if not str(resume_text or "").strip():
        raise RuntimeError("No resume text extracted")

    weakness_lines = []
    for group in weaknesses[:4]:
        title = str(group.get("title", "")).strip()
        items = [str(item).strip() for item in (group.get("items") or []) if str(item).strip()]
        if title and items:
            weakness_lines.append(f"{title}: " + "; ".join(items[:3]))

    project_titles = [str(project.get("project_name", "")).strip() for project in projects if str(project.get("project_name", "")).strip()]

    prompt = f"""You are reviewing a resume analysis report and must generate strong, clear, personalized resume improvement suggestions.

Return exactly 4 bullet points.

Rules:
- Each suggestion must be a complete sentence of 20 to 40 words.
- Make every suggestion specific to this candidate's resume, target profile, and current gaps.
- Focus on actionable improvements such as stronger project impact, measurable outcomes, certifications, production-level work, missing experience evidence, or role-specific tools.
- Do not write generic advice like "Add more keywords."
- Do not repeat the same idea with different wording.
- Do not include headings or filler like "No changes needed."

Candidate profile:
- Predicted role: {predicted_role or "Unknown"}
- Experience level: {experience_level or "Unknown"}
- Detected skills: {", ".join(skills[:15]) or "None"}
- Detected projects: {", ".join(project_titles[:5]) or "None"}
- Certifications: {", ".join(certifications[:6]) or "None"}

Detected weaknesses:
{chr(10).join("- " + line for line in weakness_lines) if weakness_lines else "- No explicit weaknesses provided"}

Useful fallback guidance:
{chr(10).join("- " + item for item in fallback_suggestions[:6]) if fallback_suggestions else "- No fallback suggestions provided"}

Resume:
{resume_text}
"""

    try:
        content = _call_groq(prompt)
        return _parse_suggestion_lines(content, limit=4)
    except Exception as exc:
        raise RuntimeError(f"Groq API failed: {exc}") from exc


def generate_suggestions(resume_text: str) -> list[str]:
    try:
        return generate_ats_improvement_suggestions(resume_text)[:3]
    except Exception:
        return []
