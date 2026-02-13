from fastapi import Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from database.session import get_db
from auth import get_current_user
from database.models import DocumentValidation, ValidationRule


class PermissionChecker:
    
    @staticmethod
    def require_roles(required_roles: List[str]):
        def role_checker(current_user = Depends(get_current_user)):
            db = next(get_db())
            fresh_user = db.query(type(current_user)).filter(
                type(current_user).id == current_user.id
            ).first()
            
            if not fresh_user:
                raise HTTPException(status_code=401, detail="User not found")
            
            user_role = str(fresh_user.role) if fresh_user.role else "user"
            
            if user_role not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Доступ запрещён. Требуется роль: {', '.join(required_roles)}"
                )
            return fresh_user
        return role_checker
    
    @staticmethod
    def require_admin():
        return PermissionChecker.require_roles(["admin"])
    
    @staticmethod
    def require_moderator_or_admin():
        return PermissionChecker.require_roles(["moderator", "admin"])
    
    @staticmethod
    def can_access_document(document_id: int, db: Session, current_user):
        document = db.query(DocumentValidation).filter(
            DocumentValidation.id == document_id
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Документ не найден")
        
        fresh_user = db.query(type(current_user)).filter(
            type(current_user).id == current_user.id
        ).first()
        
        if not fresh_user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_role = str(fresh_user.role) if fresh_user.role else "user"
        user_id = int(fresh_user.id)
        
        if user_role == "admin":
            return document
        
        if user_role == "moderator":
            return document
        
        if document.user_id != user_id: # type: ignore
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет доступа к этому документу"
            )
        
        return document