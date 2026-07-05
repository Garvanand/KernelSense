import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "worker_rss_mb" in data

def test_list_processes():
    response = client.get("/api/v1/processes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_list_resources():
    response = client.get("/api/v1/resources/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
