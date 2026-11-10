import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Trophy,
  Gamepad2,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Database
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

  // Exact vector SVG icons matching the reference photograph (fixed 22px, uniform strokeWidth 1.85)
  const navItems = useMemo(() => [
    { 
      id: 'overview', 
      label: t.nav.overview, 
      icon: (isActive: boolean) => (
        <LayoutGrid 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'top10', 
      label: t.nav.top10, 
      icon: (isActive: boolean) => (
        <Trophy 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'game_detail', 
      label: t.nav.game_detail, 
      icon: (isActive: boolean) => (
        <Gamepad2 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'industry', 
      label: t.nav.industry, 
      icon: (isActive: boolean) => (
        <TrendingUp 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'charts', 
      label: t.nav.charts, 
      icon: (isActive: boolean) => (
        <BarChart3 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'recommendations', 
      label: t.nav.recommendations, 
      icon: (isActive: boolean) => (
        <Lightbulb 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
    { 
      id: 'data_mgmt', 
      label: t.nav.data_mgmt, 
      icon: (isActive: boolean) => (
        <Database 
          size={22} 
          strokeWidth={1.85} 
          className={`flex-shrink-0 transition-all duration-[180ms] ${
            isActive ? 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'text-[#8ea2be] group-hover/link:text-white'
          }`}
        />
      )
    },
  ], [t]);

  const handleItemClick = useCallback((id: string) => {
    onSelectTab(id);
  }, [onSelectTab]);

  return (
    <ModernSidebar open={open} setOpen={handleSetOpen}>
      <SidebarBody className="justify-between gap-4">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Section (56–64px height) */}
          <div className="h-[60px] flex items-center gap-3 px-1.5 justify-center md:justify-start border-b border-[#14233e]/80 flex-shrink-0">
            <div className="size-[36px] rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-sky-500/25 flex-shrink-0">
              <Gamepad2 size={20} strokeWidth={2} className="text-white drop-shadow-sm" />
            </div>
            <SidebarBrandText />
          </div>

          {/* Navigation Items (16px spacing) */}
          <nav className="mt-[16px] flex flex-col gap-1 w-full" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    icon: item.icon(isActive),
                    isActive,
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
      <div className="font-extrabold text-[15px] text-[#7dd3fc] tracking-tight leading-snug drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]">
        Game Analyst
      </div>
      <div className="text-[10px] font-semibold text-slate-400 tracking-[0.08em] uppercase leading-tight">
        NEXT FEST INTELLIGENCE
      </div>
    </motion.div>
  );
});

SidebarBrandText.displayName = "SidebarBrandText";

const SidebarFooterInfo = memo(({ lang }: { lang: 'tr' | 'en' }) => {
  const { open, toggleSidebar } = useSidebar();
  return (
    <div className="pt-3 border-t border-[#14233e]/80 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
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
          v1.2.0 Live
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
