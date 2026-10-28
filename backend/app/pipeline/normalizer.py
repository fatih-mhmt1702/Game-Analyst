import re
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

class DataNormalizer:
    """Normalizes raw feedback fields, dates, language and content hashes."""

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        # Collapse excessive whitespace and strip
        text = re.sub(r"[\r\n]+", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    @staticmethod
    def compute_content_hash(text: str) -> str:
        """SHA-256 hash of normalized lowercase alphanumeric text for exact deduplication."""
        simplified = re.sub(r"\W+", "", text.lower())
        return hashlib.sha256(simplified.encode("utf-8")).hexdigest()

    @staticmethod
    def compute_simhash(text: str) -> str:
        """Lightweight 64-bit simhash representation for near-duplicate detection."""
        words = re.findall(r"\w+", text.lower())
        if not words:
            return "0" * 16
        
        v = [0] * 64
        for word in words:
            w_hash = int(hashlib.md5(word.encode("utf-8")).hexdigest()[:16], 16)
            for i in range(64):
                bit = (w_hash >> i) & 1
                v[i] += 1 if bit else -1
        
        fingerprint = 0
        for i in range(64):
            if v[i] > 0:
                fingerprint |= (1 << i)
        
        return f"{fingerprint:016x}"

    @staticmethod
    def normalize_timestamp(raw_date: Any) -> str:
        """Parse various date formats into standard ISO 8601 UTC string."""
        if not raw_date:
            return datetime.now(timezone.utc).isoformat()
        
        if isinstance(raw_date, (int, float)):
            # Unix timestamp
            try:
                return datetime.fromtimestamp(raw_date, tz=timezone.utc).isoformat()
            except Exception:
                return datetime.now(timezone.utc).isoformat()
        
        raw_str = str(raw_date).strip()
        
        # Try standard formats
        for fmt in [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M",
            "%d-%m-%Y",
            "%m/%d/%Y"
        ]:
            try:
                dt = datetime.strptime(raw_str, fmt)
                if not dt.tzinfo:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.isoformat()
            except ValueError:
                continue
        
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def detect_language(text: str) -> str:
        """Simple, robust heuristic language detector (tr vs en vs other)."""
        turkish_chars = set("çğıöşüÇĞİÖŞÜ")
        if any(c in turkish_chars for c in text):
            return "tr"
        
        # Turkish common stop words
        tr_words = {"ve", "ile", "bir", "cok", "çok", "bu", "oyun", "demo", "güzel", "kötü", "ama", "fakat"}
        words = set(re.findall(r"\b[a-zA-ZğüşıöçĞÜŞİÖÇ]+\b", text.lower()))
        if len(words.intersection(tr_words)) >= 2:
            return "tr"
        
        return "en"
