"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import Sidebar from "@/components/layout/Sidebar";
import GenealogyGraph, { GenealogyGraphHandle } from "@/components/graph/GenealogyGraph";
import { GRAPH_TIMELINE_BAR_HEIGHT } from "@/components/graph/TimelineBar";
import PersonPanel from "@/components/panel/PersonPanel";
import WelcomePanel from "@/components/atlas/WelcomePanel";
import TimelineView from "@/components/atlas/TimelineView";
import MapView from "@/components/atlas/MapView";
import PeopleDirectoryView from "@/components/atlas/PeopleDirectoryView";
import { getParents, getChildren, getSiblings, getConnectedRelationships } from "@/lib/graph/query";

type View = "graph" | "timeline" | "map" | "people";

function getSpouses(personId: string, data: GraphData): Person[] {
  const ids = data.relationships
    .filter(r => r.type === "spouse" && (r.source === personId || r.target === personId))
    .map(r => (r.source === personId ? r.target : r.source));
  return data.people.filter(p => ids.includes(p.id));
}

export default function AtlasShell({ data }: { data: GraphData }) {
  const [view, setView] = useState<View>("graph");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const graphRef = useRef<GenealogyGraphHandle>(null);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handlePersonSelect = useCallback((person: Person | null) => {
    setSelectedPerson(person);
    if (person) setMobileSheetOpen(true);
  }, []);

  const navigateTo = useCallback((id: string) => {
    setMobileSheetOpen(false);
    if (view !== "graph") {
      setView("graph");
      setPendingId(id);
    } else {
      graphRef.current?.navigateTo(id);
    }
  }, [view]);

  const handleViewChange = useCallback((next: View) => {
    setView(next);
    if (next !== "graph") setMobileSheetOpen(false);
  }, []);

  // Graph stays mounted when switching tabs — onReady only fires once, so apply
  // pending cross-view navigation (e.g. Map → "View in Family Tree") here.
  useEffect(() => {
    if (view !== "graph" || !pendingId) return;
    const id = pendingId;
    const timer = setTimeout(() => {
      graphRef.current?.navigateTo(id);
      setPendingId(null);
    }, 150);
    return () => clearTimeout(timer);
  }, [view, pendingId]);

  const handleGraphReady = useCallback(() => {
    if (pendingId) {
      const id = pendingId;
      setTimeout(() => {
        graphRef.current?.navigateTo(id);
        setPendingId(null);
      }, 500);
    }
  }, [pendingId]);

  const handlePanelClose = useCallback(() => {
    setSelectedPerson(null);
    setMobileSheetOpen(false);
    graphRef.current?.clearSelection();
  }, []);

  const parents = selectedPerson ? getParents(selectedPerson.id, data) : [];
  const children = selectedPerson ? getChildren(selectedPerson.id, data) : [];
  const spouses = selectedPerson ? getSpouses(selectedPerson.id, data) : [];
  const siblings = selectedPerson ? getSiblings(selectedPerson.id, data) : [];
  const connectedRels = selectedPerson ? getConnectedRelationships(selectedPerson.id, data) : [];

  const mainLineCount = data.people.filter(p => p.isMainLineage).length;
  const branchCount = data.people.filter(p => !p.isMainLineage).length;

  const panelContent = selectedPerson ? (
    <PersonPanel
      person={selectedPerson}
      parents={parents}
      children={children}
      spouses={spouses}
      siblings={siblings}
      relationships={connectedRels}
      onClose={handlePanelClose}
      onNavigate={navigateTo}
    />
  ) : (
    <WelcomePanel people={data.people} onSelect={navigateTo} />
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* ── Header ─────────────────────────────── */}
      <header
        className="shrink-0 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center z-30"
        style={{ height: 56, background: "var(--bg-panel)", borderBottom: "1px solid var(--border-dim)", padding: "0 16px" }}
      >
        <div className="shrink-0 flex items-center gap-2.5 md:gap-3.5 md:justify-self-start">
          <CompassRose />
          <div>
            <h1 className="leading-none tracking-widest uppercase" style={{ fontFamily: "var(--font-cinzel), Georgia, serif", fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.18em" }}>
              Genealogy Atlas
            </h1>
            <p className="leading-none mt-0.5 italic hidden md:block" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              A Living Map of Biblical History
            </p>
          </div>
        </div>

        {/* Header view tabs — grid-centered on desktop so width changes in left/right columns don't shift them */}
        <div className="hidden md:flex md:justify-self-center">
          <div className="flex items-center gap-0.5 md:gap-1 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dim)" }}>
            <ViewTab label="Family Tree" active={view === "graph"} icon={<GraphIcon />} onClick={() => handleViewChange("graph")} mobile={false} />
            <ViewTab label="People" active={view === "people"} icon={<PeopleIcon />} onClick={() => handleViewChange("people")} mobile={false} />
            <ViewTab label="Timeline" active={view === "timeline"} icon={<TimelineIcon />} onClick={() => handleViewChange("timeline")} mobile={false} />
            <ViewTab label="Map" active={view === "map"} icon={<MapIcon />} onClick={() => handleViewChange("map")} mobile={false} />
          </div>
        </div>

        {/* Stats — hidden on small screens */}
        <div className="shrink-0 ml-auto md:ml-0 hidden md:flex items-center gap-5 text-right md:justify-self-end" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          <button
            type="button"
            onClick={handlePanelClose}
            className="rounded-full px-3 py-1 transition-colors hover:text-[--gold-bright]"
            style={{
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              border: "1px solid var(--border-dim)",
              fontFamily: "var(--font-cinzel), serif",
              visibility: view === "graph" && selectedPerson ? "visible" : "hidden",
            }}
            disabled={!(view === "graph" && selectedPerson)}
            tabIndex={view === "graph" && selectedPerson ? 0 : -1}
            aria-hidden={!(view === "graph" && selectedPerson)}
          >
            Clear selection
          </button>
          <div>
            <p className="leading-none" style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>{mainLineCount}</p>
            <p className="leading-none mt-0.5" style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.08em" }}>IN MESSIANIC LINE</p>
          </div>
          <div className="w-px h-6" style={{ background: "var(--border-dim)" }} />
          <div>
            <p className="leading-none" style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600 }}>{branchCount}</p>
            <p className="leading-none mt-0.5" style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.08em" }}>BRANCH FIGURES</p>
          </div>
        </div>

        {/* Mobile: search/panel toggle — graph only (other views are self-contained) */}
        {isMobile && view === "graph" && (
          <button
            onClick={() => { setSelectedPerson(null); setMobileSheetOpen(v => !v); }}
            className="shrink-0 ml-2 flex items-center justify-center rounded-lg"
            style={{ width: 44, height: 44, background: mobileSheetOpen ? "rgba(200,148,42,0.15)" : "transparent", border: "1px solid var(--border-dim)", color: mobileSheetOpen ? "var(--gold)" : "var(--text-muted)" }}
            aria-label={mobileSheetOpen ? "Close search panel" : "Open search panel"}
            aria-expanded={mobileSheetOpen}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      {/* ── Body ───────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex flex-col self-stretch shrink-0 min-h-0">
          <Sidebar view={view} onViewChange={handleViewChange} className="flex-1 min-h-0" />
          {view === "graph" && (
            <div
              className="shrink-0"
              style={{
                height: GRAPH_TIMELINE_BAR_HEIGHT,
                borderTop: "1px solid var(--border-dim)",
                background: "var(--bg-panel)",
              }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Desktop: left orientation panel — Family Tree only */}
        {!isMobile && view === "graph" && (
          <div
            className="shrink-0 self-stretch flex flex-col min-h-0"
            style={{
              width: panelCollapsed ? 20 : "calc(var(--panel-width) + 20px)",
              transition: "width 320ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Sliding panel */}
              <div
                className="shrink-0 flex flex-col min-h-0 overflow-hidden h-full"
                style={{
                  width: panelCollapsed ? 0 : "var(--panel-width)",
                  transition: "width 320ms cubic-bezier(0.4,0,0.2,1)",
                  borderRight: panelCollapsed ? "none" : "1px solid var(--border-dim)",
                  background: "var(--bg-panel)",
                }}
              >
                <div className="flex-1 min-h-0 overflow-hidden" style={{ width: "var(--panel-width)" }}>
                  {panelContent}
                </div>
              </div>

              {/* Toggle tab — compact, vertically centered */}
              <button
                onClick={() => setPanelCollapsed(c => !c)}
                aria-label={panelCollapsed ? "Expand side panel" : "Collapse side panel"}
                aria-expanded={!panelCollapsed}
                className="shrink-0 self-center relative z-20 flex items-center justify-center hover:text-[--gold] hover:bg-[rgba(200,148,42,0.08)] transition-colors duration-150"
                style={{
                  width: 20,
                  height: 64,
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-dim)",
                  borderLeft: panelCollapsed ? "1px solid var(--border-dim)" : "none",
                  borderRadius: "0 6px 6px 0",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <svg
                  viewBox="0 0 6 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 10,
                    transform: panelCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 320ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <polyline points="1,1 5,5 1,9" />
                </svg>
              </button>
            </div>

            {/* Footer pad — spans panel + toggle, aligns with TimelineBar */}
            <div
              className="shrink-0"
              style={{
                height: GRAPH_TIMELINE_BAR_HEIGHT,
                borderTop: "1px solid var(--border-dim)",
                background: "var(--bg-panel)",
              }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Main content — all views stay mounted so selection & scroll state persist */}
        <main className="flex-1 overflow-hidden relative">
          <div
            className={view === "graph" ? "absolute inset-0" : "hidden"}
            aria-hidden={view !== "graph"}
          >
            <GenealogyGraph
              ref={graphRef}
              data={data}
              onPersonSelect={handlePersonSelect}
              onReady={handleGraphReady}
              isActive={view === "graph"}
            />
          </div>
          <div
            className={view === "timeline" ? "absolute inset-0" : "hidden"}
            aria-hidden={view !== "timeline"}
          >
            <TimelineView data={data} onSelect={navigateTo} />
          </div>
          <div
            className={view === "map" ? "absolute inset-0" : "hidden"}
            aria-hidden={view !== "map"}
          >
            <MapView data={data} onPersonSelect={navigateTo} isActive={view === "map"} />
          </div>
          <div
            className={view === "people" ? "absolute inset-0" : "hidden"}
            aria-hidden={view !== "people"}
          >
            <PeopleDirectoryView data={data} onNavigateToGraph={navigateTo} />
          </div>
        </main>

        {/* Mobile: bottom sheet — graph welcome/details only */}
        {isMobile && view === "graph" && (
          <>
            {/* Backdrop */}
            {mobileSheetOpen && (
              <div
                className="absolute inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => setMobileSheetOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Sheet — anchored to bottom-0 so translateY(100%) hides it exactly flush */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Person details"
              className="absolute left-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl transition-transform duration-300"
              style={{
                height: "75vh",
                background: "var(--bg-panel)",
                borderTop: "1px solid var(--border-dim)",
                transform: mobileSheetOpen ? "translateY(0)" : "translateY(100%)",
              }}
              onKeyDown={e => { if (e.key === "Escape") setMobileSheetOpen(false); }}
            >
              {/* Drag handle — decorative */}
              <div className="shrink-0 flex justify-center pt-3 pb-1" aria-hidden="true">
                <div className="w-8 h-1 rounded-full" style={{ background: "var(--border-dim)" }} />
              </div>
              {/* pb-12 clears the 48px bottom nav when the sheet is fully open */}
              <div className="flex-1 overflow-hidden pb-12">
                {panelContent}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile: bottom navigation bar */}
      {isMobile && (
        <nav
          aria-label="Main navigation"
          className="shrink-0 flex items-center justify-around z-50"
          style={{ height: 48, background: "var(--bg-panel)", borderTop: "1px solid var(--border-dim)" }}
        >
          {[
            { view: "graph" as View, label: "Tree", icon: <GraphIcon /> },
            { view: "people" as View, label: "People", icon: <PeopleIcon /> },
            { view: "timeline" as View, label: "Timeline", icon: <TimelineIcon /> },
            { view: "map" as View, label: "Map", icon: <MapIcon /> },
          ].map(item => (
            <button
              key={item.view}
              aria-label={item.label}
              aria-current={view === item.view ? "page" : undefined}
              onClick={() => handleViewChange(item.view)}
              className="flex flex-col items-center justify-center gap-0.5"
              style={{ flex: 1, height: "100%", color: view === item.view ? "var(--gold)" : "var(--text-muted)" }}
            >
              {item.icon}
              <span aria-hidden="true" style={{ fontSize: 10, fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.05em" }}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ─── Header sub-components ────────────────────────────────────────────────────

function CompassRose() {
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#2a1e0a" strokeWidth="1" />
      <circle cx="20" cy="20" r="13" stroke="#2a1e0a" strokeWidth="0.5" />
      <path d="M20 4 L22 18 L20 20 L18 18 Z" fill="#c8942a" />
      <path d="M20 36 L18 22 L20 20 L22 22 Z" fill="#5a3a0a" />
      <path d="M36 20 L22 18 L20 20 L22 22 Z" fill="#5a3a0a" />
      <path d="M4 20 L18 22 L20 20 L18 18 Z" fill="#5a3a0a" />
      <path d="M31.1 8.9 L21.4 18.6 L20 20 L21.4 21.4 L31.1 31.1" stroke="#3a2a10" strokeWidth="0.8" />
      <path d="M8.9 8.9 L18.6 18.6 L20 20 L18.6 21.4 L8.9 31.1" stroke="#3a2a10" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="3" fill="#c8942a" />
      <circle cx="20" cy="20" r="1.5" fill="#0d0a06" />
      <text x="20" y="11.5" textAnchor="middle" fontSize="5" fill="#c8942a" fontFamily="serif" fontWeight="bold">N</text>
    </svg>
  );
}

function ViewTab({ label, active, icon, onClick }: {
  label: string; active?: boolean; icon: React.ReactNode; onClick?: () => void; mobile?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="relative flex items-center gap-1.5 rounded-md transition-all cursor-pointer"
      style={{
        background: active ? "rgba(200,148,42,0.12)" : "transparent",
        border: "none",
        padding: "6px 12px",
        minHeight: 36,
      }}
    >
      <span aria-hidden="true" style={{ color: active ? "var(--gold)" : "var(--text-muted)" }}>{icon}</span>
      <span style={{ fontSize: 10, color: active ? "var(--gold)" : "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

function GraphIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <circle cx="8" cy="3" r="1.5" /><circle cx="3" cy="12" r="1.5" /><circle cx="13" cy="12" r="1.5" />
      <path d="M8 4.5v3L3 11M8 7.5L13 11" strokeLinecap="round" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M2 8h12M6 4l-4 4 4 4M10 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2a10 10 0 0 1 0 12M8 2a10 10 0 0 0 0 12" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
      <circle cx="5.5" cy="4.5" r="2" />
      <circle cx="10.5" cy="4.5" r="2" />
      <path d="M1 14v-1.5a3.5 3.5 0 0 1 3.5-3.5h3A3.5 3.5 0 0 1 11 12.5V14" strokeLinecap="round" />
      <path d="M12.5 7.5c1.2.3 2 1.4 2 2.7V14" strokeLinecap="round" />
    </svg>
  );
}
