import React, { memo } from 'react';
import { 
  Menu,
  LayoutGrid,
  Trophy,
  Gamepad2,
  Lightbulb
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
        <LayoutGrid 
          size={20} 
          strokeWidth={1.85} 
          color={isActive ? '#38bdf8' : '#8ea2be'} 
        />
      )
    },
    { 
      id: 'top10', 
      label: 'Top 10', 
      icon: (isActive: boolean) => (
        <Trophy 
          size={20} 
          strokeWidth={1.85} 
          color={isActive ? '#38bdf8' : '#8ea2be'} 
        />
      )
    },
    { 
      id: 'game_detail', 
      label: lang === 'tr' ? 'Oyunlar' : 'Games', 
      icon: (isActive: boolean) => (
        <Gamepad2 
          size={20} 
          strokeWidth={1.85} 
          color={isActive ? '#38bdf8' : '#8ea2be'} 
        />
      )
    },
    { 
      id: 'recommendations', 
      label: lang === 'tr' ? 'Öneriler' : 'Advice', 
      icon: (isActive: boolean) => (
        <Lightbulb 
          size={20} 
          strokeWidth={1.85} 
          color={isActive ? '#38bdf8' : '#8ea2be'} 
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
        <Menu size={20} strokeWidth={1.85} color="#8ea2be" />
        <span>{lang === 'tr' ? 'Menü' : 'Menu'}</span>
      </button>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
