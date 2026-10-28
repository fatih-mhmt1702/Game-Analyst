import requests
import time
import logging
from typing import Dict, Any, List, Optional
from .base import BaseConnector

logger = logging.getLogger(__name__)

class RedditConnector(BaseConnector):
    """
    Authorized Reddit API connector utilizing OAuth2 Client Credentials grant
    in accordance with Reddit Data API policies.
    """

    def __init__(self, client_id: str = "", client_secret: str = "", user_agent: str = "NextFestInsight:v1.0.0"):
        super().__init__(source_name="reddit", rate_limit_rpm=60)
        self.client_id = client_id
        self.client_secret = client_secret
        self.user_agent = user_agent
        self.access_token: Optional[str] = None
        self.token_expiry: float = 0.0

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "source_name": "reddit",
                "is_configured": False,
                "status": "not_configured",
                "message": "REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET is missing. Please create an authorized script app at https://www.reddit.com/prefs/apps and configure .env."
            }
        
        try:
            token = self._get_access_token()
            if token:
                return {
                    "source_name": "reddit",
                    "is_configured": True,
                    "status": "success",
                    "message": "Successfully authenticated with Reddit OAuth2 API.",
                    "details": {"user_agent": self.user_agent}
                }
        except Exception as e:
            return {
                "source_name": "reddit",
                "is_configured": True,
                "status": "failed",
                "message": f"Reddit OAuth2 authentication failed: {str(e)}"
            }
        
        return {
            "source_name": "reddit",
            "is_configured": True,
            "status": "failed",
            "message": "Unable to obtain OAuth2 token from Reddit."
        }

    def _get_access_token(self) -> str:
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token

        auth = requests.auth.HTTPBasicAuth(self.client_id, self.client_secret)
        headers = {"User-Agent": self.user_agent}
        data = {"grant_type": "client_credentials"}

        resp = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=auth,
            data=data,
            headers=headers,
            timeout=10.0
        )
        if resp.status_code == 200:
            token_data = resp.json()
            self.access_token = token_data.get("access_token")
            self.token_expiry = time.time() + token_data.get("expires_in", 3600) - 60
            return self.access_token
        else:
            raise Exception(f"HTTP {resp.status_code}: {resp.text}")

    def fetch_feedback(
        self,
        query: str,
        limit: int = 50,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search public Reddit posts and top comments matching game query."""
        if not self.is_configured():
            raise ValueError("Reddit connector is not configured with credentials.")

        self.enforce_rate_limit()
        token = self._get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": self.user_agent
        }

        # Search gaming subreddits: Games, IndieGaming, steam, SteamNextFest
        subreddits = "Games+IndieGaming+steam+pcgaming"
        search_url = f"https://oauth.reddit.com/r/{subreddits}/search"
        params = {
            "q": query,
            "sort": "relevance",
            "limit": min(limit, 100),
            "restrict_sr": 1
        }

        results = []
        resp = requests.get(search_url, headers=headers, params=params, timeout=15.0)
        if resp.status_code != 200:
            logger.error(f"Reddit search failed with status {resp.status_code}")
            return results

        data = resp.json().get("data", {}).get("children", [])
        for item in data:
            post = item.get("data", {})
            self_text = post.get("selftext", "")
            title = post.get("title", "")
            content = f"{title}\n{self_text}".strip()
            
            results.append({
                "source_name": "reddit",
                "external_id": post.get("id"),
                "permalink": f"https://reddit.com{post.get('permalink')}",
                "author": post.get("author", "unknown"),
                "title": title,
                "content": content,
                "published_at": post.get("created_utc"),
                "raw_metrics": {
                    "score": post.get("score", 0),
                    "upvotes": post.get("ups", 0),
                    "num_comments": post.get("num_comments", 0),
                    "subreddit": post.get("subreddit")
                },
                "data_origin": "actual"
            })

        return results
