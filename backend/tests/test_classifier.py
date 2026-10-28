from backend.app.nlp.classifier import FeedbackClassifier

def test_classifier_positive_sentiment_and_topics():
    classifier = FeedbackClassifier(provider="local")
    text = "The combat mechanics and parry system are fantastic! The boss fight is a masterpiece."
    res = classifier.classify_comment(text)
    
    assert res.sentiment == "Positive"
    assert res.confidence >= 0.70
    topic_names = [t.topic for t in res.topics]
    assert "Combat and difficulty" in topic_names or "Gameplay mechanics" in topic_names
    assert res.evidence.excerpt != ""

def test_classifier_mixed_sentiment():
    classifier = FeedbackClassifier(provider="local")
    text = "The art and graphics look gorgeous, but the combat feels clunky and laggy."
    res = classifier.classify_comment(text)
    
    assert res.sentiment == "Mixed"
    topic_names = [t.topic for t in res.topics]
    assert "Art direction and visual identity" in topic_names
    assert "Combat and difficulty" in topic_names or "Controls and responsiveness" in topic_names

def test_classifier_severity_and_actionability():
    classifier = FeedbackClassifier(provider="local")
    text = "The game crashes to desktop every time I try to start the mission."
    res = classifier.classify_comment(text)
    
    severities = [t.severity for t in res.topics]
    assert "Critical" in severities
    actionabilities = [t.actionability for t in res.topics]
    assert "Actionable bug report" in actionabilities
