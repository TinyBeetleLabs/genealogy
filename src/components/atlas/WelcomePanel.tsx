"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Person } from "@/types/person";
import { getPortrait } from "@/lib/data/portraitRefs";

interface Props {
  people: Person[];
  onSelect: (id: string) => void;
}

export default function WelcomePanel({ people, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return people
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.alternateNames?.some(n => n.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, people]);

  const handleSelect = (id: string) => {
    setQuery("");
    onSelect(id);
  };

  const adam = people.find(p => p.id === "adam");
  const adamPortrait = getPortrait("adam");

  return (
    <div className="flex flex-col h-full">
      {/* ── Hero ───────────────────────────────── */}
      <div className="shrink-0 relative overflow-hidden" style={{ height: 180 }}>
        {adamPortrait && (
          <Image src={adamPortrait.src} alt="Adam" fill className="object-cover object-top" sizes="320px" priority />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, var(--bg-panel) 100%)" }} />
        <div className="absolute bottom-4 left-5 right-5">
          <p className="italic" style={{ fontSize: 9, color: "rgba(240,184,64,0.6)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
            Artistic interpretation · No physical description in scripture
          </p>
        </div>
      </div>

      {/* ── Welcome text ───────────────────────── */}
      <div className="shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <h2 className="leading-tight mb-1" style={{ fontFamily: "var(--font-cinzel), Georgia, serif", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
          Where to Begin
        </h2>
        <p className="leading-relaxed" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Explore the biblical lineage from Adam to Jesus. Every person and connection is sourced directly from scripture.
        </p>
      </div>

      {/* ── Search ─────────────────────────────── */}
      <div className="shrink-0 px-5 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="relative">
          <label htmlFor="welcome-search" className="sr-only">Search biblical figures</label>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10.5 10.5l3 3" strokeLinecap="round" />
          </svg>
          <input
            id="welcome-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-dim)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-garamond), Georgia, serif",
              fontSize: 13,
            }}
            onFocus={e => { e.target.style.borderColor = "var(--gold-dim)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border-dim)"; }}
          />
        </div>

        {/* Search results */}
        {query.trim().length > 0 && results.length === 0 && (
          <p className="mt-2 px-2 py-1.5 italic" style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
            No results for &ldquo;{query.trim()}&rdquo;
          </p>
        )}
        {results.length > 0 && (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-dim)" }}>
            {results.map((person, i) => {
              const portrait = getPortrait(person.id);
              return (
                <button
                  key={person.id}
                  onClick={() => handleSelect(person.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all group"
                  style={{
                    background: "var(--bg-surface)",
                    borderTop: i > 0 ? "1px solid var(--border-dim)" : undefined,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)"; }}
                >
                  <div className="shrink-0 rounded-full overflow-hidden" style={{ width: 28, height: 28, border: "1px solid var(--border-dim)" }}>
                    {portrait
                      ? <Image src={portrait.src} alt={person.name} width={28} height={28} className="w-full h-full object-cover object-top" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-panel)", color: "var(--text-muted)", fontSize: 10 }}>{person.name[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate" style={{ fontSize: 13, color: person.isMainLineage ? "var(--gold-bright)" : "var(--text-primary)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
                      {person.name}
                    </span>
                    {person.alternateNames?.[0] && (
                      <span className="block truncate" style={{ fontSize: 10, color: "var(--text-muted)" }}>{person.alternateNames[0]}</span>
                    )}
                  </div>
                  {person.isMainLineage && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)", opacity: 0.7 }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Start with Adam ─────────────────────── */}
      <div className="px-5 pt-4">
        <button
          onClick={() => onSelect("adam")}
          className="w-full rounded-lg py-3 transition-all"
          style={{
            background: "rgba(200,148,42,0.12)",
            border: "1px solid rgba(200,148,42,0.3)",
            color: "var(--gold)",
            fontFamily: "var(--font-cinzel), serif",
            fontSize: 11,
            letterSpacing: "0.12em",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.12)"; }}
        >
          ✦ START WITH ADAM
        </button>
        <p className="text-center mt-2" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>
          {adam ? `Begin at the beginning · Genesis 1` : ""}
        </p>
      </div>

      {/* ── Legend — collapsed by default ───────── */}
      <div className="mt-8 px-5 pb-5">
        <button
          type="button"
          onClick={() => setLegendOpen(o => !o)}
          aria-expanded={legendOpen}
          aria-controls="welcome-legend-items"
          className="flex items-center justify-between w-full py-1 text-left"
        >
          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Legend
          </span>
          <svg
            className="shrink-0 transition-transform"
            width={10}
            height={6}
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{
              color: "var(--text-muted)",
              transform: legendOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
          </svg>
        </button>
        {legendOpen && (
          <div id="welcome-legend-items" className="mt-2 space-y-1.5">
            <LegendItem color="var(--gold)" label="Messianic line — direct ancestors of Jesus" />
            <LegendItem color="rgba(200,180,140,0.5)" label="Branch figures — siblings & relatives" />
            <LegendItem color="#a04060" label="Wives & mothers" />
            <LegendItem color="var(--gold)" dot label="Has narrative note (cause & effect)" />
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {dot
        ? <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
        : <span className="w-3 h-0.5 shrink-0 rounded-full" style={{ background: color }} />
      }
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>{label}</span>
    </div>
  );
}
