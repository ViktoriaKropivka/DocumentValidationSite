from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from services.ocr_service import OCRService
from auth import get_current_user

router = APIRouter()
ocr_service = OCRService()

@router.post("/ocr/recognize")
async def recognize_text(
    file: UploadFile = File(...),
    language: str = "English",
    current_user = Depends(get_current_user)
):
    try:
        contents = await file.read()
        
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 5MB)")
        
        if file.content_type:
            if file.content_type.startswith(('image/', 'application/pdf')):
                allowed = True
        
        if not allowed and file.filename:
            if file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp')):
                allowed = True
        
        if not allowed:
            raise HTTPException(400, "File type not supported. Please upload images or PDF files.")
        
        recognized_text = await ocr_service.recognize_image(contents, language)
        
        if recognized_text:
            return {
                "success": True,
                "text": recognized_text,
                "filename": file.filename or "unknown",
                "language": language
            }
        else:
            return {
                "success": False,
                "message": "Failed to recognize text"
            }
            
    except Exception as e:
        raise HTTPException(500, str(e))