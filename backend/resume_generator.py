from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Literal

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from resume_templates.basic import build_basic_resume
from resume_templates.executive import build_executive_resume
from resume_templates.minimal import build_minimal_resume
from resume_templates.modern import build_modern_resume
from resume_templates.professional import build_professional_resume
from resume_templates.student import build_student_resume

TemplateName = Literal["basic", "modern", "professional", "minimal", "executive", "student"]


def generate_resume_pdf(data: dict, template: TemplateName = "basic") -> str:
    output_dir = ROOT_DIR / "generated_resumes"
    output_dir.mkdir(parents=True, exist_ok=True)

    filename = f"resume_{template}_{uuid.uuid4().hex[:8]}.pdf"
    output_path = output_dir / filename

    payload = {
        "name": str(data.get("name", "")).strip(),
        "email": str(data.get("email", "")).strip(),
        "phone": str(data.get("phone", "")).strip(),
        "summary": str(data.get("summary", "")).strip(),
        "skills": str(data.get("skills", "")).strip(),
        "projects": str(data.get("projects", "")).strip(),
        "education": str(data.get("education", "")).strip(),
        "experience": str(data.get("experience", "")).strip(),
        "certifications": str(data.get("certifications", "")).strip(),
        "achievements": str(data.get("achievements", "")).strip(),
        "internships": str(data.get("internships", "")).strip(),
    }

    if template == "modern":
        build_modern_resume(str(output_path), payload)
    elif template == "professional":
        build_professional_resume(str(output_path), payload)
    elif template == "minimal":
        build_minimal_resume(str(output_path), payload)
    elif template == "executive":
        build_executive_resume(str(output_path), payload)
    elif template == "student":
        build_student_resume(str(output_path), payload)
    else:
        build_basic_resume(str(output_path), payload)

    return str(output_path)
