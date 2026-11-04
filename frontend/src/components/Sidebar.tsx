import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  ChevronRight
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

  const handleSetOpen = (nextVal: React.SetStateAction<boolean>) => {
    const resolved = typeof nextVal === 'function' ? nextVal(open) : nextVal;
    setOpen(resolved);
    if (!resolved && onCloseMobile) {
      onCloseMobile();
    }
  };

  // 3D Glassmorphic Icons sliced from user's custom design sheet
  const navItems = [
    { 
      id: 'overview', 
      label: t.nav.overview, 
      description: lang === 'tr' ? 'Genel görünüm & metrikler' : 'Festival summary & metrics',
      iconImg: '/icons/overview.png'
    },
    { 
      id: 'top10', 
      label: t.nav.top10, 
      description: lang === 'tr' ? 'Zirvedeki demolar sıralaması' : 'Top demo leaderboard',
      iconImg: '/icons/top10.png',
      badge: <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 font-bold">10</span> 
    },
    { 
      id: 'game_detail', 
      label: t.nav.game_detail, 
      description: lang === 'tr' ? 'Derin inceleme & duygu analizi' : 'Deep review & sentiment inspection',
      iconImg: '/icons/game_detail.png' 
    },
    { 
      id: 'industry', 
      label: t.nav.industry, 
      description: lang === 'tr' ? 'Sektörel trendler & hype nabzı' : 'Genre trends & player buzz',
      iconImg: '/icons/industry.png' 
    },
    { 
      id: 'charts', 
      label: t.nav.charts, 
      description: lang === 'tr' ? 'Görselleştirme & telemetri' : 'Distributions & telemetry',
      iconImg: '/icons/charts.png' 
    },
    { 
      id: 'recommendations', 
      label: t.nav.recommendations, 
      description: lang === 'tr' ? 'AI destekli geliştirici önerileri' : 'Actionable developer recommendations',
      iconImg: '/icons/recommendations.png',
      badge: <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30 font-bold">AI</span> 
    },
    { 
      id: 'data_mgmt', 
      label: t.nav.data_mgmt, 
      description: lang === 'tr' ? 'API kaynakları & veri hijyeni' : 'Data sources & hygiene',
      iconImg: '/icons/data_mgmt.png' 
    },
  ];

  return (
    <ModernSidebar open={open} setOpen={handleSetOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Section */}
          <div className="flex items-center gap-3 py-2 px-1 justify-center md:justify-start">
            <div className="size-10 rounded-xl bg-slate-900/80 border border-sky-500/25 flex items-center justify-center shadow-lg shadow-sky-500/15 flex-shrink-0 mx-auto md:mx-0 p-1">
              <img 
                src="/icons/logo.png" 
                alt="Game Analyst Logo" 
                className="size-8 object-contain drop-shadow-[0_2px_8px_rgba(56,189,248,0.4)]"
              />
            </div>
            <SidebarBrandText />
          </div>

          {/* Navigation Links */}
          <div className="mt-5 flex flex-col gap-1.5 w-full">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    description: item.description,
                    icon: (
                      <img 
                        src={item.iconImg} 
                        alt={item.label} 
                        className={`size-7 object-contain transition-transform duration-200 group-hover/link:scale-110 ${
                          isActive 
                            ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] brightness-110' 
                            : 'opacity-85 hover:opacity-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]'
                        }`}
                      />
                    ),
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

        {/* Sidebar Footer with collapse/expand toggle */}
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
        <span className="size-1.5 rounded-full bg-sky-400 animate-ping" />
      </div>
      <div className="text-[10px] font-semibold text-sky-400/80 uppercase tracking-wider">
        Next Fest Intel
      </div>
    </motion.div>
  );
};

const SidebarFooterInfo = ({ lang }: { lang: 'tr' | 'en' }) => {
  const { open, toggleSidebar } = useSidebar();
  return (
    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0" />
        <motion.span
          animate={{
            display: open ? "inline-block" : "none",
            opacity: open ? 1 : 0,
          }}
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
};
