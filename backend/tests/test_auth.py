def test_register_success(client):
    response = client.post("/api/v1/register/", json={
        "email": "new@user.com",
        "full_name": "New User",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@user.com"
    assert data["role"] == "user"

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/v1/register/", json={
        "email": "test@test.com",
        "full_name": "Another",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.text

def test_login_success(client, test_user):
    response = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_login_wrong_password(client, test_user):
    response = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "wrong"
    })
    assert response.status_code == 401

def test_refresh_token(client, test_user):
    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    refresh_token = login.json()["refresh_token"]
    
    response = client.post("/api/v1/refresh", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

def test_logout(client, test_user):
    login = client.post("/api/v1/login/", json={
        "email": "test@test.com",
        "password": "test123"
    })
    refresh_token = login.json()["refresh_token"]
    
    response = client.post("/api/v1/logout", json={
        "refresh_token": refresh_token
    })
    assert response.status_code == 200
    assert "Logged out" in response.text