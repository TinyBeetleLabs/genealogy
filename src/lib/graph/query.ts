import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import { Relationship } from "@/types/relationship";

const PARENT_TYPES = new Set(["biological", "legal", "adoptive", "maternal"]);

/** Returns all direct parents of a person (excludes spouse relationships) */
export function getParents(personId: string, data: GraphData): Person[] {
  const parentIds = data.relationships
    .filter((r) => PARENT_TYPES.has(r.type) && r.target === personId)
    .map((r) => r.source);
  return data.people.filter((p) => parentIds.includes(p.id));
}

/** Returns all direct children of a person (excludes spouse relationships), sorted by birthOrder */
export function getChildren(personId: string, data: GraphData): Person[] {
  const childIds = data.relationships
    .filter((r) => PARENT_TYPES.has(r.type) && r.source === personId)
    .map((r) => r.target);
  return data.people
    .filter((p) => childIds.includes(p.id))
    .sort((a, b) => (a.birthOrder ?? Infinity) - (b.birthOrder ?? Infinity));
}

/** Returns all relationships that connect directly to this person */
export function getConnectedRelationships(
  personId: string,
  data: GraphData
): Relationship[] {
  return data.relationships.filter(
    (r) => r.source === personId || r.target === personId
  );
}

/**
 * Returns all siblings of a person — defined as anyone who shares at least
 * one parent (via a biological/legal/adoptive relationship), excluding the
 * person themselves.
 */
export function getSiblings(personId: string, data: GraphData): Person[] {
  const parents = getParents(personId, data);
  if (parents.length === 0) return [];

  const siblingIds = new Set<string>();
  for (const parent of parents) {
    const siblings = getChildren(parent.id, data);
    for (const sibling of siblings) {
      if (sibling.id !== personId) siblingIds.add(sibling.id);
    }
  }

  return data.people
    .filter((p) => siblingIds.has(p.id))
    .sort((a, b) => (a.birthOrder ?? Infinity) - (b.birthOrder ?? Infinity));
}

