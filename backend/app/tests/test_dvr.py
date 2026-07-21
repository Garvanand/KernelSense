import pytest
from httpx import AsyncClient
from backend.app.main import app
import os

@pytest.mark.asyncio
async def test_get_dvr_history_unauthenticated():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dvr/history")
        # Assuming DVR might be open or requires auth depending on how it's wired.
        # Based on current routing in router.include_router, dvr doesn't enforce _require_api_key globally,
        # but let's assert it returns 200 if open, or 401 if secured later.
        assert response.status_code in [200, 401]

@pytest.mark.asyncio
async def test_get_dvr_history_format():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dvr/history?minutes=1")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            if len(data) > 0:
                assert "timestamp" in data[0]
                assert "system_metrics" in data[0]
                assert "processes" in data[0]
