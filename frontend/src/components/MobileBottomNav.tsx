import React from 'react';
import { LayoutDashboard, Trophy, Gamepad2, Lightbulb, Menu } from 'lucide-react';
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
  const t = lang === 'tr' ? tr : en;

  const items = [
    { id: 'overview', label: lang === 'tr' ? 'Özet' : 'Overview', icon: LayoutDashboard },
    { id: 'top10', label: 'Top 10', icon: Trophy },
    { id: 'game_detail', label: lang === 'tr' ? 'Oyunlar' : 'Games', icon: Gamepad2 },
    { id: 'recommendations', label: lang === 'tr' ? 'Öneriler' : 'Advice', icon: Lightbulb },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil Gezinme">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            type="button"
          >
            <Icon size={20} />
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
