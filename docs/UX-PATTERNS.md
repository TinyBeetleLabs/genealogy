# Genealogy Atlas — UX layout patterns

This document describes how detail panels and orientation chrome work across the four main views. **The goal is one predictable mental model** with only documented exceptions.

## Design tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--panel-width` | `320px` | Right-side inspector overlays (People, Timeline, Map) |
| `--duration-panel` | `380ms` | Slide-in/out for overlay panels |
| `--ease-panel` | `cubic-bezier(0.4,0,0.2,1)` | Panel motion easing |

`PersonPanel` is the shared detail component wherever a **person** is shown. Map location/migration cards use the same width but different content (not `PersonPanel`).

---

## View types

### 1. Canvas + left orientation — **Family Tree** (landing view)

| Aspect | Behavior |
|--------|----------|
| Primary task | Spatial exploration of lineage |
| Orientation | **Left column** — “Start with Adam” welcome + search + legend |
| Person details | **Same left column** — replaces welcome when a node is selected |
| Canvas | Graph uses full remaining width; never shrinks when panel opens |
| Collapse | Left panel can collapse via chevron tab (desktop) |
| Mobile | Bottom sheet for welcome/details; graph stays full width |

**Why left, not right?** The graph is the hero. A persistent left “home base” matches map/design-tool patterns and keeps the canvas uninterrupted. This is the **only view** with the welcome panel.

### 2. Browse + right overlay — **People** and **Timeline**

| Aspect | Behavior |
|--------|----------|
| Primary task | Scan/filter a list or chronological sequence |
| Orientation | In-view header + filters (People) or era headings (Timeline) |
| Person details | **Right overlay** at `--panel-width`, slides over content |
| Content width | **Always full width** — grid/timeline does not reflow when panel opens |
| Toggle | Click card again or close button to dismiss |
| Mobile | Overlay is full-screen width |
| Graph link | Footer button “View in Family Tree →” for explicit navigation |

**Why overlay?** Browse views need maximum reading area. Push layouts caused jarring grid reflow; overlay preserves context.

### 3. Canvas + right inspector — **Map**

| Aspect | Behavior |
|--------|----------|
| Primary task | Geographic exploration |
| Map | **Always full width** |
| Pin/route details | **Right overlay** at `--panel-width` (same slide pattern as People/Timeline) |
| Mobile | Full-screen inspector when a pin or route is selected |

#### Intentional exception: floating map guide

When **no** pin or route is selected, the map does **not** use a permanent right sidebar (that would shrink the map). Instead:

- A **floating “Routes & legend” card** appears bottom-left (dismissible), capped at ~half the map height so it never covers zoom controls.
- **Legend** inside the card is **collapsible and collapsed by default** so migration routes stay visible.
- A **“Routes & legend”** chip reopens it after dismiss.
- Clicking a migration route while on **All Eras** auto-switches the era filter to that route’s era.
- After closing a migration inspector and reopening the guide, the list **scrolls to the last route** you viewed.

Migration routes filter by an explicit `era` field on each route (matching location era labels), not person `era` keys from `people.json`.

#### Map performance & mobile data (enforced in `MapCanvas.tsx`)

The map is optimized for phones on limited data. Tile downloads dominate bandwidth — not markers or routes.

| Policy | Value / behavior | Why |
|--------|------------------|-----|
| **Single basemap** | Carto `dark_all` only | No satellite or alternate tile layers (3–5× heavier). |
| **maxBounds** | `[[22, 24], [42, 55]]` (ancient Near East) | Stops panning into empty ocean → fewer wasted tiles. |
| **maxZoom** | `14` (was 18) | Pinch-zoom cap limits tile count on mobile. |
| **fitBounds maxZoom** | `10` when framing a migration route | One-time zoom to show full route without over-fetching tiles. |
| **Lazy mount** | Map initializes only when Map tab is first opened | No tile fetch until the user visits the view. |
| **Deferred features** | No clustering, GeoJSON regions, animated routes, or basemap switcher | Low value at current scale (18 pins) or high cost (data/CPU). |

**Implemented map UX (low cost):**

- **fitBounds** — selecting a migration route frames all waypoints.
- **flyTo** — selecting a place pin zooms to that point (`zoom 7`).
- **Selection tooltips** — selected place pin shows a permanent name label on the map (works on touch; no hover-only UI).
- **Approximate regions** — locations with `approximateRadiusMeters` in `locations.json` show a dashed circle (e.g. Eden, Land of Canaan).
- **prefers-reduced-motion** — camera animations use `duration: 0` when the user prefers reduced motion.

**Adding map features later:** prefer optional toggles, simplified geometry, and lazy loading. Do not add satellite tiles or always-on animations without revisiting this table.

---

## Rules (enforced in code)

1. **“Start with Adam”** — Family Tree only (`AtlasShell` left column).
2. **Browse views** (People, Timeline) — self-contained selection state; no shell left panel.
3. **One selection per view** — no duplicate panels showing different people.
4. **Detail edge for browse/map inspect** — always **right**, overlay, `--panel-width`.
5. **Canvas never shrinks** — graph and map stay full width; timeline/people lists stay full width.
6. **Cross-view navigation** — “View in Family Tree →” jumps to the family tree and focuses that person; switching away does **not** clear tree selection.
7. **State retention** — All four views stay mounted (hidden when inactive) so each view remembers scroll, filters, and panel state. Graph selection persists until explicitly cleared.

### Clearing selection

| View | How to clear |
|------|----------------|
| **Family Tree** | Close on `PersonPanel`, click empty canvas, or **Clear selection** in header (desktop) |
| **People / Timeline** | Close button, or click the same card again |
| **Map** | Close on location/migration inspector |

---

## Quick reference

```
Family Tree  →  Left: welcome / PersonPanel  |  Canvas: tree (full remaining width)
People        →  Full-width grid             |  Right overlay: PersonPanel @ 320px
Timeline      →  Full-width list             |  Right overlay: PersonPanel @ 320px
Map           →  Full-width map              |  Right overlay: location/migration @ 320px
                  Floating card: routes & legend (when nothing selected)
```

---

## When adding a new view

Ask:

1. Is the hero a **canvas** (spatial) or **browse** (list/grid)?
2. Canvas → keep hero full width; use overlay inspector or (graph only) left orientation column.
3. Browse → full-width content + right `PersonPanel` overlay.
4. Reuse `PersonPanel` for people; do not invent a new detail width without updating `--panel-width`.
