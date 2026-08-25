"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type LayoutNavContextValue = {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
};

const LayoutNavContext = createContext<LayoutNavContextValue | null>(null);

export function LayoutNavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen((value) => !value), []);
  const value = useMemo(() => ({ menuOpen, setMenuOpen, toggleMenu }), [menuOpen, toggleMenu]);

  return <LayoutNavContext.Provider value={value}>{children}</LayoutNavContext.Provider>;
}

export function useLayoutNav() {
  const context = useContext(LayoutNavContext);
  if (!context) {
    throw new Error("useLayoutNav must be used within LayoutNavProvider");
  }
  return context;
}
