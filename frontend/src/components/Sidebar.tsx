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
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar bg-[#080d1a] border-r border-[#131b2e] w-[250px] flex flex-col h-screen flex-shrink-0 z-20 ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Header section matching exact photo */}
        <div className="p-6 pb-6 border-b border-[#131b2e]/60 relative flex-shrink-0">
          <Gamepad2 className="text-white size-[24px] mb-2.5" strokeWidth={1.8} />
          <h1 className="text-[#38bdf8] font-bold text-[20px] leading-snug tracking-tight">
            Game Analyst
          </h1>
          <p className="text-[#64748b] text-[10px] font-semibold tracking-wider uppercase mt-1">
            NEXT FEST INTELLIGENCE
          </p>

          {/* Close button visible only on mobile */}
          {onCloseMobile && (
            <button 
              className="mobile-close-btn absolute right-4 top-5 text-slate-400 hover:text-white p-1" 
              onClick={onCloseMobile}
              aria-label="Menüyü Kapat"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List matching exact photo */}
        <nav className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 h-[48px] rounded-xl text-left transition-all duration-150 cursor-pointer outline-none select-none ${
                  isActive
                    ? 'bg-[#0e1c3a] border border-[#0099ff]/35 border-l-[3.5px] border-l-[#00d2ff] text-[#00d2ff] font-semibold shadow-[0_0_15px_rgba(0,180,255,0.12)]'
                    : 'text-[#8ea0b8] hover:text-white hover:bg-white/[0.04] font-medium border border-transparent border-l-[3.5px] border-l-transparent'
                }`}
              >
                {/* Fixed 22px icon slot to prevent resizing or jumping */}
                <div className="w-[22px] h-[22px] flex items-center justify-center flex-shrink-0">
                  <Icon 
                    size={22} 
                    strokeWidth={1.8} 
                    className={`transition-colors ${
                      isActive ? 'text-[#00d2ff]' : 'text-[#8ea0b8]'
                    }`} 
                  />
                </div>
                <span className="text-[15px] leading-tight tracking-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer matching exact photo */}
        <div className="px-6 py-5 border-t border-[#131b2e]/60 flex items-center justify-between text-[#64748b] text-[12px] flex-shrink-0">
          <span>v1.2.0 Live</span>
          <span>Next Fest</span>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
