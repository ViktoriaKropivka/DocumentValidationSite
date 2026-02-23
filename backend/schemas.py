from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    role: str = "user"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

class CheckItem(BaseModel):
    id: int
    description: str
    check_type: str
    parameters: Dict[str, Any] = {}
    priority: str = "medium"
    category: str = "content"

class CheckGenerationRequest(BaseModel):
    user_request: str

class DocumentValidationRequest(BaseModel):
    document_text: str
    checks: List[CheckItem]

class CheckGenerationResponse(BaseModel):
    original_request: str
    checks: List[CheckItem]
    total_checks: int
    model_used: str

class ValidationResult(BaseModel):
    check_id: int
    check: str
    check_type: str
    passed: bool
    message: str
    parameters: Dict[str, Any] = {}

class ValidationResponse(BaseModel):
    results: List[ValidationResult]
    ai_advice: List[str]
    summary: Dict[str, Any]

class DocumentValidationBase(BaseModel):
    document_name: str
    original_text: str

class DocumentValidationCreate(DocumentValidationBase):
    pass

class DocumentValidation(DocumentValidationBase):
    id: int
    user_id: int
    validation_results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True