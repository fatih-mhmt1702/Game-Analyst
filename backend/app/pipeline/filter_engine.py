import re
from typing import Tuple

class FilterEngine:
    """Identifies spam, promotional solicitations, and low-information junk while preserving criticism and praise."""

    SPAM_PATTERNS = [
        r"https?://(?:t\.me|discord\.gg|bit\.ly|tinyurl\.com|free-keys|steam-promo)",
        r"\b(buy followers|free steam keys|crypto|airdrop|casino|betting|whatsapp me)\b",
        r"\b(subscribe to my channel|check out my bio|check out my profile)\b",
        r"^(first|bump|test|asdf|11111|\.+|\?+)$"
    ]

    @classmethod
    def evaluate(cls, text: str) -> Tuple[bool, str]:
        """Returns (is_spam_or_irrelevant, reason)."""
        clean = text.strip()
        lower = clean.lower()

        if len(clean) < 4:
            return True, "Too short / low information"

        for pat in cls.SPAM_PATTERNS:
            if re.search(pat, lower):
                return True, "Spam pattern or promotional solicitation detected"

        # Check if text is only emojis or punctuation without alphanumeric words
        words = re.findall(r"\w+", clean)
        if not words:
            return True, "Non-informative content without text"

        return False, "Relevant"
