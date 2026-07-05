import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from backend.app.main import app

client = TestClient(app)

def test_raw_events_requires_high_clearance():
    """Verify that the /events endpoint rejects Guest and Power users."""
    
    # Test Guest
    with patch("backend.app.access.state.AccessState.get_tier", return_value="guest"):
        response = client.get("/api/v1/scheduler/events")
        assert response.status_code == 403
        
    # Test Power User
    with patch("backend.app.access.state.AccessState.get_tier", return_value="power"):
        response = client.get("/api/v1/scheduler/events")
        assert response.status_code == 403
        
def test_raw_events_allows_kernel_clearance():
    """Verify that Kernel clearance is permitted to read eBPF events."""
    
    with patch("backend.app.access.state.AccessState.get_tier", return_value="kernel"):
        # We need to mock get_db so it doesn't actually try to hit a SQLite file.
        from backend.app.db.database import get_db
        
        async def override_get_db():
            mock_db = AsyncMock()
            mock_result = MagicMock()
            mock_result.scalars().all.return_value = []
            mock_db.execute.return_value = mock_result
            yield mock_db
            
        app.dependency_overrides[get_db] = override_get_db
        
        # We also mock TelemetryRepository so we don't need actual models
        with patch("backend.app.api.scheduler.TelemetryRepository") as mock_repo:
            mock_repo.return_value.get_raw_events.return_value = []
            
            response = client.get("/api/v1/scheduler/events")
            assert response.status_code == 200
            
        # Clean up dependency
        app.dependency_overrides = {}
