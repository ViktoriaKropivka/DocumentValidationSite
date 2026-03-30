from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from config import settings
from database.base import Base
from database.session import engine

from auth import router as auth_router
from api.endpoints.users import router as users_router
from api.endpoints.documents import router as documents_router
from api.endpoints.rules import router as rules_router
from api.endpoints.document_file import router as document_file_router
from api.endpoints.admin import router as admin_router
from api.endpoints.seo import router as seo_router
from api.endpoints.ocr import router as ocr_router

from database.models import User
from database.models import DocumentValidation
from database.models import ValidationRule
from database.models import ValidationSession

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Validator API",
    description="API for document validation with AI",
    version="1.0.0"
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        response = await call_next(request)
        return response

    try:
        body = await request.body()
        if body:
            try:
                body_text = body.decode('utf-8')
                print(f"Request: {request.method} {request.url}")
                print(f"Request body: {body_text}")
            except UnicodeDecodeError:
                print(f"Request: {request.method} {request.url} [binary data]")
        else:
            print(f"Request: {request.method} {request.url}")
    except Exception as e:
        print(f"Error reading body: {e}")

    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1", tags=["authentication"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(documents_router, prefix="/api/v1", tags=["documents"])
app.include_router(rules_router, prefix="/api/v1", tags=["rules"])
app.include_router(document_file_router, prefix="/api/v1", tags=["documents_save_file"])
app.include_router(admin_router, prefix="/api/v1", tags=["admin"])
app.include_router(seo_router, prefix="", tags=["seo"])
app.include_router(ocr_router, prefix="/api/v1", tags=["ocr"])

@app.get("/")
def read_root():
    return {"message": "AI Validator API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "SQLite"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)