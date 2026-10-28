import React from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Gamepad2, 
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

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  lang,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const t = lang === 'tr' ? tr : en;

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
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
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gamepad2 size={20} color="#fff" />
            </div>
            <div>
              <div className="brand-title">Game Analyst</div>
              <div className="brand-sub">Next Fest Intelligence</div>
            </div>
          </div>

          {/* Close button visible only on mobile */}
          {onCloseMobile && (
            <button 
              className="mobile-close-btn" 
              onClick={onCloseMobile}
              aria-label="Menüyü Kapat"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.74rem', color: '#64748b' }}>
          <div style={{ color: '#38bdf8', fontWeight: 600 }}>v1.0.0 Web & Mobile App</div>
          <div>Steam Next Fest Analytics</div>
        </div>
      </aside>
    </>
  );
};
