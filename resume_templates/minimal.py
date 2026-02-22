from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from xml.sax.saxutils import escape


def _format_multiline(text: str) -> str:
    if not text:
        return ""
    escaped = escape(text.strip())
    lines = [line.strip() for line in escaped.splitlines() if line.strip()]
    return "<br/>".join(lines)


def build_minimal_resume(file_path, data):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=42,
        leftMargin=42,
        topMargin=44,
        bottomMargin=44,
    )

    story = []
    story.append(Paragraph(f"<font size=18><b>{data['name']}</b></font>", styles["Title"]))
    story.append(Paragraph(f"{data['email']} | {data['phone']}", styles["Normal"]))
    story.append(Spacer(1, 12))

    def add_section(title, text):
        if text and text.strip():
            story.append(Paragraph(f"<b>{title}</b>", styles["Heading3"]))
            story.append(Paragraph(_format_multiline(text), styles["Normal"]))
            story.append(Spacer(1, 8))

    add_section("Summary", data.get("summary", ""))
    add_section("Skills", data.get("skills", ""))
    add_section("Experience", data.get("experience", ""))
    add_section("Projects", data.get("projects", ""))
    add_section("Education", data.get("education", ""))

    doc.build(story)
