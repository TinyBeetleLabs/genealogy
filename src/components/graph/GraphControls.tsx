"use client";

import { useReactFlow } from "reactflow";

export default function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    /* Larger tap targets (44px) on mobile — positioned above bottom nav on small screens */
    <div className="absolute bottom-16 md:bottom-6 right-4 md:right-6 z-10 flex flex-col gap-2">
      {[
        { label: "Zoom in",  action: () => zoomIn({ duration: 200 }), content: <span className="text-lg font-light leading-none" aria-hidden="true">+</span> },
        { label: "Zoom out", action: () => zoomOut({ duration: 200 }), content: <span className="text-lg font-light leading-none" aria-hidden="true">−</span> },
        {
          label: "Fit view", action: () => fitView({ duration: 400, padding: 0.1 }),
          content: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          ),
        },
      ].map(btn => (
        <button
          key={btn.label}
          onClick={btn.action}
          aria-label={btn.label}
          className="rounded-lg flex items-center justify-center transition-colors shadow-lg"
          style={{
            width: 44,
            height: 44,
            background: "var(--bg-panel)",
            border: "1px solid var(--border-dim)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "var(--gold-bright)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-glow)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-dim)";
          }}
        >
          {btn.content}
        </button>
      ))}
    </div>
  );
}
