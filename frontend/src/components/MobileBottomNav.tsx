import React, { memo } from 'react';
import { 
  Menu,
  Grid2X2,
  Trophy,
  Crosshair,
  Sparkles
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu: () => void;
  lang: 'tr' | 'en';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = memo(({
  currentTab,
  onSelectTab,
  onOpenMenu,
  lang,
}) => {
  const items = [
    { 
      id: 'overview', 
      label: lang === 'tr' ? 'Özet' : 'Overview', 
      icon: (isActive: boolean) => (
        <Grid2X2 
          size={20} 
          strokeWidth={1.8} 
          className={isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : 'text-slate-400'} 
        />
      )
    },
    { 
      id: 'top10', 
      label: 'Top 10', 
      icon: (isActive: boolean) => (
        <Trophy 
          size={20} 
          strokeWidth={1.8} 
          className={isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : 'text-slate-400'} 
        />
      )
    },
    { 
      id: 'game_detail', 
      label: lang === 'tr' ? 'Oyunlar' : 'Games', 
      icon: (isActive: boolean) => (
        <Crosshair 
          size={20} 
          strokeWidth={1.8} 
          className={isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : 'text-slate-400'} 
        />
      )
    },
    { 
      id: 'recommendations', 
      label: lang === 'tr' ? 'Öneriler' : 'Advice', 
      icon: (isActive: boolean) => (
        <Sparkles 
          size={20} 
          strokeWidth={1.8} 
          className={isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : 'text-slate-400'} 
        />
      )
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil Gezinme">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            type="button"
          >
            {item.icon(isActive)}
            <span>{item.label}</span>
          </button>
        );
      })}

      <button
        className="mobile-nav-btn"
        onClick={onOpenMenu}
        type="button"
        title={lang === 'tr' ? 'Daha Fazla Menü' : 'More Menu'}
      >
        <Menu size={20} strokeWidth={1.8} className="text-slate-400" />
        <span>{lang === 'tr' ? 'Menü' : 'Menu'}</span>
      </button>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
