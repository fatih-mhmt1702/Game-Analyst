import React from 'react';
import { Sparkles, Globe, ShieldCheck, HelpCircle } from 'lucide-react';

interface NavbarProps {
  lang: 'tr' | 'en';
  onToggleLang: () => void;
  onOpenWizard: () => void;
  backendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, onToggleLang, onOpenWizard, backendHealthy }) => {
  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
            Steam Next Fest: October 2026
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#1e293b', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
            19–26 Ekim 2026
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        {/* Backend health status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: backendHealthy ? '#34d399' : '#f87171' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: backendHealthy ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
          <span>{backendHealthy ? (lang === 'tr' ? 'Veritabanı & API Aktif' : 'API & DB Online') : (lang === 'tr' ? 'Bağlantı Bekleniyor' : 'Connecting')}</span>
        </div>

        {/* Setup Wizard Button */}
        <button className="btn btn-secondary" onClick={onOpenWizard} title={lang === 'tr' ? 'Kurulum ve Metodoloji Sihirbazı' : 'Setup & Methodology Wizard'}>
          <HelpCircle size={15} />
          <span>{lang === 'tr' ? 'Rehber' : 'Guide'}</span>
        </button>

        {/* Language switch */}
        <button className="btn btn-secondary" onClick={onToggleLang} style={{ minWidth: '78px' }}>
          <Globe size={15} />
          <span>{lang === 'tr' ? 'EN' : 'TR'}</span>
        </button>
      </div>
    </header>
  );
};
