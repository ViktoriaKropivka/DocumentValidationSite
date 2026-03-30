import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://docuser:docpassword@localhost:5432/doc_validator"  
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "1234")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True

    OCR_API_KEY = os.getenv("OCR_API_KEY", "your_default_key")

    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
    MINIO_ENDPOINT_EXTERNAL: str = os.getenv("MINIO_ENDPOINT_EXTERNAL", "http://localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "user-documents")

settings = Settings()