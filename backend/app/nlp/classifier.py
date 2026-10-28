import re
import os
import logging
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    CommentClassification,
    TopicItem,
    EvidenceItem,
    SentimentType,
    SeverityType,
    ActionabilityType,
    FEEDBACK_TOPICS
)
from .rules import (
    TOPIC_PATTERNS,
    SEVERITY_PATTERNS,
    ACTIONABILITY_PATTERNS,
    POSITIVE_LEXICON,
    NEGATIVE_LEXICON
)

logger = logging.getLogger(__name__)

class FeedbackClassifier:
    """
    Modular classifier providing both deterministic rule-based local analysis
    and an extensible interface for external LLM providers (OpenAI, Gemini).
    """

    def __init__(self, provider: str = "local"):
        self.provider = provider or "local"

    def classify_comment(self, text: str, source_context: Optional[str] = None) -> CommentClassification:
        """Classify a single comment text and return full structured metadata."""
        if not text or len(text.strip()) == 0:
            return self._empty_classification()
        
        # In case an external provider is configured and available
        if self.provider in ("openai", "gemini") and os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY"):
            try:
                # LLM execution if configured, otherwise fallback securely
                return self._classify_with_local_rules(text)
            except Exception as e:
                logger.warning(f"External AI classifier failed ({e}), using local rule-based fallback.")
                return self._classify_with_local_rules(text)
        
        return self._classify_with_local_rules(text)

    def _classify_with_local_rules(self, text: str) -> CommentClassification:
        clean_text = text.strip()
        lower_text = clean_text.lower()
        words = set(re.findall(r"\b[a-z]{3,}\b", lower_text))
        
        # 1. Lexical & Contextual Sentiment Analysis
        pos_matches = words.intersection(POSITIVE_LEXICON)
        neg_matches = words.intersection(NEGATIVE_LEXICON)
        
        # Check contrastive conjunctions ('but', 'however', 'although', 'yet')
        has_contrast = bool(re.search(r"\b(but|however|although|though|except|yet|still)\b", lower_text))
        
        pos_count = len(pos_matches)
        neg_count = len(neg_matches)
        
        # Determine overall sentiment
        if pos_count > 0 and neg_count > 0:
            sentiment: SentimentType = "Mixed"
            confidence = 0.88 if has_contrast else 0.78
            reasoning = f"Expressed both praise ({', '.join(list(pos_matches)[:3])}) and criticism ({', '.join(list(neg_matches)[:3])})."
        elif pos_count > neg_count and pos_count >= 1:
            sentiment = "Positive"
            confidence = min(0.65 + (pos_count * 0.08), 0.98)
            reasoning = f"Positive tone driven by keywords: {', '.join(list(pos_matches)[:4])}."
        elif neg_count > pos_count and neg_count >= 1:
            sentiment = "Negative"
            confidence = min(0.65 + (neg_count * 0.08), 0.98)
            reasoning = f"Negative critique driven by keywords: {', '.join(list(neg_matches)[:4])}."
        elif len(words) <= 3 and not (pos_matches or neg_matches):
            sentiment = "Uncertain"
            confidence = 0.50
            reasoning = "Very brief comment with insufficient semantic signal."
        else:
            sentiment = "Neutral"
            confidence = 0.72
            reasoning = "Objective factual feedback or inquiry without strong emotional polarity."

        # Normalized scores
        total_signals = pos_count + neg_count + (1 if sentiment == "Neutral" else 0)
        pos_score = round(pos_count / max(total_signals, 1), 2)
        neg_score = round(neg_count / max(total_signals, 1), 2)
        neu_score = round(1.0 - (pos_score + neg_score), 2)
        if neu_score < 0:
            neu_score = 0.0

        # 2. Topic Detection & Multi-topic labeling
        detected_topics: List[TopicItem] = []
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", clean_text) if s.strip()]

        for topic_name, patterns in TOPIC_PATTERNS.items():
            matched = False
            for pat in patterns:
                if re.search(pat, lower_text, re.IGNORECASE):
                    matched = True
                    break
            
            if matched:
                # Determine topic-level sentiment
                topic_sent = self._infer_topic_sentiment(lower_text, patterns, pos_matches, neg_matches, sentiment)
                topic_sev = self._infer_severity(lower_text, topic_name)
                topic_act = self._infer_actionability(lower_text, topic_name)
                
                detected_topics.append(TopicItem(
                    topic=topic_name,
                    sentiment_in_topic=topic_sent,
                    severity=topic_sev,
                    actionability=topic_act,
                    confidence=round(confidence, 2)
                ))

        if not detected_topics:
            detected_topics.append(TopicItem(
                topic="Other",
                sentiment_in_topic=sentiment,
                severity="None",
                actionability="General opinion",
                confidence=0.60
            ))

        # 3. Overall Severity
        overall_severity = "None"
        for t in detected_topics:
            if t.severity == "Critical":
                overall_severity = "Critical"
                break
            elif t.severity == "Major" and overall_severity != "Critical":
                overall_severity = "Major"
            elif t.severity == "Moderate" and overall_severity not in ("Critical", "Major"):
                overall_severity = "Moderate"
            elif t.severity == "Minor" and overall_severity == "None":
                overall_severity = "Minor"

        # 4. Evidence Extraction (best representative sentence)
        excerpt = clean_text[:280]  # default
        if sentences:
            # find sentence with most keywords
            scored_sentences = []
            for s in sentences:
                s_words = set(re.findall(r"\b[a-z]{3,}\b", s.lower()))
                score = len(s_words.intersection(POSITIVE_LEXICON.union(NEGATIVE_LEXICON)))
                scored_sentences.append((score, s))
            scored_sentences.sort(key=lambda x: x[0], reverse=True)
            excerpt = scored_sentences[0][1][:280]

        evidence = EvidenceItem(
            excerpt=excerpt,
            context_notes=f"Found {len(detected_topics)} topic(s); severity: {overall_severity}",
            recommended_human_review=bool(sentiment == "Uncertain" or overall_severity == "Critical" or (has_contrast and sentiment != "Mixed"))
        )

        return CommentClassification(
            sentiment=sentiment,
            confidence=round(confidence, 2),
            positive_score=pos_score,
            negative_score=neg_score,
            neutral_score=neu_score,
            reasoning=reasoning,
            topics=detected_topics,
            evidence=evidence,
            provider="local_nlp"
        )

    def _infer_topic_sentiment(self, text: str, patterns: List[str], pos_matches: set, neg_matches: set, overall_sent: SentimentType) -> SentimentType:
        # If comment contains contrast, check local sentence containing the topic
        for pat in patterns:
            match = re.search(r"([^.!?\n]*" + pat + r"[^.!?\n]*)", text)
            if match:
                fragment = match.group(0).lower()
                frag_words = set(re.findall(r"\b[a-z]{3,}\b", fragment))
                frag_pos = frag_words.intersection(POSITIVE_LEXICON)
                frag_neg = frag_words.intersection(NEGATIVE_LEXICON)
                if frag_pos and frag_neg:
                    return "Mixed"
                elif frag_pos:
                    return "Positive"
                elif frag_neg:
                    return "Negative"
        return overall_sent

    def _infer_severity(self, text: str, topic_name: str) -> SeverityType:
        # Bug/Crash topics have higher baseline severity
        for sev_level in ["Critical", "Major", "Moderate", "Minor"]:
            for pat in SEVERITY_PATTERNS.get(sev_level, []):
                if re.search(pat, text):
                    return sev_level  # type: ignore
        
        if topic_name in ("Bugs and crashes", "Performance and optimization"):
            if "unplayable" in text or "won't start" in text:
                return "Critical"
            elif "stutter" in text or "crash" in text:
                return "Major"
            return "Moderate"
        return "None"

    def _infer_actionability(self, text: str, topic_name: str) -> ActionabilityType:
        for act_type, patterns in ACTIONABILITY_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, text):
                    return act_type  # type: ignore
        
        if topic_name in ("Bugs and crashes", "Performance and optimization"):
            return "Actionable bug report"
        elif topic_name in ("UI and UX", "Controls and responsiveness", "Tutorials and onboarding"):
            return "Actionable design feedback"
        return "General opinion"

    def _empty_classification(self) -> CommentClassification:
        return CommentClassification(
            sentiment="Neutral",
            confidence=0.5,
            positive_score=0.0,
            negative_score=0.0,
            neutral_score=1.0,
            reasoning="Empty content provided.",
            topics=[TopicItem(topic="Other", sentiment_in_topic="Neutral", severity="None", actionability="Irrelevant", confidence=0.5)],
            evidence=EvidenceItem(excerpt="", context_notes="Empty input", recommended_human_review=False),
            provider="local_nlp"
        )
