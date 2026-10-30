import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { tTopic, tSentiment } from '../i18n/helpers';
import { 
  Gamepad2, 
  MessageSquare, 
  Layers, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';

interface OverviewPageProps {
  lang: 'tr' | 'en';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getOverview();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Yükleniyor...' : 'Loading metrics...'}</div>;
  }

  const sentimentData = data?.sentiment_distribution
    ? Object.entries(data.sentiment_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const sourceData = data?.source_distribution
    ? Object.entries(data.source_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const SENTIMENT_COLORS: Record<string, string> = {
    Positive: '#10b981',
    Negative: '#ef4444',
    Mixed: '#c084fc',
    Neutral: '#64748b',
    Uncertain: '#f59e0b'
  };

  const SOURCE_COLORS: Record<string, string> = {
    reddit: '#ff4500',
    x: '#1da1f2',
    steam: '#1b2838',
    csv_import: '#0284c7',
    json_import: '#0d9488',
    sample_fixture: '#8b5cf6'
  };

  return (
    <div className="page-container">
      {/* Coverage Warnings */}
      {data?.coverage_warnings?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {data.coverage_warnings.map((warn: string, idx: number) => (
            <div key={idx} className="warning-box">
              <AlertCircle size={18} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid-cards">
        <div className="metric-card">
          <div className="label">{t.overview.total_games}</div>
          <div className="value">{data?.total_games_analyzed ?? 0}</div>
          <div className="sub">{data?.event_name}</div>
        </div>

        <div className="metric-card">
          <div className="label">{t.overview.total_comments}</div>
          <div className="value" style={{ color: '#38bdf8' }}>
            {data?.total_relevant_comments?.toLocaleString() ?? 0}
          </div>
          <div className="sub">{data?.unique_discussions_count ?? 0} {t.overview.unique_discussions}</div>
        </div>

        <div className="metric-card">
          <div className="label">Pozitif Geri Bildirim</div>
          <div className="value" style={{ color: '#10b981' }}>
            {data?.sentiment_distribution?.Positive ?? 0}
          </div>
          <div className="sub">
            {data?.total_relevant_comments > 0
              ? `%${Math.round(((data.sentiment_distribution?.Positive || 0) / data.total_relevant_comments) * 100)} (${data.sentiment_distribution?.Positive || 0} / ${data.total_relevant_comments} Yorum)`
              : 'Veri yok'}
          </div>
        </div>

        <div className="metric-card">
          <div className="label">Negatif Eleştiri</div>
          <div className="value" style={{ color: '#ef4444' }}>
            {data?.sentiment_distribution?.Negative ?? 0}
          </div>
          <div className="sub">
            {data?.total_relevant_comments > 0
              ? `%${Math.round(((data.sentiment_distribution?.Negative || 0) / data.total_relevant_comments) * 100)} (${data.sentiment_distribution?.Negative || 0} / ${data.total_relevant_comments} Yorum)`
              : 'Veri yok'}
          </div>
        </div>
      </div>

      {/* Charts & Distributions */}
      <div className="grid-2col">
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.overview.sentiment_dist}</div>
          </div>
          <div style={{ height: 260 }}>
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Henüz veri toplanmadı
              </div>
            )}
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">{t.overview.source_dist}</div>
          </div>
          <div style={{ height: 260 }}>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-src-${index}`} fill={SOURCE_COLORS[entry.name] || '#38bdf8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Henüz veri toplanmadı
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Praises and Complaints side-by-side */}
      <div className="grid-2col">
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ThumbsUp size={18} /> {t.overview.top_praised}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.top_praised_features?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#0f172a', borderRadius: '6px' }}>
                <span style={{ fontWeight: 500 }}>{tTopic(item.topic, lang)}</span>
                <span className="badge badge-positive">{item.count} {t.overview.comments_unit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ThumbsDown size={18} /> {t.overview.top_complaints}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.top_complaints?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#0f172a', borderRadius: '6px' }}>
                <span style={{ fontWeight: 500 }}>{tTopic(item.topic, lang)}</span>
                <span className="badge badge-negative">{item.count} {t.overview.complaints_unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status & Freshness footer info */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', color: '#94a3b8' }}>
          <div>
            <strong>{t.overview.data_freshness}:</strong> {data?.data_freshness}
          </div>
          <div>
            <strong>{lang === 'tr' ? 'Durum:' : 'Status:'}</strong> {data?.collection_status} | <strong>{t.overview.active_provider}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
