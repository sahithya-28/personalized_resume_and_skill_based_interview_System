from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer
from xml.sax.saxutils import escape


def _lines(text: str) -> list[str]:
    if not text:
        return []
    return [line.strip() for line in text.splitlines() if line.strip()]


def _section(story, title: str):
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>{escape(title.upper())}</b>", _SECTION_TITLE))
    story.append(HRFlowable(width="100%", thickness=0.7, lineCap="round", color=colors.HexColor("#9ca3af")))
    story.append(Spacer(1, 4))


styles = getSampleStyleSheet()
_HEADER_NAME = ParagraphStyle(
    "CreatorName",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=25,
    alignment=1,
    textColor=colors.HexColor("#111827"),
)
_HEADER_META = ParagraphStyle(
    "CreatorMeta",
    parent=styles["Normal"],
    fontSize=9.5,
    leading=12,
    alignment=1,
    textColor=colors.HexColor("#374151"),
)
_SECTION_TITLE = ParagraphStyle(
    "CreatorSection",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=13,
    textColor=colors.HexColor("#111827"),
)
_BODY = ParagraphStyle(
    "CreatorBody",
    parent=styles["Normal"],
    fontSize=10.2,
    leading=13.5,
    textColor=colors.HexColor("#111827"),
)
_SUBTITLE = ParagraphStyle(
    "CreatorSubtitle",
    parent=styles["Normal"],
    fontName="Helvetica-Oblique",
    fontSize=10.2,
    leading=13,
    textColor=colors.HexColor("#111827"),
)
_DATE_LOC = ParagraphStyle(
    "CreatorDateLoc",
    parent=styles["Normal"],
    fontSize=9.6,
    leading=12,
    alignment=2,
    textColor=colors.HexColor("#374151"),
)


def build_creator_resume(file_path, data):
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=42,
        rightMargin=42,
        topMargin=30,
        bottomMargin=34,
    )
    story = []

    name = escape(data.get("name") or "Candidate Name")
    story.append(Paragraph(name, _HEADER_NAME))
    story.append(Spacer(1, 3))
    contact = " | ".join([x for x in [data.get("phone", "").strip(), data.get("email", "").strip()] if x])
    if contact:
        story.append(Paragraph(escape(contact), _HEADER_META))
    story.append(Spacer(1, 8))

    # Experience
    _section(story, "Experience")
    exp_lines = _lines(data.get("experience", ""))
    if exp_lines:
        story.append(Paragraph(f"<b>{escape(exp_lines[0])}</b>", _BODY))
        if len(exp_lines) > 1:
            story.append(Paragraph(escape(exp_lines[1]), _SUBTITLE))
        for line in exp_lines[2:]:
            story.append(Paragraph(f"&#8226; {escape(line)}", _BODY))
    else:
        story.append(Paragraph("&#8226; Add your role, company, dates, and measurable outcomes.", _BODY))

    # Projects
    _section(story, "Projects")
    prj_lines = _lines(data.get("projects", ""))
    if prj_lines:
        story.append(Paragraph(f"<b>{escape(prj_lines[0])}</b>", _BODY))
        for line in prj_lines[1:]:
            story.append(Paragraph(f"&#8226; {escape(line)}", _BODY))
    else:
        story.append(Paragraph("&#8226; Add 1-3 projects with impact metrics.", _BODY))

    # Education
    _section(story, "Education")
    edu_lines = _lines(data.get("education", ""))
    if edu_lines:
        story.append(Paragraph(f"<b>{escape(edu_lines[0])}</b>", _BODY))
        if len(edu_lines) > 1:
            story.append(Paragraph(escape(edu_lines[1]), _SUBTITLE))
        for line in edu_lines[2:]:
            story.append(Paragraph(f"&#8226; {escape(line)}", _BODY))
    else:
        story.append(Paragraph("&#8226; Add your degree, university, and graduation year.", _BODY))

    # Skills
    _section(story, "Skills")
    skills_text = escape((data.get("skills") or "").strip())
    if skills_text:
        story.append(Paragraph(skills_text, _BODY))
    else:
        story.append(Paragraph("Python, JavaScript, React, SQL, Product Thinking", _BODY))

    # Optional summary/certifications as compact footer section
    extra = []
    if data.get("summary", "").strip():
        extra.append(f"<b>Summary:</b> {escape(data['summary'].strip())}")
    if data.get("certifications", "").strip():
        extra.append(f"<b>Certifications:</b> {escape(data['certifications'].strip())}")
    if extra:
        _section(story, "Additional")
        for line in extra:
            story.append(Paragraph(line, _BODY))

    doc.build(story)
