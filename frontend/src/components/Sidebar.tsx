import React from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  BarChart3, 
  Lightbulb, 
  Database 
} from 'lucide-react';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  lang: 'tr' | 'en';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, lang }) => {
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Gamepad2 size={20} color="#fff" />
        </div>
        <div>
          <div className="brand-title">NextFest Insight</div>
          <div className="brand-sub">Feedback Intelligence</div>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <li
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.74rem', color: '#64748b' }}>
        <div>v1.0.0 Desktop Windows</div>
        <div>Steam Next Fest Analytics</div>
      </div>
    </aside>
  );
};
