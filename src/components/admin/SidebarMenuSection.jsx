import React, { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import SidebarMenuItem from "./SidebarMenuItem";

export default function SidebarMenuSection({ item, depth = 0, collapsed, onNavigate }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const Icon = item.icon;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="sidebar-link justify-center"
        title={item.label}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="sidebar-link w-full"
      >
        {Icon && depth === 0 && <Icon className="h-5 w-5 shrink-0" />}
        <span className="flex-1 truncate text-sm">{item.label}</span>
        {item.badge && <Badge item={item} />}
        <span
          className={`ml-1 h-4 w-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      {open && (
        <div className="sidebar-dropdown-enter pl-2">
          {item.children?.map((child, i) => {
            const key = `${item.to || item.label}-child-${i}`;
            if (child.children?.length) {
              return (
                <SidebarMenuSection
                  key={key}
                  item={child}
                  depth={depth + 1}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              );
            }
            return (
              <SidebarMenuItem key={key} item={child} depth={depth + 1} onNavigate={onNavigate} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Badge({ item }) {
  const show = item.badge.value > 0 || !item.badge.hideZero;
  if (!show) return null;
  return (
    <span
      className={[
        "inline-flex min-w-[1.25rem] items-center justify-center",
        "rounded-full px-1.5 py-0.5 text-xs font-bold leading-none",
        item.badge.color,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {typeof item.badge.value === "number" ? item.badge.value.toLocaleString() : item.badge.value}
    </span>
  );
}

export { Badge };
