import React, { useState, useMemo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { useBadgeCounts } from "../../hooks/useBadgeCounts";
import { useAddonMenus } from "../../hooks/useAddonMenus";
import { MENU_ITEMS, filterMenu } from "../../config/menuConfig";
import { ROUTES } from "../../routes";
import { ADMIN_UID } from "../../utils/constants";

import SidebarBrand from "./SidebarBrand";
import SearchInput from "../common/SearchInput";
import SidebarMenuItem from "./SidebarMenuItem";
import SidebarMenuSection from "./SidebarMenuSection";

function resolveBadge(item, counts) {
  if (!counts || !item.badge) return item;
  if (typeof item.badge.value === "number") return item;
  const map = {
    subscriptionOrders: counts.subscriptionOrders,
    "dispatch-search": counts.dispatchSearching,
    "dispatch-ongoing": counts.dispatchOngoing,
    refundRequests: counts.refundRequests,
    restaurantPending: counts.restaurantPending,
    deliverymanPending: counts.deliverymanPending,
    contactMessages: counts.contactMessages,
    offlinePaymentPending: counts.offlinePaymentPending,
    ordersPending: counts.ordersPending,
  };
  const key = item.badge?.key || item.badgeKey;
  const val = map[key];
  if (typeof val === "number") return { ...item, badge: { ...item.badge, value: val } };
  return item;
}

function applyBadges(items, counts) {
  return items.map((it) => {
    if (it.section) return it;
    let next = resolveBadge(it, counts);
    if (next.children) next = { ...next, children: applyBadges(next.children, counts) };
    return next;
  });
}

function filterByQuery(items, q) {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items
    .map((it) => {
      if (it.section) {
        const children = it.children?.filter((c) => {
          if (c.label?.toLowerCase().includes(lower)) return true;
          if (c.children) return c.children.some((cc) => cc.label?.toLowerCase().includes(lower));
          return false;
        });
        return children?.length ? { ...it, children } : null;
      }
      if (it.label?.toLowerCase().includes(lower)) return it;
      if (it.children) {
        const children = it.children.filter((c) => {
          if (c.label?.toLowerCase().includes(lower)) return true;
          return c.children?.some((cc) => cc.label?.toLowerCase().includes(lower));
        });
        return children.length ? { ...it, children } : null;
      }
      return null;
    })
    .filter(Boolean);
}

export default function Sidebar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { counts } = useBadgeCounts();
  const { menus: addonMenus, isLoading: addonLoading } = useAddonMenus();

  const [search, setSearch] = useState("");

  const restrictedMenu = useMemo(
    () => {
      const userRole = user?.role || (user?.uid === ADMIN_UID ? "super_admin" : "staff");
      return filterMenu(MENU_ITEMS, userRole, user?.permissions || []);
    },
    [user]
  );

  const menu = useMemo(() => {
    const bag = applyBadges(restrictedMenu, counts);
    const combined = addonMenus?.length ? [...bag, ...addonMenus] : bag;
    return filterByQuery(combined, search.trim());
  }, [search, counts, restrictedMenu, addonMenus]);

  return (
    <div className="flex h-full w-64 flex-col bg-transparent">
      <SidebarBrand
        collapsed={collapsed || false}
        dark={dark}
        onToggleTheme={toggleTheme}
        onToggleCollapse={onToggleCollapse}
        onOpenMobile={onOpenMobile}
      />
      <div className="px-2 py-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={(v) => setSearch(v)}
          placeholder="Filter menu…"
        />
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 sidebar-scrollbar">
        {!collapsed && (
          <>
            <NavLink
              to={ROUTES.dashboard}
              end
              className={({ isActive }) =>
                ["sidebar-link", isActive ? "sidebar-link-active" : ""].filter(Boolean).join(" ")
              }
            >
              <DashboardIcon />
              <span className="truncate text-sm">Dashboard</span>
            </NavLink>
            <SidebarDivider />
          </>
        )}
        <SidebarBody items={menu} collapsed={collapsed} onNavigate={onOpenMobile} />
        {addonLoading && !collapsed && (
          <p className="px-3 py-2 text-xs text-slate-400">Loading addons…</p>
        )}
      </nav>
      <SidebarFooter user={user} collapsed={collapsed} onLogout={() => { logout(); navigate(ROUTES.login, { replace: true }); }} />
    </div>
  );
}

function DashboardIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    </span>
  );
}

function SidebarBody({ items, collapsed, onNavigate }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.section) {
          if (collapsed) return <div key={i} className="h-6 px-2" aria-hidden="true" />;
          return (
            <div key={i} className="sidebar-section-label">
              {item.section}
            </div>
          );
        }
        const k = `${item.to || item.label}-${i}`;
        if (item.children?.length) {
          return <SidebarMenuSection key={k} item={item} collapsed={collapsed} onNavigate={onNavigate} />;
        }
        return <SidebarMenuItem key={k} item={item} onNavigate={onNavigate} />;
      })}
    </>
  );
}

function SidebarFooter({ user, collapsed, onLogout }) {
  if (!user) return null;
  return (
    <div className="border-t border-slate-200 dark:border-slate-700/60 p-3 space-y-3">
      {!collapsed && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-200">
            {user.displayName || user.email}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {user.email}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        className="sidebar-footer-btn"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );
}

function SidebarDivider() {
  return <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />;
}
