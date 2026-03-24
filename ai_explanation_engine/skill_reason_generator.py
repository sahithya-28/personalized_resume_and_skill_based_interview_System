import json
import os
import urllib.error
import urllib.request


DEFAULT_GEMINI_MODELS = (
    "gemini-1.5-flash",
)

DEFAULT_GEMINI_API_VERSIONS = (
    "v1",
    "v1beta",
)

MODEL_ALIASES = {
    "gemini-1.5-flash-001": "gemini-1.5-flash",
    "gemini-1.5-flash-8b": "gemini-1.5-flash",
    "gemini-1.5-flash-latest": "gemini-1.5-flash",
}


def _get_gemini_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    return api_key


def _get_gemini_models() -> list[str]:
    configured = os.getenv("GEMINI_MODEL", "").strip()
    normalized = MODEL_ALIASES.get(configured, configured)
    models = [normalized] if normalized else []
    for model in DEFAULT_GEMINI_MODELS:
        if model not in models:
            models.append(model)
    return models


def _get_gemini_api_versions() -> list[str]:
    configured = os.getenv("GEMINI_API_VERSION", "").strip()
    versions = [configured] if configured else []
    for version in DEFAULT_GEMINI_API_VERSIONS:
        if version not in versions:
            versions.append(version)
    return versions


def _call_gemini(prompt: str) -> str:
    api_key = _get_gemini_api_key()
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 120,
        },
    }
    last_error: RuntimeError | None = None
    for version in _get_gemini_api_versions():
        for model in _get_gemini_models():
            url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={api_key}"
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    data = json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")
                last_error = RuntimeError(f"Gemini API request failed with status {exc.code}: {detail}")
                if exc.code == 404:
                    continue
                raise last_error from exc
            except Exception as exc:
                raise RuntimeError(f"Gemini API request failed: {exc}") from exc

            candidates = data.get("candidates") or []
            if not candidates:
                last_error = RuntimeError("Gemini API returned no candidates.")
                continue

            parts = candidates[0].get("content", {}).get("parts", [])
            text = "\n".join(str(part.get("text", "")).strip() for part in parts if str(part.get("text", "")).strip())
            if text:
                return text
            last_error = RuntimeError("Gemini API returned an empty response.")

    if last_error is not None:
        raise last_error
    raise RuntimeError("Gemini API request could not be completed.")


def generate_skill_reason(
    skill: str,
    level: str,
    appears_in_projects: bool,
    appears_in_tools: bool,
    appears_only_in_skills: bool,
    project_summary: str = "",
    resume_snippet: str = ""
) -> str:
    """
    Generates a concise, interviewer-style explanation
    for why a skill is classified as strong / medium / weak.
    """

    if level == "strong":
        return "This skill is clearly demonstrated through project implementation."

    prompt = f"""
You are an interview analysis assistant.

Skill: {skill}
Classification: {level}

Evidence facts:
- Appears in project implementation: {appears_in_projects}
- Appears in tools or tech stack: {appears_in_tools}
- Appears only in skills section: {appears_only_in_skills}

Project summary (if any):
{project_summary}

Resume snippet (if any):
{resume_snippet}

Task:
Explain in 1-2 lines why this skill is classified as {level}.
Rules:
- Be factual and specific
- Do NOT praise the candidate
- Do NOT assume missing information
- Use an interviewer's perspective
"""

    try:
        return _call_gemini(prompt).strip()
    except Exception:
        return "No detailed explanation generated due to system limitation."
