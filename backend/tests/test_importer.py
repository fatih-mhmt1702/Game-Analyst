import pytest
from backend.app.connectors.importer import FileImporter

def test_csv_import_with_auto_mapping():
    csv_sample = """game_title,source_name,content,published_at,author,score
Echoes of Aethelgard,reddit,Amazing combat and fluid movement!,2026-10-21,PlayerOne,42
Neon Vanguard,x,Stuttering issues on RTX 3060,2026-10-22,PlayerTwo,15
"""
    records = FileImporter.parse_csv(csv_sample)
    assert len(records) == 2
    assert records[0]["game_title"] == "Echoes of Aethelgard"
    assert "combat" in records[0]["content"]
    assert records[0]["data_origin"] == "imported"

def test_json_import():
    json_sample = """[
        {"game_title": "Starbound Colonies", "content": "Tutorial needs more clarity", "author": "UserA"},
        {"game_title": "Mystic Archipelago", "content": "Breathtaking water shaders", "author": "UserB"}
    ]"""
    records = FileImporter.parse_json(json_sample)
    assert len(records) == 2
    assert records[0]["game_title"] == "Starbound Colonies"
    assert records[1]["author"] == "UserB"

def test_invalid_csv_handling():
    with pytest.raises(ValueError):
        FileImporter.parse_csv("col_a,col_b\n1,2")
