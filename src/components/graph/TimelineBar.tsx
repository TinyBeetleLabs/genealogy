"use client";

import Image from "next/image";
import { Person } from "@/types/person";
import { getPortrait } from "@/lib/data/portraitRefs";
import { APPROX_DATES } from "@/lib/data/eraInfo";

// Milestone bar shows a curated subset of the shared date list
const MILESTONE_APPROX: Record<string, string> = {
  adam:     APPROX_DATES.adam,
  noah:     APPROX_DATES.noah,
  abraham:  APPROX_DATES.abraham,
  isaac:    APPROX_DATES.isaac,
  jacob:    APPROX_DATES.jacob,
  david:    APPROX_DATES.david,
  jesus:    APPROX_DATES.jesus,
};

const MILESTONE_IDS = ["adam", "noah", "abraham", "isaac", "jacob", "david", "jesus"];

/** Height of the graph footer bar — keep in sync with AtlasShell panel/sidebar footers */
export const GRAPH_TIMELINE_BAR_HEIGHT = 88;

interface Props {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TimelineBar({ people, selectedId, onSelect }: Props) {
  const milestones = MILESTONE_IDS
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as Person[];

  return (
    <div
      className="shrink-0 flex items-center px-6 gap-0 z-20 overflow-x-auto"
      style={{
        height: GRAPH_TIMELINE_BAR_HEIGHT,
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      {/* Label */}
      <div className="shrink-0 mr-6">
        <p className="font-atlas text-xs tracking-widest uppercase" style={{ color: "var(--gold-dim)", fontSize: 9 }}>
          Messianic Line
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 8 }}>Adam → Jesus</p>
      </div>

      {/* Milestones */}
      <div className="flex items-center gap-0 flex-1">
        {milestones.map((person, i) => {
          const portraitInfo = getPortrait(person.id);
          const hasPortrait = !!portraitInfo;
          const isSelected = selectedId === person.id;

          return (
            <div key={person.id} className="flex items-center">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className="h-px shrink-0 mx-1"
                  style={{ width: 24, background: "var(--border-dim)" }}
                />
              )}

              {/* Person chip */}
              <button
                onClick={() => onSelect(person.id)}
                aria-label={`${person.name}${MILESTONE_APPROX[person.id] ? `, ${MILESTONE_APPROX[person.id]}` : ""}`}
                aria-current={isSelected ? "true" : undefined}
                className="flex flex-col items-center gap-1 group shrink-0"
                style={{ minWidth: 56 }}
              >
                {/* Portrait circle */}
                <div
                  className="rounded-full overflow-hidden shrink-0 transition-all duration-200"
                  style={{
                    width: isSelected ? 42 : 34,
                    height: isSelected ? 42 : 34,
                    border: isSelected
                      ? "2px solid var(--gold)"
                      : "1.5px solid var(--border-dim)",
                    boxShadow: isSelected ? "0 0 12px rgba(200,148,42,0.5)" : undefined,
                  }}
                >
                  {hasPortrait && portraitInfo ? (
                    <Image
                      src={portraitInfo.src}
                      alt={person.name}
                      width={42}
                      height={42}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs"
                      style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
                    >
                      {person.name[0]}
                    </div>
                  )}
                </div>

                {/* Name */}
                <span
                  className="font-atlas text-center leading-none transition-colors"
                  style={{
                    fontSize: 9,
                    color: isSelected ? "var(--gold)" : "var(--text-muted)",
                    maxWidth: 56,
                  }}
                >
                  {person.name}
                </span>

                {/* Date */}
                <span
                  className="text-center leading-none"
                  style={{ fontSize: 9, color: "var(--text-muted)" }}
                >
                  {MILESTONE_APPROX[person.id]}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Scripture note */}
      <div className="shrink-0 ml-4 text-right hidden lg:block">
        <p style={{ color: "var(--text-muted)", fontSize: 8 }}>All facts backed</p>
        <p style={{ color: "var(--text-muted)", fontSize: 8 }}>by scripture</p>
      </div>
    </div>
  );
}
