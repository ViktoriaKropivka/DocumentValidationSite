from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from auth import get_current_user
from database.models import User
import schemas
from ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/generate-checks", response_model=schemas.CheckGenerationResponse)
async def generate_checks(
    request: schemas.CheckGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Быстрая генерация чек-листа"""
    try:
        result = await ai_service.generate_checks(request.user_request)
        
        # Преобразуем в формат CheckItem (новая структура)
        check_items = [
            schemas.CheckItem(
                id=check["id"],
                description=check["description"],
                check_type=check["check_type"],
                parameters=check.get("parameters", {}),
                priority=check.get("priority", "medium"),
                category=check.get("category", "content")
            )
            for check in result["checks"]
        ]
        
        return schemas.CheckGenerationResponse(
            original_request=result["original_request"],
            checks=check_items,
            total_checks=result["total_checks"],
            model_used=result["model_used"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации проверок: {str(e)}"
        )

@router.post("/validate-document", response_model=schemas.ValidationResponse)
async def validate_document(
    request: schemas.DocumentValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Быстрая валидация документа по AI-правилам"""
    try:
        checks_dict = [
            {
                "id": check.id,
                "description": check.description,
                "check_type": check.check_type,
                "parameters": check.parameters,
                "priority": check.priority,
                "category": check.category
            }
            for check in request.checks
        ]
        
        validation_result = await ai_service.validate_document(
            request.document_text, 
            checks_dict
        )
        
        results = [
            schemas.ValidationResult(
                check_id=result["check_id"],
                check=result["check"],
                check_type=result.get("check_type", "content"),
                passed=result["passed"],
                message=result["message"],
                parameters=result.get("parameters", {})
            )
            for result in validation_result["results"]
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