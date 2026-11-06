import React, { memo } from 'react';
import { 
  LayoutGrid, 
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
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header Section matching screenshot */}
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-sky-500/25 flex-shrink-0">
              <Gamepad2 size={22} strokeWidth={2} className="text-white drop-shadow-sm" />
            </div>
            <div className="overflow-hidden">
              <div className="brand-title">Game Analyst</div>
              <div className="brand-sub">NEXT FEST INTELLIGENCE</div>
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

        {/* Navigation List */}
        <ul className="nav-list" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item.id);
                  }
                }}
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2 : 1.85} 
                  className={isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be]'}
                />
                <span className="truncate">{item.label}</span>
              </li>
            );
          })}
        </ul>

        {/* Footer info matching dark theme */}
        <div className="sidebar-footer">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">v1.2.0 Live</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Next Fest</span>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
