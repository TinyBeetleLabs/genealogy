export interface BiblicalLocation {
  id: string;
  name: string;
  region: string;
  description: string;
  scriptureRef: string;
  /** [lat, lng] */
  coordinates: [number, number];
  era: string;
  /**
   * When set, the map draws a dashed circle — the pin marks an approximate center,
   * not a precise archaeological site (e.g. Garden of Eden).
   */
  approximateRadiusMeters?: number;
}

export interface MigrationRoute {
  id: string;
  personId: string;
  label: string;
  description: string;
  scriptureRef: string;
  color: string;
  /** Map era filter label — matches `BiblicalLocation.era` (e.g. "Patriarchal Age") */
  era: string;
  /** Array of [lat, lng] waypoints */
  waypoints: [number, number][];
  /** Place name for each waypoint (same length as waypoints) — shown on the map */
  waypointLabels?: string[];
  /** Scripture-sourced journey facts for the detail panel */
  journey?: {
    origin: string;
    destination: string;
    /** Only when scripture gives a time span */
    duration?: string;
    /** Noteworthy events at places along the route */
    highlights?: Array<{ place: string; note: string }>;
    /** Only when scripture records death and/or burial */
    deathBurial?: { place: string; note: string };
  };
}
