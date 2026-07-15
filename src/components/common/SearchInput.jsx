import React, { useRef, useEffect, useState } from "react";

export default function SearchInput({ value, onChange, onClear, placeholder = "Search menu…", debounceMs = 200 }) {
  const [showClear, setShowClear] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setShowClear(value.length > 0);
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    onChange(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onClear?.(next), debounceMs);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </span>
      <input
        type="text"
        className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-8 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-ember focus:ring-2 focus:ring-red-100"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {showClear && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-slate-400 hover:text-slate-700 transition"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}