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
  AlertCircle,
  TrendingUp,
  TrendingDown
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

      {/* Top Metric Cards - Refined Uiverse Gaming Cards */}
      <div className="grid-cards">
        {/* Toplam Oyun: Blue */}
        <div className="metric-card metric-card-blue">
          <div className="metric-card-header">
            <div className="label">{t.overview.total_games}</div>
            <div className="metric-icon-refined metric-icon-blue">
              <Gamepad2 size={15} />
            </div>
          </div>
          <div className="metric-val">{data?.total_games_analyzed ?? 0}</div>
          <div className="sub">{data?.event_name || 'Steam Next Fest October 2026'}</div>
          <div className="metric-trend-footer">
            <span>{lang === 'tr' ? 'Etkinlik Kapsamı' : 'Event Scope'}</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>100% {lang === 'tr' ? 'Demosu Aktif' : 'Active Demos'}</span>
          </div>
          <div className="metric-trend-bar">
            <div className="metric-trend-fill" style={{ width: '100%', background: '#38bdf8' }} />
          </div>
        </div>

        {/* Toplam Kayıt / Yorum: Cyan */}
        <div className="metric-card metric-card-cyan">
          <div className="metric-card-header">
            <div className="label">{t.overview.total_comments}</div>
            <div className="metric-icon-refined metric-icon-cyan">
              <MessageSquare size={15} />
            </div>
          </div>
          <div className="metric-val">{data?.total_relevant_comments?.toLocaleString() ?? 0}</div>
          <div className="sub">{data?.unique_discussions_count ?? 0} {t.overview.unique_discussions}</div>
          <div className="metric-trend-footer">
            <span>{lang === 'tr' ? 'Topluluk Tartışmaları' : 'Discussions'}</span>
            <span style={{ color: '#22d3ee', fontWeight: 600 }}>
              {data?.unique_discussions_count ? `${data.unique_discussions_count} ${lang === 'tr' ? 'başlık' : 'threads'}` : 'Steam/Reddit/X'}
            </span>
          </div>
          <div className="metric-trend-bar">
            <div className="metric-trend-fill" style={{ width: '100%', background: '#06b6d4' }} />
          </div>
        </div>

        {/* Pozitif Duygu: Yeşil */}
        <div className="metric-card metric-card-green">
          <div className="metric-card-header">
            <div className="label">{lang === 'tr' ? 'Pozitif Duygu' : 'Positive Sentiment'}</div>
            <div className="metric-icon-refined metric-icon-green">
              <ThumbsUp size={15} />
            </div>
          </div>
          <div className="metric-val">
            {data?.total_relevant_comments > 0
              ? `%${Math.round(((data.sentiment_distribution?.Positive || 0) / data.total_relevant_comments) * 100)}`
              : '0%'}
          </div>
          <div className="sub">
            {data?.sentiment_distribution?.Positive ?? 0} / {data?.total_relevant_comments ?? 0} {lang === 'tr' ? 'Yorum' : 'Comments'}
          </div>
          <div className="metric-trend-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={12} color="#34d399" />
              <span>{lang === 'tr' ? 'Oyuncu Onayı' : 'Player Praise'}</span>
            </span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>
              {data?.total_relevant_comments > 0
                ? `${Math.round(((data.sentiment_distribution?.Positive || 0) / data.total_relevant_comments) * 100)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="metric-trend-bar">
            <div 
              className="metric-trend-fill" 
              style={{ 
                width: `${data?.total_relevant_comments > 0 ? Math.round(((data.sentiment_distribution?.Positive || 0) / data.total_relevant_comments) * 100) : 0}%`, 
                background: '#10b981' 
              }} 
            />
          </div>
        </div>

        {/* Negatif Duygu: Kırmızı */}
        <div className="metric-card metric-card-red">
          <div className="metric-card-header">
            <div className="label">{lang === 'tr' ? 'Negatif Duygu' : 'Negative Sentiment'}</div>
            <div className="metric-icon-refined metric-icon-red">
              <ThumbsDown size={15} />
            </div>
          </div>
          <div className="metric-val">
            {data?.total_relevant_comments > 0
              ? `%${Math.round(((data.sentiment_distribution?.Negative || 0) / data.total_relevant_comments) * 100)}`
              : '0%'}
          </div>
          <div className="sub">
            {data?.sentiment_distribution?.Negative ?? 0} / {data?.total_relevant_comments ?? 0} {lang === 'tr' ? 'Eleştiri' : 'Critiques'}
          </div>
          <div className="metric-trend-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingDown size={12} color="#f87171" />
              <span>{lang === 'tr' ? 'Hata & Şikayet' : 'Issues & Bugs'}</span>
            </span>
            <span style={{ color: '#f87171', fontWeight: 600 }}>
              {data?.total_relevant_comments > 0
                ? `${Math.round(((data.sentiment_distribution?.Negative || 0) / data.total_relevant_comments) * 100)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="metric-trend-bar">
            <div 
              className="metric-trend-fill" 
              style={{ 
                width: `${data?.total_relevant_comments > 0 ? Math.round(((data.sentiment_distribution?.Negative || 0) / data.total_relevant_comments) * 100) : 0}%`, 
                background: '#ef4444' 
              }} 
            />
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
