from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import time
import logging

logger = logging.getLogger(__name__)

class BaseConnector(ABC):
    """Abstract base connector with built-in retry and rate limit protections."""

    def __init__(self, source_name: str, rate_limit_rpm: int = 60):
        self.source_name = source_name
        self.rate_limit_rpm = rate_limit_rpm
        self.min_interval = 60.0 / max(rate_limit_rpm, 1)
        self.last_call_time = 0.0

    def enforce_rate_limit(self):
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Test authentication and endpoint accessibility."""
        pass

    @abstractmethod
    def fetch_feedback(self, query: str, limit: int = 50, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch feedback records from the source with standard normalized output."""
        pass
