from database.models import DocumentValidation

def test_document_pagination(client, test_user, user_token, test_db):
    for i in range(15):
        doc = DocumentValidation(
            user_id=test_user.id,
            document_name=f"Doc {i}",
            original_text="",
            validation_results={}
        )
        test_db.add(doc)
    test_db.commit()
    
    response = client.get(
        "/api/v1/validation-history?page=1&page_size=10",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 15
    assert data["page"] == 1
    assert data["total_pages"] == 2
    
    response = client.get(
        "/api/v1/validation-history?page=2&page_size=10",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    data = response.json()
    assert len(data["items"]) == 5

def test_search_by_document_name(client, test_user, user_token, test_db):
    docs = [
        DocumentValidation(user_id=test_user.id, document_name="Alpha Report", original_text="", validation_results={}),
        DocumentValidation(user_id=test_user.id, document_name="Beta Analysis", original_text="", validation_results={}),
        DocumentValidation(user_id=test_user.id, document_name="Gamma Summary", original_text="", validation_results={}),
    ]
    test_db.add_all(docs)
    test_db.commit()
    
    response = client.get(
        "/api/v1/validation-history?doc_name=Report",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["document_name"] == "Alpha Report"

def test_filter_by_date(client, test_user, user_token, test_db):
    from datetime import datetime, timedelta
    
    dates = [
        datetime.now() - timedelta(days=5),
        datetime.now() - timedelta(days=3),
        datetime.now() - timedelta(days=1)
    ]
    
    for i, date in enumerate(dates):
        doc = DocumentValidation(
            user_id=test_user.id,
            document_name=f"Doc {i}",
            original_text="",
            validation_results={},
            created_at=date
        )
        test_db.add(doc)
    test_db.commit()
    
    from_date = (datetime.now() - timedelta(days=2)).date().isoformat()
    response = client.get(
        f"/api/v1/validation-history?date_from={from_date}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    data = response.json()
    assert len(data["items"]) == 1