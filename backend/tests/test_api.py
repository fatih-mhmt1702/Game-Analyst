import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.db import init_db

client = TestClient(app)

def setup_module(module):
    init_db()

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_api_overview():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_games_analyzed" in data

def test_api_games_and_top10():
    r_games = client.get("/api/games")
    assert r_games.status_code == 200
    assert len(r_games.json()) >= 10

    r_top10 = client.get("/api/games/top10")
    assert r_top10.status_code == 200
    assert len(r_top10.json()) == 10

def test_api_recommendations():
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data

def test_api_export_csv():
    response = client.get("/api/export/csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")

def test_api_export_html():
    response = client.get("/api/export/html")
    assert response.status_code == 200
    assert "NextFest Insight" in response.text
