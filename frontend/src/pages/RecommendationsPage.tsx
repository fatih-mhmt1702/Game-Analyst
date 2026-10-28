import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { tPriorityGroup, tSeverity } from '../i18n/helpers';
import { 
  Lightbulb, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';

interface RecommendationsPageProps {
  lang: 'tr' | 'en';
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getRecommendations();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Öneriler oluşturuluyor...' : 'Generating indie recommendations...'}</div>;
  }

  const recs = data?.recommendations || [];

  const getPriorityStyle = (group: string) => {
    switch (group) {
      case 'Must fix before release':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' };
      case 'High priority':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' };
      case 'Important improvement':
        return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8' };
      case 'Optional polish':
        return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7' };
      case 'Features worth considering':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' };
      case 'Design patterns to avoid':
        return { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.1)', border: '#fb7185' };
      default:
        return { color: '#64748b', bg: '#1e293b', border: '#475569' };
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lightbulb size={28} color="#eab308" />
          {t.recommendations.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          {t.recommendations.subtitle}
        </p>
      </div>

      {/* Methodology Banner */}
      <div className="panel" style={{ background: 'linear-gradient(90deg, #131c31 0%, #1e293b 100%)', borderLeft: '4px solid #38bdf8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.3rem' }}>
          <Sparkles size={18} />
          <span>Bağımsız Stüdyo Karar Destek Metodolojisi</span>
        </div>
        <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
          En popüler oyunları körü körüne kopyalamak yerine, indie stüdyolar için aktarılabilir oynanış ve cilalama dersleri filtrelenmiştir. Her öneri gerçek oyuncu geri bildirimleriyle desteklenir.
        </p>
      </div>

      {/* Recommendations Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
        {recs.map((r: any) => {
          const style = getPriorityStyle(r.priority_group);
          return (
            <div
              key={r.id}
              className="panel"
              style={{
                borderLeft: `5px solid ${style.border}`,
                background: '#131c31',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <span
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {tPriorityGroup(r.priority_group, lang)}
                </span>

                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>{t.recommendations.severity_label} <strong style={{ color: '#fff' }}>{tSeverity(r.severity, lang)}</strong></span>
                  <span>{t.recommendations.confidence_label} <strong style={{ color: '#34d399' }}>%{Math.round(r.confidence * 100)}</strong></span>
                  <span style={{ color: '#fbbf24' }}>{t.recommendations.effort_label} <strong>{r.estimated_effort}</strong></span>
                </div>
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.6rem' }}>
                {r.problem_or_opportunity}
              </h2>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '0.9rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  {t.recommendations.suggested_action}
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {r.suggested_action}
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.86rem', color: '#cbd5e1', marginBottom: '0.9rem' }}>
                <strong style={{ color: '#f59e0b' }}>{t.recommendations.why_it_matters}</strong> {r.why_it_matters_for_indie}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', fontSize: '0.82rem', color: '#64748b' }}>
                <div>
                  <strong>{t.recommendations.supporting_games}</strong> {r.supporting_games?.join(', ')} ({r.relevant_comments_count} {t.overview.comments_unit})
                </div>

                {r.transferability_caveat && (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    <strong style={{ color: '#38bdf8' }}>{t.recommendations.transfer_warning}</strong> {r.transferability_caveat}
                  </div>
                )}
              </div>

              {/* Representative evidence sources */}
              {r.representative_sources?.length > 0 && (
                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Kanıt Alıntıları & Kaynak Linkleri:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {r.representative_sources.map((src: any, sIdx: number) => (
                      <div key={sIdx} style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong style={{ color: '#cbd5e1' }}>[{src.game}]</strong> "{src.text}"</span>
                        {src.url && src.url !== '#' && (
                          <a href={src.url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                            <span>Bağlantı</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
