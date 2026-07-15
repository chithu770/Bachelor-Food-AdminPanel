import { useState, useCallback, useEffect, useRef } from "react";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";
const SIDEBAR_DEFAULT_WIDTH = "18rem";
const SIDEBAR_COLLAPSED_WIDTH = "5rem";

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "false");
    } catch {}
  }, []);

  return {
    collapsed,
    setCollapsed,
    toggle,
    expand,
    expandedWidth: SIDEBAR_DEFAULT_WIDTH,
    collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
  };
}