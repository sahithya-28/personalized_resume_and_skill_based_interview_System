import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _get_groq_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured on the backend.")
    return api_key


def _get_groq_model() -> str:
    return os.getenv("GROQ_MODEL", "").strip() or DEFAULT_GROQ_MODEL


def _call_groq(prompt: str) -> str:
    api_key = _get_groq_api_key()
    payload = {
        "model": _get_groq_model(),
        "temperature": 0.3,
        "max_tokens": 300,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an ATS resume reviewer. Return only concise improvement bullets. "
                    "Do not rewrite the resume. Do not add headings."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }

    request = urllib.request.Request(
        GROQ_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        if exc.code == 401:
            raise RuntimeError("Groq API key is invalid or unauthorized.") from exc
        if exc.code == 429:
            raise RuntimeError("Groq rate limit or quota exceeded for the current API key.") from exc
        raise RuntimeError(f"Groq API request failed with status {exc.code}: {detail}") from exc
    except Exception as exc:
        raise RuntimeError(f"Groq API request failed: {exc}") from exc

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("Groq API returned no choices.")

    message = choices[0].get("message") or {}
    content = str(message.get("content", "")).strip()
    if not content:
        raise RuntimeError("Groq API returned an empty response.")
    return content


def _parse_suggestion_lines(content: str, *, limit: int = 6) -> list[str]:
    suggestions = []
    for line in content.split("\n"):
        line = line.strip()
        if line.startswith("- "):
            suggestions.append(line[2:].strip())
        elif line.startswith("* "):
            suggestions.append(line[2:].strip())
        elif len(line) > 5 and line[0].isdigit() and line[1] in [".", ")"]:
            suggestions.append(line[2:].strip())

    if suggestions:
        return suggestions[:limit]

    return [part.strip() for part in content.split("\n") if part.strip()][:limit]


def generate_ats_improvement_suggestions(resume_text: str) -> list[str]:
    """
    Generates ATS-focused suggestions using the Groq API key configured on the backend.
    """
    if not resume_text or not str(resume_text).strip():
        raise RuntimeError("No resume text extracted")

    prompt = f"""Analyze this resume and suggest improvements.
Preserve the existing structure.
Focus on:
- missing skills
- weak bullet points
- lack of measurable achievements
- use of action verbs
- formatting improvements
Return concise bullet points.

Resume:
{resume_text}
"""

    try:
        content = _call_groq(prompt)
        return _parse_suggestion_lines(content, limit=6)
    except Exception as exc:
        raise RuntimeError(f"Groq API failed: {exc}") from exc


def generate_suggestions(resume_text: str) -> list[str]:
    """
    Backward-compatible helper for existing callers that expect 3 suggestions.
    """
    try:
        return generate_ats_improvement_suggestions(resume_text)[:3]
    except Exception:
        return []
