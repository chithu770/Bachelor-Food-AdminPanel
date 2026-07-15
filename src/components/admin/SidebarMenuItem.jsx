import React from "react";
import { NavLink } from "react-router-dom";

export default function SidebarMenuItem({ item, depth = 0, onNavigate }) {
  const Icon = item.icon;

  const className = ({ isActive }) =>
    [
      "sidebar-link",
      isActive ? "sidebar-link-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={className}
      style={depth > 0 ? { paddingLeft: "2rem" } : undefined}
      onClick={onNavigate}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span className="flex-1 truncate text-sm">{item.label}</span>
      {item.badge && !item.badge.hideZero && (item.badge.value > 0 || item.badge.value === undefined) && (
        <Badge item={item} />
      )}
      {item.badge && item.badge.hideZero && item.badge.value === 0 && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500">0</span>
      )}
      {item.badge && item.badge.value > 0 && <Badge item={item} />}
    </NavLink>
  );
}

function Badge({ item }) {
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
      {item.badge.value}
    </span>
  );
}
