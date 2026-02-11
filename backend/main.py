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
        print(f"Request (multipart): {request.method} {request.url}")
        response = await call_next(request)
        return response

    try:
        body = await request.body()
        print(f"Request: {request.method} {request.url}")
        print(f"Request body: {body.decode('utf-8', errors='ignore')}")
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

@app.get("/")
def read_root():
    return {"message": "AI Validator API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "SQLite"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)