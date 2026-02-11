import json
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Depends, status
from sqlalchemy import cast
from sqlalchemy.orm import Session
import os
import uuid
from tempfile import TemporaryDirectory
from docx import Document

import schemas
from database.session import get_db
from auth import get_current_user
from database.models import User
from ai_service import AIService
from pdf_util import extract_pdf_text

router = APIRouter()
ai_service = AIService()

ALLOWED_EXTENSIONS = {"pdf", "txt", "doc", "docx"}
MAX_FILE_SIZE_MB = 10

def get_extension(filename: Optional[str]) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()

from fastapi import UploadFile, File, Form
import json
from tempfile import TemporaryDirectory
import os, uuid

@router.post("/validate-file", response_model=schemas.ValidationResponse)
async def validate_file(
    file: UploadFile = File(...),
    checks: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_bytes = await file.read()

    if ext == "pdf":
        document_text = extract_pdf_text(file_bytes)

    elif ext == "docx":
        try:
            with TemporaryDirectory() as temp_dir:
                temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}.docx")
                with open(temp_path, "wb") as f:
                    f.write(file_bytes)

                doc = Document(temp_path)
                document_text = "\n".join([p.text for p in doc.paragraphs])

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

    else:
        document_text = file_bytes.decode("utf-8", errors="ignore")


    try:
        checks_list = json.loads(checks)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid checks JSON")

    validation_result = await ai_service.validate_document(
        document_text=document_text,
        checks=checks_list,
        user_id=current_user.id,
        db=db
    )

    results = [
        schemas.ValidationResult(
            check_id=r["check_id"],
            check=r["check"],
            check_type=r.get("check_type", "content"),
            passed=r["passed"],
            message=r["message"],
            parameters=r.get("parameters", {})
        ) for r in validation_result["results"]
    ]

    return schemas.ValidationResponse(
        results=results,
        ai_advice=validation_result["ai_advice"],
        summary=validation_result["summary"]
    )