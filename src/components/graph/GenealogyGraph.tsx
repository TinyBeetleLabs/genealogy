"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  NodeTypes,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
} from "reactflow";
import {
  MAIN_NODE_WIDTH,
  MAIN_NODE_HEIGHT,
  BRANCH_NODE_WIDTH,
  BRANCH_NODE_HEIGHT,
} from "@/lib/graph/layout";
import "reactflow/dist/style.css";

import { GraphData } from "@/types/graph";
import { Person } from "@/types/person";
import { transformGraphData, PersonNodeData } from "@/lib/graph/transform";
import { applyDagreLayout } from "@/lib/graph/layout";
import PersonNode from "./PersonNode";
import GraphControls from "./GraphControls";
import TimelineBar from "./TimelineBar";

export interface GenealogyGraphHandle {
  navigateTo: (id: string) => void;
  fitAll: () => void;
  clearSelection: () => void;
}

const nodeTypes: NodeTypes = { personNode: PersonNode };

interface InnerGraphProps {
  data: GraphData;
  onPersonSelect: (person: Person | null) => void;
  onReady?: () => void;
  isActive?: boolean;
}

/** Re-fit when the canvas size changes (panel open, tab switch, window resize). */
function GraphViewportSync({
  isActive,
  containerRef,
  selectedId,
  onInitialFit,
  onFocusSelection,
}: {
  isActive: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedId: string | null;
  onInitialFit?: () => void;
  onFocusSelection: () => void;
}) {
  const { fitView } = useReactFlow();
  const initialFitDone = useRef(false);
  const fitFrame = useRef<number | null>(null);

  const scheduleFit = useCallback(
    (duration: number) => {
      if (!isActive) return;
      if (fitFrame.current != null) cancelAnimationFrame(fitFrame.current);
      fitFrame.current = requestAnimationFrame(() => {
        fitFrame.current = requestAnimationFrame(() => {
          fitView({ padding: 0.12, duration });
          fitFrame.current = null;
          if (!initialFitDone.current) {
            initialFitDone.current = true;
            onInitialFit?.();
          }
        });
      });
    },
    [isActive, fitView, onInitialFit]
  );

  const restoreViewport = useCallback(
    (duration: number) => {
      if (!isActive) return;
      if (fitFrame.current != null) cancelAnimationFrame(fitFrame.current);
      fitFrame.current = requestAnimationFrame(() => {
        fitFrame.current = requestAnimationFrame(() => {
          if (selectedId) onFocusSelection();
          else scheduleFit(duration);
          fitFrame.current = null;
          if (!initialFitDone.current) {
            initialFitDone.current = true;
            onInitialFit?.();
          }
        });
      });
    },
    [isActive, selectedId, onFocusSelection, scheduleFit, onInitialFit]
  );

  useEffect(() => {
    if (!isActive) return;
    if (initialFitDone.current && selectedId) restoreViewport(300);
    else scheduleFit(initialFitDone.current ? 300 : 800);
  }, [isActive, selectedId, scheduleFit, restoreViewport]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isActive) return;
    let debounce: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      if (!initialFitDone.current) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (selectedId) onFocusSelection();
        else scheduleFit(300);
      }, 150);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(debounce);
    };
  }, [isActive, containerRef, selectedId, onFocusSelection, scheduleFit]);

  return null;
}

const InnerGraph = forwardRef<GenealogyGraphHandle, InnerGraphProps>(
  function InnerGraph({ data, onPersonSelect, onReady, isActive = true }, ref) {
    const { fitView, setCenter } = useReactFlow();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const onReadyFired = useRef(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleInitialFit = useCallback(() => {
      if (!onReadyFired.current) {
        onReadyFired.current = true;
        onReady?.();
      }
    }, [onReady]);

    const { initialNodes, initialEdges } = useMemo(() => {
      const { nodes, edges } = transformGraphData(data);
      const laid = applyDagreLayout(nodes, edges, "TB");
      return { initialNodes: laid.nodes, initialEdges: laid.edges };
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync nodes/edges when data or layout changes (e.g. HMR, future dynamic load)
    useEffect(() => {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const focusOnPerson = useCallback(
      (id: string) => {
        const spouseIds = data.relationships
          .filter(r => r.type === "spouse" && (r.source === id || r.target === id))
          .map(r => (r.source === id ? r.target : r.source));
        const familyIds = new Set([id, ...spouseIds]);
        const familyNodes = initialNodes.filter(n => familyIds.has(n.id));

        if (familyNodes.length === 0) return;

        const xs    = familyNodes.map(n => n.position.x);
        const xsEnd = familyNodes.map(n => n.position.x + (n.data.person.isMainLineage ? MAIN_NODE_WIDTH : BRANCH_NODE_WIDTH));
        const ys    = familyNodes.map(n => n.position.y);
        const ysEnd = familyNodes.map(n => n.position.y + (n.data.person.isMainLineage ? MAIN_NODE_HEIGHT : BRANCH_NODE_HEIGHT));

        const centerX = (Math.min(...xs) + Math.max(...xsEnd)) / 2;
        const centerY = (Math.min(...ys) + Math.max(...ysEnd)) / 2;

        requestAnimationFrame(() => {
          setCenter(centerX, centerY, { duration: 600, zoom: 1.2 });
        });
      },
      [data.relationships, initialNodes, setCenter]
    );

    const navigateTo = useCallback(
      (id: string) => {
        const person = data.people.find(p => p.id === id);
        if (!person) return;
        setSelectedId(id);
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === id })));
        onPersonSelect(person);
        focusOnPerson(id);
      },
      [data.people, setNodes, onPersonSelect, focusOnPerson]
    );

    const restoreSelectionView = useCallback(() => {
      if (selectedId) focusOnPerson(selectedId);
    }, [selectedId, focusOnPerson]);

    useImperativeHandle(ref, () => ({
      navigateTo,
      fitAll: () => fitView({ duration: 800, padding: 0.1 }),
      clearSelection: () => {
        setSelectedId(null);
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        onPersonSelect(null);
      },
    }), [navigateTo, fitView, setNodes, onPersonSelect]);

    const onNodeClick = useCallback(
      (_: React.MouseEvent, node: Node<PersonNodeData>) => {
        navigateTo(node.data.person.id);
      },
      [navigateTo]
    );

    const onPaneClick = useCallback(() => {
      setSelectedId(null);
      setNodes(nds => nds.map(n => ({ ...n, selected: false })));
      onPersonSelect(null);
    }, [setNodes, onPersonSelect]);

    return (
      <div className="flex flex-col w-full h-full min-h-0">
        <div ref={canvasRef} className="relative flex-1 min-h-0 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            minZoom={0.03}
            maxZoom={3}
            proOptions={{ hideAttribution: true }}
            style={{ background: "var(--bg-base)", width: "100%", height: "100%" }}
          >
            <GraphViewportSync
              isActive={isActive}
              containerRef={canvasRef}
              selectedId={selectedId}
              onInitialFit={handleInitialFit}
              onFocusSelection={restoreSelectionView}
            />
            <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#1e1608" />
            <GraphControls />
          </ReactFlow>
        </div>

        <TimelineBar
          people={data.people}
          selectedId={selectedId}
          onSelect={navigateTo}
        />
      </div>
    );
  }
);

interface GenealogyGraphProps {
  data: GraphData;
  onPersonSelect: (person: Person | null) => void;
  onReady?: () => void;
  isActive?: boolean;
}

const GenealogyGraph = forwardRef<GenealogyGraphHandle, GenealogyGraphProps>(
  function GenealogyGraph({ data, onPersonSelect, onReady, isActive }, ref) {
    return (
      <ReactFlowProvider>
        <InnerGraph ref={ref} data={data} onPersonSelect={onPersonSelect} onReady={onReady} isActive={isActive} />
      </ReactFlowProvider>
    );
  }
);

export default GenealogyGraph;
