"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRINCIPLES = [
  {
    title: "Every person is named in scripture",
    body: "Each figure includes at least one verse proving they are mentioned in the biblical text.",
  },
  {
    title: "Every connection is cited",
    body: "Parent–child and spouse links include references for that specific relationship — not just that both people exist.",
  },
  {
    title: "Omit rather than guess",
    body: "If a detail isn't clearly supported, we leave it out. Descriptions stay short and verifiable.",
  },
  {
    title: "Portraits are labeled honestly",
    body: "Artistic depictions are marked as interpretation. Where scripture describes appearance, that reference is shown instead.",
  },
];

export default function ScriptureTrustDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scripture-trust-title"
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-dim)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <div>
            <p
              id="scripture-trust-title"
              style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700, color: "var(--gold)" }}
            >
              Scripture-Grounded Atlas
            </p>
            <p className="mt-1" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              How this genealogy is built and verified
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, color: "var(--text-muted)" }}
          >
            <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {PRINCIPLES.map(item => (
            <div key={item.title}>
              <p style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 10, letterSpacing: "0.08em", color: "var(--gold-dim)", textTransform: "uppercase" }}>
                {item.title}
              </p>
              <p className="mt-1" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>
                {item.body}
              </p>
            </div>
          ))}

          <p className="pt-2" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
            Open any person to see their scripture references. Gold nodes trace the Messianic line; every edge in the graph can be checked against the cited verses.
          </p>
        </div>

        <div className="px-5 py-3 flex justify-end" style={{ borderTop: "1px solid var(--border-dim)" }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--gold)",
              border: "1px solid var(--border-dim)",
            }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
