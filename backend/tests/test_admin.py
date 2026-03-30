from backend.auth import get_password_hash
from database.models import User
from datetime import datetime

def test_admin_change_user_role(client, test_admin, admin_token, db_session):
    user = User(
        email="change@test.com",
        full_name="Change Me",
        hashed_password=get_password_hash("test123"),
        role="user",
        is_active=True,
        created_at=datetime.now()
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.put(
        f"/api/v1/admin/users/{user.id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "moderator"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["new_role"] == "moderator"
    
    db_session.refresh(user)
    assert user.role == "moderator" # type: ignore

def test_admin_toggle_user_block(client, test_admin, admin_token, db_session):
    user = User(
        email="block@test.com",
        full_name="Block Me",
        hashed_password=get_password_hash("test123"),
        role="user",
        is_active=True,
        created_at=datetime.now()
    )
    db_session.add(user)
    db_session.commit()
    
    response = client.put(
        f"/api/v1/admin/users/{user.id}/toggle-block",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    db_session.refresh(user)
    assert user.is_active is False
    
    response = client.put(
        f"/api/v1/admin/users/{user.id}/toggle-block",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    db_session.refresh(user)
    assert user.is_active is True

def test_admin_search_users(client, test_admin, admin_token, db_session):
    users = [
        User(email="alice@test.com", full_name="Alice Wonder", hashed_password=get_password_hash("pwd"), role="user", is_active=True, created_at=datetime.now()),
        User(email="bob@test.com", full_name="Bob Builder", hashed_password=get_password_hash("pwd"), role="user", is_active=True, created_at=datetime.now()),
        User(email="charlie@test.com", full_name="Charlie Brown", hashed_password=get_password_hash("pwd"), role="user", is_active=True, created_at=datetime.now()),
    ]
    db_session.add_all(users)
    db_session.commit()
    
    response = client.get(
        "/api/v1/admin/users?search=alice",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    data = response.json()
    assert len(data) >= 1
    assert any(u["email"] == "alice@test.com" for u in data)
    
    response = client.get(
        "/api/v1/admin/users?search=Builder",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    data = response.json()
    assert any(u["full_name"] == "Bob Builder" for u in data)