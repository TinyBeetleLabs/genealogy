"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import { getPortrait } from "@/lib/data/portraitRefs";
import { ERA_LABELS, PERSON_LOCATIONS, APPROX_DATES } from "@/lib/data/eraInfo";
import PersonPanel from "@/components/panel/PersonPanel";
import { getParents, getChildren, getSiblings, getConnectedRelationships } from "@/lib/graph/query";

// Re-export shared dates under the local alias used throughout this file
const DATES = APPROX_DATES;

// Extended timeline era subtitles (more detail than the badge labels)
const TIMELINE_ERA_SUBTITLES: Record<string, string> = {
  "pre-flood": "From Creation to the Great Flood · Ancient World",
  "post-flood": "After the Ark · Ararat → Mesopotamia",
  "patriarchs": "Abraham, Isaac & Jacob · Canaan & Egypt",
  "judges": "Ruth & the Judges · Canaan / Israel",
  "united-kingdom": "David & Solomon · Kingdom of Israel (United) · Jerusalem",
  "divided-kingdom": "Kings of Judah · Jerusalem",
  "exile-return": "Babylon & the Return · Babylonian Empire → Judea",
  "post-exile": "Rebuilding Jerusalem · Persian Period · Judea",
  "new-testament": "The Messiah · Roman-Occupied Judea",
};

function getMainLineageOrdered(data: GraphData): Person[] {
  const mainIds = new Set(data.people.filter(p => p.isMainLineage).map(p => p.id));
  // Build parent→children map (main lineage only)
  const childrenOf = new Map<string, string[]>();
  data.relationships.forEach(r => {
    if (r.type === "spouse") return;
    if (mainIds.has(r.source) && mainIds.has(r.target)) {
      if (!childrenOf.has(r.source)) childrenOf.set(r.source, []);
      childrenOf.get(r.source)!.push(r.target);
    }
  });
  // BFS from adam
  const result: Person[] = [];
  const visited = new Set<string>();
  const queue = ["adam"];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const p = data.people.find(x => x.id === id);
    if (p && p.isMainLineage) {
      result.push(p);
      (childrenOf.get(id) ?? []).forEach(c => queue.push(c));
    }
  }
  return result;
}

function getSpouses(personId: string, data: GraphData): Person[] {
  const ids = data.relationships
    .filter(r => r.type === "spouse" && (r.source === personId || r.target === personId))
    .map(r => (r.source === personId ? r.target : r.source));
  return data.people.filter(p => ids.includes(p.id));
}

interface Props {
  data: GraphData;
  /** Called when user explicitly clicks "View in Family Tree" */
  onSelect: (id: string) => void;
}

export default function TimelineView({ data, onSelect }: Props) {
  const lineage = getMainLineageOrdered(data);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const panelPerson = panelId ? data.people.find(p => p.id === panelId) ?? null : null;
  const parents     = panelPerson ? getParents(panelPerson.id, data) : [];
  const children    = panelPerson ? getChildren(panelPerson.id, data) : [];
  const spouses     = panelPerson ? getSpouses(panelPerson.id, data) : [];
  const siblings    = panelPerson ? getSiblings(panelPerson.id, data) : [];
  const connRels    = panelPerson ? getConnectedRelationships(panelPerson.id, data) : [];

  // Group by era
  const groups: { era: string; people: Person[] }[] = [];
  lineage.forEach(p => {
    const era = p.era ?? "unknown";
    const last = groups[groups.length - 1];
    if (last && last.era === era) {
      last.people.push(p);
    } else {
      groups.push({ era, people: [p] });
    }
  });

  return (
    <div className="relative h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* Full-width timeline (never shrinks when panel opens) */}
      <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 md:px-8 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <h2 className="leading-none" style={{ fontFamily: "var(--font-cinzel), Georgia, serif", fontSize: 18, color: "var(--gold)", letterSpacing: "0.15em" }}>
          MESSIANIC TIMELINE
        </h2>
        <p className="mt-1 italic" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 12, color: "var(--text-muted)" }}>
          The direct lineage from Adam to Jesus · Dates are traditional approximations · Click any person to view details
        </p>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {groups.map(({ era, people }) => (
            <div key={era} className="mb-8">
              {/* Era header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: "var(--border-dim)" }} />
                <span
                  className="shrink-0 px-3 py-1 rounded-full"
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    color: "var(--gold-dim)",
                    background: "rgba(200,148,42,0.06)",
                    border: "1px solid rgba(200,148,42,0.15)",
                    textTransform: "uppercase",
                  }}
                >
                  {TIMELINE_ERA_SUBTITLES[era] ?? ERA_LABELS[era] ?? era}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border-dim)" }} />
              </div>

              {/* People in this era */}
              <div className="relative pl-10">
                {/* Vertical timeline line */}
                <div
                  className="absolute left-5 top-0 bottom-0 w-px"
                  style={{ background: "linear-gradient(to bottom, var(--border-dim) 0%, rgba(200,148,42,0.2) 50%, var(--border-dim) 100%)" }}
                />

                {people.map((person, idx) => {
                  const portrait = getPortrait(person.id);
                  const isSelected = panelId === person.id;
                  const isKey = ["adam", "noah", "abraham", "david", "jesus"].includes(person.id);

                  return (
                    <div key={person.id} className="relative mb-3">
                      {/* Timeline dot */}
                      <div
                        className="absolute -left-10 top-3 rounded-full"
                        style={{
                          width: 10,
                          height: 10,
                          background: isKey ? "var(--gold)" : isSelected ? "var(--gold-bright)" : "var(--border-glow)",
                          boxShadow: isKey || isSelected ? "0 0 8px var(--gold)" : undefined,
                          border: `1px solid ${isKey ? "var(--gold-bright)" : "var(--border-dim)"}`,
                          transform: "translateX(5px)",
                        }}
                      />

                      {/* Card */}
                      <button
                        onClick={() => setPanelId(prev => prev === person.id ? null : person.id)}
                        className="w-full text-left rounded-xl overflow-hidden flex gap-0 transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(200,148,42,0.1)"
                            : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? "rgba(200,148,42,0.4)" : "var(--border-dim)"}`,
                          boxShadow: isSelected ? "0 0 20px rgba(200,148,42,0.1)" : undefined,
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-glow)";
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-dim)";
                        }}
                      >
                        {/* Portrait */}
                        <div className="shrink-0 relative" style={{ width: 64, height: 64 }}>
                          {portrait ? (
                            <Image src={portrait.src} alt={person.name} fill className="object-cover object-top" sizes="64px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
                              <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
                                <ellipse cx="20" cy="14" rx="7" ry="8" fill="rgba(200,148,42,0.12)" />
                                <path d="M6 40 Q6 28 20 24 Q34 28 34 40 Z" fill="rgba(200,148,42,0.12)" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, rgba(13,10,6,0.6) 100%)" }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4 py-3 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span
                              className="leading-none"
                              style={{
                                fontFamily: "var(--font-cinzel), Georgia, serif",
                                fontSize: isKey ? 15 : 13,
                                fontWeight: isKey ? 700 : 500,
                                color: isKey || isSelected ? "var(--gold-bright)" : "var(--text-primary)",
                              }}
                            >
                              {person.name}
                            </span>
                            {person.alternateNames?.[0] && (
                              <span className="italic" style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), serif" }}>
                                ({person.alternateNames[0]})
                              </span>
                            )}
                            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", marginLeft: "auto" }}>
                              {DATES[person.id] ?? ""}
                            </span>
                          </div>
                          {person.description && (
                            <p className="mt-1 leading-snug line-clamp-2" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                              {person.description}
                            </p>
                          )}
                          {/* Location */}
                          {PERSON_LOCATIONS[person.id] && (
                            <div className="mt-1 flex items-center gap-1">
                              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--gold-dim)", opacity: 0.7 }}>
                                <path d="M6 1a3 3 0 0 1 3 3c0 2.5-3 7-3 7S3 6.5 3 4a3 3 0 0 1 3-3z" strokeLinejoin="round" />
                                <circle cx="6" cy="4" r="1" fill="var(--gold-dim)" stroke="none" />
                              </svg>
                              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), serif" }}>
                                {PERSON_LOCATIONS[person.id].place}
                              </span>
                            </div>
                          )}
                          {person.significance && person.significance.length > 0 && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--gold)", boxShadow: "0 0 4px var(--gold)" }} />
                              <span className="italic" style={{ fontSize: 10, color: "var(--gold-dim)", fontFamily: "var(--font-garamond), serif" }}>
                                {person.significance[0].title}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 flex items-center px-3" style={{ color: "var(--text-muted)" }}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </button>

                      {/* Connector arrow between people */}
                      {idx < people.length - 1 && (
                        <div className="flex items-center pl-6 py-0.5">
                          <svg viewBox="0 0 16 12" fill="none" className="w-3 h-2.5" style={{ color: "var(--border-glow)", opacity: 0.6 }}>
                            <path d="M8 0 L8 8 M5 5 L8 8 L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* End of line */}
          <div className="flex justify-center mt-4 mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-6" style={{ background: "var(--gold)", opacity: 0.3 }} />
              <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.15em" }}>
                END OF RECORDED LINEAGE · Matthew 1:1–17 · Luke 3:23–38
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Detail panel — right overlay (same pattern as People directory) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={panelPerson ? `${panelPerson.name} details` : "Person details"}
        className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{
          width: isMobile ? "100%" : "var(--panel-width)",
          background: "var(--bg-panel)",
          borderLeft: isMobile ? "none" : "1px solid var(--border-dim)",
          transform: panelPerson ? "translateX(0)" : "translateX(100%)",
          transition: "transform var(--duration-panel) var(--ease-panel)",
          zIndex: 40,
          boxShadow: panelPerson ? (isMobile ? "none" : "-8px 0 32px rgba(0,0,0,0.5)") : "none",
        }}
        onKeyDown={e => { if (e.key === "Escape") setPanelId(null); }}
      >
        {panelPerson && (
          <PersonPanel
            person={panelPerson}
            parents={parents}
            children={children}
            spouses={spouses}
            siblings={siblings}
            relationships={connRels}
            onClose={() => setPanelId(null)}
            onNavigate={(id) => setPanelId(id)}
            extraFooterAction={{
              label: "View in Family Tree →",
              onClick: () => onSelect(panelPerson.id),
            }}
          />
        )}
      </div>
    </div>
  );
}
