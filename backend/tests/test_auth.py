import pytest


async def test_login_success(client, admin_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": admin_user.email,
        "password": "pytest_secret_123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client, admin_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": admin_user.email,
        "password": "wrong_password",
    })
    assert resp.status_code == 401


async def test_login_nonexistent_user(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@nonexistent.com",
        "password": "whatever",
    })
    assert resp.status_code == 401


async def test_refresh_valid_token(client, admin_user):
    # Login primero para obtener tokens reales
    login = await client.post("/api/v1/auth/login", json={
        "email": admin_user.email,
        "password": "pytest_secret_123!",
    })
    refresh_token = login.json()["refresh_token"]

    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_refresh_invalid_token(client):
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": "not.a.real.token"})
    assert resp.status_code == 401


async def test_get_me_authenticated(client, admin_headers, admin_user):
    resp = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == admin_user.email
    assert data["role"] == "business_admin"


async def test_get_me_no_token(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 403
