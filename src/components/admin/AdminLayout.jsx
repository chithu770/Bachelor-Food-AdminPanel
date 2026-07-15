import React, { useState, useCallback } from "react";
import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSidebar } from "../../hooks/useSidebar";
import { useTheme } from "../../contexts/ThemeContext";
import { X } from "lucide-react";

export default function AdminLayout() {
  const { collapsed, toggle, expand } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100 bg-transparent">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:h-screen lg:w-auto lg:shrink-0 lg:flex-col lg:sticky lg:top-0 border-r border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggle}
          onOpenMobile={openMobile}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="sidebar-drawer-backdrop"
            onClick={closeMobile}
          />
          <div className="sidebar-drawer-panel">
            <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                className="sidebar-icon-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar
              collapsed={false}
              onToggleCollapse={closeMobile}
              onOpenMobile={openMobile}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex lg:hidden items-center gap-3 border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl px-4 py-3 sticky top-0 z-20 shadow-sm">
          <button
            type="button"
            onClick={openMobile}
            className="sidebar-icon-btn"
            title="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Bachelor Foods</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
