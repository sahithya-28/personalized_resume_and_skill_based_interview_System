import os
from openai import OpenAI

# Initialize OpenAI client (uses environment variable OPENAI_API_KEY)
client = OpenAI()


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

    # STRONG skills usually don't need explanation
    if level == "strong":
        return "This skill is clearly demonstrated through project implementation."

    # Build a structured prompt (NO hallucination)
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
Explain in 1–2 lines why this skill is classified as {level}.
Rules:
- Be factual and specific
- Do NOT praise the candidate
- Do NOT assume missing information
- Use an interviewer’s perspective
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You generate concise interview evaluation explanations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,   # LOW temperature = stable explanations
            max_tokens=60
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        # Safe fallback (IMPORTANT for demos)
        return f"No detailed explanation generated due to system limitation."
