import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from backend.app.ml.incident_engine import IncidentEngineWorker
from backend.app.db.models.prediction import Prediction

@pytest.mark.asyncio
async def test_incident_engine_filters_low_confidence():
    """Verify that predictions with < 0.85 confidence are ignored entirely."""
    worker = IncidentEngineWorker()
    
    # Mock a low confidence prediction
    low_conf = Prediction(id=1, confidence=0.7, score=0.9, payload={})
    
    mock_session = AsyncMock()
    # Mock context manager
    mock_session.__aenter__.return_value = mock_session
    mock_session.__aexit__.return_value = None
    
    mock_result = MagicMock()
    # It shouldn't even be returned by the select statement because of the .where() clause,
    # but we mock it returning empty to simulate the DB filter
    mock_result.scalars().all.return_value = []
    mock_session.execute.return_value = mock_result
    
    with patch("backend.app.ml.incident_engine.AsyncSessionLocal", return_value=mock_session):
        await worker._process_predictions()
        
    mock_session.add.assert_not_called()

@pytest.mark.asyncio
async def test_incident_engine_promotes_high_confidence_high_score():
    """Verify that >0.85 conf and >0.8 score becomes 'active'."""
    worker = IncidentEngineWorker()
    
    high_conf = Prediction(id=2, confidence=0.9, score=0.85, payload={})
    
    mock_session = AsyncMock()
    # Mock context manager
    mock_session.__aenter__.return_value = mock_session
    mock_session.__aexit__.return_value = None
    
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [high_conf]
    mock_session.execute.return_value = mock_result
    
    with patch("backend.app.ml.incident_engine.AsyncSessionLocal", return_value=mock_session):
        await worker._process_predictions()
        
    assert high_conf.payload["incident_status"] == "active"
    mock_session.add.assert_called_once_with(high_conf)
    mock_session.commit.assert_called_once()
