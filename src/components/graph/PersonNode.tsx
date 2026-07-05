"use client";

import { memo } from "react";
import Image from "next/image";
import { Handle, Position, NodeProps } from "reactflow";
import { PersonNodeData } from "@/lib/graph/transform";
import { Person } from "@/types/person";
import { getPortrait } from "@/lib/data/portraitRefs";

const KEY_FIGURES = new Set(["adam", "noah", "abraham", "david", "jesus"]);

// ─── SVG Portrait fallback ─────────────────────────────────────────────────
// Clean tasteful silhouette — no cartoon face. Used only when no AI portrait
// is available. Keeps visual weight consistent with portrait cards.

function SvgPortrait({ person }: { person: Person }) {
  const isFemale = person.gender === "female";
  const isMain = person.isMainLineage;
  const bgTop = isMain ? "#1e1408" : "#131008";
  const bgBot = isMain ? "#0d0904" : "#090805";
  const silhouette = isMain ? "rgba(200,148,42,0.08)" : "rgba(255,255,255,0.05)";
  const id = `sil-${person.id}`;

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgTop} />
          <stop offset="100%" stopColor={bgBot} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      {/* Head */}
      <ellipse cx="50" cy="34" rx={isFemale ? 13 : 14} ry={isFemale ? 15 : 14} fill={silhouette} />
      {/* Shoulders / body */}
      {isFemale
        ? <path d="M20 100 Q20 68 50 60 Q80 68 80 100 Z" fill={silhouette} />
        : <path d="M16 100 Q16 65 50 58 Q84 65 84 100 Z" fill={silhouette} />}
      {/* Veil hint for female */}
      {isFemale && (
        <ellipse cx="50" cy="28" rx="18" ry="10" fill={silhouette} opacity="0.6" />
      )}
    </svg>
  );
}

// ─── Node ─────────────────────────────────────────────────────────────────────

function PersonNode({ data, selected }: NodeProps<PersonNodeData>) {
  const { person } = data;

  const isMainLine = person.isMainLineage === true;
  const isKeyFigure = KEY_FIGURES.has(person.id);
  const hasSignificance = !!(person.significance?.length);
  const portraitInfo = getPortrait(person.id);
  const nodeW = isMainLine ? 155 : 125;

  const isFemaleNode = person.gender === "female";

  // Border & glow colors — CSS variable tokens where possible
  const borderColor = selected
    ? "var(--gold-bright)"
    : isKeyFigure
      ? "var(--gold)"
      : isMainLine
        ? "var(--border-glow)"
        : isFemaleNode
          ? "var(--accent-female)"
          : "var(--border-dim)";

  const bg = isMainLine
    ? isKeyFigure
      ? "#0f0a04"
      : "var(--bg-base)"
    : isFemaleNode
      ? "#110608"
      : "var(--bg-base)";

  return (
    <div
      className="relative flex flex-col cursor-pointer select-none overflow-hidden rounded-xl transition-all duration-150"
      style={{
        width: nodeW,
        background: bg,
        border: `1.5px solid ${borderColor}`,
        boxShadow: selected
          ? isFemaleNode
            ? `0 0 0 1px rgba(160,64,96,0.4), 0 8px 32px rgba(160,64,96,0.35)`
            : `0 0 0 1px rgba(240,184,64,0.4), 0 8px 32px rgba(240,184,64,0.25)`
          : isKeyFigure
            ? `0 4px 20px rgba(200,148,42,0.2)`
            : isFemaleNode
              ? `0 2px 12px rgba(160,64,96,0.18)`
              : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2! h-2! opacity-0! pointer-events-none!"
      />

      {/* Portrait image */}
      <div className="relative overflow-hidden shrink-0" style={{ height: nodeW, width: nodeW }}>
        {portraitInfo ? (
          <Image
            src={portraitInfo.src}
            alt={person.name}
            fill
            className="object-cover object-top"
            sizes={`${nodeW}px`}
          />
        ) : (
          <SvgPortrait person={person} />
        )}

        {/* Bottom gradient fade */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 50%, ${bg} 100%)`,
          }}
        />

        {/* Female gender marker — top-left corner */}
        {isFemaleNode && (
          <span
            aria-label="Female"
            role="img"
            className="absolute top-1 left-1 flex items-center justify-center rounded-full leading-none"
            style={{
              width: 12,
              height: 12,
              fontSize: 8,
              background: "rgba(160,64,96,0.75)",
              border: "1px solid rgba(200,100,140,0.6)",
              color: "#f0c0d0",
              fontWeight: 700,
            }}
          >
            ♀
          </span>
        )}

        {/* Significance dot */}
        {hasSignificance && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#f0b840", boxShadow: "0 0 6px rgba(240,184,64,0.7)" }}
          />
        )}

        {/* Key figure glow ring */}
        {isKeyFigure && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: "inset 0 -20px 30px rgba(200,148,42,0.12)" }}
          />
        )}

        {/* Caption — scripture ref if available, else artistic interpretation.
            Minimum 8px so it remains legible; panel shows fuller caption at 10px. */}
        <div
          className="absolute bottom-0 left-0 right-0 px-1 py-0.5"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <p
            className="text-center leading-none italic truncate"
            style={{
              fontSize: 8,
              color: portraitInfo?.scriptureRef
                ? "rgba(240,184,64,0.75)"
                : "rgba(220,200,170,0.55)",
              fontFamily: "var(--font-garamond), Georgia, serif",
            }}
          >
            {portraitInfo?.scriptureRef
              ? `Based on ${portraitInfo.scriptureRef}`
              : "Artistic interpretation"}
          </p>
        </div>
      </div>

      {/* Name plate */}
      <div
        className="shrink-0 px-2 py-1.5 text-center"
        style={{ background: bg }}
      >
        <p
          className="font-atlas leading-tight"
          style={{
            fontSize: isMainLine ? 10 : 9,
            color: isKeyFigure ? "var(--gold-bright)" : isMainLine ? "var(--text-secondary)" : "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          {person.name}
        </p>
        {person.alternateNames?.[0] && (
          <p className="leading-none mt-0.5" style={{ fontSize: 7, color: "var(--text-muted)" }}>
            {person.alternateNames[0]}
          </p>
        )}
        {isMainLine && (
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full" style={{ background: "var(--gold)", opacity: 0.5 }} />
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2! h-2! opacity-0! pointer-events-none!"
      />
    </div>
  );
}

export default memo(PersonNode);
