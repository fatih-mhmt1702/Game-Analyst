import React, { memo } from 'react';
import { 
  Gamepad2,
  LayoutGrid, 
  Trophy, 
  TrendingUp, 
  BarChart3, 
  Lightbulb, 
  Database,
  X
} from 'lucide-react';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: 'tr' | 'en';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = memo(({ 
  currentTab, 
  onSelectTab, 
  lang,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const t = lang === 'tr' ? tr : en;

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: LayoutGrid },
    { id: 'top10', label: t.nav.top10, icon: Trophy },
    { id: 'game_detail', label: t.nav.game_detail, icon: Gamepad2 },
    { id: 'industry', label: t.nav.industry, icon: TrendingUp },
    { id: 'charts', label: t.nav.charts, icon: BarChart3 },
    { id: 'recommendations', label: t.nav.recommendations, icon: Lightbulb },
    { id: 'data_mgmt', label: t.nav.data_mgmt, icon: Database },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Sol üst: Game Analyst / NEXT FEST INTELLIGENCE */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Gamepad2 size={24} strokeWidth={1.8} color="#ffffff" />
          </div>
          <h1 className="brand-title">Game Analyst</h1>
          <div className="brand-sub">NEXT FEST INTELLIGENCE</div>

          {onCloseMobile && (
            <button 
              type="button"
              className="mobile-close-btn" 
              onClick={onCloseMobile}
              aria-label="Menüyü Kapat"
              style={{ position: 'absolute', right: '1rem', top: '1.25rem' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigasyon Menüsü: Yatay (flex-row), solda sade outline SVG ikon, sağda tek satır başlık */}
        <ul className="nav-list" role="navigation" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon">
                    <Icon 
                      size={20} 
                      strokeWidth={1.8} 
                      color={isActive ? '#00d2ff' : 'currentColor'} 
                    />
                  </span>
                  <span className="nav-item-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* En alt: Sürüm bilgileri ("v1.2.0 Live", "Next Fest") */}
        <div className="sidebar-footer">
          <span>v1.2.0 Live</span>
          <span>Next Fest</span>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
