from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from auth import get_current_user
from database.models import User
import schemas

router = APIRouter()

def require_admin(current_user = Depends(get_current_user)):
    user_role = str(current_user.role) if current_user.role else "user"
    
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён. Требуется роль администратора."
        )
    return current_user

@router.get("/admin/users", response_model=List[schemas.User])
async def get_all_users(
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return users

@router.put("/admin/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    role_data: dict,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить свою роль"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    new_role = role_data.get("role")
    valid_roles = ["user", "moderator", "admin"]
    
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Роль должна быть одной из: {', '.join(valid_roles)}"
        )
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Роль пользователя {user.email} изменена на {new_role}",
        "user_id": user.id,
        "new_role": new_role
    }

@router.put("/admin/users/{user_id}/toggle-block")
async def toggle_user_block(
    user_id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя заблокировать самого себя"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.is_active = not user.is_active # type: ignore
    db.commit()
    
    status_text = "разблокирован" if user.is_active else "заблокирован" # type: ignore
    return {
        "message": f"Пользователь {user.email} {status_text}",
        "is_active": user.is_active
    }