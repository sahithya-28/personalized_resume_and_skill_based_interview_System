from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.parser import clean_resume_text, parse_resume_text
from utils.pdf_reader import extract_pdf_text

router = APIRouter(tags=["resume"])


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is missing")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        file_bytes = await file.read()
        extracted_text = extract_pdf_text(file_bytes)
        cleaned_text = clean_resume_text(extracted_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {exc}") from exc

    if not cleaned_text:
        raise HTTPException(status_code=400, detail="No readable text found in the uploaded PDF")

    return parse_resume_text(cleaned_text)
