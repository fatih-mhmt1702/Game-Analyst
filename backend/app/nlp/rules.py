import re
from typing import Dict, List, Tuple

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

# Comprehensive keyword & semantic rule patterns for the 26 Steam Next Fest topics
TOPIC_PATTERNS: Dict[str, List[str]] = {
    "Gameplay mechanics": [
        r"\bmechanic[s]?\b", r"\bgameplay\b", r"\bloot loop\b", r"\bprogression\b", 
        r"\bcore loop\b", r"\bskill tree\b", r"\bcrafting\b", r"\bphysics\b", r"\bdeck building\b"
    ],
    "Controls and responsiveness": [
        r"\bcontrol[s]?\b", r"\bresponsiv(e|eness)\b", r"\binput lag\b", r"\bmouse smoothing\b",
        r"\bcontroller\b", r"\bkeybind[s]?\b", r"\bclunky\b", r"\bstiff\b", r"\bkeyboard\b", r"\bjoystick\b"
    ],
    "Combat and difficulty": [
        r"\bcombat\b", r"\bdifficulty\b", r"\bdamage\b", r"\bhitbox(es)?\b", r"\bboss(es)?\b",
        r"\benem(y|ies)\b", r"\bparry\b", r"\bdodge\b", r"\bbullet sponge\b", r"\bunfair\b", r"\btoo hard\b", r"\btoo easy\b"
    ],
    "Game feel and feedback": [
        r"\bgame feel\b", r"\bimpact\b", r"\bscreen shake\b", r"\bfeedback\b", r"\bweight\b",
        r"\bvisceral\b", r"\bheaviness\b", r"\bsatisfying\b", r"\bcrunchy\b", r"\bfloaty\b"
    ],
    "Performance and optimization": [
        r"\bfps\b", r"\bframerate\b", r"\bperformance\b", r"\boptimi(z|s)ation\b", r"\blag\b",
        r"\bstutter(ing)?\b", r"\bdrops?\b", r"\bgpu\b", r"\bcpu\b", r"\bram\b", r"\bsteam deck\b"
    ],
    "Bugs and crashes": [
        r"\bcrash(ed|es|ing)?\b", r"\bbug[s]?\b", r"\bglitch(es)?\b", r"\bsoftlock(ed)?\b",
        r"\bfreeze[s]?\b", r"\bfroze\b", r"\bblack screen\b", r"\bbroken\b", r"\berror\b"
    ],
    "UI and UX": [
        r"\bui\b", r"\bux\b", r"\binterface\b", r"\bmenu[s]?\b", r"\bhud\b", r"\bfont\b",
        r"\breadab(le|ility)\b", r"\bnavigation\b", r"\btooltips?\b", r"\binventory\b"
    ],
    "Tutorials and onboarding": [
        r"\btutorial[s]?\b", r"\bonboarding\b", r"\bhow to play\b", r"\bguide\b",
        r"\bconfusing\b", r"\bunclear\b", r"\bexplanation\b", r"\bintro\b"
    ],
    "Game pacing": [
        r"\bpacing\b", r"\bslow\b", r"\bdrag(s|ging)?\b", r"\bboring\b", r"\brushed\b",
        r"\bpadding\b", r"\bwalking simulator\b"
    ],
    "Content quantity": [
        r"\bcontent\b", r"\bdepth\b", r"\blength\b", r"\bvariety\b", r"\bamount\b",
        r"\blacking\b", r"\bshallow\b", r"\brich\b"
    ],
    "Replayability": [
        r"\breplay(able|ability)\b", r"\bnew game\b", r"\bbranching\b", r"\bprocedural\b",
        r"\brogueli(ke|te)\b", r"\bruns?\b"
    ],
    "Narrative and writing": [
        r"\bstory\b", r"\bdialogue\b", r"\bwriting\b", r"\bnarrative\b", r"\blore\b",
        r"\bcharacter[s]?\b", r"\bvoice acting\b", r"\bplot\b"
    ],
    "Art direction and visual identity": [
        r"\bart\b", r"\bvisual[s]?\b", r"\bgraphics?\b", r"\baesthetic\b", r"\bstyle\b",
        r"\bcolors?\b", r"\blook[s]?\b", r"\bdesign\b", r"\bgorgeous\b", r"\bbeautiful\b"
    ],
    "Animation quality": [
        r"\banimation[s]?\b", r"\btransitions?\b", r"\bclipping\b", r"\bmotion\b",
        r"\bfluid\b", r"\bjanky\b", r"\bjank\b"
    ],
    "Sound design and music": [
        r"\bsound\b", r"\baudio\b", r"\bmusic\b", r"\bsoundtrack\b", r"\bsfx\b",
        r"\bmute\b", r"\becho\b", r"\bmixing\b", r"\bost\b"
    ],
    "Multiplayer and networking": [
        r"\bmultiplayer\b", r"\bco-?op\b", r"\bnetcode\b", r"\bping\b", r"\bserver[s]?\b",
        r"\bmatchmaking\b", r"\bdisconnect(ed|ion)?\b", r"\blag\b", r"\blocal co-op\b"
    ],
    "Accessibility": [
        r"\baccessib(le|ility)\b", r"\bcolorblind\b", r"\bsubtitle[s]?\b", r"\brebind\b",
        r"\bdifficulty slider\b", r"\barachnophobia\b"
    ],
    "Demo length": [
        r"\bdemo (length|duration|short|long|too short|too long)\b", r"\bminutes\b", r"\bhours?\b",
        r"\bfinished in\b", r"\bplaytime\b"
    ],
    "Demo scope and content": [
        r"\bdemo scope\b", r"\bvertical slice\b", r"\bteaser\b", r"\bsample\b",
        r"\bshowcase\b", r"\bgood taste\b", r"\bcut off\b"
    ],
    "Marketing versus actual gameplay": [
        r"\btrailer\b", r"\bmarketing\b", r"\blooked different\b", r"\bmisleading\b",
        r"\bfalse advertising\b", r"\bnot what i expected\b", r"\bdeceptive\b"
    ],
    "Monetization and pricing expectations": [
        r"\bprice\b", r"\bpricing\b", r"\bcost\b", r"\bworth\b", r"\bmicrotransaction[s]?\b",
        r"\bpay to win\b", r"\bbattle pass\b", r"\bdollar[s]?\b"
    ],
    "Originality and genre saturation": [
        r"\boriginal(ity)?\b", r"\bgeneric\b", r"\bclone\b", r"\bcopy\b", r"\buninspired\b",
        r"\bunique\b", r"\bfresh\b", r"\byet another\b", r"\bsaturated\b"
    ],
    "AI-generated content concerns": [
        r"\bai[- ]generated\b", r"\bartificial intelligence\b", r"\bmidjourney\b",
        r"\bchatgpt\b", r"\bai art\b", r"\bai voices?\b", r"\bai slop\b"
    ],
    "Technical requirements": [
        r"\bsystem requirement[s]?\b", r"\bvram\b", r"\bdirectx\b", r"\bwindows 11\b",
        r"\blinux\b", r"\bproton\b", r"\bsteam os\b"
    ],
    "Positive standout features": [
        r"\blove the\b", r"\bfavorite part\b", r"\bstandout\b", r"\bgem\b", r"\bmasterpiece\b",
        r"\binstantly wishlisted\b", r"\bday one buy\b", r"\bhooked\b", r"\bchef'?s kiss\b"
    ]
}

# Severity indicator patterns
SEVERITY_PATTERNS = {
    "Critical": [
        r"\bcrash(es|ed|ing)? to desktop\b", r"\bwon'?t (start|launch|open)\b", 
        r"\bblack screen on start\b", r"\bcorrupted (save|data)\b", r"\bgame-?breaking\b",
        r"\bfatal error\b", r"\bblue screen\b", r"\bdeletes? save\b"
    ],
    "Major": [
        r"\bsoftlock(ed)?\b", r"\bunplayable\b", r"\bheavy stutter\b", r"\bmassive lag\b",
        r"\bcontroller (not detected|broken|does not work)\b", r"\bquest cannot be completed\b",
        r"\bkeybinds? broken\b", r"\bconstant disconnect\b", r"\bextreme drop\b"
    ],
    "Moderate": [
        r"\bclunky\b", r"\bconfusing\b", r"\bawkward\b", r"\bfrustrating\b", r"\bneeds balancing\b",
        r"\bhard to read\b", r"\bboring section\b", r"\bhitbox is off\b", r"\bslow pacing\b"
    ],
    "Minor": [
        r"\bminor\b", r"\bslight(ly)?\b", r"\btypo\b", r"\btexture clipping\b", r"\bfont size\b",
        r"\bcould be tweaked\b", r"\bniggle\b", r"\blittle bug\b"
    ]
}

# Actionability indicator patterns
ACTIONABILITY_PATTERNS = {
    "Actionable bug report": [
        r"\bwhen i (click|press|go to|enter)\b", r"\breproduce\b", r"\berror code\b", 
        r"\bhappens every time\b", r"\bstep[s]? to reproduce\b", r"\bglitch occurs\b"
    ],
    "Actionable design feedback": [
        r"\bwould be better if\b", r"\bshould add\b", r"\bplease consider\b", 
        r"\bneeds an option to\b", r"\bcamera sensitivity is too\b", r"\brecommend changing\b",
        r"\binstead of.*it should\b", r"\bbalance adjustment\b"
    ],
    "Suggestion": [
        r"\bsuggestion\b", r"\bi suggest\b", r"\bhope they add\b", r"\bwould love to see\b",
        r"\bany chance for\b", r"\bcould you add\b"
    ],
    "Question": [
        r"\?", r"\bhow do i\b", r"\bis there any\b", r"\bwill this have\b", 
        r"\bdoes anyone know\b", r"\bwhen will\b"
    ],
    "Irrelevant": [
        r"\bclick here\b", r"\bdiscord\.gg\b", r"\bsubscribe to\b", r"\bcheck my channel\b",
        r"\bfirst!\b", r"\blmao\b", r"\bgg\b"
    ]
}

# Positive & Negative sentiment vocabularies
POSITIVE_LEXICON = {
    "amazing", "awesome", "fantastic", "masterpiece", "great", "excellent", "superb",
    "fun", "smooth", "love", "loved", "enjoyed", "addictive", "satisfying", "gorgeous",
    "beautiful", "polished", "recommend", "wishlisted", "promising", "brilliant",
    "gem", "fresh", "crisp", "fluid", "responsive", "hooked", "delightful", "solid"
}

NEGATIVE_LEXICON = {
    "terrible", "awful", "horrible", "broken", "unplayable", "clunky", "boring",
    "disappointing", "trash", "bad", "worst", "laggy", "stutter", "crash", "crashes",
    "crashed", "buggy", "frustrating", "confusing", "ugly", "generic", "tedious",
    "sluggish", "unresponsive", "refund", "pass", "avoid", "sloppy", "unfinished"
}
