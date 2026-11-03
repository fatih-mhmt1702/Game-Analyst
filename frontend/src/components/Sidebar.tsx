import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  BarChart3, 
  Lightbulb, 
  Database,
  Sparkles
} from 'lucide-react';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { 
  Sidebar as ModernSidebar, 
  SidebarBody, 
  SidebarLink, 
  useSidebar 
} from '@/components/ui/sidebar';
import { motion } from 'framer-motion';

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isMobileOpen);
  }, [isMobileOpen]);

  // Sync mobile open prop with sidebar open state when provided
  const effectiveMobileOpen = isMobileOpen;
  const handleSetOpen = (nextVal: React.SetStateAction<boolean>) => {
    const resolved = typeof nextVal === 'function' ? nextVal(open) : nextVal;
    setOpen(resolved);
    if (!resolved && onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: LayoutDashboard },
    { id: 'top10', label: t.nav.top10, icon: Trophy, badge: <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-bold">10</span> },
    { id: 'game_detail', label: t.nav.game_detail, icon: Gamepad2 },
    { id: 'industry', label: t.nav.industry, icon: TrendingUp },
    { id: 'charts', label: t.nav.charts, icon: BarChart3 },
    { id: 'recommendations', label: t.nav.recommendations, icon: Lightbulb, badge: <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30 font-bold">AI</span> },
    { id: 'data_mgmt', label: t.nav.data_mgmt, icon: Database },
  ];

  return (
    <ModernSidebar open={open} setOpen={handleSetOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Section */}
          <div className="flex items-center gap-3 py-2 px-1">
            <div className="size-9 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 flex-shrink-0">
              <Gamepad2 className="size-5 text-white" />
            </div>
            <SidebarBrandText />
          </div>

          {/* Navigation Links */}
          <div className="mt-6 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    icon: <Icon className={`size-5 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover/sidebar:text-slate-200'}`} />,
                    isActive,
                    badge: item.badge,
                    onClick: () => {
                      onSelectTab(item.id);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <SidebarFooterInfo lang={lang} />
      </SidebarBody>
    </ModernSidebar>
  );
};

const SidebarBrandText = () => {
  const { open } = useSidebar();
  return (
    <motion.div
      animate={{
        display: open ? "block" : "none",
        opacity: open ? 1 : 0,
        x: open ? 0 : -8,
      }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden whitespace-nowrap min-w-0"
    >
      <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
        <span>Game Analyst</span>
        <Sparkles className="size-3 text-sky-400" />
      </div>
      <div className="text-[11px] font-semibold text-sky-400/80 uppercase tracking-wider">
        Next Fest Intel
      </div>
    </motion.div>
  );
};

const SidebarFooterInfo = ({ lang }: { lang: 'tr' | 'en' }) => {
  const { open } = useSidebar();
  return (
    <motion.div
      animate={{
        opacity: open ? 1 : 0.6,
      }}
      className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500"
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <motion.span
          animate={{
            display: open ? "inline-block" : "none",
            opacity: open ? 1 : 0,
          }}
          className="text-slate-400 font-medium whitespace-nowrap"
        >
          v1.2.0 Next Fest Live
        </motion.span>
      </div>
    </motion.div>
  );
};
