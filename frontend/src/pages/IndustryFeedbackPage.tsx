import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { 
  TrendingUp, 
  AlertCircle, 
  Cpu, 
  Crosshair, 
  Sparkles, 
  Tv, 
  Copy, 
  ExternalLink 
} from 'lucide-react';

interface IndustryFeedbackPageProps {
  lang: 'tr' | 'en';
}

export const IndustryFeedbackPage: React.FC<IndustryFeedbackPageProps> = ({ lang }) => {
  const t = lang === 'tr' ? tr : en;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const res = await api.getIndustryPatterns();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>{lang === 'tr' ? 'Yükleniyor...' : 'Loading industry macro patterns...'}</div>;
  }

  const renderPatternCard = (item: any, icon: React.ReactNode, borderColor: string = '#0284c7') => (
    <div key={item.title} className="panel" style={{ borderLeft: `4px solid ${borderColor}`, marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {icon}
            {item.title}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '780px' }}>
            {item.description}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
            {item.frequency_count} Yorum
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Toplamın %{item.percentage_of_all_comments} kadarı ({item.frequency_count} / {data.total_comments_evaluated} Yorum)
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>
            {item.affected_games_count} Farklı Oyunda Görüldü
          </div>
        </div>
      </div>

      {/* Severity breakdown pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        {item.severity_breakdown.Critical > 0 && (
          <span className="badge badge-critical">{item.severity_breakdown.Critical} Kritik</span>
        )}
        {item.severity_breakdown.Major > 0 && (
          <span className="badge badge-major">{item.severity_breakdown.Major} Majör</span>
        )}
        {item.severity_breakdown.Moderate > 0 && (
          <span className="badge badge-moderate">{item.severity_breakdown.Moderate} Orta</span>
        )}
        {item.severity_breakdown.Minor > 0 && (
          <span className="badge badge-minor">{item.severity_breakdown.Minor} Minör</span>
        )}
      </div>

      {/* Representative excerpts */}
      {item.example_excerpts?.length > 0 && (
        <div style={{ marginTop: '0.9rem', background: '#090d16', padding: '0.8rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Gerçek Oyuncu Alıntıları & Kanıtlar:
          </div>
          {item.example_excerpts.map((ex: any, i: number) => (
            <div key={i} style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <strong style={{ color: '#38bdf8' }}>[{ex.game}]</strong> "{ex.text}"
              </span>
              {ex.url && (
                <a href={ex.url} target="_blank" rel="noreferrer" style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TrendingUp size={28} color="#38bdf8" />
          {t.industry.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          {t.industry.subtitle} ({data?.total_games_evaluated} Oyun ve {data?.total_comments_evaluated} Yorum Çapraz Analizi)
        </p>
      </div>

      {/* 1. Usability Problems */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.usability_problems}
      </h2>
      {data?.frequent_demo_usability_problems?.map((p: any) =>
        renderPatternCard(p, <AlertCircle size={18} color="#f59e0b" />, '#f59e0b')
      )}

      {/* 2. Performance Patterns */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.performance_patterns}
      </h2>
      {data?.performance_optimization_patterns?.map((p: any) =>
        renderPatternCard(p, <Cpu size={18} color="#ef4444" />, '#ef4444')
      )}

      {/* 3. Controls and Combat */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.controls_combat}
      </h2>
      {data?.controls_combat_tutorial_issues?.map((p: any) =>
        renderPatternCard(p, <Crosshair size={18} color="#38bdf8" />, '#38bdf8')
      )}

      {/* 4. Reasons Felt Unfinished */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fb923c', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.unfinished_reasons}
      </h2>
      {data?.reasons_demo_felt_unfinished?.map((p: any) =>
        renderPatternCard(p, <AlertCircle size={18} color="#fb923c" />, '#fb923c')
      )}

      {/* 5. Retention & Praise Drivers */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.praise_drivers}
      </h2>
      {data?.retention_and_praise_drivers?.map((p: any) =>
        renderPatternCard(p, <Sparkles size={18} color="#10b981" />, '#10b981')
      )}

      {/* 6. Marketing vs Actual Gameplay */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.marketing_mismatch}
      </h2>
      {data?.marketing_vs_gameplay_mismatches?.map((p: any) =>
        renderPatternCard(p, <Tv size={18} color="#c084fc" />, '#c084fc')
      )}

      {/* 7. Generic Design */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#94a3b8', margin: '1.8rem 0 1rem 0' }}>
        {t.industry.generic_complaints}
      </h2>
      {data?.generic_design_complaints?.map((p: any) =>
        renderPatternCard(p, <Copy size={18} color="#94a3b8" />, '#64748b')
      )}
    </div>
  );
};
