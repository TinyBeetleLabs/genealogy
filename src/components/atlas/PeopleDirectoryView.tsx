"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Person } from "@/types/person";
import { GraphData } from "@/types/graph";
import { getPortrait } from "@/lib/data/portraitRefs";
import PersonPanel from "@/components/panel/PersonPanel";
import { getParents, getChildren, getSiblings, getConnectedRelationships } from "@/lib/graph/query";
import { ERA_LABELS, ERA_DESCRIPTIONS } from "@/lib/data/eraInfo";

interface Props {
  data: GraphData;
  /** Called when user explicitly clicks "View in Graph" — navigates away */
  onNavigateToGraph: (id: string) => void;
}

type LineageFilter = "all" | "messianic" | "branch";

/** Canonical order for the era pills */
const ERA_ORDER_KEYS = [
  "pre-flood",
  "post-flood",
  "patriarchs",
  "judges",
  "united-kingdom",
  "divided-kingdom",
  "exile-return",
  "post-exile",
  "new-testament",
];

/** Short display label (pills / cards use a concise version) */
const ERA_SHORT: Record<string, string> = {
  "pre-flood":       "Pre-Flood",
  "post-flood":      "Post-Flood",
  "patriarchs":      "Patriarchal Age",
  "judges":          "Conquest & Judges",
  "united-kingdom":  "United Monarchy",
  "divided-kingdom": "Divided Kingdom",
  "exile-return":    "Exile & Return",
  "post-exile":      "Post-Exile",
  "new-testament":   "New Testament",
};

function eraShort(key: string | undefined): string {
  if (!key) return "Unknown Era";
  return ERA_SHORT[key] ?? ERA_LABELS[key] ?? key;
}

function getSpouses(personId: string, data: GraphData): Person[] {
  const ids = data.relationships
    .filter(r => r.type === "spouse" && (r.source === personId || r.target === personId))
    .map(r => (r.source === personId ? r.target : r.source));
  return data.people.filter(p => ids.includes(p.id));
}

export default function PeopleDirectoryView({ data, onNavigateToGraph }: Props) {
  const { people } = data;
  const [query, setQuery] = useState("");
  const [lineageFilter, setLineageFilter] = useState<LineageFilter>("all");
  const [eraFilter, setEraFilter] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Collect unique eras present in data, sorted by canonical ERA_ORDER_KEYS
  const availableEras = useMemo(() => {
    const set = new Set(people.map(p => p.era).filter(Boolean) as string[]);
    const ordered = ERA_ORDER_KEYS.filter(k => set.has(k));
    const rest = [...set].filter(k => !ERA_ORDER_KEYS.includes(k)).sort();
    return ["all", ...ordered, ...rest];
  }, [people]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter(p => p.showInGraph !== false)
      .filter(p => {
        if (lineageFilter === "messianic") return p.isMainLineage;
        if (lineageFilter === "branch") return !p.isMainLineage;
        return true;
      })
      .filter(p => eraFilter === "all" || p.era === eraFilter)
          .filter(p => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
          eraShort(p.era).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ai = ERA_ORDER_KEYS.indexOf(a.era ?? "");
        const bi = ERA_ORDER_KEYS.indexOf(b.era ?? "");
        if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        return a.name.localeCompare(b.name);
      });
  }, [people, query, lineageFilter, eraFilter]);

  // Group by era for display
  const grouped = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const p of filtered) {
      const key = p.era ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filtered]);

  // Queries for selected person's panel
  const parents  = selectedPerson ? getParents(selectedPerson.id, data) : [];
  const children = selectedPerson ? getChildren(selectedPerson.id, data) : [];
  const spouses  = selectedPerson ? getSpouses(selectedPerson.id, data) : [];
  const siblings = selectedPerson ? getSiblings(selectedPerson.id, data) : [];
  const connectedRels = selectedPerson ? getConnectedRelationships(selectedPerson.id, data) : [];

  const handleCardClick = (person: Person) => {
    setSelectedPerson(prev => prev?.id === person.id ? null : person);
  };

  return (
    <div className="relative h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Directory (always full width — panel overlays it) ─── */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* Toolbar */}
        <div
          className="shrink-0 flex flex-col gap-3 px-5 py-4 z-10"
          style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border-dim)" }}
        >
          <div className="flex items-baseline gap-3">
            <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em" }}>
              People Directory
            </h2>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>
              {filtered.length} figures
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <label htmlFor="people-search" className="sr-only">Search people by name or era</label>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }} aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="M10.5 10.5l3 3" strokeLinecap="round" />
            </svg>
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or era…"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-dim)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-garamond), Georgia, serif",
                fontSize: 13,
              }}
              onFocus={e => (e.target.style.borderColor = "var(--gold-dim)")}
              onBlur={e => (e.target.style.borderColor = "var(--border-dim)")}
            />
          </div>

          {/* Lineage filter */}
          <div role="group" aria-label="Filter by lineage" className="flex items-center gap-2">
            {(["all", "messianic", "branch"] as LineageFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setLineageFilter(f)}
                aria-pressed={lineageFilter === f}
                className="rounded-full px-3 transition-all"
                style={{
                  fontSize: 10,
                  minHeight: 32,
                  fontFamily: "var(--font-cinzel), serif",
                  letterSpacing: "0.06em",
                  border: `1px solid ${lineageFilter === f ? "var(--gold)" : "var(--border-dim)"}`,
                  background: lineageFilter === f ? "rgba(200,148,42,0.15)" : "transparent",
                  color: lineageFilter === f ? "var(--gold)" : "var(--text-muted)",
                }}
              >
                {f === "all" ? "All" : f === "messianic" ? "✦ Messianic Line" : "Branch Figures"}
              </button>
            ))}
          </div>

          {/* Era filter — ordered chronologically */}
          <div role="group" aria-label="Filter by era" className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "thin" }}>
            {availableEras.map(key => (
              <button
                key={key}
                onClick={() => setEraFilter(key)}
                aria-pressed={eraFilter === key}
                className="shrink-0 rounded-full px-3 transition-all"
                style={{
                  fontSize: 9,
                  minHeight: 30,
                  fontFamily: "var(--font-cinzel), serif",
                  letterSpacing: "0.05em",
                  border: `1px solid ${eraFilter === key ? "var(--gold)" : "var(--border-dim)"}`,
                  background: eraFilter === key ? "rgba(200,148,42,0.12)" : "transparent",
                  color: eraFilter === key ? "var(--gold)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {key === "all" ? "All Eras" : eraShort(key)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {grouped.size === 0 && (
            <p className="text-center pt-16" style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
              No people match your filters.
            </p>
          )}

          {[...grouped.entries()].map(([eraKey, persons]) => (
            <div key={eraKey}>
              {/* Era heading */}
              <div className="flex items-center gap-3 mb-1">
                <span style={{ fontSize: 9, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {eraShort(eraKey)}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>
                  {persons.length}
                </span>
              </div>
              {/* Era description */}
              {ERA_DESCRIPTIONS[eraKey] && (
                <p className="mb-3 italic" style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.6 }}>
                  {ERA_DESCRIPTIONS[eraKey]}
                </p>
              )}

              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
                {persons.map(person => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    isSelected={selectedPerson?.id === person.id}
                    onClick={() => handleCardClick(person)}
                  />
                ))}
              </div>
            </div>
          ))}
          <div style={{ height: 24 }} />
        </div>
      </div>

      {/* ── Detail panel — slides over the grid from the right ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={selectedPerson ? `${selectedPerson.name} details` : "Person details"}
        className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{
          width: isMobile ? "100%" : "var(--panel-width)",
          background: "var(--bg-panel)",
          borderLeft: isMobile ? "none" : "1px solid var(--border-dim)",
          transform: selectedPerson ? "translateX(0)" : "translateX(100%)",
          transition: "transform var(--duration-panel) var(--ease-panel)",
          zIndex: 40,
          boxShadow: selectedPerson ? (isMobile ? "none" : "-8px 0 32px rgba(0,0,0,0.5)") : "none",
        }}
        onKeyDown={e => { if (e.key === "Escape") setSelectedPerson(null); }}
      >
        {selectedPerson && (
          <>
            <PersonPanel
              person={selectedPerson}
              parents={parents}
              children={children}
              spouses={spouses}
              siblings={siblings}
              relationships={connectedRels}
              onClose={() => setSelectedPerson(null)}
              onNavigate={(id) => {
                const next = people.find(p => p.id === id);
                if (next) setSelectedPerson(next);
              }}
              extraFooterAction={{
                label: "View in Family Tree →",
                onClick: () => onNavigateToGraph(selectedPerson.id),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Person card ───────────────────────────────────────────────────────────────
function PersonCard({ person, isSelected, onClick }: {
  person: Person;
  isSelected: boolean;
  onClick: () => void;
}) {
  const portrait = getPortrait(person.id);

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl overflow-hidden text-left transition-all"
      style={{
        background: "var(--bg-panel)",
        border: `1px solid ${isSelected ? "var(--gold)" : person.isMainLineage ? "rgba(200,148,42,0.25)" : "var(--border-dim)"}`,
        boxShadow: isSelected ? "0 0 0 1px var(--gold), 0 6px 20px rgba(200,148,42,0.2)" : "none",
        transform: isSelected ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={e => {
        if (isSelected) return;
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = person.isMainLineage ? "var(--gold)" : "rgba(200,148,42,0.3)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        if (isSelected) return;
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = person.isMainLineage ? "rgba(200,148,42,0.25)" : "var(--border-dim)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Portrait */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1/1", background: "var(--bg-surface)" }}>
        {portrait ? (
          <Image src={portrait.src} alt={person.name} fill className="object-cover object-top" sizes="180px" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--bg-surface), var(--bg-panel))" }}>
            <span style={{ fontSize: 28, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", opacity: 0.4 }}>
              {person.name[0]}
            </span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, var(--bg-panel) 100%)" }} />
        {person.isMainLineage && (
          <div className="absolute top-2 right-2 rounded-full flex items-center justify-center" style={{ width: 16, height: 16, background: "var(--gold)", boxShadow: "0 0 8px rgba(200,148,42,0.7)" }}>
            <span style={{ fontSize: 7, color: "#0d0a04" }}>✦</span>
          </div>
        )}
        {person.gender === "female" && (
          <div className="absolute top-2 left-2 rounded-full flex items-center justify-center" style={{ width: 14, height: 14, background: "rgba(160,64,96,0.8)", border: "1px solid #a04060" }}>
            <span style={{ fontSize: 7, color: "#ffb0c8" }}>♀</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="leading-tight truncate" style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 11, fontWeight: 600, color: person.isMainLineage ? "var(--gold-bright)" : "var(--text-primary)" }}>
          {person.name}
        </p>
        {person.alternateNames?.[0] && (
          <p className="truncate mt-0.5" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif", fontStyle: "italic" }}>
            {person.alternateNames[0]}
          </p>
        )}
        <p className="truncate mt-1" style={{ fontSize: 8, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {eraShort(person.era)}
        </p>
      </div>
    </button>
  );
}
