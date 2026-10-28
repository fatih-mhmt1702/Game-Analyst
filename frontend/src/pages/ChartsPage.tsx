import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { tTopic } from '../i18n/helpers';
import { BarChart3, PieChart as PieIcon, Activity, Flame, ShieldAlert, Layers } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

interface ChartsPageProps {
  lang: 'tr' | 'en';
}

export const ChartsPage: React.FC<ChartsPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;

  const [sentimentByGame, setSentimentByGame] = useState<any[]>([]);
  const [topicFreq, setTopicFreq] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllCharts();
  }, []);

  const loadAllCharts = async () => {
    try {
      setLoading(true);
      const [sGame, tFreq, pData, tSeries, sevData, hMap] = await Promise.all([
        api.getSentimentByGame(),
        api.getTopicFrequency(),
        api.getPlatformComparison(),
        api.getVolumeOverTime(),
        api.getSeverityByGame(),
        api.getHeatmap()
      ]);
      setSentimentByGame(sGame);
      setTopicFreq(tFreq);
      setPlatformData(pData);
      setTimeSeries(tSeries);
      setSeverityData(sevData);
      setHeatmapData(hMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Grafikler yükleniyor...' : 'Loading charts...'}</div>;
  }

  // Format platform comparison for recharts
  const platformChartData = platformData
    ? Object.entries(platformData).map(([platform, counts]: [string, any]) => ({
        platform: platform.toUpperCase(),
        Positive: counts.Positive || 0,
        Negative: counts.Negative || 0,
        Mixed: counts.Mixed || 0,
        Neutral: counts.Neutral || 0
      }))
    : [];

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={28} color="#38bdf8" />
          {t.nav.charts}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          Tüm metrikler gerçek veritabanı kayıtlarından filtrelenmiştir. Her grafik net sayılara ve açıklamalara dayanır.
        </p>
      </div>

      {/* 1. Sentiment by Game Stacked Bar */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Oyun Bazında Pozitif vs Negatif Duygu Dağılımı</div>
            <div className="panel-desc">En çok geri bildirim toplanan oyunların duygu kutupsallığı</div>
          </div>
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentByGame} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <XAxis dataKey="title" stroke="#64748b" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" label={{ value: 'Yorum Sayısı', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="positive" name="Pozitif" stackId="a" fill="#10b981" />
              <Bar dataKey="mixed" name="Karmaşık" stackId="a" fill="#c084fc" />
              <Bar dataKey="negative" name="Negatif" stackId="a" fill="#ef4444" />
              <Bar dataKey="neutral" name="Nötr" stackId="a" fill="#64748b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Platform Comparison (Reddit vs X vs Steam) & Volume Over Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.8rem' }}>
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Reddit vs X vs Steam Duygu Kıyaslaması</div>
              <div className="panel-desc">Platformların oyuncu duyarlılık profili</div>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData}>
                <XAxis dataKey="platform" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Positive" fill="#10b981" name="Pozitif" />
                <Bar dataKey="Negative" fill="#ef4444" name="Negatif" />
                <Bar dataKey="Mixed" fill="#c084fc" name="Karmaşık" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Günlük Geri Bildirim Hacmi</div>
              <div className="panel-desc">Etkinlik boyunca paylaşımların zamansal akışı</div>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Toplam Hacim" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="reddit" name="Reddit" stroke="#ff4500" strokeWidth={1.5} />
                <Line type="monotone" dataKey="x" name="X" stroke="#1da1f2" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Severity by Game (Critical / Major issues) */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <ShieldAlert size={20} />
              Kritik ve Majör Problem Dağılımı (Ciddiyet Derecesine Göre)
            </div>
            <div className="panel-desc">Çökme, kilitlenme, kontrol arızası ve ağır performans problemleri</div>
          </div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData} margin={{ top: 10, right: 30, left: 20, bottom: 35 }}>
              <XAxis dataKey="title" stroke="#64748b" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend verticalAlign="top" />
              <Bar dataKey="critical" name="Kritik (Çökme / Save Kaybı)" fill="#ef4444" stackId="sev" />
              <Bar dataKey="major" name="Majör (Takılma / Kontrol Arızası)" fill="#f59e0b" stackId="sev" />
              <Bar dataKey="moderate" name="Orta (UI / Balans / Denge)" fill="#38bdf8" stackId="sev" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Heatmap Matrix of Feedback Topics x Sentiment */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={20} color="#f59e0b" />
              {t.charts.heatmap_title}
            </div>
            <div className="panel-desc">{t.charts.heatmap_desc}</div>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{lang === 'tr' ? 'Geri Bildirim Konusu' : 'Feedback Topic'}</th>
                <th style={{ color: '#10b981' }}>{t.charts.positive}</th>
                <th style={{ color: '#ef4444' }}>{t.charts.negative}</th>
                <th style={{ color: '#c084fc' }}>{t.charts.mixed}</th>
                <th style={{ color: '#94a3b8' }}>{t.charts.neutral}</th>
                <th>{lang === 'tr' ? 'Toplam Sinyal' : 'Total Signals'}</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => {
                const total = row.Positive + row.Negative + row.Mixed + row.Neutral;
                if (total === 0) return null; // show active topics
                return (
                  <tr key={row.topic}>
                    <td><strong>{tTopic(row.topic, lang)}</strong></td>
                    <td style={{ background: row.Positive > 0 ? `rgba(16, 185, 129, ${Math.min(row.Positive * 0.15, 0.4)})` : 'transparent' }}>
                      {row.Positive}
                    </td>
                    <td style={{ background: row.Negative > 0 ? `rgba(239, 68, 68, ${Math.min(row.Negative * 0.15, 0.4)})` : 'transparent' }}>
                      {row.Negative}
                    </td>
                    <td style={{ background: row.Mixed > 0 ? `rgba(192, 132, 252, ${Math.min(row.Mixed * 0.15, 0.4)})` : 'transparent' }}>
                      {row.Mixed}
                    </td>
                    <td>{row.Neutral}</td>
                    <td><span className="badge badge-minor">{total}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
