from datetime import timedelta

import pytest

from app.core.security import create_access_token, hash_password
from app.database.database import SessionLocal
from app.database.models import User


def test_user_registration_success(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser_reg",
            "email": "testuser_reg@example.com",
            "password": "StrongPassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser_reg"
    assert data["email"] == "testuser_reg@example.com"
    assert data["role"] == "member"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data

    login = client.post(
        "/auth/login",
        json={"email": "testuser_reg@example.com", "password": "StrongPassword123"},
    )
    profile = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["role"] == "member"


def test_duplicate_user_registration_fails(client):
    registration = client.post(
        "/auth/register",
        json={
            "username": "dupuser",
            "email": "dupuser@example.com",
            "password": "StrongPassword123"
        }
    )
    assert registration.status_code == 201

    duplicate_email = client.post(
        "/auth/register",
        json={
            "username": "different_user",
            "email": "dupuser@example.com",
            "password": "StrongPassword123"
        }
    )
    duplicate_username = client.post(
        "/auth/register",
        json={
            "username": "dupuser",
            "email": "different@example.com",
            "password": "StrongPassword123"
        }
    )
    assert duplicate_email.status_code == 400
    assert duplicate_username.status_code == 400


@pytest.mark.parametrize(
    "overrides",
    [
        {"username": "ab"},
        {"email": "not-an-email"},
        {"password": "short"},
    ],
)
def test_invalid_user_registration_is_rejected(client, overrides):
    payload = {
        "username": "invalid_registration",
        "email": "invalid_registration@example.com",
        "password": "StrongPassword123",
    }
    payload.update(overrides)

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422


def test_user_login_success(client):
    client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "loginuser@example.com",
            "password": "StrongPassword123"
        }
    )
    response = client.post(
        "/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "StrongPassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["expires_in"] > 0
    assert data["token_type"] == "bearer"


def test_email_is_normalized_for_registration_and_login(client):
    registration = client.post(
        "/auth/register",
        json={
            "username": "caseuser",
            "email": "CaseUser@Example.com",
            "password": "StrongPassword123",
        },
    )
    login = client.post(
        "/auth/login",
        json={
            "email": "CASEUSER@EXAMPLE.COM",
            "password": "StrongPassword123",
        },
    )

    assert registration.status_code == 201
    assert registration.json()["email"] == "caseuser@example.com"
    assert login.status_code == 200


def test_login_finds_existing_user_with_mixed_case_email(client):
    db = SessionLocal()
    db.add(
        User(
            username="legacycaseuser",
            email="LegacyCase@Example.com",
            password_hash=hash_password("StrongPassword123"),
            role="member",
        )
    )
    db.commit()
    db.close()

    response = client.post(
        "/auth/login",
        json={
            "email": "legacycase@example.com",
            "password": "StrongPassword123",
        },
    )

    assert response.status_code == 200


def test_login_invalid_password_fails(client):
    client.post(
        "/auth/register",
        json={
            "username": "badpassuser",
            "email": "badpassuser@example.com",
            "password": "StrongPassword123"
        }
    )
    response = client.post(
        "/auth/login",
        json={
            "email": "badpassuser@example.com",
            "password": "WrongPassword999"
        }
    )
    assert response.status_code == 401


def test_invalid_email_and_password_have_same_auth_error(client):
    client.post(
        "/auth/register",
        json={
            "username": "enumerationuser",
            "email": "enumeration@example.com",
            "password": "StrongPassword123",
        },
    )
    wrong_password = client.post(
        "/auth/login",
        json={"email": "enumeration@example.com", "password": "WrongPassword999"},
    )
    unknown_email = client.post(
        "/auth/login",
        json={"email": "unknown@example.com", "password": "WrongPassword999"},
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_expired_access_token_is_rejected(client):
    client.post(
        "/auth/register",
        json={
            "username": "expireduser",
            "email": "expired@example.com",
            "password": "StrongPassword123",
        },
    )
    token = create_access_token(
        {"sub": "1", "email": "expired@example.com"},
        expires_delta=timedelta(seconds=-1),
    )

    response = client.get("/tasks", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Token has expired"


def test_refresh_token_rotation_and_reuse_detection(client):
    client.post(
        "/auth/register",
        json={
            "username": "refreshuser",
            "email": "refresh@example.com",
            "password": "StrongPassword123",
        },
    )
    login = client.post(
        "/auth/login",
        json={"email": "refresh@example.com", "password": "StrongPassword123"},
    )
    original_refresh = login.json()["refresh_token"]

    rotated = client.post("/auth/refresh", json={"refresh_token": original_refresh})

    assert rotated.status_code == 200
    rotated_refresh = rotated.json()["refresh_token"]
    assert rotated_refresh != original_refresh

    reused = client.post("/auth/refresh", json={"refresh_token": original_refresh})
    invalidated_replacement = client.post(
        "/auth/refresh", json={"refresh_token": rotated_refresh}
    )

    assert reused.status_code == 401
    assert invalidated_replacement.status_code == 401


def test_logout_revokes_refresh_token(client):
    client.post(
        "/auth/register",
        json={
            "username": "logoutuser",
            "email": "logout@example.com",
            "password": "StrongPassword123",
        },
    )
    login = client.post(
        "/auth/login",
        json={"email": "logout@example.com", "password": "StrongPassword123"},
    )
    refresh_token = login.json()["refresh_token"]

    logout = client.post("/auth/logout", json={"refresh_token": refresh_token})
    refresh = client.post("/auth/refresh", json={"refresh_token": refresh_token})

    assert logout.status_code == 204
    assert refresh.status_code == 401


def test_valid_access_token_protects_task_endpoint(client):
    client.post(
        "/auth/register",
        json={
            "username": "protecteduser",
            "email": "protected@example.com",
            "password": "StrongPassword123",
        },
    )
    login = client.post(
        "/auth/login",
        json={"email": "protected@example.com", "password": "StrongPassword123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.get("/tasks", headers=headers)

    assert response.status_code == 200
