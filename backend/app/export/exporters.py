import csv
import json
import os
import io
import sqlite3
from typing import Dict, Any, List
from datetime import datetime, timezone

class ReportExporter:
    """Exports structured datasets and comprehensive HTML research reports."""

    @staticmethod
    def export_csv(conn: sqlite3.Connection) -> str:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pc.id, g.title as game_title, ds.name as source_name, pc.permalink,
                   pc.author, pc.published_at, pc.content, pc.language,
                   sc.sentiment, sc.confidence as sentiment_confidence,
                   GROUP_CONCAT(DISTINCT tc.topic) as topics,
                   MAX(tc.severity) as highest_severity,
                   pc.data_origin
            FROM posts_comments pc
            LEFT JOIN game_comment_associations gca ON pc.id = gca.comment_id
            LEFT JOIN games g ON gca.game_id = g.id
            JOIN data_sources ds ON pc.source_id = ds.id
            LEFT JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            LEFT JOIN topic_classifications tc ON pc.id = tc.comment_id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY pc.id
            ORDER BY pc.published_at DESC
        """)
        rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Comment ID", "Game Title", "Source", "Permalink", "Author", "Published At",
            "Content", "Language", "Sentiment", "Sentiment Confidence", "Topics", "Highest Severity", "Data Origin"
        ])

        for r in rows:
            writer.writerow([
                r["id"],
                r["game_title"] or "General / Unassociated",
                r["source_name"],
                r["permalink"],
                r["author"],
                r["published_at"],
                r["content"],
                r["language"],
                r["sentiment"],
                r["sentiment_confidence"],
                r["topics"],
                r["highest_severity"],
                r["data_origin"]
            ])

        return output.getvalue()

    @staticmethod
    def export_json(conn: sqlite3.Connection) -> str:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pc.id, g.title as game_title, ds.name as source_name, pc.permalink,
                   pc.author, pc.published_at, pc.content, pc.language, pc.raw_metrics,
                   sc.sentiment, sc.confidence as sentiment_confidence, sc.reasoning,
                   ce.excerpt, ce.context_notes, pc.data_origin
            FROM posts_comments pc
            LEFT JOIN game_comment_associations gca ON pc.id = gca.comment_id
            LEFT JOIN games g ON gca.game_id = g.id
            JOIN data_sources ds ON pc.source_id = ds.id
            LEFT JOIN sentiment_classifications sc ON pc.id = sc.comment_id
            LEFT JOIN classification_evidence ce ON pc.id = ce.comment_id
            WHERE pc.is_spam_or_irrelevant = 0 AND pc.is_duplicate = 0
            GROUP BY pc.id
            ORDER BY pc.published_at DESC
        """)
        records = []
        for r in cursor.fetchall():
            # Get topics for this comment
            c_id = r["id"]
            cur2 = conn.cursor()
            cur2.execute("SELECT topic, sentiment_in_topic, severity, actionability, confidence FROM topic_classifications WHERE comment_id = ?", (c_id,))
            topics = [dict(t) for t in cur2.fetchall()]

            metrics = {}
            if r["raw_metrics"]:
                try:
                    metrics = json.loads(r["raw_metrics"])
                except Exception:
                    pass

            records.append({
                "id": r["id"],
                "game": r["game_title"] or "General",
                "source": r["source_name"],
                "permalink": r["permalink"],
                "author": r["author"],
                "published_at": r["published_at"],
                "content": r["content"],
                "language": r["language"],
                "raw_metrics": metrics,
                "sentiment": {
                    "label": r["sentiment"],
                    "confidence": r["sentiment_confidence"],
                    "reasoning": r["reasoning"]
                },
                "topics": topics,
                "evidence": {
                    "excerpt": r["excerpt"],
                    "context_notes": r["context_notes"]
                },
                "data_origin": r["data_origin"]
            })

        return json.dumps(records, indent=2, ensure_ascii=False)

    @staticmethod
    def generate_html_report(conn: sqlite3.Connection, overview: Dict[str, Any], top10: List[Dict[str, Any]], recommendations: Dict[str, Any]) -> str:
        """Generates a professional, print-friendly standalone HTML report."""
        now_str = datetime.now(timezone.utc).strftime("%d %B %Y %H:%M UTC")

        top10_rows = ""
        for g in top10:
            verified_badge = '<span class="badge verified">Doğrulanmış (Steam)</span>' if g["ccu_verified"] else f'<span class="badge unverified">{g["ccu_source"]}</span>'
            cov_badge = '<span class="badge warning">Düşük Örneklem</span>' if g["is_low_sample"] else '<span class="badge ok">Yeterli</span>'
            top10_rows += f"""
            <tr>
                <td><strong>#{g['rank']}</strong></td>
                <td><strong>{g['title']}</strong><br><small style="color:#888;">{g['developer']} | {g['genre']}</small></td>
                <td>{g['peak_ccu']:,} CCU<br>{verified_badge}</td>
                <td>{g['collected_comments_count']} Yorum<br>{cov_badge}</td>
                <td>
                    <div style="font-size:0.85rem;">
                        <span style="color:#22c55e;">%{g['positive_pct']} Pozitif</span> | 
                        <span style="color:#ef4444;">%{g['negative_pct']} Negatif</span>
                    </div>
                </td>
                <td style="color:#10b981; font-size:0.85rem;">{g['most_praised_feature']}</td>
                <td style="color:#f43f5e; font-size:0.85rem;">{g['most_common_complaint']}</td>
            </tr>
            """

        rec_cards = ""
        for r in recommendations.get("recommendations", []):
            rec_cards += f"""
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="badge priority">{r['priority_group']}</span>
                    <span style="font-size:0.8rem; color:#888;">Ciddiyet: <strong>{r['severity']}</strong> | Efor: <strong>{r['estimated_effort']}</strong></span>
                </div>
                <h3 style="margin: 0.5rem 0; color:#38bdf8;">{r['problem_or_opportunity']}</h3>
                <p><strong>Önerilen Aksiyon:</strong> {r['suggested_action']}</p>
                <p style="background:#1e293b; padding:0.6rem; border-radius:4px; font-size:0.9rem;">
                    <strong>Neden Önemli:</strong> {r['why_it_matters_for_indie']}
                </p>
                <div style="font-size:0.8rem; color:#94a3b8;">
                    <strong>Destekleyen Örnek Oyunlar:</strong> {', '.join(r['supporting_games'])} ({r['relevant_comments_count']} İlgili Yorum)
                </div>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>NextFest Insight - Steam Next Fest Feedback Intelligence Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
        }}
        .container {{ max-width: 1100px; margin: 0 auto; }}
        header {{ border-bottom: 2px solid #334155; padding-bottom: 1.5rem; margin-bottom: 2rem; }}
        h1 {{ color: #38bdf8; margin: 0 0 0.5rem 0; font-size: 2.2rem; }}
        .meta {{ color: #94a3b8; font-size: 0.95rem; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
        .stat-box {{ background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.2rem; text-align: center; }}
        .stat-val {{ font-size: 1.8rem; font-weight: bold; color: #38bdf8; }}
        .stat-lbl {{ color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; margin-top: 0.3rem; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; background: #1e293b; border-radius: 8px; overflow: hidden; }}
        th, td {{ padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ background: #0f172a; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; }}
        .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.2rem; margin-bottom: 1rem; }}
        .badge {{ display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }}
        .badge.verified {{ background: #065f46; color: #34d399; }}
        .badge.unverified {{ background: #374151; color: #9ca3af; }}
        .badge.ok {{ background: #1e3a8a; color: #60a5fa; }}
        .badge.warning {{ background: #78350f; color: #f59e0b; }}
        .badge.priority {{ background: #0284c7; color: #ffffff; }}
        @media print {{
            body {{ background: #fff; color: #000; }}
            .stat-box, .card, table {{ border-color: #ccc; background: #fff; }}
            th {{ background: #eee; color: #000; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>NextFest Insight</h1>
            <h2>Steam Next Fest Geri Bildirim ve Pazar Zekası Raporu</h2>
            <div class="meta">
                Etkinlik: <strong>{overview.get('event_name')}</strong> ({overview.get('event_start')} — {overview.get('event_end')})<br>
                Rapor Üretim Tarihi: {now_str} | Sağlayıcı Modeli: Doğrulanabilir Veri Ambarı + Hibrit NLP
            </div>
        </header>

        <section>
            <h2>1. Yönetici Özeti ve Metrikler</h2>
            <div class="grid">
                <div class="stat-box">
                    <div class="stat-val">{overview.get('total_games_analyzed', 0)}</div>
                    <div class="stat-lbl">Analiz Edilen Oyun</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val">{overview.get('total_relevant_comments', 0):,}</div>
                    <div class="stat-lbl">Benzersiz Yorum</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val">{overview.get('unique_discussions_count', 0):,}</div>
                    <div class="stat-lbl">Kaynak Tartışma</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val">{overview.get('sentiment_distribution', {}).get('Positive', 0)}</div>
                    <div class="stat-lbl">Pozitif Geri Bildirim</div>
                </div>
            </div>
        </section>

        <section>
            <h2>2. En Yüksek Eşzamanlı Demo Oyuncusuna Sahip İlk 10 Oyun</h2>
            <p style="color:#94a3b8; font-size:0.9rem;">
                Not: Sıralama doğrulanabilir veri kaynaklarına dayalıdır. Oyuncu sayısı doğrudan oyun kalitesinin bir ölçüsü değildir; pazarlama erişimi ve tür popülaritesini yansıtır. Düşük yorum sayısına sahip oyunlar için yüzdeler genelleştirilemez.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Sıra</th>
                        <th>Oyun & Stüdyo</th>
                        <th>Zirve CCU & Kaynak</th>
                        <th>Yorum Hacmi</th>
                        <th>Duygu Dağılımı</th>
                        <th>En Çok Övülen</th>
                        <th>En Sık Şikayet</th>
                    </tr>
                </thead>
                <tbody>
                    {top10_rows}
                </tbody>
            </table>
        </section>

        <section style="margin-top:2.5rem;">
            <h2>3. Bağımsız Demo Geliştirme Aksiyon Planı ve Öneriler</h2>
            <p style="color:#94a3b8; font-size:0.9rem;">
                Etkinlikteki oyuncu davranışları, terk etme nedenleri ve viral olma faktörleri taranarak küçük bir indie stüdyonun gelecekteki Next Fest demosu için somutlaştırılmıştır.
            </p>
            {rec_cards}
        </section>

        <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #334155; color: #64748b; font-size: 0.85rem;">
            NextFest Insight Masaüstü Uygulaması ile yerel veritabanından üretilmiştir. Gizlilik ve Veri Güvenliği: Hiçbir API anahtarı veya kimlik bilgisi rapora aktarılmamıştır.
        </footer>
    </div>
</body>
</html>
"""
        return html
