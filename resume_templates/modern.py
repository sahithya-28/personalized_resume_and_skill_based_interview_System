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


def build_modern_resume(file_path, data):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    story = []
    story.append(Paragraph(f"<font size=20><b>{data['name']}</b></font>", styles["Title"]))
    story.append(Spacer(1, 16))
    story.append(Paragraph(f"<i>{data['email']} | {data['phone']}</i>", styles["Normal"]))
    story.append(Spacer(1, 14))

    def add_section(title, text):
        if text and text.strip():
            story.append(Paragraph(f"<b>{title}</b>", styles["Heading2"]))
            story.append(Spacer(1, 6))
            story.append(Paragraph(_format_multiline(text), styles["Normal"]))
            story.append(Spacer(1, 10))

    add_section("Skills", data.get("skills", ""))
    add_section("Projects", data.get("projects", ""))
    add_section("Experience", data.get("experience", ""))
    add_section("Education", data.get("education", ""))

    doc.build(story)
