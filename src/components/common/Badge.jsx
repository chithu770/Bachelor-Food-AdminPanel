import React from "react";

export default function Badge({ value, color = "bg-slate-100 text-slate-700", className = "" }) {
  if (value === undefined || value === null || value === 0) {
    return null;
  }

  const displayValue = value > 99 ? "99+" : String(value);

  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "min-w-[1.25rem] rounded-full px-1.5 py-0.5",
        "text-xs font-bold leading-none",
        color,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {displayValue}
    </span>
  );
}