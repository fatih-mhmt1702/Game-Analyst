import React from 'react';
import { Menu, Globe, HelpCircle, Gamepad2 } from 'lucide-react';

interface NavbarProps {
  lang: 'tr' | 'en';
  onToggleLang: () => void;
  onOpenWizard: () => void;
  backendHealthy: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  lang, 
  onToggleLang, 
  onOpenWizard, 
  backendHealthy,
  onToggleMobileMenu
}) => {
  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mobile Hamburger Menu Button */}
        {onToggleMobileMenu && (
          <button 
            className="mobile-menu-btn" 
            onClick={onToggleMobileMenu}
            aria-label="Menüyü Aç"
            type="button"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Mobile Brand Title (shown when sidebar hidden on small screens) */}
        <div className="mobile-brand-wrapper">
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gamepad2 size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff', letterSpacing: '-0.01em' }}>
            Game Analyst
          </span>
        </div>

        {/* Desktop Event Title */}
        <div className="desktop-event-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
            Steam Next Fest: October 2026
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#1e293b', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
            19–26 Ekim 2026
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Backend health status badge */}
        <div className="health-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: backendHealthy ? '#34d399' : '#f87171' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: backendHealthy ? '#10b981' : '#ef4444', display: 'inline-block', flexShrink: 0 }}></span>
          <span className="health-text">
            {backendHealthy ? (lang === 'tr' ? 'API Aktif' : 'API Online') : (lang === 'tr' ? 'Bağlanıyor' : 'Offline')}
          </span>
        </div>

        {/* Setup Wizard Button */}
        <button className="btn btn-secondary nav-action-btn" onClick={onOpenWizard} title={lang === 'tr' ? 'Kurulum ve Metodoloji Sihirbazı' : 'Setup & Methodology Wizard'}>
          <HelpCircle size={15} />
          <span className="btn-label">{lang === 'tr' ? 'Rehber' : 'Guide'}</span>
        </button>

        {/* Language switch */}
        <button className="btn btn-secondary nav-action-btn" onClick={onToggleLang} style={{ minWidth: '60px' }}>
          <Globe size={15} />
          <span>{lang === 'tr' ? 'EN' : 'TR'}</span>
        </button>
      </div>
    </header>
  );
};
