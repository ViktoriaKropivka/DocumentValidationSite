import requests
import base64
from typing import Optional
import time

class OCRService:
    def __init__(self):
        self.base_url = "https://api.aspose.cloud/v5.0/ocr"
    
    async def recognize_image(self, image_bytes: bytes, language: str = "English") -> Optional[str]:
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        response = requests.post(
            f"{self.base_url}/RecognizeImageTrial",
            headers={
                "Accept": "text/plain",
                "Content-Type": "application/json"
            },
            json={
                "image": image_base64,
                "settings": {
                    "language": language,
                    "resultType": "Text"
                }
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"OCR API error: {response.text}")
        
        task_id = response.text.strip('"')
        
        time.sleep(2)
        
        result_response = requests.get(
            f"{self.base_url}/RecognizeImageTrial",
            headers={
                "Accept": "text/plain",
                "Content-Type": "application/json"
            },
            params={"id": task_id}
        )
        
        if result_response.status_code == 200:
            return result_response.text
        else:
            return None