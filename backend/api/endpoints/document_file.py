import json
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
import os
import uuid
from tempfile import TemporaryDirectory
from docx import Document

import schemas
from database.session import get_db
from auth import get_current_user
from database.models import DocumentValidation, User
from ai_service import AIService
from pdf_util import extract_pdf_text

from services.ocr_service import OCRService
from services.minio_service import MinIOService

router = APIRouter()
ai_service = AIService()
ocr_service = OCRService()
minio_service = MinIOService()

ALLOWED_EXTENSIONS = {"pdf", "txt", "doc", "docx", "jpg", "jpeg", "png", "gif", "bmp", "tiff"}
MAX_FILE_SIZE_MB = 10

def get_extension(filename: Optional[str]) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()

@router.post("/validate-file", response_model=schemas.ValidationResponse)
async def validate_file(
    file: UploadFile = File(...),
    checks: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    file_bytes = await file.read()

    image_extensions = {"jpg", "jpeg", "png", "gif", "bmp", "tiff"}

    try:
        file_path = minio_service.upload_file(
            file_bytes, 
            current_user.id, 
            file.filename, # type: ignore
            file.content_type or "application/octet-stream"
        )
        
        if ext in image_extensions:
            recognized_text = await ocr_service.recognize_image(file_bytes)
            print(f"Распознано {len(recognized_text)} символов") # type: ignore

            try:
                checks_list = json.loads(checks)
                print(f"Получено {len(checks_list)} правил для проверки")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid checks JSON: {str(e)}")
            
            validation_result = await ai_service.validate_document(
                document_text=recognized_text, # type: ignore
                checks=checks_list,
                document_name=file.filename,
            )
            
            ocr_result = schemas.ValidationResult(
                check_id=0,
                check="Распознавание текста из изображения",
                check_type="OCR",
                passed=True,
                message=f"Текст успешно распознан, длина: {len(recognized_text)} символов", # type: ignore
                parameters={"source": "aspose", "format": ext}
            )
            
            all_results = [ocr_result] + [
                schemas.ValidationResult(
                    check_id=r["check_id"],
                    check=r["check"],
                    check_type=r.get("check_type", "content"),
                    passed=r["passed"],
                    message=r["message"],
                    parameters=r.get("parameters", {})
                ) for r in validation_result["results"]
            ]
            
            response = schemas.ValidationResponse(
                results=all_results,
                ai_advice=validation_result["ai_advice"],
                summary=validation_result["summary"]
            )

            db_validation = DocumentValidation(
                user_id=current_user.id,
                document_name=file.filename,
                original_text=recognized_text,
                validation_results=response.dict(),
                file_path=file_path
            )
            db.add(db_validation)
            db.commit()
            
            return response
            
        else:
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
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid checks JSON: {str(e)}")

            validation_result = await ai_service.validate_document(
                document_text=document_text,
                checks=checks_list,
                user_id=current_user.id,
                db=db,
                document_name=file.filename,
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

            response = schemas.ValidationResponse(
                results=results,
                ai_advice=validation_result["ai_advice"],
                summary=validation_result["summary"]
            )
            
            db_validation = DocumentValidation(
                user_id=current_user.id,
                document_name=file.filename,
                original_text=document_text,
                validation_results=response.dict(),
                file_path=file_path
            )
            db.add(db_validation)
            db.commit()
            
            return response
            
    except Exception as e:
        print(f"ОШИБКА: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))