from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ai_service import AIService
from database.session import get_db
from auth import get_current_user
from database.models import User, DocumentValidation
import schemas

router = APIRouter()

@router.get("/validation-history", response_model=List[schemas.DocumentValidation])
async def get_validation_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает историю проверок документов пользователя"""
    try:
        validations = db.query(DocumentValidation).filter(
            DocumentValidation.user_id == current_user.id
        ).order_by(DocumentValidation.created_at.desc()).all()
        
        return validations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении истории: {str(e)}"
        )

@router.post("/save-validation")
async def save_validation_result(
    validation_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сохраняет результаты валидации в базу данных"""
    try:
        db_validation = DocumentValidation(
            user_id=current_user.id,
            document_name=validation_data.get("document_name", "Unnamed Document"),
            original_text=validation_data.get("document_text", ""),
            validation_results=validation_data.get("validation_results", {})
        )
        
        db.add(db_validation)
        db.commit()
        db.refresh(db_validation)
        
        return {"message": "Результаты валидации сохранены", "validation_id": db_validation.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении результатов: {str(e)}"
        )
