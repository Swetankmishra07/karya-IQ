import pytest
from pydantic import ValidationError

from app.core.config import Settings, settings
from app.database.database import SessionLocal
from app.database.models import User


def register_and_login(client, username, email, password="StrongPassword123"):
    registration = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert registration.status_code == 201
    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def assign_role(email, role):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).one()
        user.role = role
        db.commit()
    finally:
        db.close()


def test_member_can_access_owned_task_but_not_user_management(client):
    member_headers = register_and_login(client, "member", "member@example.com")

    task = client.post(
        "/tasks",
        headers=member_headers,
        json={"title": "Member task", "status": "todo"},
    )
    users = client.get("/users", headers=member_headers)

    assert task.status_code == 201
    assert users.status_code == 403


def test_manager_can_manage_current_task_scope(client):
    owner_headers = register_and_login(client, "owner", "owner@example.com")
    task = client.post(
        "/tasks",
        headers=owner_headers,
        json={"title": "Managed task", "status": "todo"},
    )
    task_id = task.json()["id"]

    manager_headers = register_and_login(client, "manager", "manager@example.com")
    assign_role("manager@example.com", "manager")

    users = client.get("/users", headers=manager_headers)
    managed_task = client.get(f"/tasks/{task_id}", headers=manager_headers)
    updated = client.put(
        f"/tasks/{task_id}",
        headers=manager_headers,
        json={"title": "Manager updated task"},
    )

    assert users.status_code == 200
    assert managed_task.status_code == 200
    assert updated.status_code == 200


@pytest.mark.parametrize("role", ["admin", "manager", "member"])
def test_admin_can_change_user_roles(client, role):
    admin_headers = register_and_login(client, "admin", "admin@example.com")
    assign_role("admin@example.com", "admin")
    register_and_login(client, "target", "target@example.com")

    target = client.get("/users", headers=admin_headers).json()
    target_id = next(user["id"] for user in target if user["email"] == "target@example.com")
    response = client.patch(
        f"/users/{target_id}/role",
        headers=admin_headers,
        json={"role": role},
    )

    assert response.status_code == 200
    assert response.json()["role"] == role
    refreshed_users = client.get("/users", headers=admin_headers)
    refreshed_target = next(
        user for user in refreshed_users.json() if user["email"] == "target@example.com"
    )
    assert refreshed_target["role"] == role


def test_member_cannot_escalate_role(client):
    member_headers = register_and_login(client, "escalator", "escalator@example.com")

    response = client.patch(
        "/users/1/role",
        headers=member_headers,
        json={"role": "admin"},
    )

    assert response.status_code == 403
    profile = client.get("/users/me", headers=member_headers)
    assert profile.status_code == 200
    assert profile.json()["role"] == "member"


def test_manager_cannot_assign_roles(client):
    manager_headers = register_and_login(client, "manager", "manager@example.com")
    assign_role("manager@example.com", "manager")
    register_and_login(client, "target", "target@example.com")

    users = client.get("/users", headers=manager_headers)
    target_id = next(user["id"] for user in users.json() if user["email"] == "target@example.com")
    response = client.patch(
        f"/users/{target_id}/role",
        headers=manager_headers,
        json={"role": "admin"},
    )

    assert users.status_code == 200
    assert response.status_code == 403
    refreshed_target = next(
        user for user in users.json() if user["email"] == "target@example.com"
    )
    assert refreshed_target["role"] == "member"


@pytest.mark.parametrize("requested_role", ["admin", "manager"])
def test_registration_cannot_assign_privileged_role(client, requested_role):
    assert settings.ENVIRONMENT == "testing"
    assert settings.DEMO_ROLE_REGISTRATION_ENABLED is False
    response = client.post(
        "/auth/register",
        json={
            "username": f"untrusted_{requested_role}",
            "email": f"untrusted_{requested_role}@example.com",
            "password": "StrongPassword123",
            "role": requested_role,
            "demo_registration_code": "not-enabled",
        },
    )

    assert response.status_code == 403
    response = client.post(
        "/auth/register",
        json={
            "username": f"untrusted_{requested_role}",
            "email": f"untrusted_{requested_role}@example.com",
            "password": "StrongPassword123",
            "role": "member",
        },
    )
    assert response.status_code == 201
    assert response.json()["role"] == "member"
    login = client.post(
        "/auth/login",
        json={
            "email": f"untrusted_{requested_role}@example.com",
            "password": "StrongPassword123",
        },
    )
    profile = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["role"] == "member"


@pytest.mark.parametrize("role", ["member", "manager", "admin"])
def test_development_demo_registration_assigns_selected_role(client, monkeypatch, role):
    demo_code = "college-demo-registration-code"
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "DEMO_ROLE_REGISTRATION_ENABLED", True)
    monkeypatch.setattr(settings, "DEMO_ROLE_REGISTRATION_CODE", demo_code)

    response = client.post(
        "/auth/register",
        json={
            "username": f"demo_{role}",
            "email": f"demo_{role}@example.com",
            "password": "StrongPassword123",
            "role": role,
            "demo_registration_code": demo_code,
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == role
    login = client.post(
        "/auth/login",
        json={"email": f"demo_{role}@example.com", "password": "StrongPassword123"},
    )
    profile = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert profile.status_code == 200
    assert profile.json()["role"] == role


@pytest.mark.parametrize("role", ["manager", "admin"])
def test_development_demo_registration_rejects_invalid_code(client, monkeypatch, role):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "DEMO_ROLE_REGISTRATION_ENABLED", True)
    monkeypatch.setattr(
        settings, "DEMO_ROLE_REGISTRATION_CODE", "college-demo-registration-code"
    )

    response = client.post(
        "/auth/register",
        json={
            "username": f"bad_demo_{role}",
            "email": f"bad_demo_{role}@example.com",
            "password": "StrongPassword123",
            "role": role,
            "demo_registration_code": "incorrect-demo-code",
        },
    )

    assert response.status_code == 403


def test_demo_role_registration_cannot_run_outside_development(client, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DEMO_ROLE_REGISTRATION_ENABLED", True)
    monkeypatch.setattr(
        settings, "DEMO_ROLE_REGISTRATION_CODE", "college-demo-registration-code"
    )

    response = client.post(
        "/auth/register",
        json={
            "username": "production_demo",
            "email": "production_demo@example.com",
            "password": "StrongPassword123",
            "role": "admin",
            "demo_registration_code": "college-demo-registration-code",
        },
    )

    assert response.status_code == 403


def test_demo_role_registration_configuration_rejects_production():
    with pytest.raises(ValidationError):
        Settings(
            PROJECT_NAME="Configuration test",
            DATABASE_URL="sqlite://",
            SECRET_KEY="test-only-secret-key-with-at-least-32-bytes",
            ENVIRONMENT="production",
            DEMO_ROLE_REGISTRATION_ENABLED=True,
            DEMO_ROLE_REGISTRATION_CODE="college-demo-registration-code",
        )


def test_unauthenticated_users_cannot_access_rbac_or_tasks(client):
    users = client.get("/users")
    tasks = client.get("/tasks")
    me = client.get("/users/me")

    assert users.status_code == 401
    assert tasks.status_code == 401
    assert me.status_code == 401


def test_member_can_retrieve_own_profile(client):
    member_headers = register_and_login(client, "profile_user", "profile_user@example.com")
    response = client.get("/users/me", headers=member_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "profile_user"
    assert data["email"] == "profile_user@example.com"
    assert data["role"] == "member"
    assert "id" in data
