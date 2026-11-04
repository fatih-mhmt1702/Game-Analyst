import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

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
    <motion.div
      className={cn(
        "h-full py-4 hidden md:flex md:flex-col bg-[rgba(9,15,29,0.95)] backdrop-blur-2xl border-r border-[rgba(56,189,248,0.12)] flex-shrink-0 z-30 transition-all duration-300 relative select-none",
        open ? "px-3 w-[260px]" : "px-2.5 w-[68px]",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "68px") : "260px",
      }}
      transition={{
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[990] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "fixed h-full w-[85vw] max-w-[300px] inset-y-0 left-0 bg-[rgba(9,15,29,0.98)] backdrop-blur-2xl p-5 z-[1000] flex flex-col justify-between border-r border-[rgba(56,189,248,0.2)] shadow-2xl shadow-black md:hidden",
              className
            )}
            {...props}
          >
            <div
              className="absolute right-4 top-4 z-50 text-slate-400 hover:text-white cursor-pointer p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Menüyü Kapat"
            >
              <X className="size-5" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate, setOpen } = useSidebar();

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
    <div className="relative group/tooltip flex justify-center w-full">
      <button
        type="button"
        onClick={handleClick}
        title={!open ? link.label : undefined}
        className={cn(
          "h-12 w-full rounded-xl transition-all duration-150 outline-none relative overflow-hidden flex items-center cursor-pointer select-none group/link",
          open 
            ? "px-2.5 justify-start gap-2.5" 
            : "px-1.5 justify-center",
          link.isActive
            ? (open
                ? "bg-gradient-to-r from-sky-500/18 via-sky-500/8 to-transparent text-white font-bold border-l-2 border-sky-400 shadow-[inset_0_0_12px_rgba(56,189,248,0.12)]"
                : "bg-sky-500/20 text-sky-400 font-bold border border-sky-400/40 shadow-[0_0_14px_rgba(56,189,248,0.25)]")
            : "text-slate-400 hover:text-white hover:bg-slate-800/50 active:scale-95",
          className
        )}
        {...props}
      >
        <div className="size-8 flex items-center justify-center flex-shrink-0">
          {link.icon}
        </div>
        
        {/* Expanded text & description */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col min-w-0 flex-1 text-left overflow-hidden ml-1"
            >
              <span className="text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis font-semibold text-slate-100">
                {link.label}
              </span>
              {link.description && (
                <span className="text-[11px] text-slate-400 font-normal whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  {link.description}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Expanded badge */}
        {link.badge && open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto flex-shrink-0"
          >
            {link.badge}
          </motion.div>
        )}
      </button>

      {/* Floating tooltip when collapsed on desktop */}
      {!open && (
        <div className="hidden md:group-hover/tooltip:flex pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] items-center">
          <div className="bg-slate-900/95 text-slate-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700/80 shadow-2xl whitespace-nowrap backdrop-blur-md flex items-center gap-1.5">
            <span>{link.label}</span>
            {link.badge}
          </div>
        </div>
      )}
    </div>
  );
};
