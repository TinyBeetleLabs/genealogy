"use client";

import dynamic from "next/dynamic";
import { GraphData } from "@/types/graph";

interface Props {
  data: GraphData;
  onPersonSelect?: (id: string) => void;
  isActive?: boolean;
}

// Leaflet must never be server-rendered
const MapCanvas = dynamic<Props>(
  () => import("@/components/atlas/MapCanvas").then((mod) => mod.default),
  { ssr: false, loading: () => <MapLoading /> },
);

export default function MapView({ data, onPersonSelect, isActive = true }: Props) {
  return <MapCanvas data={data} onPersonSelect={onPersonSelect} isActive={isActive} />;
}

function MapLoading() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: "var(--bg-base)" }}>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", fontSize: 13, letterSpacing: "0.1em" }}>
        Loading map…
      </p>
    </div>
  );
}
