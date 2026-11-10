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

      <aside className={`sidebar bg-[#080d1a] border-r border-[#131b2e] w-[260px] min-w-[260px] flex flex-col h-screen flex-shrink-0 z-20 select-none ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Sol üst: Game Analyst / NEXT FEST INTELLIGENCE */}
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

        {/* Navigasyon Listesi (Tek satır, dikeyde ortalanmış flex-row, solda outline ikon, sağda başlık) */}
        <nav className="flex-1 p-3.5 flex flex-col gap-2 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex flex-row items-center gap-3 px-3.5 h-[46px] rounded-xl text-left transition-all duration-150 cursor-pointer outline-none ${
                  isActive
                    ? 'bg-[#0e1c3a] border border-[#0099ff]/30 border-l-[3.5px] border-l-[#00d2ff] text-[#00d2ff] font-semibold shadow-[0_0_14px_rgba(0,180,255,0.12)]'
                    : 'text-[#8ea0b8] hover:text-white hover:bg-white/[0.04] font-medium border border-transparent border-l-[3.5px] border-l-transparent'
                }`}
              >
                {/* Sabit 22px outline SVG ikon */}
                <div className="w-[22px] h-[22px] flex items-center justify-center flex-shrink-0">
                  <Icon 
                    size={20} 
                    strokeWidth={1.8} 
                    className={`transition-colors ${
                      isActive ? 'text-[#00d2ff]' : 'text-[#8ea0b8]'
                    }`} 
                  />
                </div>
                {/* Tek satıra tam sığan menü başlığı */}
                <span className="text-[14.5px] leading-none tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* En altta sürüm bilgileri ("v1.2.0 Live", "Next Fest") */}
        <div className="px-6 py-4 border-t border-[#131b2e]/60 flex items-center justify-between text-[#64748b] text-[12px] flex-shrink-0">
          <span>v1.2.0 Live</span>
          <span>Next Fest</span>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
