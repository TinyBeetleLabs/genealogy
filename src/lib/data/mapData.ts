import locationsRaw from "../../../data/locations.json";
import migrationsRaw from "../../../data/migrations.json";
import { BiblicalLocation, MigrationRoute } from "@/types/location";

export const LOCATIONS: BiblicalLocation[] = locationsRaw as BiblicalLocation[];
export const MIGRATIONS: MigrationRoute[] = migrationsRaw as MigrationRoute[];

/** Era filter labels used on the map toolbar */
export const MAP_ERA_LABELS = [
  "All Eras",
  "Primeval History",
  "Patriarchal Age",
  "Sojourn in Egypt",
  "Conquest & Judges",
  "United Monarchy",
  "Exile",
  "New Testament",
] as const;

export type MapEraLabel = (typeof MAP_ERA_LABELS)[number];

export function migrationMatchesMapEra(migration: MigrationRoute, mapEra: string): boolean {
  if (mapEra === "All Eras") return true;
  return migration.era === mapEra;
}

/**
 * Maps person IDs to their primary biblical location.
 * Only includes persons who have a known, scripture-confirmed location.
 */
export const PERSON_LOCATION_MAP: Record<string, string> = {
  // Primeval History
  adam: "eden",
  eve: "eden",

  // Patriarchal Age
  abraham: "hebron",
  sarah: "hebron",
  isaac: "beersheba",
  rebekah: "hebron",
  jacob: "hebron",
  leah: "hebron",
  rachel: "bethel",
  esau: "hebron",
  "joseph-son-of-jacob": "egypt",
  judah: "hebron",
  tamar: "hebron",
  reuben: "canaan",
  simeon: "canaan",
  levi: "canaan",
  dan: "canaan",
  naphtali: "canaan",
  gad: "canaan",
  asher: "canaan",
  issachar: "canaan",
  zebulun: "canaan",
  benjamin: "canaan",

  // Conquest
  rahab: "jericho",

  // Judges / Ruth era
  boaz: "bethlehem",
  ruth: "bethlehem",
  naomi: "bethlehem",
  salmon: "jericho",
  perez: "bethlehem",

  // United Monarchy
  jesse: "bethlehem",
  david: "jerusalem",
  bathsheba: "jerusalem",
  solomon: "jerusalem",
  absalom: "jerusalem",

  // Divided Kingdom / Exile
  rehoboam: "jerusalem",
  jeconiah: "babylon",
  shealtiel: "babylon",
  zerubbabel: "babylon",
  nebuchadnezzar: "babylon",

  // New Testament
  mary: "nazareth",
  jesus: "bethlehem",
};

export function getLocationForPerson(personId: string): BiblicalLocation | null {
  const locationId = PERSON_LOCATION_MAP[personId];
  if (!locationId) return null;
  return LOCATIONS.find((l) => l.id === locationId) ?? null;
}

export function getPeopleAtLocation(locationId: string, personIds: string[]): string[] {
  return personIds.filter((id) => PERSON_LOCATION_MAP[id] === locationId);
}
