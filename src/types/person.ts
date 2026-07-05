export interface ScriptureRef {
  display: string; // e.g. "Genesis 5:3"
  book?: string;
  chapter?: number;
  verse?: string; // "3" or "3-5"
}

/** A cause-and-effect narrative beat — must be scripture-grounded */
export interface Significance {
  title: string;
  text: string;
  /** Scripture reference(s) supporting this significance note */
  scriptureRef?: string;
}

export type Era =
  | "pre-flood"
  | "post-flood"
  | "patriarchs"
  | "judges"
  | "united-kingdom"
  | "divided-kingdom"
  | "exile-return"
  | "post-exile"
  | "new-testament";

export interface Person {
  id: string; // URL-safe slug: "adam", "seth", "noah"
  name: string;
  alternateNames?: string[];
  gender?: "male" | "female";
  /** Only if clearly and directly stated in scripture. Omit if uncertain. */
  description?: string;
  scriptureRefs: {
    /** References proving this person exists in scripture */
    existence: ScriptureRef[];
    /** References proving the specific parent→child lineage connection */
    lineage?: ScriptureRef[];
  };
  /**
   * True for people who are on the direct Adam → Jesus Messianic chain.
   * False for siblings, spouses, and other branch figures.
   */
  isMainLineage?: boolean;
  /** Historical era for visual grouping */
  era?: Era;
  /**
   * Cause-and-effect narrative beats.
   * Only added where scripture clearly records a consequence or covenant.
   */
  significance?: Significance[];
  /** Clarifying notes about textual ambiguity or genealogical complexity */
  notes?: string;
  /**
   * Birth order within siblings (1 = firstborn). Used to sort siblings/children
   * in the panel. Only set where scripture clearly establishes the order.
   */
  birthOrder?: number;
  /**
   * Optional override for left-to-right graph layout among siblings.
   * When set, used instead of birthOrder for Dagre child ordering only.
   */
  graphOrder?: number;
  /**
   * When false, this person is excluded from the graph visualization but
   * still present in data (so the panel can show them as a parent/spouse).
   * Defaults to true if omitted.
   */
  showInGraph?: boolean;
  // Phase 2 extension hooks — optional, unused in MVP
  approxYearBC?: number;
  geographyIds?: string[];
}
