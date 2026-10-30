import requests
import time
import logging
from typing import Dict, Any, List, Optional
from .base import BaseConnector

logger = logging.getLogger(__name__)

class RedditConnector(BaseConnector):
    """
    Dual-mode Reddit feedback connector:
    1. Official Reddit OAuth2 API (when REDDIT_CLIENT_ID & SECRET configured)
    2. Resilient Public Gateway fallback (pullpush / public search) when credentials are not yet configured.
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
        if self.is_configured():
            try:
                token = self._get_access_token()
                if token:
                    return {
                        "source_name": "reddit",
                        "is_configured": True,
                        "status": "success",
                        "message": "Resmi Reddit OAuth2 API bağlantısı başarılı.",
                        "details": {"user_agent": self.user_agent}
                    }
            except Exception as e:
                return {
                    "source_name": "reddit",
                    "is_configured": True,
                    "status": "failed",
                    "message": f"Reddit OAuth2 kimlik doğrulama hatası: {str(e)}"
                }

        # If OAuth is not configured, test public search gateway
        try:
            resp = requests.get(
                "https://api.pullpush.io/reddit/search/submission/?q=Steam&size=1",
                timeout=8.0
            )
            if resp.status_code == 200:
                return {
                    "source_name": "reddit",
                    "is_configured": True,
                    "status": "success",
                    "message": "Reddit Genel Açık Ağ Geçidi (Public Gateway) devrede ve veri çekmeye hazır."
                }
        except Exception as e:
            logger.warning(f"Pullpush health check error: {e}")

        return {
            "source_name": "reddit",
            "is_configured": False,
            "status": "not_configured",
            "message": "Reddit API anahtarları girilmemiş. Resmi API için https://www.reddit.com/prefs/apps adresinden ücretsiz script app oluşturup .env dosyasına girebilirsiniz."
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
        """
        Search public Reddit posts and in-depth player comments matching game/NextFest query.
        """
        self.enforce_rate_limit()
        results: List[Dict[str, Any]] = []

        # 1. Mode 1: Authorized OAuth2 Reddit API
        if self.is_configured():
            try:
                token = self._get_access_token()
                headers = {
                    "Authorization": f"Bearer {token}",
                    "User-Agent": self.user_agent
                }
                subreddits = "Games+IndieGaming+steam+pcgaming"
                search_url = f"https://oauth.reddit.com/r/{subreddits}/search"
                params = {
                    "q": query,
                    "sort": "relevance",
                    "limit": min(limit, 100),
                    "restrict_sr": 1
                }
                resp = requests.get(search_url, headers=headers, params=params, timeout=15.0)
                if resp.status_code == 200:
                    data = resp.json().get("data", {}).get("children", [])
                    for item in data:
                        post = item.get("data", {})
                        self_text = post.get("selftext", "")
                        title = post.get("title", "")
                        content = f"{title}\n{self_text}".strip()
                        if not content:
                            continue

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
                    if results:
                        return results
            except Exception as e:
                logger.warning(f"OAuth2 Reddit fetch error: {e}. Falling back to public gateway...")

        # 2. Mode 2: Resilient Public Search Gateway (Submissions & Comments)
        try:
            # A. Search Reddit Submissions
            sub_url = "https://api.pullpush.io/reddit/search/submission/"
            params = {"q": query, "size": min(limit, 50)}
            r = requests.get(sub_url, params=params, timeout=12.0)
            if r.status_code == 200:
                for item in r.json().get("data", []):
                    title = item.get("title", "")
                    selftext = item.get("selftext", "")
                    content = f"{title}\n{selftext}".strip()
                    if not content or content == "[removed]" or content == "[deleted]":
                        continue
                    post_id = str(item.get("id", ""))
                    permalink = item.get("permalink", "")
                    if permalink and not permalink.startswith("http"):
                        permalink = f"https://reddit.com{permalink}"
                    elif not permalink:
                        permalink = f"https://reddit.com/r/{item.get('subreddit', 'Games')}/comments/{post_id}"

                    results.append({
                        "source_name": "reddit",
                        "external_id": post_id,
                        "permalink": permalink,
                        "author": item.get("author", "reddit_user"),
                        "title": title,
                        "content": content,
                        "published_at": item.get("created_utc"),
                        "raw_metrics": {
                            "score": item.get("score", 0),
                            "upvotes": item.get("score", 0),
                            "num_comments": item.get("num_comments", 0),
                            "subreddit": item.get("subreddit", "Games")
                        },
                        "data_origin": "actual"
                    })

            # B. Search Reddit In-depth Player Comments if more records needed
            if len(results) < limit:
                comm_url = "https://api.pullpush.io/reddit/search/comment/"
                c_params = {"q": query, "size": min(limit - len(results), 50)}
                c_resp = requests.get(comm_url, params=c_params, timeout=12.0)
                if c_resp.status_code == 200:
                    for c_item in c_resp.json().get("data", []):
                        body = (c_item.get("body") or "").strip()
                        if not body or len(body) < 15 or body in ("[deleted]", "[removed]"):
                            continue
                        c_id = str(c_item.get("id", ""))
                        permalink = c_item.get("permalink", "")
                        if permalink and not permalink.startswith("http"):
                            permalink = f"https://reddit.com{permalink}"
                        elif not permalink:
                            permalink = f"https://reddit.com/r/{c_item.get('subreddit', 'Games')}/comments"

                        results.append({
                            "source_name": "reddit",
                            "external_id": c_id,
                            "permalink": permalink,
                            "author": c_item.get("author", "reddit_user"),
                            "title": f"Reddit Comment in r/{c_item.get('subreddit', 'Games')}",
                            "content": body,
                            "published_at": c_item.get("created_utc"),
                            "raw_metrics": {
                                "score": c_item.get("score", 0),
                                "upvotes": c_item.get("score", 0),
                                "subreddit": c_item.get("subreddit", "Games")
                            },
                            "data_origin": "actual"
                        })
        except Exception as e:
            logger.error(f"Reddit public gateway search failed for '{query}': {e}")

        return results
