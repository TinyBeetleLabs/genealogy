import { Node, Edge, MarkerType } from "reactflow";
import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import { Relationship } from "@/types/relationship";
import { MAIN_NODE_WIDTH, MAIN_NODE_HEIGHT, BRANCH_NODE_WIDTH, BRANCH_NODE_HEIGHT } from "./layout";

export interface PersonNodeData {
  person: Person;
  isSelected?: boolean;
}

export function toReactFlowNodes(people: Person[]): Node<PersonNodeData>[] {
  return people
    // People with showInGraph === false stay in the data model for the panel
    // but don't appear as visual nodes in the graph.
    .filter((person) => person.showInGraph !== false)
    .map((person) => ({
      id: person.id,
      type: "personNode",
      position: { x: 0, y: 0 }, // overwritten by layout
      data: { person },
      draggable: false,
      style: {
        width: person.isMainLineage ? MAIN_NODE_WIDTH : BRANCH_NODE_WIDTH,
      },
    }));
}

export function toReactFlowEdges(relationships: Relationship[]): Edge[] {
  return relationships
    // Maternal edges are kept in data.relationships for the panel (so it can show
    // the correct mother for each child), but they are NOT rendered as graph edges.
    // With polygamous families (Jacob's four wives) this would create a dense web
    // of crossing "mother" arrows that makes the graph unreadable.
    .filter((rel) => rel.type !== "maternal")
    .map((rel) => {
      const isSpouse = rel.type === "spouse";
      const isLegal = rel.type === "legal";

      return {
        id: rel.id,
        source: rel.source,
        target: rel.target,
        type: isSpouse ? "straight" : "smoothstep",
        animated: false,
        // Spouse edges stay in the array (layout.ts uses them for wife placement)
        // but are hidden so no line is drawn — marital connections are shown in
        // the detail panel when a person is clicked.
        hidden: isSpouse,
        data: { relationshipType: rel.type },
        markerEnd: isSpouse ? undefined : { type: MarkerType.ArrowClosed },
        style: {
          stroke: isLegal ? "#8b7355" : "#c8a96e",
          strokeWidth: isLegal ? 1.5 : 2,
          strokeDasharray: isLegal ? "6 3" : undefined,
        },
        label: isLegal ? "legal" : undefined,
        labelStyle: { fill: "#8b7355", fontSize: 10 },
        labelBgStyle: { fill: "transparent" },
      };
    });
}

export function transformGraphData(data: GraphData): {
  nodes: Node<PersonNodeData>[];
  edges: Edge[];
} {
  const nodes = toReactFlowNodes(data.people);
  const edges = toReactFlowEdges(data.relationships);
  return { nodes, edges };
}
