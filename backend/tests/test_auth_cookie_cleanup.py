"""
Test script to verify refresh token behavior after logout.
Run this with: python -m pytest backend/tests/test_auth_cookie_cleanup.py -v
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.user import User
from backend.core.config import settings


client = TestClient(app)


def test_refresh_rejects_after_logout():
    """
    Verify that POST /refresh rejects requests after logout.
    This test exposes the cookie attribute mismatch bug in _clear_auth_cookies.
    """
    # 1. Register a user
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    print("\n✓ Registration successful")
    print(f"  Response cookies: {response.cookies}")

    # 2. Verify login works
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    print("✓ Login successful")
    print(f"  Cookies after login: {client.cookies}")

    # 3. Verify refresh works BEFORE logout
    response = client.post("/auth/refresh")
    assert response.status_code == 200
    print("✓ Refresh successful (before logout)")

    # 4. Logout
    response = client.post("/auth/logout")
    assert response.status_code == 204
    print("✓ Logout successful")
    print(f"  Cookies after logout: {client.cookies}")

    # 5. **KEY TEST**: Verify refresh FAILS AFTER logout
    response = client.post("/auth/refresh")
    print(
        f"\n❌ ISSUE FOUND: Refresh after logout returned {response.status_code}")
    print(f"   Expected: 401 (Unauthorized)")
    print(f"   Response: {response.json()}")
    print(f"   Client cookies: {client.cookies}")

    # This assertion will FAIL if the bug exists
    assert response.status_code == 401, (
        f"Refresh should fail after logout with 401, but got {response.status_code}"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
