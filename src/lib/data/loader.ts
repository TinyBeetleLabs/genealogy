import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import { Relationship } from "@/types/relationship";
import rawPeople from "../../../data/people.json";
import rawRelationships from "../../../data/relationships.json";

function validatePerson(p: unknown): p is Person {
  if (!p || typeof p !== "object") return false;
  const obj = p as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id) return false;
  if (typeof obj.name !== "string" || !obj.name) return false;
  if (!obj.scriptureRefs || typeof obj.scriptureRefs !== "object") return false;
  const refs = obj.scriptureRefs as Record<string, unknown>;
  if (!Array.isArray(refs.existence) || refs.existence.length === 0) return false;
  return true;
}

function validateRelationship(r: unknown): r is Relationship {
  if (!r || typeof r !== "object") return false;
  const obj = r as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id) return false;
  if (typeof obj.source !== "string" || !obj.source) return false;
  if (typeof obj.target !== "string" || !obj.target) return false;
  if (!["biological", "adoptive", "legal", "spouse", "maternal"].includes(obj.type as string)) return false;
  if (!Array.isArray(obj.scriptureRefs) || obj.scriptureRefs.length === 0) return false;
  return true;
}

let cachedData: GraphData | null = null;

export function loadGraphData(): GraphData {
  if (cachedData) return cachedData;

  const peoplePayload = rawPeople as { metadata?: unknown; people?: unknown[] };
  const relPayload = rawRelationships as { relationships?: unknown[] };

  const rawPeopleList = peoplePayload.people ?? [];
  const rawRelList = relPayload.relationships ?? [];

  const people = rawPeopleList.filter(validatePerson) as Person[];
  const relationships = rawRelList.filter(validateRelationship) as Relationship[];

  const peopleIds = new Set(people.map((p) => p.id));
  const validRelationships = relationships.filter((r) => {
    const valid = peopleIds.has(r.source) && peopleIds.has(r.target);
    if (!valid && process.env.NODE_ENV === "development") {
      console.warn(
        `Relationship "${r.id}" references unknown person ids: source="${r.source}" target="${r.target}"`
      );
    }
    return valid;
  });

  const meta = (peoplePayload as Record<string, unknown>).metadata as GraphData["metadata"] | undefined;

  cachedData = {
    metadata: meta ?? {
      version: "1.0.0",
      lastVerified: "2026-07-02",
      scope: "Messianic main chain: Adam to Jesus",
      sources: [],
    },
    people,
    relationships: validRelationships,
  };

  return cachedData;
}

export function getPersonById(id: string): Person | undefined {
  return loadGraphData().people.find((p) => p.id === id);
}

export function getRelationshipsForPerson(personId: string): Relationship[] {
  const data = loadGraphData();
  return data.relationships.filter(
    (r) => r.source === personId || r.target === personId
  );
}

