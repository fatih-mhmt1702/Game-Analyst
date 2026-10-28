import sqlite3
from typing import Dict, Any, List

class IndustryPatternAnalyzer:
    """Extracts macro patterns, churn triggers, and praise drivers across all Next Fest titles."""

    @staticmethod
    def analyze_patterns(conn: sqlite3.Connection) -> Dict[str, Any]:
        cursor = conn.cursor()

        # Total comments and games
        cursor.execute("SELECT COUNT(*) as count FROM games")
        total_games = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM posts_comments WHERE is_spam_or_irrelevant = 0 AND is_duplicate = 0")
        total_comments = cursor.fetchone()["count"]

        def fetch_topic_pattern(
            topic_names: List[str],
            sentiment_filter: str = "Negative",
            title: str = "",
            description: str = ""
        ) -> Dict[str, Any]:
            placeholders = ",".join(["?"] * len(topic_names))
            query = f"""
                SELECT tc.topic, COUNT(tc.id) as freq,
                       COUNT(DISTINCT gca.game_id) as affected_games,
                       SUM(CASE WHEN tc.severity = 'Critical' THEN 1 ELSE 0 END) as crit,
                       SUM(CASE WHEN tc.severity = 'Major' THEN 1 ELSE 0 END) as maj,
                       SUM(CASE WHEN tc.severity = 'Moderate' THEN 1 ELSE 0 END) as mod,
                       SUM(CASE WHEN tc.severity = 'Minor' THEN 1 ELSE 0 END) as min
                FROM topic_classifications tc
                JOIN posts_comments pc ON tc.comment_id = pc.id
                LEFT JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
                WHERE tc.topic IN ({placeholders})
                  AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            """
            params: List[Any] = list(topic_names)
            if sentiment_filter == "Negative":
                query += " AND (tc.sentiment_in_topic = 'Negative' OR tc.severity IN ('Critical', 'Major', 'Moderate'))"
            elif sentiment_filter == "Positive":
                query += " AND tc.sentiment_in_topic = 'Positive'"
            
            cursor.execute(query, params)
            row = cursor.fetchone()
            freq = row["freq"] or 0
            pct = round((freq / max(total_comments, 1)) * 100, 2)

            # Sample excerpts
            cursor.execute(f"""
                SELECT ce.excerpt, pc.permalink, g.title as game_title
                FROM topic_classifications tc
                JOIN posts_comments pc ON tc.comment_id = pc.id
                JOIN classification_evidence ce ON tc.comment_id = ce.comment_id
                LEFT JOIN game_comment_associations gca ON tc.comment_id = gca.comment_id
                LEFT JOIN games g ON gca.game_id = g.id
                WHERE tc.topic IN ({placeholders})
                  AND pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
                  AND ce.excerpt != ''
                LIMIT 3
            """, list(topic_names))
            excerpts = [
                {"game": r["game_title"] or "Indie Demo", "text": r["excerpt"], "url": r["permalink"]}
                for r in cursor.fetchall()
            ]

            return {
                "title": title or topic_names[0],
                "category": topic_names[0],
                "description": description,
                "frequency_count": freq,
                "percentage_of_all_comments": pct,
                "severity_breakdown": {
                    "Critical": row["crit"] or 0,
                    "Major": row["maj"] or 0,
                    "Moderate": row["mod"] or 0,
                    "Minor": row["min"] or 0
                },
                "affected_games_count": row["affected_games"] or 0,
                "example_excerpts": excerpts
            }

        # 1. Frequent demo usability problems
        usability = [
            fetch_topic_pattern(
                ["UI and UX"], "Negative",
                "Karmaşık Arayüz ve Okunaksız HUD / Menüler",
                "Oyuncular menü hiyerarşisinin hantal olmasından, yazı boyutlarının küçük kalmasından ve envanter yönetiminin zorluğundan yakınıyor."
            ),
            fetch_topic_pattern(
                ["Accessibility"], "Negative",
                "Tuş Yeniden Atama ve Erişilebilirlik Eksikliği",
                "Klavyede tuş atama desteğinin olmaması veya kontrolcü algılanmaması oyuncuların demoyu hemen terk etmesine yol açıyor."
            )
        ]

        # 2. Performance and optimization patterns
        performance = [
            fetch_topic_pattern(
                ["Performance and optimization"], "Negative",
                "Kare Hızı Düşüşleri ve Mikro Takılmalar (Stuttering)",
                "Özellikle shader derleme takılmaları ve orta segment GPU'larda ani FPS düşüşleri demoların olumsuz not almasına neden oluyor."
            ),
            fetch_topic_pattern(
                ["Bugs and crashes"], "Negative",
                "İlk Açılış Çökmeleri ve Softlock Problemleri",
                "Oyunun başlangıcında siyah ekranda kalma veya tutorial esnasında ilerlemeyi kilitleyen kritik hatalar."
            )
        ]

        # 3. Controls, combat and tutorials
        controls_combat = [
            fetch_topic_pattern(
                ["Controls and responsiveness"], "Negative",
                "Gecikmeli Girdi (Input Lag) ve Sert/Hantal Kontroller",
                "Oyuncuların hareket ve vuruş hissinin 'floaty' veya 'clunky' olduğunu belirtmesi demo bırakma oranını artırıyor."
            ),
            fetch_topic_pattern(
                ["Combat and difficulty"], "Negative",
                "Dengesiz Hitboxlar ve 'Mermi Süngeri' Düşmanlar",
                "Vuruş hissinin geri bildirim vermemesi ve gereksiz yere uzayan düşman can barları dövüş zevkini baltalıyor."
            ),
            fetch_topic_pattern(
                ["Tutorials and onboarding"], "Negative",
                "Oyuncuyu Boğan Bilgi Duvarları ve Belirsiz Amaçlar",
                "Mekaniklerin doğrudan oynanış yerine uzun statik metin pencereleriyle anlatılması veya tersine oyuncunun ne yapacağını bilememesi."
            )
        ]

        # 4. Reasons demo felt unfinished
        unfinished = [
            fetch_topic_pattern(
                ["Animation quality"], "Negative",
                "Tutarsız Animasyon Geçişleri ve Kaplama Kırılmaları (Clipping)",
                "Karakter ve düşman animasyonlarının eksik karelerle sert geçiş yapması demoyu alfa aşamasında hissettiriyor."
            ),
            fetch_topic_pattern(
                ["Sound design and music"], "Negative",
                "Eksik Ses Efektleri ve Karışık Ses Düzeyleri",
                "Vuruşlarda ses tepkisi olmaması veya diyalog seslerinin müzik altında kaybolması profesyonel olmayan bir hava yaratıyor."
            ),
            fetch_topic_pattern(
                ["Game pacing"], "Negative",
                "Ağır Tempo ve Gereksiz Yürüme Süreleri",
                "İlk 10 dakikada aksiyon veya ilgi çekici bir mekanik sunamayan demolar erken kapatılıyor."
            )
        ]

        # 5. Retention and praise drivers
        praise_drivers = [
            fetch_topic_pattern(
                ["Positive standout features"], "Positive",
                "Anında İstek Listesine (Wishlist) Aldıran Çarpıcı Kanca",
                "Özgün bir temel oynanış döngüsü (core loop) ve akıcı bir oyun hissi oyuncuların oyunu doğrudan övmesini sağlıyor."
            ),
            fetch_topic_pattern(
                ["Art direction and visual identity"], "Positive",
                "Güçlü Görsel Kimlik ve Sanat Yönetimi",
                "Yüksek bütçeli fotogerçekçilik yerine stilize, tutarlı ve akılda kalıcı sanat tasarımı en çok övgü alan unsurlar arasında."
            ),
            fetch_topic_pattern(
                ["Replayability"], "Positive",
                "Farklı Oynanış Biçimleri ve Tekrar Oynanabilirlik",
                "Demonun birden fazla build veya alternatif yolla tekrar deneyimlenebilmesi toplulukta viral paylaşımı tetikliyor."
            )
        ]

        # 6. Marketing vs gameplay mismatches
        marketing_mismatch = [
            fetch_topic_pattern(
                ["Marketing versus actual gameplay"], "Negative",
                "Fragmandaki Dinamik Aksiyon ile Demonun Tempou Arasındaki Çelişki",
                "Fragmanın hızlı tempolu bir aksiyon vadetmesine rağmen demonun uzun envanter ve yürüme sekanslarıyla başlaması oyuncu hayal kırıklığı yaratıyor."
            )
        ]

        # 7. Generic design complaints
        generic_design = [
            fetch_topic_pattern(
                ["Originality and genre saturation"], "Negative",
                "Türe Yenilik Katmayan Klon Tasarımlar",
                "Özellikle popüler roguelike/survivor veya souls-like oyunlarını belirgin bir yenilik katmadan taklit eden demolar hızlıca eleştiriliyor."
            )
        ]

        return {
            "total_comments_evaluated": total_comments,
            "total_games_evaluated": total_games,
            "frequent_demo_usability_problems": usability,
            "performance_optimization_patterns": performance,
            "controls_combat_tutorial_issues": controls_combat,
            "reasons_demo_felt_unfinished": unfinished,
            "retention_and_praise_drivers": praise_drivers,
            "marketing_vs_gameplay_mismatches": marketing_mismatch,
            "generic_design_complaints": generic_design
        }
