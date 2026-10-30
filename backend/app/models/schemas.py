from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# Permitted feedback topics defined in prompt requirements
FEEDBACK_TOPICS = [
    "Gameplay mechanics",
    "Controls and responsiveness",
    "Combat and difficulty",
    "Game feel and feedback",
    "Performance and optimization",
    "Bugs and crashes",
    "UI and UX",
    "Tutorials and onboarding",
    "Game pacing",
    "Content quantity",
    "Replayability",
    "Narrative and writing",
    "Art direction and visual identity",
    "Animation quality",
    "Sound design and music",
    "Multiplayer and networking",
    "Accessibility",
    "Demo length",
    "Demo scope and content",
    "Marketing versus actual gameplay",
    "Monetization and pricing expectations",
    "Originality and genre saturation",
    "AI-generated content concerns",
    "Technical requirements",
    "Positive standout features",
    "Other"
]

SentimentType = Literal["Positive", "Negative", "Mixed", "Neutral", "Uncertain"]
SeverityType = Literal["Minor", "Moderate", "Major", "Critical", "None"]
ActionabilityType = Literal[
    "Actionable bug report",
    "Actionable design feedback",
    "General opinion",
    "Suggestion",
    "Question",
    "Irrelevant"
]
DataOriginType = Literal["actual", "imported", "sample"]

# --- Base Models ---

class EventModel(BaseModel):
    id: str
    name: str
    slug: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    is_active: bool = True

class GameModel(BaseModel):
    id: str
    event_id: str
    title: str
    developer: Optional[str] = None
    publisher: Optional[str] = None
    steam_app_id: Optional[str] = None
    genre: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    peak_ccu: int = 0
    ccu_source: Optional[str] = None
    ccu_verified: bool = False
    rank_order: Optional[int] = None
    is_top10: bool = False
    wishlist_count: int = 0
    wishlist_rank: Optional[int] = None
    steam_followers: int = 0
    wishlist_source: Optional[str] = None

class GameCreateRequest(BaseModel):
    title: str
    developer: Optional[str] = None
    publisher: Optional[str] = None
    steam_app_id: Optional[str] = None
    genre: Optional[str] = "Indie"
    tags: List[str] = Field(default_factory=list)
    peak_ccu: int = 0
    ccu_source: Optional[str] = "Manual entry"
    ccu_verified: bool = False
    rank_order: Optional[int] = None
    is_top10: bool = False
    wishlist_count: int = 0
    wishlist_rank: Optional[int] = None
    steam_followers: int = 0
    wishlist_source: Optional[str] = "Manual / Steam Follower Model"

class LiveFetchRequest(BaseModel):
    source_name: Literal["steam", "reddit", "x"] = "steam"
    game_id: Optional[str] = None
    limit: int = Field(default=25, ge=5, le=100)

class TopicItem(BaseModel):
    topic: str
    sentiment_in_topic: SentimentType = "Neutral"
    severity: SeverityType = "None"
    actionability: ActionabilityType = "General opinion"
    confidence: float = 0.8

class EvidenceItem(BaseModel):
    excerpt: str
    context_notes: Optional[str] = None
    recommended_human_review: bool = False

class CommentClassification(BaseModel):
    sentiment: SentimentType
    confidence: float
    positive_score: float = 0.0
    negative_score: float = 0.0
    neutral_score: float = 0.0
    reasoning: str
    topics: List[TopicItem] = Field(default_factory=list)
    evidence: EvidenceItem
    provider: str = "local_nlp"

class NormalizedComment(BaseModel):
    id: str
    source_name: str
    external_id: Optional[str] = None
    permalink: Optional[str] = None
    author: Optional[str] = None
    title: Optional[str] = None
    content: str
    published_at: str
    language: str = "en"
    content_hash: str
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    is_spam_or_irrelevant: bool = False
    spam_reason: Optional[str] = None
    raw_metrics: Dict[str, Any] = Field(default_factory=dict)
    data_origin: DataOriginType = "actual"
    associated_game_title: Optional[str] = None
    classification: Optional[CommentClassification] = None

# --- Dashboard & Report Payloads ---

class OverviewMetrics(BaseModel):
    event_name: str
    event_start: str
    event_end: str
    total_games_analyzed: int
    total_relevant_comments: int
    unique_discussions_count: int
    data_origin_distribution: Dict[str, int]
    source_distribution: Dict[str, int]
    sentiment_distribution: Dict[str, int]
    top_praised_features: List[Dict[str, Any]]
    top_complaints: List[Dict[str, Any]]
    data_freshness: str
    collection_status: str
    coverage_warnings: List[str]

class Top10GameSummary(BaseModel):
    rank: int
    game_id: str
    title: str
    developer: Optional[str]
    genre: Optional[str]
    peak_ccu: int
    ccu_source: str
    ccu_verified: bool
    collected_comments_count: int
    positive_pct: float
    negative_pct: float
    mixed_pct: float
    neutral_pct: float
    most_praised_feature: str
    most_common_complaint: str
    data_coverage: str  # 'Adequate', 'Low Sample Warning (<30)', 'Insufficient'
    is_low_sample: bool
    source_links_count: int

class GameDetailResponse(BaseModel):
    game: GameModel
    collected_comments_count: int
    is_low_sample: bool
    low_sample_threshold: int
    sentiment_counts: Dict[str, int]
    sentiment_percentages: Dict[str, float]
    topic_frequencies: List[Dict[str, Any]]
    top_complaints: List[Dict[str, Any]]
    top_praises: List[Dict[str, Any]]
    critical_bugs_and_usability: List[Dict[str, Any]]
    reddit_vs_x: Dict[str, Any]
    timeline_activity: List[Dict[str, Any]]
    recent_comments: List[Dict[str, Any]]
    coverage_notes: List[str]

class IndustryPatternItem(BaseModel):
    title: str
    category: str
    description: str
    frequency_count: int
    percentage_of_all_comments: float
    severity_breakdown: Dict[str, int]
    affected_games_count: int
    example_excerpts: List[Dict[str, str]]

class IndustryAnalysisResponse(BaseModel):
    total_comments_evaluated: int
    total_games_evaluated: int
    frequent_demo_usability_problems: List[IndustryPatternItem]
    performance_optimization_patterns: List[IndustryPatternItem]
    controls_combat_tutorial_issues: List[IndustryPatternItem]
    reasons_demo_felt_unfinished: List[IndustryPatternItem]
    retention_and_praise_drivers: List[IndustryPatternItem]
    marketing_vs_gameplay_mismatches: List[IndustryPatternItem]
    generic_design_complaints: List[IndustryPatternItem]

class RecommendationItem(BaseModel):
    id: str
    priority_group: Literal[
        "Must fix before release",
        "High priority",
        "Important improvement",
        "Optional polish",
        "Features worth considering",
        "Design patterns to avoid"
    ]
    problem_or_opportunity: str
    suggested_action: str
    why_it_matters_for_indie: str
    supporting_games: List[str]
    relevant_comments_count: int
    severity: SeverityType
    confidence: float
    estimated_effort: str  # "Low (1-2 days)", "Medium (1-2 weeks)", "High (3+ weeks)" - explicitly labeled estimate
    is_transferable: bool
    transferability_caveat: Optional[str] = None
    representative_sources: List[Dict[str, str]]

class RecommendationsResponse(BaseModel):
    generated_at: str
    methodology: str
    recommendations: List[RecommendationItem]

class JobStatusResponse(BaseModel):
    job_id: str
    source_name: str
    status: str
    total_items: int
    processed_items: int
    progress_pct: float
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None

class ConnectionTestResult(BaseModel):
    source_name: str
    is_configured: bool
    status: Literal["success", "failed", "warning", "not_configured"]
    message: str
    details: Optional[Dict[str, Any]] = None
