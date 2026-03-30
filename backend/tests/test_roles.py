import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.models import User, DocumentValidation
from auth import get_password_hash
from datetime import datetime, timezone

def test_user_own_docs(client, test_user, db_session):
    doc1 = DocumentValidation(
        user_id=test_user.id,
        document_name="My doc",
        original_text="text",
        validation_results={}
    )
    doc2 = DocumentValidation(
        user_id=999,
        document_name="Their doc",
        original_text="text",
        validation_results={}
    )
    db_session.add_all([doc1, doc2])
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    token = login.json()["access_token"]

    response = client.get(
        "/api/v1/validation-history",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["document_name"] == "My doc"

def test_user_no_delete_others(client, test_user, db_session):
    doc = DocumentValidation(
        user_id=999,
        document_name="Their doc",
        original_text="text",
        validation_results={}
    )
    db_session.add(doc)
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    token = login.json()["access_token"]

    response = client.delete(
        f"/api/v1/validation-history/{doc.id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403

def test_user_delete_own(client, test_user, db_session):
    doc = DocumentValidation(
        user_id=test_user.id,
        document_name="My doc",
        original_text="text",
        validation_results={}
    )
    db_session.add(doc)
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    token = login.json()["access_token"]

    response = client.delete(
        f"/api/v1/validation-history/{doc.id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200

def test_admin_all_docs(client, test_admin, db_session):
    docs = [
        DocumentValidation(user_id=111, document_name="Doc 1", original_text="", validation_results={}),
        DocumentValidation(user_id=222, document_name="Doc 2", original_text="", validation_results={}),
        DocumentValidation(user_id=333, document_name="Doc 3", original_text="", validation_results={})
    ]
    db_session.add_all(docs)
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    token = login.json()["access_token"]

    response = client.get(
        "/api/v1/validation-history",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3

def test_admin_filter_user(client, test_admin, db_session):
    docs = [
        DocumentValidation(user_id=111, document_name="Doc 1", original_text="", validation_results={}),
        DocumentValidation(user_id=111, document_name="Doc 2", original_text="", validation_results={}),
        DocumentValidation(user_id=222, document_name="Doc 3", original_text="", validation_results={})
    ]
    db_session.add_all(docs)
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    token = login.json()["access_token"]

    response = client.get(
        "/api/v1/validation-history?user_id=111",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2

def test_admin_delete_any(client, test_admin, db_session):
    doc = DocumentValidation(
        user_id=999,
        document_name="Their doc",
        original_text="text",
        validation_results={}
    )
    db_session.add(doc)
    db_session.commit()

    login = client.post("/api/v1/login/", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    token = login.json()["access_token"]

    response = client.delete(
        f"/api/v1/validation-history/{doc.id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200