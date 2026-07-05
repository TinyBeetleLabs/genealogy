import { ScriptureRef } from "./person";

export type RelationshipType = "biological" | "adoptive" | "legal" | "spouse" | "maternal";

export interface Relationship {
  id: string;
  /** Person ID of the parent (or first spouse) */
  source: string;
  /** Person ID of the child (or second spouse) */
  target: string;
  type: RelationshipType;
  /** References proving this specific connection */
  scriptureRefs: ScriptureRef[];
  /** Brief clarifying note where the relationship requires explanation */
  notes?: string;
}
