"use client";

import { useEffect, useRef, useState, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Tooltip, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";

import { GraphData } from "@/types/graph";
import { BiblicalLocation, MigrationRoute } from "@/types/location";
import { LOCATIONS, MIGRATIONS, MAP_ERA_LABELS, migrationMatchesMapEra, getPeopleAtLocation } from "@/lib/data/mapData";
import { getPortrait } from "@/lib/data/portraitRefs";
import { Person } from "@/types/person";

interface Props {
  data: GraphData;
  onPersonSelect?: (id: string) => void;
  /** False while another tab is visible — avoids Leaflet init in a hidden container */
  isActive?: boolean;
}

const ALL_ERAS = MAP_ERA_LABELS;

/** Mobile-safe map policy — see docs/UX-PATTERNS.md § Map performance */
const MAP_MAX_BOUNDS: L.LatLngBoundsExpression = [[22, 24], [42, 55]];
const MAP_MAX_ZOOM = 14;
const MAP_FIT_BOUNDS_MAX_ZOOM = 10;
const MAP_LOCATION_ZOOM = 7;

type MapCameraTarget =
  | { kind: "point"; coords: [number, number]; zoom?: number }
  | { kind: "bounds"; waypoints: [number, number][] };

// ── Fix Leaflet default icon paths broken by webpack ─────────────────────────
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

// ── Custom DivIcon for settlement / place pins (distinct from route waypoints) ─
function makeLocationIcon(hasPortraits: boolean, isSelected: boolean) {
  const w = isSelected ? 22 : 16;
  const h = isSelected ? 28 : 20;
  const fill = isSelected ? "#c8942a" : "rgba(200,148,42,0.75)";
  const stroke = isSelected ? "#f0c060" : "rgba(240,192,96,0.5)";
  const pulse = isSelected ? `<span class="map-pin-pulse"></span>` : "";
  const innerDot = hasPortraits
    ? `<circle cx="12" cy="10" r="3" fill="#0d0a06" opacity="0.35"/>`
    : "";
  return L.divIcon({
    className: "",
    html: `<div class="map-location-pin${isSelected ? " selected" : ""}" style="width:${w}px;height:${h}px;position:relative;">${pulse}<svg viewBox="0 0 24 30" width="${w}" height="${h}" aria-hidden="true"><path d="M12 1C7.03 1 3 5.03 3 10c0 7.25 9 18.5 9 18.5s9-11.25 9-18.5C21 5.03 16.97 1 12 1z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${innerDot}</svg></div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

// ── Migration route markers (start / end / steps) ─────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeRouteEndpointIcon(
  role: "start" | "end",
  placeName: string | undefined,
  selected: boolean,
  showPlace: boolean,
): L.DivIcon {
  const pillW = selected ? 40 : 34;
  const pillH = selected ? 24 : 20;
  const tag = role === "start" ? "START" : "END";
  const cls = role === "start" ? "map-route-start" : "map-route-end";
  const placeHtml =
    showPlace && placeName
      ? `<span class="map-route-place">${escapeHtml(placeName)}</span>`
      : "";
  const html = `<div class="map-route-marker-wrap"><div class="${cls}${selected ? " selected" : ""}">${tag}</div>${placeHtml}</div>`;
  const labelW = placeName ? Math.min(placeName.length * 6 + 10, 110) : 0;
  const width = Math.max(pillW, labelW);
  const height = pillH + (placeHtml ? 15 : 0);
  return L.divIcon({
    className: "",
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, pillH / 2],
  });
}

function makeRouteStepIcon(step: number, color: string, placeName?: string): L.DivIcon {
  const circleSize = 20;
  const placeHtml = placeName
    ? `<span class="map-route-place">${escapeHtml(placeName)}</span>`
    : "";
  const html = `<div class="map-route-marker-wrap"><div class="map-route-step" style="border-color:${color};color:${color}">${step}</div>${placeHtml}</div>`;
  const labelW = placeName ? Math.min(placeName.length * 6 + 10, 110) : 0;
  const width = Math.max(circleSize, labelW);
  const height = circleSize + (placeHtml ? 15 : 0);
  return L.divIcon({
    className: "",
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, circleSize / 2],
  });
}

function MigrationRouteLayer({
  route,
  isSelected,
  onSelect,
}: {
  route: MigrationRoute;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const wps = route.waypoints.filter(isValidCoords);
  if (wps.length < 2) return null;

  const labels = route.waypointLabels ?? [];
  const placeAt = (i: number) => labels[i] ?? "";

  const start = wps[0];
  const end = wps[wps.length - 1];
  const middle = wps.slice(1, -1);
  const selectHandlers = { click: onSelect };

  return (
    <>
      <Polyline
        positions={wps}
        pathOptions={{
          color: isSelected ? route.color : route.color + "88",
          weight: isSelected ? 2 : 1,
          dashArray: "6 5",
          opacity: isSelected ? 1 : 0.45,
        }}
        eventHandlers={{
          click: onSelect,
          mouseover: (e) => e.target.setStyle({ opacity: 1, weight: 2 }),
          mouseout: (e) =>
            e.target.setStyle({ opacity: isSelected ? 1 : 0.45, weight: isSelected ? 2 : 1 }),
        }}
      />
      {isSelected && (
        <>
          <Marker
            position={start}
            icon={makeRouteEndpointIcon("start", placeAt(0), isSelected, true)}
            eventHandlers={selectHandlers}
          />
          <Marker
            position={end}
            icon={makeRouteEndpointIcon("end", placeAt(wps.length - 1), isSelected, true)}
            eventHandlers={selectHandlers}
          />
        </>
      )}
      {isSelected &&
        middle.map((wp, i) => (
          <Marker
            key={`step-${i}`}
            position={wp}
            icon={makeRouteStepIcon(i + 2, route.color, placeAt(i + 1))}
            eventHandlers={selectHandlers}
          />
        ))}
    </>
  );
}

// ── Fly-to helper component ───────────────────────────────────────────────────
function isValidCoords(coords: [number, number] | null | undefined): coords is [number, number] {
  if (!coords || coords.length < 2) return false;
  return Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
}

function MapVisibilitySync({ isActive }: { isActive: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!isActive) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [isActive, map]);
  return null;
}

function mapMotionDuration(): number {
  if (typeof window === "undefined") return 1.2;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.2;
}

function MapCameraSync({
  target,
  isActive,
}: {
  target: MapCameraTarget | null;
  isActive: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!isActive || !target) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
      const duration = mapMotionDuration();
      if (target.kind === "point" && isValidCoords(target.coords)) {
        map.flyTo(target.coords, target.zoom ?? MAP_LOCATION_ZOOM, { duration });
        return;
      }
      if (target.kind === "bounds" && target.waypoints.length > 0) {
        if (target.waypoints.length === 1) {
          map.flyTo(target.waypoints[0], MAP_LOCATION_ZOOM, { duration });
        } else {
          const bounds = L.latLngBounds(target.waypoints);
          map.flyToBounds(bounds.pad(0.12), {
            duration,
            maxZoom: MAP_FIT_BOUNDS_MAX_ZOOM,
          });
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [map, target, isActive]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MapCanvas({ data, onPersonSelect, isActive = true }: Props) {
  const [selectedEra, setSelectedEra] = useState("All Eras");
  const [selectedLocation, setSelectedLocation] = useState<BiblicalLocation | null>(null);
  const [selectedMigration, setSelectedMigration] = useState<MigrationRoute | null>(null);
  const [cameraTarget, setCameraTarget] = useState<MapCameraTarget | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mapHelpOpen, setMapHelpOpen] = useState(true);
  const [lastMigrationId, setLastMigrationId] = useState<string | null>(null);
  const [mapMounted, setMapMounted] = useState(false);
  const mapHelpScrollRef = useRef<HTMLDivElement>(null);
  const iconsFixed = useRef(false);

  // Defer Leaflet mount until the map tab is visited (hidden containers break flyTo)
  useEffect(() => {
    if (isActive) setMapMounted(true);
  }, [isActive]);

  useEffect(() => {
    if (!iconsFixed.current) { fixLeafletIcons(); iconsFixed.current = true; }
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const allPersonIds = useMemo(() => data.people.map(p => p.id), [data.people]);

  const visibleLocations = useMemo(() =>
    LOCATIONS.filter(loc =>
      selectedEra === "All Eras" || loc.era === selectedEra
    ),
    [selectedEra]
  );

  const visibleMigrations = useMemo(() =>
    MIGRATIONS.filter(m => migrationMatchesMapEra(m, selectedEra)),
    [selectedEra]
  );

  const handleEraClick = (era: string) => {
    if (era === selectedEra && era !== "All Eras") {
      setSelectedEra("All Eras");
      setSelectedMigration(null);
      setSelectedLocation(null);
      setMapHelpOpen(true);
      return;
    }
    setSelectedEra(era);
  };

  const handleMigrationSelect = (route: MigrationRoute) => {
    // When browsing all eras, jump to the route's era so list and map stay in sync
    if (selectedEra === "All Eras" && route.era) {
      setSelectedEra(route.era);
    }
    setSelectedMigration(route);
    setSelectedLocation(null);
    const wps = route.waypoints.filter(isValidCoords);
    if (wps.length > 0) {
      setCameraTarget(
        wps.length === 1
          ? { kind: "point", coords: wps[0], zoom: MAP_LOCATION_ZOOM }
          : { kind: "bounds", waypoints: wps },
      );
    }
  };

  const handleMigrationClose = () => {
    if (selectedMigration) setLastMigrationId(selectedMigration.id);
    setSelectedMigration(null);
    setMapHelpOpen(true);
  };

  const handleLocationClose = () => {
    setSelectedLocation(null);
    setMapHelpOpen(true);
  };

  // Scroll migration list to last viewed route when reopening the floating guide
  useEffect(() => {
    if (!mapHelpOpen || !lastMigrationId) return;
    const el = document.getElementById(`migration-${lastMigrationId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }, [mapHelpOpen, lastMigrationId, visibleMigrations]);

  // Drop inspector selection if it falls outside the active era filter
  useEffect(() => {
    if (selectedMigration && !migrationMatchesMapEra(selectedMigration, selectedEra)) {
      setSelectedMigration(null);
    }
    if (selectedLocation && selectedEra !== "All Eras" && selectedLocation.era !== selectedEra) {
      setSelectedLocation(null);
    }
  }, [selectedEra, selectedMigration, selectedLocation]);

  const handleLocationClick = (loc: BiblicalLocation) => {
    setSelectedLocation(loc);
    setSelectedMigration(null);
    if (isValidCoords(loc.coordinates)) {
      setCameraTarget({ kind: "point", coords: loc.coordinates, zoom: MAP_LOCATION_ZOOM });
    }
  };

  const handlePersonClick = (id: string) => {
    onPersonSelect?.(id);
  };

  const inspectorOpen = Boolean(selectedLocation || selectedMigration);

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Era filter bar ──────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label="Filter locations by era"
        className="shrink-0 flex items-center gap-2 px-4 overflow-x-auto z-20"
        style={{ height: 48, background: "var(--bg-panel)", borderBottom: "1px solid var(--border-dim)" }}
      >
        <span aria-hidden="true" style={{ fontSize: 9, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", paddingRight: 4 }}>
          Era
        </span>
        {ALL_ERAS.map(era => (
          <button
            key={era}
            onClick={() => handleEraClick(era)}
            aria-pressed={selectedEra === era}
            className="shrink-0 rounded-full px-3 transition-all"
            style={{
              fontSize: 10,
              minHeight: 32,
              fontFamily: "var(--font-cinzel), serif",
              letterSpacing: "0.06em",
              border: `1px solid ${selectedEra === era ? "var(--gold)" : "var(--border-dim)"}`,
              background: selectedEra === era ? "rgba(200,148,42,0.15)" : "transparent",
              color: selectedEra === era ? "var(--gold)" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {era}
          </button>
        ))}
      </div>

      {/* ── Map (always full width) + inspector overlay ─────────── */}
      <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">

        <div className="absolute inset-0 z-10">
          {!mapMounted ? (
            <div className="flex items-center justify-center h-full" style={{ background: "#0d0d0a" }}>
              <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", fontSize: 13 }}>
                Loading map…
              </p>
            </div>
          ) : (
          <MapContainer
            center={[31.0, 36.0]}
            zoom={5}
            minZoom={4}
            maxZoom={MAP_MAX_ZOOM}
            maxBounds={MAP_MAX_BOUNDS}
            maxBoundsViscosity={0.85}
            style={{ height: "100%", width: "100%", background: "#0d0d0a" }}
            zoomControl={false}
            attributionControl={true}
          >
            <ZoomControl position="topright" />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={MAP_MAX_ZOOM}
            />

            <MapVisibilitySync isActive={isActive} />
            <MapCameraSync target={cameraTarget} isActive={isActive} />

            {visibleLocations.map(loc => {
              const peopleHere = getPeopleAtLocation(loc.id, allPersonIds);
              const isSelected = selectedLocation?.id === loc.id;
              const approxRadius = loc.approximateRadiusMeters;
              return (
                <Fragment key={loc.id}>
                  {approxRadius != null && approxRadius > 0 && (
                    <Circle
                      center={loc.coordinates}
                      radius={approxRadius}
                      pathOptions={{
                        color: isSelected ? "#c8942a" : "rgba(200,148,42,0.4)",
                        fillColor: "rgba(200,148,42,0.12)",
                        fillOpacity: isSelected ? 0.14 : 0.06,
                        weight: isSelected ? 1.5 : 1,
                        dashArray: "5 7",
                      }}
                    />
                  )}
                  <Marker
                    position={loc.coordinates}
                    icon={makeLocationIcon(peopleHere.length > 0, isSelected)}
                    eventHandlers={{ click: () => handleLocationClick(loc) }}
                  >
                    {isSelected && (
                      <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -30]}
                        className="map-location-tooltip"
                      >
                        {loc.name}
                      </Tooltip>
                    )}
                  </Marker>
                </Fragment>
              );
            })}

            {visibleMigrations.map(route => (
              <MigrationRouteLayer
                key={route.id}
                route={route}
                isSelected={selectedMigration?.id === route.id}
                onSelect={() => handleMigrationSelect(route)}
              />
            ))}
          </MapContainer>
          )}
        </div>

        {/* Floating orientation card — map-only pattern (see docs/UX-PATTERNS.md) */}
        {!inspectorOpen && mapHelpOpen && (
          <div
            className="absolute z-30 flex flex-col overflow-hidden rounded-xl shadow-2xl"
            style={{
              bottom: isMobile ? 16 : 24,
              left: isMobile ? 12 : 24,
              right: isMobile ? 12 : undefined,
              width: isMobile ? undefined : "var(--panel-width)",
              maxHeight: isMobile ? "min(calc(50% + 84px), calc(100% - 48px))" : "min(calc(50% + 76px), calc(100% - 56px))",
              background: "var(--bg-panel)",
              border: "1px solid var(--border-dim)",
            }}
          >
            <div className="shrink-0 flex justify-end px-2 pt-2">
              <button
                type="button"
                onClick={() => setMapHelpOpen(false)}
                aria-label="Dismiss map guide"
                className="flex items-center justify-center rounded-full"
                style={{ width: 32, height: 32, color: "var(--text-muted)" }}
              >
                <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </div>
            <div ref={mapHelpScrollRef} className="flex-1 min-h-0 overflow-y-auto -mt-2">
              <MapWelcome
                migrations={visibleMigrations}
                highlightMigrationId={lastMigrationId}
                onMigrationClick={handleMigrationSelect}
              />
            </div>
          </div>
        )}

        {!inspectorOpen && !mapHelpOpen && (
          <button
            type="button"
            onClick={() => setMapHelpOpen(true)}
            className="absolute z-30 rounded-full px-4 py-2"
            style={{
              bottom: isMobile ? 16 : 24,
              left: isMobile ? 12 : 24,
              background: "var(--bg-panel)",
              border: "1px solid var(--border-dim)",
              color: "var(--gold)",
              fontFamily: "var(--font-cinzel), serif",
              fontSize: 10,
              letterSpacing: "0.08em",
            }}
          >
            Routes &amp; legend
          </button>
        )}

        {/* Right inspector — slides over map when pin/route selected */}
        <div
          role="dialog"
          aria-modal={inspectorOpen}
          aria-label={
            selectedLocation ? `${selectedLocation.name} details` :
            selectedMigration ? `${selectedMigration.label} details` :
            "Map details"
          }
          className="absolute top-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden"
          style={{
            width: isMobile ? "100%" : "var(--panel-width)",
            background: "var(--bg-panel)",
            borderLeft: isMobile ? "none" : "1px solid var(--border-dim)",
            transform: inspectorOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform var(--duration-panel) var(--ease-panel)",
            boxShadow: inspectorOpen ? (isMobile ? "none" : "-8px 0 32px rgba(0,0,0,0.5)") : "none",
          }}
          onKeyDown={e => {
            if (e.key === "Escape") {
              if (selectedMigration) handleMigrationClose();
              else if (selectedLocation) handleLocationClose();
            }
          }}
        >
          {selectedLocation ? (
            <LocationCard
              location={selectedLocation}
              people={data.people}
              allPersonIds={allPersonIds}
              onPersonClick={handlePersonClick}
              onClose={handleLocationClose}
            />
          ) : selectedMigration ? (
            <MigrationCard
              migration={selectedMigration}
              people={data.people}
              onPersonClick={handlePersonClick}
              onClose={handleMigrationClose}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Location card ─────────────────────────────────────────────────────────────
function LocationCard({ location, people, allPersonIds, onPersonClick, onClose }: {
  location: BiblicalLocation;
  people: Person[];
  allPersonIds: string[];
  onPersonClick: (id: string) => void;
  onClose: () => void;
}) {
  const peopleHere = getPeopleAtLocation(location.id, allPersonIds)
    .map(id => people.find(p => p.id === id))
    .filter(Boolean) as Person[];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div>
          <p style={{ fontSize: 9, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {location.region}
          </p>
          <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, color: "var(--gold)", marginTop: 2 }}>
            {location.name}
          </h2>
          <p style={{ fontSize: 10, color: "var(--gold-dim)", marginTop: 4, fontFamily: "var(--font-cinzel), serif" }}>
            {location.era}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close location details"
          className="shrink-0 flex items-center justify-center rounded-full transition-all hover:bg-[rgba(200,148,42,0.1)] hover:text-[--gold]"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
        >
          <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        {location.approximateRadiusMeters != null && location.approximateRadiusMeters > 0 && (
          <p
            className="mb-3 rounded-lg px-3 py-2"
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-garamond), Georgia, serif",
              lineHeight: 1.5,
              fontStyle: "italic",
              background: "rgba(200,148,42,0.06)",
              border: "1px dashed rgba(200,148,42,0.25)",
            }}
          >
            Approximate region — the dashed circle on the map shows the general area; the exact site is not known from scripture.
          </p>
        )}
        <p style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {location.description}
        </p>
        <p className="mt-3" style={{ fontSize: 10, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif" }}>
          {location.scriptureRef}
        </p>
      </div>

      {/* People here */}
      {peopleHere.length === 0 ? (
        <div className="px-5 py-4">
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif", fontStyle: "italic" }}>
            No figures from this genealogy are pinned to this location on the map. Check migration routes in the guide panel for journeys that passed through here.
          </p>
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="mb-3" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Biblical figures here
          </p>
          <div className="space-y-2">
            {peopleHere.map(person => {
              const portrait = getPortrait(person.id);
              return (
                <button
                  key={person.id}
                  onClick={() => onPersonClick(person.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dim)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.08)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                >
                  <div className="shrink-0 rounded-full overflow-hidden" style={{ width: 34, height: 34, border: `1.5px solid ${person.isMainLineage ? "var(--gold)" : "var(--border-dim)"}` }}>
                    {portrait
                      ? <Image src={portrait.src} alt={person.name} width={34} height={34} className="w-full h-full object-cover object-top" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-surface)", color: "var(--text-muted)", fontSize: 12 }}>{person.name[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate" style={{ fontSize: 13, color: person.isMainLineage ? "var(--gold-bright)" : "var(--text-primary)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
                      {person.name}
                    </span>
                    <span className="block truncate mt-0.5" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.05em" }}>
                      {person.era}
                    </span>
                  </div>
                  {person.isMainLineage && <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)", opacity: 0.7 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Migration card ────────────────────────────────────────────────────────────

function MigrationDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p className="mt-0.5" style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.5 }}>
        {value}
      </p>
    </div>
  );
}

function MigrationCard({ migration, people, onPersonClick, onClose }: {
  migration: MigrationRoute;
  people: Person[];
  onPersonClick: (id: string) => void;
  onClose: () => void;
}) {
  const person = people.find(p => p.id === migration.personId);
  const portrait = person ? getPortrait(person.id) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div>
          <p style={{ fontSize: 9, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Migration Route
          </p>
          <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700, color: migration.color, marginTop: 2 }}>
            {migration.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close migration details"
          className="shrink-0 flex items-center justify-center rounded-full transition-all hover:bg-[rgba(200,148,42,0.1)] hover:text-[--gold]"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
        >
          <svg viewBox="0 0 12 12" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>

      {/* Person */}
      {person && (
        <button
          className="mx-5 mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${migration.color}44` }}
          onClick={() => onPersonClick(person.id)}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(200,148,42,0.08)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
        >
          <div className="shrink-0 rounded-full overflow-hidden" style={{ width: 40, height: 40, border: `2px solid ${migration.color}` }}>
            {portrait
              ? <Image src={portrait.src} alt={person.name} width={40} height={40} className="w-full h-full object-cover object-top" unoptimized />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-surface)", color: "var(--text-muted)", fontSize: 14 }}>{person.name[0]}</div>
            }
          </div>
          <div>
            <span className="block" style={{ fontSize: 14, color: "var(--text-primary)", fontFamily: "var(--font-cinzel), serif" }}>{person.name}</span>
            <span className="block mt-0.5" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif" }}>View in Family Tree →</span>
          </div>
        </button>
      )}

      {/* Description */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)", marginTop: 12 }}>
        <p style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {migration.description}
        </p>
        <p className="mt-3" style={{ fontSize: 10, color: "var(--gold-dim)", fontFamily: "var(--font-cinzel), serif" }}>
          {migration.scriptureRef}
        </p>
      </div>

      {migration.journey && (
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <p className="mb-3" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Journey Details
          </p>
          <p className="mb-3" style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.5, fontStyle: "italic" }}>
            On the map: follow <span style={{ color: "#7ddea8" }}>START</span> → numbered stops → <span style={{ color: "#f0b0b0" }}>END</span>. Each stop shows its place name below the number.
          </p>
          <div className="space-y-3">
            <MigrationDetailRow label="Started from" value={migration.journey.origin} />
            <MigrationDetailRow label="Final destination" value={migration.journey.destination} />
            {migration.journey.duration && (
              <MigrationDetailRow label="Time span" value={migration.journey.duration} />
            )}
          </div>

          {migration.waypointLabels && migration.waypointLabels.length > 0 && (
            <div className="mt-4">
              <p className="mb-2" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Stops on the map
              </p>
              <ol className="space-y-1.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {migration.waypointLabels.map((place, i) => {
                  const total = migration.waypointLabels!.length;
                  const tag =
                    i === 0 ? "START" : i === total - 1 ? "END" : String(i + 1);
                  return (
                    <li
                      key={`${place}-${i}`}
                      className="flex items-baseline gap-2"
                      style={{ fontSize: 11, fontFamily: "var(--font-garamond), Georgia, serif", color: "var(--text-secondary)" }}
                    >
                      <span
                        className="shrink-0"
                        style={{
                          fontFamily: "var(--font-cinzel), serif",
                          fontSize: 9,
                          fontWeight: 700,
                          color: i === 0 ? "#7ddea8" : i === total - 1 ? "#f0b0b0" : migration.color,
                          minWidth: 28,
                        }}
                      >
                        {tag}
                      </span>
                      <span>{place}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {migration.journey.highlights && migration.journey.highlights.length > 0 && (
            <div className="mt-4">
              <p className="mb-2" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Along the way
              </p>
              <ul className="space-y-2.5">
                {migration.journey.highlights.map((h, i) => (
                  <li
                    key={`${h.place}-${i}`}
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dim)" }}
                  >
                    <span className="block" style={{ fontSize: 11, color: migration.color, fontFamily: "var(--font-cinzel), serif", fontWeight: 600 }}>
                      {h.place}
                    </span>
                    <span className="block mt-1" style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.55 }}>
                      {h.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {migration.journey.deathBurial && (
            <div
              className="mt-4 rounded-lg px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-dim)" }}
            >
              <p className="mb-1" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Death &amp; burial
              </p>
              <span className="block" style={{ fontSize: 11, color: "var(--text-primary)", fontFamily: "var(--font-cinzel), serif", fontWeight: 600 }}>
                {migration.journey.deathBurial.place}
              </span>
              <span className="block mt-1" style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-garamond), Georgia, serif", lineHeight: 1.55 }}>
                {migration.journey.deathBurial.note}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Waypoint count */}
      <div className="px-5 py-3">
        <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
          {migration.waypoints.length} waypoints mapped along this route
        </p>
      </div>
    </div>
  );
}

// ── Map welcome / legend ──────────────────────────────────────────────────────
function MapWelcome({ migrations, highlightMigrationId, onMigrationClick }: {
  migrations: MigrationRoute[];
  highlightMigrationId?: string | null;
  onMigrationClick: (m: MigrationRoute) => void;
}) {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div>
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>
          Geographic Atlas
        </h2>
        <p className="mt-2" style={{ fontFamily: "var(--font-garamond), Georgia, serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Every person and journey mapped to the ancient Near East. Click a <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>route line</strong> for journey details, or a <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>place pin</strong> to see who lived there.
        </p>
      </div>

      {/* Legend — collapsed by default to keep migration routes visible */}
      <div className="px-5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <button
          type="button"
          onClick={() => setLegendOpen((o) => !o)}
          aria-expanded={legendOpen}
          aria-controls="map-legend-items"
          className="flex items-center justify-between w-full py-3 text-left"
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
          <div id="map-legend-items" className="space-y-2 pb-4">
          <div className="flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center" style={{ width: 14, height: 18 }}>
              <svg viewBox="0 0 24 30" width={12} height={15} aria-hidden="true">
                <path d="M12 1C7.03 1 3 5.03 3 10c0 7.25 9 18.5 9 18.5s9-11.25 9-18.5C21 5.03 16.97 1 12 1z" fill="rgba(200,148,42,0.75)" stroke="rgba(240,192,96,0.5)" strokeWidth="1.5" />
              </svg>
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>Place pin — settlements; click to see who lived here</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center" style={{ width: 14, height: 18 }}>
              <svg viewBox="0 0 24 30" width={14} height={17} aria-hidden="true">
                <path d="M12 1C7.03 1 3 5.03 3 10c0 7.25 9 18.5 9 18.5s9-11.25 9-18.5C21 5.03 16.97 1 12 1z" fill="#c8942a" stroke="#f0c060" strokeWidth="1.5" />
              </svg>
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>Selected place</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center gap-1">
              <div style={{ width: 20, height: 1, background: "rgba(200,148,42,0.6)", borderTop: "1px dashed rgba(200,148,42,0.6)" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>Migration route — dashed line; select a route to see START, END, and stops</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-full border border-dashed" style={{ width: 14, height: 14, borderColor: "rgba(200,148,42,0.5)", background: "rgba(200,148,42,0.08)" }} aria-hidden="true" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>Dashed circle — approximate region (e.g. Eden, Canaan)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 map-route-start" style={{ minWidth: 28, height: 16, padding: "2px 6px", fontSize: 5, cursor: "default" }} aria-hidden="true">START</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>Era filters toggle off when clicked again</span>
          </div>
          </div>
        )}
      </div>

      {/* Migration routes list */}
      <div className="px-5 py-4">
        <p className="mb-3" style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Migration Routes
        </p>
        <div className="space-y-2">
          {migrations.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif", fontStyle: "italic" }}>
              No migration routes for this era.
            </p>
          ) : migrations.map(m => (
            <button
              key={m.id}
              id={`migration-${m.id}`}
              onClick={() => onMigrationClick(m)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: highlightMigrationId === m.id ? "rgba(200,148,42,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${highlightMigrationId === m.id ? "var(--gold-dim)" : "var(--border-dim)"}`,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = m.color + "66"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = highlightMigrationId === m.id ? "var(--gold-dim)" : "var(--border-dim)"}
            >
              <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: m.color }} />
              <div className="flex-1 min-w-0">
                <span className="block truncate" style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-cinzel), serif" }}>
                  {m.label}
                </span>
                <span className="block truncate mt-0.5" style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-garamond), Georgia, serif" }}>
                  {m.scriptureRef}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
