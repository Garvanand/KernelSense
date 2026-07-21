import pytest
from httpx import AsyncClient
from backend.app.main import app
import os

@pytest.mark.asyncio
async def test_session_creation_with_valid_key():
    api_key = os.environ.get("KERNELSENSE_API_KEY", "dev-api-key")
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Default tier (guest)
        response = await ac.post("/api/v1/auth/session", headers={"X-Api-Key": api_key})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "encryption" in data

@pytest.mark.asyncio
async def test_session_creation_invalid_key():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/session", headers={"X-Api-Key": "wrong-key"})
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_session_creation_admin_tier():
    api_key = os.environ.get("KERNELSENSE_API_KEY", "dev-api-key")
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/session?tier=admin", headers={"X-Api-Key": api_key})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
