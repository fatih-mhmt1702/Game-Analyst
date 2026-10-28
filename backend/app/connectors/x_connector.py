import requests
import logging
from typing import Dict, Any, List, Optional
from .base import BaseConnector

logger = logging.getLogger(__name__)

class XConnector(BaseConnector):
    """
    Authorized X (Twitter) API v2 connector using official Bearer token.
    Clearly reports access tier limits and historical search constraints.
    """

    def __init__(self, bearer_token: str = ""):
        super().__init__(source_name="x", rate_limit_rpm=15)
        self.bearer_token = bearer_token

    def is_configured(self) -> bool:
        return bool(self.bearer_token and len(self.bearer_token.strip()) > 10)

    def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_name": "x",
                "is_configured": False,
                "status": "not_configured",
                "message": "X_BEARER_TOKEN is missing. Please configure an authorized X Developer App in .env."
            }

        try:
            headers = {"Authorization": f"Bearer {self.bearer_token}"}
            # Lightweight user lookup or recent search test
            resp = requests.get(
                "https://api.x.com/2/tweets/sample/stream/rules",
                headers=headers,
                timeout=10.0
            )
            # Alternatively test tweets search endpoint
            search_test = requests.get(
                "https://api.x.com/2/tweets/search/recent?query=SteamNextFest&max_results=10",
                headers=headers,
                timeout=10.0
            )

            if search_test.status_code == 200:
                return {
                    "source_name": "x",
                    "is_configured": True,
                    "status": "success",
                    "message": "Successfully connected to X API v2 (Recent Search authorized).",
                    "details": {"tier": "Basic/Pro or higher with recent search access"}
                }
            elif search_test.status_code == 403:
                return {
                    "source_name": "x",
                    "is_configured": True,
                    "status": "warning",
                    "message": "X credentials accepted, but your current tier does not grant 'tweets/search/recent' historical access. Free tier cannot search historical posts.",
                    "details": {"code": 403, "response": search_test.json() if search_test.content else None}
                }
            else:
                return {
                    "source_name": "x",
                    "is_configured": True,
                    "status": "failed",
                    "message": f"X API returned error: HTTP {search_test.status_code}",
                    "details": {"response": search_test.text}
                }
        except Exception as e:
            return {
                "source_name": "x",
                "is_configured": True,
                "status": "failed",
                "message": f"Connection to X API failed: {str(e)}"
            }

    def fetch_feedback(
        self,
        query: str,
        limit: int = 50,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Fetch posts mentioning game and Steam Next Fest via official API."""
        if not self.is_configured():
            raise ValueError("X connector is not configured with Bearer Token.")

        self.enforce_rate_limit()
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        
        # Twitter v2 recent search query
        # Restrict to non-retweet English/relevant tweets
        api_query = f"({query}) (demo OR NextFest OR Steam) -is:retweet"
        url = "https://api.x.com/2/tweets/search/recent"
        
        params: Dict[str, Any] = {
            "query": api_query,
            "max_results": min(max(limit, 10), 100),
            "tweet.fields": "created_at,public_metrics,author_id,lang"
        }
        if start_date:
            params["start_time"] = start_date
        if end_date:
            params["end_time"] = end_date

        resp = requests.get(url, headers=headers, params=params, timeout=15.0)
        results = []

        if resp.status_code == 200:
            data = resp.json().get("data", [])
            for tweet in data:
                metrics = tweet.get("public_metrics", {})
                results.append({
                    "source_name": "x",
                    "external_id": tweet.get("id"),
                    "permalink": f"https://x.com/i/status/{tweet.get('id')}",
                    "author": tweet.get("author_id", "unknown"),
                    "title": "",
                    "content": tweet.get("text", ""),
                    "published_at": tweet.get("created_at"),
                    "language": tweet.get("lang", "en"),
                    "raw_metrics": {
                        "retweets": metrics.get("retweet_count", 0),
                        "replies": metrics.get("reply_count", 0),
                        "likes": metrics.get("like_count", 0),
                        "quotes": metrics.get("quote_count", 0)
                    },
                    "data_origin": "actual"
                })
        elif resp.status_code == 403:
            logger.warning("X API recent search requires a paid tier (Basic/Pro). Historical search unavailable.")
        else:
            logger.error(f"X API error {resp.status_code}: {resp.text}")

        return results
