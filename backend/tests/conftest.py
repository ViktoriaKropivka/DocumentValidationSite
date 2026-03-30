import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
from typing import Generator

from main import app
from database.base import Base
from database.session import get_db
from database.models import User
from auth import get_password_hash

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("Создание таблиц...")
Base.metadata.create_all(bind=engine)
print("Таблицы созданы")

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db_for_test():
        try:
            yield db_session
        finally:
            pass
    
    original_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db_for_test
    
    with TestClient(app) as test_client:
        yield test_client
    
    if original_override:
        app.dependency_overrides[get_db] = original_override
    else:
        del app.dependency_overrides[get_db]

@pytest.fixture
def test_user(db_session):
    user = User(
        email="test@test.com",
        full_name="Test User",
        hashed_password=get_password_hash("test123"),
        role="user",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    print(f"Пользователь test@test.com создан с id={user.id}")
    return user

@pytest.fixture
def test_admin(db_session):
    admin = User(
        email="admin@test.com",
        full_name="Admin User",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    print(f"Администратор admin@test.com создан с id={admin.id}")
    return admin

@pytest.fixture
def user_token(client, test_user):
    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    return login.json()["access_token"]

@pytest.fixture
def admin_token(client, test_admin):
    login = client.post("/api/v1/login/", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    return login.json()["access_token"]

@pytest.fixture
def test_db(db_session):
    return db_session