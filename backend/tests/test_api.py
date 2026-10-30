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

def test_api_create_game_and_sync():
    payload = {
        "title": "Test Indie Demo 2026",
        "developer": "Test Studio",
        "genre": "Roguelike",
        "steam_app_id": "2849100",
        "peak_ccu": 4500,
        "is_top10": False
    }
    res = client.post("/api/games", json=payload)
    assert res.status_code == 200
    game_id = res.json()["id"]

    detail_res = client.get(f"/api/games/{game_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["game"]["wishlist_count"] > 0

    # Test updating game
    update_payload = {
        "title": "Test Indie Demo 2026 Updated",
        "developer": "Test Studio Revised",
        "genre": "Action Roguelike",
        "steam_app_id": "2849100",
        "peak_ccu": 6000,
        "is_top10": False
    }
    upd_res = client.put(f"/api/games/{game_id}", json=update_payload)
    assert upd_res.status_code == 200

    detail_after = client.get(f"/api/games/{game_id}")
    assert detail_after.json()["game"]["title"] == "Test Indie Demo 2026 Updated"
    assert detail_after.json()["game"]["peak_ccu"] == 6000

    # Test deleting custom game
    del_res = client.delete(f"/api/games/{game_id}")
    assert del_res.status_code == 200
    not_found = client.get(f"/api/games/{game_id}")
    assert not_found.status_code == 404

def test_api_jobs_list():
    res = client.get("/api/jobs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
