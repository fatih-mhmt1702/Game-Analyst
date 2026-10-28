import csv
import json
import io
from typing import List, Dict, Any, Optional
import pandas as pd

class FileImporter:
    """
    Imports and validates player feedback records from CSV or JSON files
    with flexible field mapping and strict schema validation.
    """

    SUPPORTED_COLUMNS = {
        "content": ["content", "text", "comment", "review", "body", "yorum", "metin"],
        "game_title": ["game_title", "game", "title", "oyun", "game_name"],
        "source_name": ["source_name", "source", "platform", "kaynak"],
        "published_at": ["published_at", "date", "created_at", "timestamp", "tarih"],
        "author": ["author", "user", "username", "kullanici"],
        "permalink": ["permalink", "url", "link"],
        "score": ["score", "upvotes", "likes", "puan"]
    }

    @classmethod
    def detect_field_mapping(cls, available_columns: List[str]) -> Dict[str, str]:
        """Automatically suggest best field mapping for standard columns."""
        mapping: Dict[str, str] = {}
        col_lower = {col.lower(): col for col in available_columns}

        for target_field, candidates in cls.SUPPORTED_COLUMNS.items():
            for cand in candidates:
                if cand in col_lower:
                    mapping[target_field] = col_lower[cand]
                    break

        return mapping

    @classmethod
    def parse_csv(cls, file_content: str, field_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """Parse raw CSV string into normalized records."""
        df = pd.read_csv(io.StringIO(file_content))
        if df.empty:
            return []

        mapping = field_mapping or cls.detect_field_mapping(df.columns.tolist())
        content_col = mapping.get("content")
        if not content_col or content_col not in df.columns:
            raise ValueError("CSV must contain a text/content column. Detected columns: " + ", ".join(df.columns))

        records = []
        for _, row in df.iterrows():
            content = str(row[content_col]) if pd.notna(row[content_col]) else ""
            if not content.strip():
                continue

            rec = {
                "content": content,
                "game_title": str(row[mapping["game_title"]]) if mapping.get("game_title") in df.columns and pd.notna(row[mapping["game_title"]]) else None,
                "source_name": str(row[mapping["source_name"]]) if mapping.get("source_name") in df.columns and pd.notna(row[mapping["source_name"]]) else "csv_import",
                "published_at": str(row[mapping["published_at"]]) if mapping.get("published_at") in df.columns and pd.notna(row[mapping["published_at"]]) else None,
                "author": str(row[mapping["author"]]) if mapping.get("author") in df.columns and pd.notna(row[mapping["author"]]) else "anonymous",
                "permalink": str(row[mapping["permalink"]]) if mapping.get("permalink") in df.columns and pd.notna(row[mapping["permalink"]]) else "",
                "raw_metrics": {
                    "score": int(row[mapping["score"]]) if mapping.get("score") in df.columns and pd.notna(row[mapping["score"]]) and str(row[mapping["score"]]).isdigit() else 0
                },
                "data_origin": "imported"
            }
            records.append(rec)

        return records

    @classmethod
    def parse_json(cls, file_content: str, field_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """Parse raw JSON array into normalized records."""
        data = json.loads(file_content)
        if isinstance(data, dict):
            # If wrapped in a results/items field
            data = data.get("comments") or data.get("data") or data.get("items") or [data]
        
        if not isinstance(data, list):
            raise ValueError("JSON must be a list of objects or an object containing a list.")

        records = []
        for item in data:
            if not isinstance(item, dict):
                continue
            
            content = item.get("content") or item.get("text") or item.get("comment") or item.get("body") or ""
            if not str(content).strip():
                continue

            records.append({
                "content": str(content),
                "game_title": item.get("game_title") or item.get("game"),
                "source_name": item.get("source_name") or item.get("source") or "json_import",
                "published_at": item.get("published_at") or item.get("date"),
                "author": item.get("author") or item.get("user") or "anonymous",
                "permalink": item.get("permalink") or item.get("url") or "",
                "raw_metrics": item.get("raw_metrics") or {
                    "score": item.get("score", 0),
                    "upvotes": item.get("upvotes", 0)
                },
                "data_origin": "imported"
            })

        return records
