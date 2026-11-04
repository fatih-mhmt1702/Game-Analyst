import React from 'react';
import { Menu } from 'lucide-react';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu: () => void;
  lang: 'tr' | 'en';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  lang,
}) => {
  const items = [
    { id: 'overview', label: lang === 'tr' ? 'Özet' : 'Overview', iconImg: '/icons/overview.png' },
    { id: 'top10', label: 'Top 10', iconImg: '/icons/top10.png' },
    { id: 'game_detail', label: lang === 'tr' ? 'Oyunlar' : 'Games', iconImg: '/icons/game_detail.png' },
    { id: 'recommendations', label: lang === 'tr' ? 'Öneriler' : 'Advice', iconImg: '/icons/recommendations.png' },
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
            <img 
              src={item.iconImg} 
              alt={item.label} 
              className={`size-[19px] object-contain transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : 'opacity-75'}`} 
            />
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
        <Menu size={20} />
        <span>{lang === 'tr' ? 'Menü' : 'Menu'}</span>
      </button>
    </nav>
  );
};
