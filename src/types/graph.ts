import { Person } from "./person";
import { Relationship } from "./relationship";

export interface GraphMetadata {
  version: string;
  lastVerified: string; // ISO date string
  scope: string;
  sources: string[];
}

export interface GraphData {
  metadata: GraphMetadata;
  people: Person[];
  relationships: Relationship[];
}

// Phase 2 extension types — defined here so data model is ready
export interface Event {
  id: string;
  name: string;
  description?: string;
  approxYearBC?: number;
  personIds: string[];
  locationIds?: string[];
  scriptureRefs: Array<{ display: string }>;
}

export interface Location {
  id: string;
  name: string;
  modernName?: string;
  latitude?: number;
  longitude?: number;
}
