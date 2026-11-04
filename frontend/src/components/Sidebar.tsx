import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Trophy,
  Crosshair,
  Flame,
  BarChart2,
  Sparkles,
  Database,
  Gamepad2
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

export const Sidebar: React.FC<SidebarProps> = memo(({ 
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

  const handleSetOpen = useCallback((nextVal: React.SetStateAction<boolean>) => {
    setOpen((prev) => {
      const resolved = typeof nextVal === 'function' ? nextVal(prev) : nextVal;
      if (!resolved && onCloseMobile) {
        onCloseMobile();
      }
      return resolved;
    });
  }, [onCloseMobile]);

  // Vector SVG Icon Navigation Items (fixed 22px, uniform strokeWidth 1.8)
  const navItems = useMemo(() => [
    { 
      id: 'overview', 
      label: t.nav.overview, 
      description: lang === 'tr' ? 'Genel görünüm & metrikler' : 'Festival summary & metrics',
      icon: (isActive: boolean) => (
        <Grid2X2 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'top10', 
      label: t.nav.top10, 
      description: lang === 'tr' ? 'Zirvedeki demolar sıralaması' : 'Top demo leaderboard',
      badge: <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-bold">10</span>,
      icon: (isActive: boolean) => (
        <Trophy 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'game_detail', 
      label: t.nav.game_detail, 
      description: lang === 'tr' ? 'Derin inceleme & duygu analizi' : 'Deep review & sentiment inspection',
      icon: (isActive: boolean) => (
        <Crosshair 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'industry', 
      label: t.nav.industry, 
      description: lang === 'tr' ? 'Sektörel trendler & hype nabzı' : 'Genre trends & player buzz',
      icon: (isActive: boolean) => (
        <Flame 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'charts', 
      label: t.nav.charts, 
      description: lang === 'tr' ? 'Görselleştirme & telemetri' : 'Distributions & telemetry',
      icon: (isActive: boolean) => (
        <BarChart2 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'recommendations', 
      label: t.nav.recommendations, 
      description: lang === 'tr' ? 'AI destekli geliştirici önerileri' : 'Actionable developer recommendations',
      badge: <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30 font-bold">AI</span>,
      icon: (isActive: boolean) => (
        <Sparkles 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
    { 
      id: 'data_mgmt', 
      label: t.nav.data_mgmt, 
      description: lang === 'tr' ? 'API kaynakları & veri hijyeni' : 'Data sources & hygiene',
      icon: (isActive: boolean) => (
        <Database 
          size={22} 
          strokeWidth={1.8} 
          className={`flex-shrink-0 transition-colors duration-[180ms] ${
            isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 group-hover/link:text-slate-200'
          }`}
        />
      )
    },
  ], [lang, t]);

  const handleItemClick = useCallback((id: string) => {
    onSelectTab(id);
  }, [onSelectTab]);

  return (
    <ModernSidebar open={open} setOpen={handleSetOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Area: Strict 56–64px height (60px) */}
          <div className="h-[60px] flex items-center gap-3 px-1 justify-center md:justify-start border-b border-slate-800/60 flex-shrink-0">
            <div className="size-[34px] rounded-xl bg-slate-900/90 border border-sky-500/30 flex items-center justify-center shadow-md shadow-sky-500/15 flex-shrink-0">
              <Gamepad2 size={20} strokeWidth={1.8} className="text-sky-400" />
            </div>
            <SidebarBrandText />
          </div>

          {/* Navigation Group Spacing: 16px */}
          <nav className="mt-[16px] flex flex-col gap-1 w-full" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    description: item.description,
                    icon: item.icon(isActive),
                    isActive,
                    badge: item.badge,
                    onClick: () => handleItemClick(item.id)
                  }}
                />
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with collapse/expand toggle */}
        <SidebarFooterInfo lang={lang} />
      </SidebarBody>
    </ModernSidebar>
  );
});

Sidebar.displayName = "Sidebar";

const SidebarBrandText = memo(() => {
  const { open } = useSidebar();
  return (
    <motion.div
      animate={{
        display: open ? "block" : "none",
        opacity: open ? 1 : 0,
        x: open ? 0 : -6,
      }}
      transition={{ duration: 0.16 }}
      className="overflow-hidden whitespace-nowrap min-w-0"
    >
      <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
        <span>Game Analyst</span>
        <span className="size-1.5 rounded-full bg-sky-400 animate-ping" />
      </div>
      <div className="text-[10px] font-semibold text-sky-400/80 uppercase tracking-wider">
        Next Fest Intel
      </div>
    </motion.div>
  );
});

SidebarBrandText.displayName = "SidebarBrandText";

const SidebarFooterInfo = memo(({ lang }: { lang: 'tr' | 'en' }) => {
  const { open, toggleSidebar } = useSidebar();
  return (
    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0" />
        <motion.span
          animate={{
            display: open ? "inline-block" : "none",
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.14 }}
          className="text-slate-400 font-medium whitespace-nowrap text-[11px]"
        >
          v1.2.0 Next Fest Live
        </motion.span>
      </div>

      <button
        type="button"
        onClick={toggleSidebar}
        title={open 
          ? (lang === 'tr' ? 'Kenar Çubuğunu Daralt' : 'Collapse Sidebar') 
          : (lang === 'tr' ? 'Kenar Çubuğunu Genişlet' : 'Expand Sidebar')}
        className="hidden md:flex items-center justify-center size-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60 cursor-pointer ml-auto"
      >
        {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
    </div>
  );
});

SidebarFooterInfo.displayName = "SidebarFooterInfo";
