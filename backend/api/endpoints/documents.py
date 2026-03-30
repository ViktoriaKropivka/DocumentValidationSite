from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from datetime import datetime, date

from ai_service import AIService
from services.minio_service import MinIOService
from database.session import get_db
from auth import get_current_user
from database.models import User, DocumentValidation
import schemas

router = APIRouter()
minio_service = MinIOService()

@router.get("/validation-history", response_model=schemas.PaginatedValidationHistory)
async def get_validation_history(
    doc_name: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    user_id: Optional[int] = Query(None),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(DocumentValidation)
        
        user_role = str(current_user.role) if current_user.role else "user"
        
        if user_role == "user":
            query = query.filter(DocumentValidation.user_id == current_user.id)
        else:
            if user_id:
                query = query.filter(DocumentValidation.user_id == user_id)
        
        if doc_name:
            query = query.filter(DocumentValidation.document_name.contains(doc_name))
        
        if date_from:
            query = query.filter(DocumentValidation.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            query = query.filter(DocumentValidation.created_at <= datetime.combine(date_to, datetime.max.time()))
        
        total = query.count()
        
        if sort_order == "desc":
            query = query.order_by(desc(DocumentValidation.created_at))
        else:
            query = query.order_by(asc(DocumentValidation.created_at))
        
        validations = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "items": validations,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении истории: {str(e)}"
        )

@router.post("/validate-document", response_model=schemas.ValidationResponse)
async def validate_document(
    request: schemas.DocumentValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        ai_service = AIService()
        
        checks_dict = [
            {
                "id": check.id,
                "description": check.description,
                "check_type": check.check_type,
                "parameters": check.parameters
            }
            for check in request.checks
        ]
        
        validation_result = await ai_service.validate_document(
            request.document_text, 
            checks_dict,
            user_id=current_user.id,
            db=db,
            document_name="Введённый текст"
        )
        
        results = [
            schemas.ValidationResult(
                check_id=r["check_id"],
                check=r["check"],
                check_type=r.get("check_type", "content"),
                passed=r["passed"],
                message=r["message"],
                parameters=r.get("parameters", {})
            )
            for r in validation_result["results"]
        ]
        
        return schemas.ValidationResponse(
            results=results,
            ai_advice=validation_result["ai_advice"],
            summary=validation_result["summary"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при проверке документа: {str(e)}"
        )
    
@router.delete("/validation-history/{document_id}")
async def delete_validation(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    document = db.query(DocumentValidation).filter(
        DocumentValidation.id == document_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    user_role = str(current_user.role) if current_user.role else "user" # type: ignore
    
    if user_role != "admin" and document.user_id != current_user.id: # type: ignore
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав на удаление"
        )
    
    db.delete(document)
    db.commit()
    
    return {"message": "Документ удалён", "id": document_id}

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(DocumentValidation).filter(
        DocumentValidation.id == document_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    user_role = str(current_user.role) if current_user.role else "user" # type: ignore
    if user_role != "admin" and document.user_id != current_user.id: # type: ignore
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    if document.file_path is None: # type: ignore
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    url = minio_service.get_download_url(document.file_path, filename=document.document_name) # type: ignore
    
    return {"download_url": url, "filename": document.document_name}