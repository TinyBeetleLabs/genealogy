import dagre from "@dagrejs/dagre";
import { Node, Edge } from "reactflow";
import { Person } from "@/types/person";

export const MAIN_NODE_WIDTH = 155;
export const MAIN_NODE_HEIGHT = 190;
export const BRANCH_NODE_WIDTH = 125;
export const BRANCH_NODE_HEIGHT = 160;
const SPOUSE_GAP = 30;
/** Minimum gap between parent rank bottom and child rank top (Dagre ranksep). */
const RANK_SEP = 80;
/** Extra clearance below the lowest parent/spouse card before child nodes begin. */
const MIN_PARENT_CHILD_GAP = 40;

/**
 * Runs Dagre hierarchical layout on parent-child edges only.
 * Spouse nodes are post-processed to sit adjacent to their partners.
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  // Maternal edges are filtered out in transform.ts before reaching here, so this
  // set only catches any that might slip through. Spouse edges are excluded from
  // Dagre's hierarchy and post-processed to sit beside their lineage partner.
  const SIDE_EDGE_TYPES = new Set(["spouse", "maternal"]);
  const lineageEdges = edges.filter((e) => !SIDE_EDGE_TYPES.has(e.data?.relationshipType));
  const spouseEdges = edges.filter((e) => SIDE_EDGE_TYPES.has(e.data?.relationshipType));

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: RANK_SEP,
    marginx: 60,
    marginy: 60,
  });

  const lineageNodeIds = new Set(
    lineageEdges.flatMap((e) => [e.source, e.target])
  );

  nodes.forEach((node) => {
    if (!lineageNodeIds.has(node.id)) return;
    const isMainLine = (node.data as { person?: { isMainLineage?: boolean } })?.person?.isMainLineage;
    g.setNode(node.id, {
      width: isMainLine ? MAIN_NODE_WIDTH : BRANCH_NODE_WIDTH,
      height: isMainLine ? MAIN_NODE_HEIGHT : BRANCH_NODE_HEIGHT,
    });
  });

  // Sort edges so children appear left-to-right in birth order within Dagre
  const birthOrderMap = new Map<string, number>();
  nodes.forEach((node) => {
    const person = (node.data as { person?: Person })?.person;
    if (!person) return;
    const order = person.graphOrder ?? person.birthOrder;
    if (order !== undefined) birthOrderMap.set(node.id, order);
  });

  const sortedLineageEdges = lineageEdges
    .slice()
    .sort((a, b) => (birthOrderMap.get(a.target) ?? Infinity) - (birthOrderMap.get(b.target) ?? Infinity));

  sortedLineageEdges.forEach((edge) => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const positionMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    if (!g.hasNode(node.id)) return;
    const pos = g.node(node.id);
    const isMainLine = (node.data as { person?: { isMainLineage?: boolean } })?.person?.isMainLineage;
    const w = isMainLine ? MAIN_NODE_WIDTH : BRANCH_NODE_WIDTH;
    const h = isMainLine ? MAIN_NODE_HEIGHT : BRANCH_NODE_HEIGHT;
    positionMap.set(node.id, { x: pos.x - w / 2, y: pos.y - h / 2 });
  });

  // Dimension lookup for every node
  const nodeDimMap = new Map<string, { w: number; h: number }>();
  nodes.forEach((node) => {
    const isMainLine = (node.data as { person?: { isMainLineage?: boolean } })?.person?.isMainLineage;
    nodeDimMap.set(node.id, {
      w: isMainLine ? MAIN_NODE_WIDTH : BRANCH_NODE_WIDTH,
      h: isMainLine ? MAIN_NODE_HEIGHT : BRANCH_NODE_HEIGHT,
    });
  });

  // Build parent/children maps for subtree traversal
  const childrenMap = new Map<string, string[]>();
  const parentMap   = new Map<string, string>();
  lineageEdges.forEach((e) => {
    if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
    childrenMap.get(e.source)!.push(e.target);
    parentMap.set(e.target, e.source);
  });

  /** BFS: return nodeId plus every lineage descendant */
  const getSubtree = (nodeId: string): Set<string> => {
    const visited = new Set<string>([nodeId]);
    const queue   = [nodeId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const child of childrenMap.get(curr) ?? []) {
        if (!visited.has(child)) { visited.add(child); queue.push(child); }
      }
    }
    return visited;
  };

  // Dagre ignores edge insertion order — reorder siblings left-to-right by birthOrder (oldest first)
  const siblingOrderMap = new Map<string, number>();
  nodes.forEach((node) => {
    const person = (node.data as { person?: Person })?.person;
    if (person?.birthOrder !== undefined) siblingOrderMap.set(node.id, person.birthOrder);
  });

  const siblingGap = 40;
  const parentsWithMultipleChildren = [...childrenMap.entries()]
    .filter(([, kids]) => kids.length >= 2)
    .map(([parentId]) => parentId)
    .sort((a, b) => (positionMap.get(a)?.y ?? 0) - (positionMap.get(b)?.y ?? 0));

  for (const parentId of parentsWithMultipleChildren) {
    const children = [...(childrenMap.get(parentId) ?? [])]
      .filter((id) => positionMap.has(id))
      .sort((a, b) => {
        const oa = siblingOrderMap.get(a) ?? Infinity;
        const ob = siblingOrderMap.get(b) ?? Infinity;
        if (oa !== ob) return oa - ob;
        return a.localeCompare(b);
      });

    if (children.length < 2) continue;

    const widths = children.map((id) => nodeDimMap.get(id)?.w ?? BRANCH_NODE_WIDTH);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + siblingGap * (children.length - 1);

    const parentPos = positionMap.get(parentId);
    const parentDim = nodeDimMap.get(parentId) ?? { w: MAIN_NODE_WIDTH, h: MAIN_NODE_HEIGHT };
    if (!parentPos) continue;

    const parentCenterX = parentPos.x + parentDim.w / 2;
    let cursorX = parentCenterX - totalWidth / 2;

    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const childPos = positionMap.get(childId);
      if (!childPos) continue;

      const shiftX = cursorX - childPos.x;
      if (Math.abs(shiftX) > 0.5) {
        for (const id of getSubtree(childId)) {
          const pos = positionMap.get(id);
          if (pos) positionMap.set(id, { x: pos.x + shiftX, y: pos.y });
        }
      }
      cursorX += widths[i] + siblingGap;
    }
  }

  // ── Spouse post-processing ─────────────────────────────────────────────────
  //
  // Strategy: for each husband that has unpositioned wives, *shift their right
  // siblings and those siblings' full subtrees* to the right by the total width
  // the wives will occupy.  Wives are then placed consecutively in that gap.
  //
  // This guarantees:  husband | wife1 | wife2 | [gap] | next-sibling
  // with no crossing-over.

  // childrenMap, parentMap, getSubtree built above for sibling ordering

  // Count how many unpositioned wives each lineage husband has
  const husbandWifeCount = new Map<string, number>();
  spouseEdges.forEach((edge) => {
    const husbandId =
      positionMap.has(edge.source) && !positionMap.has(edge.target) ? edge.source :
      positionMap.has(edge.target) && !positionMap.has(edge.source) ? edge.target :
      null;
    if (husbandId) husbandWifeCount.set(husbandId, (husbandWifeCount.get(husbandId) ?? 0) + 1);
  });

  // Pass 1 — shift right siblings' subtrees to create a clean slot for the wives
  husbandWifeCount.forEach((wivesCnt, husbandId) => {
    const husbandPos = positionMap.get(husbandId);
    const husbandDim = nodeDimMap.get(husbandId) ?? { w: MAIN_NODE_WIDTH, h: MAIN_NODE_HEIGHT };
    if (!husbandPos) return;

    const slotWidth = wivesCnt * (BRANCH_NODE_WIDTH + SPOUSE_GAP);
    const parentId  = parentMap.get(husbandId);
    if (!parentId) return;

    // Find siblings that are strictly to the right of the husband
    const toShift = new Set<string>();
    (childrenMap.get(parentId) ?? []).forEach((sibId) => {
      if (sibId === husbandId) return;
      const sibPos = positionMap.get(sibId);
      if (sibPos && sibPos.x >= husbandPos.x + husbandDim.w) {
        getSubtree(sibId).forEach((id) => toShift.add(id));
      }
    });

    toShift.forEach((id) => {
      const pos = positionMap.get(id);
      if (pos) positionMap.set(id, { x: pos.x + slotWidth, y: pos.y });
    });
  });

  // Pass 2 — place wife nodes consecutively after their husbands
  // Wives are offset 60 px downward so they sit visually below the sibling row.
  const WIFE_Y_OFFSET = (MAIN_NODE_HEIGHT - BRANCH_NODE_HEIGHT) + 30; // = 60 px

  const husbandLastRight = new Map<string, number>();
  spouseEdges.forEach((edge) => {
    const sourcePos = positionMap.get(edge.source);
    const targetPos = positionMap.get(edge.target);

    const husbandId =
      sourcePos && !positionMap.has(edge.target) ? edge.source :
      targetPos && !positionMap.has(edge.source) ? edge.target :
      null;
    if (!husbandId) return;

    const husbandPos = positionMap.get(husbandId)!;
    const husbandDim = nodeDimMap.get(husbandId) ?? { w: MAIN_NODE_WIDTH, h: MAIN_NODE_HEIGHT };
    const lastRight  = husbandLastRight.get(husbandId) ?? (husbandPos.x + husbandDim.w);
    const wifeX      = lastRight + SPOUSE_GAP;
    const spouseY    = husbandPos.y + WIFE_Y_OFFSET;

    const wifeId = sourcePos ? edge.target : edge.source;
    positionMap.set(wifeId, { x: wifeX, y: spouseY });
    husbandLastRight.set(husbandId, wifeX + BRANCH_NODE_WIDTH);
  });

  // Ensure children sit below any spouse cards that extend lower than the parent
  // (e.g. Eve offset beside Adam — connector lines were clipping her card).
  for (const [parentId, kids] of childrenMap) {
    const parentPos = positionMap.get(parentId);
    if (!parentPos) continue;

    const visibleKids = kids.filter((id) => positionMap.has(id));
    if (visibleKids.length === 0) continue;

    const parentDim = nodeDimMap.get(parentId) ?? { w: MAIN_NODE_WIDTH, h: MAIN_NODE_HEIGHT };
    let lowestBottom = parentPos.y + parentDim.h;

    spouseEdges.forEach((edge) => {
      const partnerId =
        edge.source === parentId ? edge.target :
        edge.target === parentId ? edge.source :
        null;
      if (!partnerId) return;
      const partnerPos = positionMap.get(partnerId);
      const partnerDim = nodeDimMap.get(partnerId);
      if (!partnerPos || !partnerDim) return;
      if (partnerPos.y >= parentPos.y - 10) {
        lowestBottom = Math.max(lowestBottom, partnerPos.y + partnerDim.h);
      }
    });

    const minChildTop = Math.min(...visibleKids.map((id) => positionMap.get(id)!.y));
    const shiftY = lowestBottom + MIN_PARENT_CHILD_GAP - minChildTop;
    if (shiftY > 0.5) {
      const toShift = new Set<string>();
      visibleKids.forEach((kid) => getSubtree(kid).forEach((id) => toShift.add(id)));
      toShift.forEach((id) => {
        const pos = positionMap.get(id);
        if (pos) positionMap.set(id, { x: pos.x, y: pos.y + shiftY });
      });
    }
  }

  const layoutedNodes = nodes.map((node) => {
    const pos = positionMap.get(node.id);
    return pos ? { ...node, position: pos } : { ...node, position: { x: -9999, y: -9999 } };
  });

  return { nodes: layoutedNodes, edges };
}
