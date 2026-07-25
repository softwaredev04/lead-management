"use client";

import { useEffect, useState, useRef } from "react";
import { Search, ChevronsUpDown, Check } from "lucide-react";

export function Combobox({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm text-left transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 text-muted-foreground/50" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-lg border border-border bg-card p-1 shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-8 w-full rounded-md border-0 bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-1 max-h-48 overflow-y-auto space-y-0.5">
            <button
              onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
              className={`flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                !value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              All {label}
            </button>
            {filtered.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
                  value === o.value ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
              >
                {o.label}
                {value === o.value && <Check className="size-3.5" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No results.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
