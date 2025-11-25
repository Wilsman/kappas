import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StoryNode from "./StoryNode";
import DecisionNode from "./DecisionNode";
import EndingNode from "./EndingNode";
import { CostPanel } from "./CostPanel";
import { initialNodes, initialEdges } from "./storylineMapData";
import { Map, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  story: StoryNode,
  decision: DecisionNode,
  ending: EndingNode,
};

interface StorylineMapViewProps {
  completedNodes: Set<string>;
  currentNodeId?: string;
  onToggleNode: (id: string) => void;
  onBack?: () => void;
}

export function StorylineMapView({
  completedNodes,
  currentNodeId,
  onToggleNode,
  onBack,
}: StorylineMapViewProps): JSX.Element {
  // Initialize nodes with completion status from props
  const initialNodesWithState = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCompleted: completedNodes.has(node.id),
        isCurrentStep: node.id === currentNodeId,
      },
    }));
  }, [completedNodes, currentNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesWithState);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when completedNodes changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isCompleted: completedNodes.has(n.id),
          isCurrentStep: n.id === currentNodeId,
        },
      }))
    );
  }, [completedNodes, currentNodeId, setNodes]);

  // Update edges to animate completed paths
  const animatedEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceCompleted = completedNodes.has(edge.source);
      const targetCompleted = completedNodes.has(edge.target);
      return {
        ...edge,
        animated: sourceCompleted && targetCompleted,
      };
    });
  }, [edges, completedNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Only allow toggling story nodes
      if (node.type === "story") {
        onToggleNode(node.id);
      }
    },
    [onToggleNode]
  );

  const calculateTotalCost = useCallback(() => {
    return nodes
      .filter(
        (n) => n.data.isCompleted && (n.data as Record<string, unknown>).cost
      )
      .reduce(
        (sum, n) => sum + ((n.data as Record<string, unknown>).cost as number),
        0
      );
  }, [nodes]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={animatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={2}
        className="bg-background"
      >
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-muted" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(node) => {
            if (node.data.isCurrentStep) return "#f59e0b";
            if (node.data.isCompleted) return "#22c55e";
            if (node.type === "decision") return "#eab308";
            if (node.type === "ending") return "#ef4444";
            return "#444";
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="!bg-background"
          color="hsl(var(--muted-foreground) / 0.2)"
        />
        <Panel position="top-left" className="!m-4">
          <div className="rounded-lg border bg-card p-4 shadow-lg max-w-sm">
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Map className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-lg">Tarkov Storyline Map</h1>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Click story nodes to mark as completed • Pan to navigate • Scroll
              to zoom
            </p>
            {/* WIP Warning */}
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  <span className="font-semibold">Work in Progress:</span> Map
                  data may be incomplete as the 1.0 storyline is still being
                  documented.
                </p>
              </div>
            </div>
          </div>
        </Panel>
        <CostPanel totalCost={calculateTotalCost()} nodes={nodes} />
      </ReactFlow>
    </div>
  );
}
