import React, { useState, createContext, useContext, memo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Links {
  label: string;
  description?: string;
  href?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  const toggleSidebar = useCallback(() => {
    setOpen((prev) => !prev);
  }, [setOpen]);

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) => {
  return (
    <>
      <DesktopSidebar {...props}>{children}</DesktopSidebar>
      <MobileSidebar {...props}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.aside
      className={cn(
        "h-full py-3.5 hidden md:flex md:flex-col bg-gradient-to-b from-[#060c1c]/98 via-[#050a17]/98 to-[#040712]/99 backdrop-blur-2xl border-r border-[#152542] flex-shrink-0 z-30 relative select-none shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
        open ? "px-3 w-[240px]" : "px-3 w-[72px]",
        className
      )}
      animate={{
        width: animate ? (open ? "240px" : "72px") : "240px",
      }}
      transition={{
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & { children?: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[990] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "fixed h-full w-[85vw] max-w-[280px] inset-y-0 left-0 bg-gradient-to-b from-[#070e20] via-[#050a17] to-[#040712] backdrop-blur-2xl p-4 z-[1000] flex flex-col justify-between border-r border-[#1c3055] shadow-2xl shadow-black md:hidden",
              className
            )}
            {...props}
          >
            <button
              type="button"
              className="absolute right-3.5 top-3.5 z-50 text-slate-400 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Menüyü Kapat"
            >
              <X className="size-5" />
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const SidebarLink = memo(({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, setOpen } = useSidebar();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (link.onClick) {
      link.onClick();
    }
    // On mobile view close the drawer
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <div className="relative group/tooltip flex justify-center w-full my-0.5">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "h-[46px] w-full rounded-xl transition-all duration-[160ms] outline-none relative overflow-hidden flex items-center cursor-pointer select-none group/link",
          open 
            ? "px-3.5 justify-start gap-[12px]" 
            : "px-0 justify-center",
          link.isActive
            ? "border-l-[3.5px] border-l-[#38bdf8] border-t border-r border-b border-sky-500/20 bg-gradient-to-r from-[#0c2246]/95 via-[#0a1832]/85 to-[#081224]/75 text-[#38bdf8] font-semibold shadow-[0_0_16px_rgba(56,189,248,0.16),inset_0_0_12px_rgba(56,189,248,0.06)]"
            : "border-l-[3.5px] border-l-transparent border-t border-r border-b border-transparent text-[#8ea2be] hover:text-white hover:bg-[#0c1a32]/60 hover:border-l-sky-400/40 active:bg-[#0c1a32]/80",
          className
        )}
        {...props}
      >
        {/* Fixed 20px icon slot */}
        <div className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0 transition-colors duration-[160ms]">
          {link.icon}
        </div>
        
        {/* Expanded text */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.14 }}
              className="flex flex-col min-w-0 flex-1 text-left overflow-hidden"
            >
              <span className={cn(
                "text-[14px] leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis transition-colors",
                link.isActive ? "text-[#38bdf8] font-semibold" : "text-[#8ea2be] group-hover/link:text-white font-medium"
              )}>
                {link.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Expanded badge */}
        {link.badge && open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.14 }}
            className="ml-auto flex-shrink-0"
          >
            {link.badge}
          </motion.div>
        )}
      </button>

      {/* Floating tooltip when collapsed on desktop */}
      {!open && (
        <div className="hidden md:group-hover/tooltip:flex pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] items-center">
          <div className="bg-[#091326]/95 text-slate-100 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-sky-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap backdrop-blur-md flex items-center gap-2">
            <span className={link.isActive ? "text-[#38bdf8] font-semibold" : "text-slate-200"}>{link.label}</span>
            {link.badge}
          </div>
        </div>
      )}
    </div>
  );
});

SidebarLink.displayName = "SidebarLink";
