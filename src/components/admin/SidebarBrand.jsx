import React from "react";
import { LayoutDashboard, Sun, Moon, PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";

export default function SidebarBrand({ collapsed, dark, onToggleTheme, onToggleCollapse, onOpenMobile }) {
  return (
    <div className="sidebar-header">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobile && !collapsed && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="sidebar-icon-btn lg:hidden mr-1"
            title="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {!collapsed ? (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember text-white shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Admin Panel
              </p>
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                Bachelor Foods
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember text-white mx-auto">
            <LayoutDashboard className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="sidebar-icon-btn"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="sidebar-icon-btn hidden lg:inline-flex"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
