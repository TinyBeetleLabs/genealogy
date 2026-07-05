"use client";

import { useState } from "react";
import ScriptureTrustDialog from "@/components/layout/ScriptureTrustDialog";

type View = "graph" | "timeline" | "map" | "people";

const NAV_ITEMS: {
  id: string;
  label: string;
  view: View;
  icon: React.ReactNode;
}[] = [
  {
    id: "atlas",
    label: "Family Tree",
    view: "graph",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="19" r="2.5" />
        <circle cx="19" cy="19" r="2.5" />
        <path d="M12 7.5v5L5 17M12 12.5L19 17" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "people",
    label: "People",
    view: "people",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <circle cx="8" cy="7" r="3" />
        <circle cx="16" cy="7" r="3" />
        <path d="M2 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" strokeLinecap="round" />
        <path d="M19 11c1.7.5 3 2 3 4v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    view: "timeline",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <path d="M3 12h18M8 8l-5 4 5 4M16 8l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "places",
    label: "Map",
    view: "map",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8" strokeLinecap="round" />
        <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
  className?: string;
}

export default function Sidebar({ view, onViewChange, className }: SidebarProps) {
  const [trustOpen, setTrustOpen] = useState(false);

  return (
    <>
    <aside
      aria-label="Main navigation"
      className={`shrink-0 flex flex-col items-center py-5 gap-1 z-20 ${className ?? ""}`}
      style={{
        width: 56,
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border-dim)",
      }}
    >
      <nav className="flex flex-col items-center gap-1 w-full">
        {NAV_ITEMS.map((item) => {
          const isActive = (
            item.id === "atlas"    ? view === "graph"    :
            item.id === "people"   ? view === "people"   :
            item.id === "timeline" ? view === "timeline" :
            item.id === "places"   ? view === "map"      :
            false
          );

          return (
            <button
              key={item.id}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onViewChange(item.view)}
              className="relative flex flex-col items-center justify-center rounded-lg transition-all duration-150 group"
              style={{
                width: 44,
                height: 44,
                color: isActive ? "var(--gold)" : "var(--text-muted)",
                background: isActive ? "rgba(200,148,42,0.1)" : "transparent",
              }}
            >
              {item.icon}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
                  style={{ height: 20, background: "var(--gold)" }}
                />
              )}
              {/* Tooltip — shown on hover AND focus */}
              <span
                className="absolute left-12 bg-stone-900 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none whitespace-nowrap transition-opacity"
                style={{ color: "var(--text-primary)", border: "1px solid var(--border-dim)", zIndex: 50 }}
                aria-hidden="true"
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Scripture trust — opens sourcing guide */}
      <button
        type="button"
        onClick={() => setTrustOpen(true)}
        title="How we source from scripture"
        aria-label="How we source from scripture"
        className="flex flex-col items-center justify-center rounded-lg transition-colors hover:text-[--gold] hover:bg-[rgba(200,148,42,0.08)]"
        style={{ width: 44, height: 44, color: "var(--text-muted)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" strokeLinejoin="round" />
        </svg>
      </button>
    </aside>

    <ScriptureTrustDialog open={trustOpen} onClose={() => setTrustOpen(false)} />
    </>
  );
}
