from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ValidationRule(Base):
    __tablename__ = "validation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    pattern = Column(Text)
    condition = Column(Text)
    severity = Column(String(50), default="error")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DocumentValidation(Base):
    __tablename__ = "document_validations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    document_name = Column(String(255))
    original_text = Column(Text)
    validation_results = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ValidationSession(Base):
    __tablename__ = "validation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_name = Column(String(255))
    rules_used = Column(JSON)
    document_text = Column(Text)
    results = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())