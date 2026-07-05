"use client";

import Image from "next/image";
import { useState } from "react";
import { Person } from "@/types/person";
import { Relationship } from "@/types/relationship";
import ScriptureRefList from "./ScriptureRef";
import { getPortrait } from "@/lib/data/portraitRefs";
import { ERA_LABELS, PERSON_LOCATIONS } from "@/lib/data/eraInfo";

interface Props {
  person: Person | null;
  parents: Person[];
  children: Person[];
  spouses: Person[];
  siblings: Person[];
  relationships: Relationship[];
  onClose: () => void;
  onNavigate: (id: string) => void;
  /** Optional extra CTA shown in the footer (e.g. "View in Family Tree") */
  extraFooterAction?: { label: string; onClick: () => void };
}

export default function PersonPanel({
  person,
  parents,
  children,
  spouses,
  siblings,
  relationships,
  onClose,
  onNavigate,
  extraFooterAction,
}: Props) {
  // Hooks must run unconditionally — declare before any early return
  const [siblingsOpen, setSiblingsOpen] = useState(false);

  if (!person) return null;

  const portraitInfo = getPortrait(person.id);
  const isMainLine = person.isMainLineage === true;
  const eraLabel = person.era ? ERA_LABELS[person.era] : null;
  const locationInfo = PERSON_LOCATIONS[person.id] ?? null;

  const legalRels = relationships.filter(
    (r) => r.type === "legal" && (r.source === person.id || r.target === person.id)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-panel)" }}>
      {/* ── Panel chrome — close always visible (not over portrait) ── */}
      <div
        className="shrink-0 flex items-center justify-end px-3 py-2"
        style={{ borderBottom: "1px solid var(--border-dim)", minHeight: 44 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 flex items-center justify-center rounded-full transition-all hover:bg-[rgba(200,148,42,0.1)] hover:text-[--gold]"
          style={{
            width: 36,
            height: 36,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border-dim)",
            color: "var(--text-muted)",
          }}
        >
          <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>

      {/* ── Portrait ───────────────────────────────── */}
      <div className="relative shrink-0 w-full overflow-hidden" style={{ height: 200 }}>
        {portraitInfo ? (
          <Image
            src={portraitInfo.src}
            alt={person.name}
            fill
            className="object-cover object-top"
            sizes="340px"
            priority
          />
        ) : (
          <PortraitFallback person={person} />
        )}

        {/* Gradient overlay — bottom fade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 40%, var(--bg-panel) 100%)",
          }}
        />

        {/* Caption — scripture-based or artistic interpretation */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
          {portraitInfo?.scriptureRef ? (
            <p
              className="italic leading-snug"
              style={{
                fontSize: 9,
                color: "rgba(240,184,64,0.75)",
                fontFamily: "var(--font-garamond), Georgia, serif",
              }}
            >
              Artistic depiction based on <span className="not-italic font-semibold">{portraitInfo.scriptureRef}</span>
            </p>
          ) : (
            <p
              className="italic"
              style={{
                fontSize: 10,
                color: "rgba(220,200,160,0.55)",
                fontFamily: "var(--font-garamond), Georgia, serif",
              }}
            >
              Artistic interpretation · No physical description in scripture
            </p>
          )}
        </div>
      </div>

      {/* ── Name + badges ──────────────────────────── */}
      <div className="shrink-0 px-5 pt-3 pb-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        {/* Lineage + era badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {isMainLine ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(200,148,42,0.15)",
                border: "1px solid rgba(200,148,42,0.3)",
                color: "var(--gold)",
                fontSize: 9,
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.06em",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--gold)" }} />
              Messianic Line
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-dim)",
                color: "var(--text-muted)",
                fontSize: 9,
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.06em",
              }}
            >
              Branch Figure
            </span>
          )}
          {eraLabel && (
            <span
              className="rounded-full px-2 py-0.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-dim)",
                fontSize: 9,
                color: "var(--text-muted)",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.04em",
              }}
            >
              {eraLabel}
            </span>
          )}
        </div>

        {/* Location — scripture-supported only */}
        {locationInfo && (
          <div className="flex items-start gap-1.5 mb-1">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--gold-dim)" }}>
              <path d="M7 1a4 4 0 0 1 4 4c0 3-4 8-4 8S3 8 3 5a4 4 0 0 1 4-4z" strokeLinejoin="round" />
              <circle cx="7" cy="5" r="1.3" fill="var(--gold-dim)" stroke="none" />
            </svg>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
                {locationInfo.place}
              </span>
              <span className="ml-1.5" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>
                {locationInfo.scriptureRef}
              </span>
            </div>
          </div>
        )}

        <h2
          className="leading-tight mb-1"
          style={{
            fontFamily: "var(--font-cinzel), Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: isMainLine ? "var(--gold-bright)" : "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          {person.name}
        </h2>

        {person.alternateNames && person.alternateNames.length > 0 && (
          <p
            className="italic"
            style={{
              fontFamily: "var(--font-garamond), Georgia, serif",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Also known as: {person.alternateNames.join(", ")}
          </p>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        <div className="px-5 py-4 space-y-5">

          {/* Description */}
          {person.description && (
            <p
              className="leading-relaxed"
              style={{
                fontFamily: "var(--font-garamond), Georgia, serif",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.7,
              }}
            >
              {person.description}
            </p>
          )}

          {/* Scripture appearance description */}
          {portraitInfo?.scriptureRef && portraitInfo.scriptureDescription && (
            <div
              className="rounded-lg p-3 space-y-1.5"
              style={{ background: "rgba(200,148,42,0.06)", border: "1px solid rgba(200,148,42,0.2)" }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 10 }}>📜</span>
                <p
                  style={{
                    fontSize: 9,
                    color: "var(--gold-dim)",
                    fontFamily: "var(--font-cinzel), serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Physical Description in Scripture
                </p>
              </div>
              <p
                className="italic leading-relaxed"
                style={{
                  fontFamily: "var(--font-garamond), Georgia, serif",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  lineHeight: 1.65,
                }}
              >
                {portraitInfo.scriptureDescription}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: 10,
                  color: "var(--gold-dim)",
                }}
              >
                — {portraitInfo.scriptureRef}
              </p>
            </div>
          )}

          {/* Cause & Effect / Significance */}
          {person.significance && person.significance.length > 0 && (
            <div className="space-y-2.5">
              <SectionLabel icon="✦" label="Why This Person Matters" />
              {person.significance.map((sig, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 space-y-1"
                  style={{ background: "rgba(200,148,42,0.07)", border: "1px solid rgba(200,148,42,0.15)" }}
                >
                  <p
                    className="font-semibold"
                    style={{ fontSize: 11, color: "var(--gold)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.04em" }}
                  >
                    {sig.title}
                  </p>
                  <p
                    className="leading-relaxed"
                    style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.65 }}
                  >
                    {sig.text}
                  </p>
                  {sig.scriptureRef && (
                    <p style={{ fontSize: 11, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif" }}>
                      {sig.scriptureRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Textual notes */}
          {person.notes && (
            <div
              className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dim)" }}
            >
              <p
                className="italic leading-relaxed"
                style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.6 }}
              >
                {person.notes}
              </p>
            </div>
          )}

          {/* Legal relationship note */}
          {legalRels.length > 0 && legalRels[0].notes && (
            <div
              className="rounded-lg p-3"
              style={{ background: "rgba(200,148,42,0.05)", border: "1px solid rgba(200,148,42,0.2)" }}
            >
              <p
                className="italic leading-relaxed"
                style={{ fontSize: 12, color: "rgba(200,148,42,0.7)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.6 }}
              >
                {legalRels[0].notes}
              </p>
            </div>
          )}

          {/* Scripture References */}
          <div className="space-y-2.5">
            <SectionLabel icon="📖" label="Scripture References" />
            <ScriptureRefList refs={person.scriptureRefs.existence} label="Mentioned in scripture" />
            {person.scriptureRefs.lineage && person.scriptureRefs.lineage.length > 0 && (
              <ScriptureRefList refs={person.scriptureRefs.lineage} label="Lineage confirmed" />
            )}
          </div>

          {/* Family Connections */}
          {(spouses.length > 0 || parents.length > 0 || children.length > 0 || siblings.length > 0) && (
            <div className="space-y-3">
              <SectionLabel icon="⚭" label="Family Connections" />

              {/* Mothers (maternal) vs Fathers (biological/legal) */}
              {parents.length > 0 && (() => {
                const mothers = parents.filter((p) =>
                  relationships.some(
                    (r) => r.type === "maternal" && (
                      (r.source === p.id && r.target === person.id) ||
                      (r.target === p.id && r.source === person.id)
                    )
                  )
                );
                const fathers = parents.filter((p) => !mothers.includes(p));
                return (
                  <>
                    {mothers.length > 0 && (
                      <ConnectionGroup label={mothers.length > 1 ? "Mothers" : "Mother"} people={mothers} badge="mother" onNavigate={onNavigate} />
                    )}
                    {fathers.length > 0 && (
                      <ConnectionGroup
                        label={
                          legalRels.some((r) => fathers.some((f) => r.source === f.id || r.target === f.id))
                            ? "Legal Father"
                            : fathers.length > 1 ? "Fathers" : "Father"
                        }
                        people={fathers}
                        onNavigate={onNavigate}
                      />
                    )}
                  </>
                );
              })()}

              {spouses.length > 0 && (
                <ConnectionGroup
                  label={spouses.length > 1 ? "Spouses" : "Spouse"}
                  people={spouses}
                  badge="spouse"
                  onNavigate={onNavigate}
                />
              )}

              {children.length > 0 && (
                <ConnectionGroup
                  label={children.length > 1 ? "Children" : "Child"}
                  people={children}
                  onNavigate={onNavigate}
                />
              )}

              {siblings.length > 0 && (
                <div className="space-y-1">
                  <button
                    onClick={() => setSiblingsOpen((o) => !o)}
                    aria-expanded={siblingsOpen}
                    aria-controls="siblings-list"
                    className="flex items-center gap-1.5 w-full text-left"
                  >
                    <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em", fontFamily: "var(--font-cinzel), serif" }}>
                      {siblings.length === 1 ? "Sibling" : "Siblings"}
                      <span className="ml-1.5" style={{ color: "var(--gold-dim)" }}>({siblings.length})</span>
                    </p>
                    <svg
                      className="w-2.5 h-2.5 transition-transform"
                      style={{
                        color: "var(--text-muted)",
                        transform: siblingsOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                      fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                    </svg>
                  </button>
                  {siblingsOpen && (
                    <div id="siblings-list" className="space-y-1 pl-1">
                      {siblings.map((s) => (
                        <PersonLink key={s.id} person={s} onNavigate={onNavigate} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-3 flex flex-col gap-2"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      >
        <p className="italic" style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
          All information sourced directly from scripture · References cited above
        </p>
        {extraFooterAction && (
          <button
            onClick={extraFooterAction.onClick}
            className="w-full rounded-lg py-2 transition-all text-center"
            style={{
              background: "rgba(200,148,42,0.08)",
              border: "1px solid rgba(200,148,42,0.25)",
              color: "var(--gold)",
              fontFamily: "var(--font-cinzel), serif",
              fontSize: 10,
              letterSpacing: "0.08em",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.18)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.08)"}
          >
            {extraFooterAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 11 }}>{icon}</span>
      <p
        style={{
          fontSize: 9,
          color: "var(--text-muted)",
          fontFamily: "var(--font-cinzel), serif",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function ConnectionGroup({
  label,
  people,
  badge,
  onNavigate,
}: {
  label: string;
  people: Person[];
  badge?: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em", fontFamily: "var(--font-cinzel), serif" }}>
        {label}
      </p>
      <div className="space-y-1">
        {people.map((p) => (
          <PersonLink key={p.id} person={p} badge={badge} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function PersonLink({
  person,
  badge,
  onNavigate,
}: {
  person: Person;
  badge?: string;
  onNavigate: (id: string) => void;
}) {
  const portrait = getPortrait(person.id);

  return (
    <button
      onClick={() => onNavigate(person.id)}
      className="w-full text-left rounded-lg flex items-center gap-2.5 transition-all group"
      style={{
        padding: "6px 10px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-dim)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-glow)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,148,42,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-dim)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      {/* Mini portrait */}
      <div
        className="shrink-0 rounded-full overflow-hidden"
        style={{
          width: 28,
          height: 28,
          border: "1px solid var(--border-dim)",
          background: "var(--bg-surface)",
        }}
      >
        {portrait ? (
          <Image src={portrait.src} alt={person.name} width={28} height={28} className="w-full h-full object-cover object-top" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)", fontSize: 10 }}>
            {person.name[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="block truncate"
          style={{
            fontSize: 13,
            color: person.isMainLineage ? "var(--gold-bright)" : "var(--text-primary)",
            fontFamily: "var(--font-garamond), Georgia, serif",
          }}
        >
          {person.name}
        </span>
      </div>

      {badge && (
        <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>
          {badge}
        </span>
      )}

      {person.isMainLineage && (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)", opacity: 0.6 }} />
      )}
    </button>
  );
}

function PortraitFallback({ person }: { person: Person }) {
  const isFemale = person.gender === "female";
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          background: isFemale ? "rgba(159,88,48,0.2)" : "rgba(200,148,42,0.15)",
          border: `2px solid ${isFemale ? "rgba(159,88,48,0.4)" : "rgba(200,148,42,0.3)"}`,
        }}
      >
        <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
          <circle cx="24" cy="16" r="9" />
          <path d="M8 44c0-9 7-15 16-15s16 6 16 15" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-3" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.1em" }}>
        No portrait available
      </p>
    </div>
  );
}
