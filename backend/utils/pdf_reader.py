from __future__ import annotations

from io import BytesIO

from PyPDF2 import PdfReader


def extract_pdf_text(file_bytes: bytes) -> str:
    if not file_bytes:
        raise ValueError("Uploaded PDF is empty")

    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError("Unable to read PDF file") from exc

    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text)

    return "\n".join(pages).strip()
