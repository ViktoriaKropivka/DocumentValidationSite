from unittest.mock import patch, AsyncMock

@patch("services.ocr_service.OCRService.recognize_image", new_callable=AsyncMock)
def test_ocr_success(mock_recognize, client, test_user, user_token):
    mock_recognize.return_value = "Распознанный текст с картинки"
    
    image_content = b"fake image data"
    
    response = client.post(
        "/api/v1/validate-file",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.png", image_content, "image/png")},
        data={"checks": '[{"id":1,"check_type":"CHECK_TITLE","description":"Test"}]'}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    ocr_results = [r for r in data["results"] if r["check_type"] == "OCR"]
    assert len(ocr_results) > 0
    assert "распознан" in ocr_results[0]["message"].lower()
    
    ai_results = [r for r in data["results"] if r["check_type"] != "OCR"]
    assert len(ai_results) > 0

@patch("services.ocr_service.OCRService.recognize_image", new_callable=AsyncMock)
def test_ocr_empty_result(mock_recognize, client, test_user, user_token):
    mock_recognize.return_value = ""
    
    image_content = b"fake image data"
    
    response = client.post(
        "/api/v1/validate-file",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("empty.png", image_content, "image/png")},
        data={"checks": '[{"id":1,"check_type":"CHECK_TITLE","description":"Test"}]'}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    ocr_results = [r for r in data["results"] if r["check_type"] == "OCR"]
    assert len(ocr_results) > 0
    assert "0 символов" in ocr_results[0]["message"]

@patch("services.ocr_service.OCRService.recognize_image", new_callable=AsyncMock)
def test_ocr_api_failure(mock_recognize, client, test_user, user_token):
    mock_recognize.side_effect = Exception("OCR API unavailable")
    
    image_content = b"fake image data"
    
    response = client.post(
        "/api/v1/validate-file",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.png", image_content, "image/png")},
        data={"checks": '[{"id":1,"check_type":"CHECK_TITLE","description":"Test"}]'}
    )
    
    assert response.status_code == 400
    assert "OCR API" in response.text

def test_ocr_unsupported_format(client, test_user, user_token):
    image_content = b"fake data"
    
    response = client.post(
        "/api/v1/validate-file",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.webp", image_content, "image/webp")},
        data={"checks": '[{"id":1,"check_type":"CHECK_TITLE","description":"Test"}]'}
    )
    
    assert response.status_code == 400
    assert "Unsupported file type" in response.text

def test_ocr_no_checks(client, test_user, user_token):
    image_content = b"fake image data"
    
    response = client.post(
        "/api/v1/validate-file",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.png", image_content, "image/png")},
        data={}
    )
    
    assert response.status_code == 422