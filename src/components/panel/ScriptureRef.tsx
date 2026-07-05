"use client";

import { ScriptureRef } from "@/types/person";

interface Props {
  refs: ScriptureRef[];
  label?: string;
}

export default function ScriptureRefList({ refs, label }: Props) {
  if (!refs || refs.length === 0) return null;

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/70">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {refs.map((ref, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium
                       bg-amber-950/60 border border-amber-800/40 text-amber-200
                       hover:bg-amber-900/60 transition-colors cursor-default"
            title={ref.display}
          >
            {ref.display}
          </span>
        ))}
      </div>
    </div>
  );
}
