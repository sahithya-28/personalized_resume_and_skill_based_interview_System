from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from auth_store import authenticate_user, create_user, init_auth_db
from resume_generator import generate_resume_pdf
from resume_scorer import analyze_resume_text, extract_text_from_file

app = FastAPI(title="Smart Interview Backend", version="1.1.0")

ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(__file__).resolve().parent / "static"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_auth_db()
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class ResumeGenerateRequest(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    summary: str = ""
    skills: str = ""
    projects: str = ""
    education: str = ""
    experience: str = ""
    certifications: str = ""
    achievements: str = ""
    internships: str = ""
    template: str = "basic"


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class SkillMatchRequest(BaseModel):
    skills: list[str] = Field(default_factory=list)


class SkillQuestionsRequest(BaseModel):
    skill: str = Field(min_length=1)


class SkillAnswerScoreRequest(BaseModel):
    skill: str = Field(min_length=1)
    question_id: str = Field(min_length=1)
    answer: str = ""


RESUME_TEMPLATE_CATALOG: list[dict] = [
    {
        "id": "basic",
        "name": "Basic",
        "description": "Balanced sections for most roles",
        "preview_url": "/static/resume_previews/basic.svg",
        "fields": [
            {"key": "skills", "label": "Skills", "placeholder": "Python, FastAPI, React, SQL", "required": True},
            {"key": "projects", "label": "Projects", "placeholder": "Project name, your role, key impact", "required": True},
            {"key": "experience", "label": "Experience", "placeholder": "Company, role, duration, measurable outcomes", "required": True},
            {"key": "education", "label": "Education", "placeholder": "Degree, college, year range, GPA", "required": True},
        ],
    },
    {
        "id": "modern",
        "name": "Modern",
        "description": "Clean layout with modern hierarchy",
        "preview_url": "/static/resume_previews/modern.svg",
        "fields": [
            {"key": "summary", "label": "Professional Summary", "placeholder": "2-4 lines overview of your profile and strengths", "required": True},
            {"key": "skills", "label": "Skills", "placeholder": "Python, FastAPI, React, SQL", "required": True},
            {"key": "projects", "label": "Projects", "placeholder": "Project name, your role, key impact", "required": True},
            {"key": "experience", "label": "Experience", "placeholder": "Company, role, duration, measurable outcomes", "required": True},
            {"key": "education", "label": "Education", "placeholder": "Degree, college, year range, GPA", "required": True},
        ],
    },
    {
        "id": "professional",
        "name": "Professional",
        "description": "Traditional structure for corporate roles",
        "preview_url": "/static/resume_previews/professional.svg",
        "fields": [
            {"key": "summary", "label": "Professional Summary", "placeholder": "2-4 lines overview of your profile and strengths", "required": True},
            {"key": "experience", "label": "Experience", "placeholder": "Company, role, duration, measurable outcomes", "required": True},
            {"key": "projects", "label": "Projects", "placeholder": "Project name, your role, key impact", "required": True},
            {"key": "skills", "label": "Skills", "placeholder": "Python, FastAPI, React, SQL", "required": True},
            {"key": "education", "label": "Education", "placeholder": "Degree, college, year range, GPA", "required": True},
        ],
    },
    {
        "id": "minimal",
        "name": "Minimal",
        "description": "Lightweight one-page style",
        "preview_url": "/static/resume_previews/minimal.svg",
        "fields": [
            {"key": "summary", "label": "Professional Summary", "placeholder": "2-4 lines overview of your profile and strengths", "required": True},
            {"key": "skills", "label": "Skills", "placeholder": "Python, FastAPI, React, SQL", "required": True},
            {"key": "experience", "label": "Experience", "placeholder": "Company, role, duration, measurable outcomes", "required": True},
            {"key": "education", "label": "Education", "placeholder": "Degree, college, year range, GPA", "required": True},
        ],
    },
    {
        "id": "executive",
        "name": "Executive",
        "description": "Leadership-focused detail-rich format",
        "preview_url": "/static/resume_previews/executive.svg",
        "fields": [
            {"key": "summary", "label": "Professional Summary", "placeholder": "Leadership narrative and strategic strengths", "required": True},
            {"key": "achievements", "label": "Achievements", "placeholder": "Awards, recognitions, ranking, impact metrics", "required": True},
            {"key": "experience", "label": "Experience", "placeholder": "Company, role, duration, measurable outcomes", "required": True},
            {"key": "projects", "label": "Projects", "placeholder": "Major programs delivered, scope, KPIs", "required": True},
            {"key": "skills", "label": "Skills", "placeholder": "Leadership, program management, budgeting, analytics", "required": True},
            {"key": "certifications", "label": "Certifications", "placeholder": "PMP, Six Sigma, etc.", "required": False},
            {"key": "education", "label": "Education", "placeholder": "Degree, university, year range", "required": True},
        ],
    },
    {
        "id": "student",
        "name": "Student",
        "description": "Highlights academics and internships",
        "preview_url": "/static/resume_previews/student.svg",
        "fields": [
            {"key": "summary", "label": "Career Objective", "placeholder": "Entry-level objective and interests", "required": True},
            {"key": "education", "label": "Education", "placeholder": "Degree, college, expected graduation, GPA", "required": True},
            {"key": "internships", "label": "Internships", "placeholder": "Company, role, tasks, outcomes", "required": True},
            {"key": "projects", "label": "Projects", "placeholder": "Academic/personal projects with outcomes", "required": True},
            {"key": "skills", "label": "Skills", "placeholder": "Languages, frameworks, tools", "required": True},
            {"key": "certifications", "label": "Certifications", "placeholder": "NPTEL, Coursera, AWS, etc.", "required": False},
            {"key": "achievements", "label": "Achievements", "placeholder": "Hackathons, competitions, scholarships", "required": False},
        ],
    },
]


def _validate_email(value: str) -> str:
    email = value.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email format")
    return email.lower()


def _normalize_skill(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9\s]+", " ", value.lower())


def _question_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "questions"


def _skill_aliases() -> dict[str, str]:
    return {
        "ml": "ml",
        "machinelearning": "ml",
        "artificialintelligence": "ml",
        "ai": "ml",
        "py": "python",
        "python3": "python",
        "js": "javascript",
        "ecmascript": "javascript",
    }


def _load_question_banks() -> list[dict]:
    folder = _question_dir()
    if not folder.exists():
        return []

    banks: list[dict] = []
    for file_path in folder.glob("*.json"):
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        questions = data.get("questions") or []
        if not isinstance(questions, list) or not questions:
            continue

        bank_skill = str(data.get("skill") or file_path.stem).strip()
        banks.append(
            {
                "file_stem": file_path.stem,
                "bank_skill": bank_skill,
                "questions": questions,
                "keys": {
                    _normalize_skill(file_path.stem),
                    _normalize_skill(bank_skill),
                },
            }
        )
    return banks


def _resolve_skill_bank(skill: str) -> dict | None:
    normalized = _normalize_skill(skill)
    alias_target = _skill_aliases().get(normalized, normalized)

    for bank in _load_question_banks():
        if normalized in bank["keys"] or alias_target in bank["keys"]:
            return bank
    return None


def _score_answer_with_keywords(answer: str, keywords: list[str], marks: float) -> dict:
    cleaned_answer = _normalize_text(answer)
    found_keywords: list[str] = []
    missing_keywords: list[str] = []

    for keyword in keywords:
        key = _normalize_text(str(keyword)).strip()
        if not key:
            continue
        if key in cleaned_answer:
            found_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    total = len(found_keywords) + len(missing_keywords)
    ratio = (len(found_keywords) / total) if total else 0.0
    marks_awarded = round(marks * ratio, 2)
    percentage = round(ratio * 100, 2)

    verdict = "Needs Improvement"
    if ratio >= 0.7:
        verdict = "Strong"
    elif ratio >= 0.4:
        verdict = "Moderate"

    return {
        "found_keywords": found_keywords,
        "missing_keywords": missing_keywords,
        "ratio": ratio,
        "marks_awarded": marks_awarded,
        "total_marks": marks,
        "percentage": percentage,
        "verdict": verdict,
    }


def _template_map() -> dict[str, dict]:
    return {item["id"]: item for item in RESUME_TEMPLATE_CATALOG if item.get("id")}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/resume-templates")
def list_resume_templates() -> dict:
    return {
        "default_template": "basic",
        "core_fields": [
            {"key": "name", "label": "Name", "required": True, "type": "text"},
            {"key": "email", "label": "Email", "required": True, "type": "email"},
            {"key": "phone", "label": "Phone", "required": True, "type": "text"},
        ],
        "templates": RESUME_TEMPLATE_CATALOG,
    }


@app.post("/auth/register")
def register(payload: RegisterRequest):
    email = _validate_email(payload.email)
    ok, message = create_user(payload.full_name, email, payload.password)
    if not ok:
        raise HTTPException(status_code=409, detail=message)
    return {"message": message}


@app.post("/auth/login")
def login(payload: LoginRequest):
    email = _validate_email(payload.email)
    ok, result = authenticate_user(email, payload.password)
    if not ok:
        raise HTTPException(status_code=401, detail=result)
    return {"message": "Login successful", "user": result}


@app.post("/generate-resume")
def generate_resume(payload: ResumeGenerateRequest):
    template = _template_map().get(payload.template)
    if not template:
        raise HTTPException(status_code=400, detail=f"Unsupported template: {payload.template}")

    for field in template.get("fields", []):
        if not field.get("required"):
            continue
        key = str(field.get("key", "")).strip()
        label = str(field.get("label") or key).strip()
        value = str(getattr(payload, key, "") or "").strip()
        if not value:
            raise HTTPException(status_code=400, detail=f"Missing required field for {template['name']}: {label}")

    try:
        output_path = generate_resume_pdf(payload.model_dump(), payload.template)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate resume: {exc}") from exc

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=Path(output_path).name,
    )


@app.post("/analyze-resume")
def analyze_resume(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    upload_dir = Path(__file__).resolve().parent.parent / "uploads" / "resumes"
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name if file.filename else f"resume{suffix}"
    target_path = upload_dir / safe_name

    try:
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        text = extract_text_from_file(str(target_path))
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from uploaded file")
        return analyze_resume_text(text)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {exc}") from exc


@app.post("/skill-verification/matched-skills")
def matched_skills(payload: SkillMatchRequest):
    seen = set()
    matched = []

    for skill in payload.skills:
        normalized = _normalize_skill(skill)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)

        bank = _resolve_skill_bank(skill)
        if not bank:
            continue

        levels = sorted(
            {str(q.get("level", "")).strip() for q in bank["questions"] if str(q.get("level", "")).strip()}
        )
        matched.append(
            {
                "resume_skill": skill,
                "bank_skill": bank["bank_skill"],
                "question_count": len(bank["questions"]),
                "levels": levels,
            }
        )

    return {"skills": matched}


@app.post("/skill-verification/questions")
def get_skill_questions(payload: SkillQuestionsRequest):
    bank = _resolve_skill_bank(payload.skill)
    if not bank:
        raise HTTPException(status_code=404, detail=f"No question bank found for skill: {payload.skill}")

    questions = []
    for item in bank["questions"]:
        question_id = str(item.get("id", "")).strip()
        question_text = str(item.get("question", "")).strip()
        if not question_id or not question_text:
            continue

        keywords = [str(x).strip() for x in (item.get("keywords") or []) if str(x).strip()]
        marks = float(item.get("marks") or max(1, len(keywords) or 1))
        questions.append(
            {
                "id": question_id,
                "level": str(item.get("level", "Core")).strip(),
                "question": question_text,
                "marks": marks,
            }
        )

    return {"skill": bank["bank_skill"], "questions": questions}


@app.post("/skill-verification/score")
def score_skill_answer(payload: SkillAnswerScoreRequest):
    bank = _resolve_skill_bank(payload.skill)
    if not bank:
        raise HTTPException(status_code=404, detail=f"No question bank found for skill: {payload.skill}")

    target = None
    for item in bank["questions"]:
        if str(item.get("id", "")).strip() == payload.question_id:
            target = item
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Question id not found: {payload.question_id}")

    keywords = [str(x).strip() for x in (target.get("keywords") or []) if str(x).strip()]
    marks = float(target.get("marks") or max(1, len(keywords) or 1))
    scored = _score_answer_with_keywords(payload.answer, keywords, marks)
    expected_answer = ", ".join(keywords)

    return {
        "skill": bank["bank_skill"],
        "question_id": payload.question_id,
        "level": str(target.get("level", "Core")).strip(),
        "question": str(target.get("question", "")).strip(),
        "expected_keywords": keywords,
        "expected_answer": expected_answer,
        **scored,
    }
