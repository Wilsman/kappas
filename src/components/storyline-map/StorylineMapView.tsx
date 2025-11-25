import { useCallback, useMemo, useEffect, useState } from "react";
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
import { EndingBreakdownPanel } from "./EndingBreakdownPanel";
import {
  initialNodes,
  initialEdges,
  findPathToNode,
  getPathBreakdown,
  getPathEdgeIds,
} from "./storylineMapData";
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
  // Track selected node for path highlighting and breakdown view
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Start with interactivity locked by default
  const [nodesLocked, setNodesLocked] = useState(true);

  // Compute path to selected node
  const { pathNodeIds, pathEdgeIds } = useMemo(() => {
    if (!selectedNodeId)
      return { pathNodeIds: new Set<string>(), pathEdgeIds: new Set<string>() };
    const pathNodes = findPathToNode(
      selectedNodeId,
      initialNodes,
      initialEdges
    );
    return {
      pathNodeIds: new Set(pathNodes.map((n) => n.id)),
      pathEdgeIds: getPathEdgeIds(pathNodes, initialEdges),
    };
  }, [selectedNodeId]);

  // Initialize nodes with completion status from props
  const initialNodesWithState = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCompleted: completedNodes.has(node.id),
        isCurrentStep: node.id === currentNodeId,
        isSelected: node.id === selectedNodeId,
        isOnPath: pathNodeIds.has(node.id),
      },
    }));
  }, [completedNodes, currentNodeId, selectedNodeId, pathNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesWithState);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when completedNodes or selectedNodeId changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isCompleted: completedNodes.has(n.id),
          isCurrentStep: n.id === currentNodeId,
          isSelected: n.id === selectedNodeId,
          isOnPath: pathNodeIds.has(n.id),
        },
      }))
    );
  }, [completedNodes, currentNodeId, selectedNodeId, pathNodeIds, setNodes]);

  // Update edges to animate completed paths and highlight selected path
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const sourceCompleted = completedNodes.has(edge.source);
      const targetCompleted = completedNodes.has(edge.target);
      const isOnPath = pathEdgeIds.has(edge.id);
      return {
        ...edge,
        animated: sourceCompleted && targetCompleted,
        style: {
          ...edge.style,
          strokeWidth: isOnPath ? 4 : 2,
          opacity: selectedNodeId && !isOnPath ? 0.2 : 1,
        },
      };
    });
  }, [edges, completedNodes, pathEdgeIds, selectedNodeId]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Toggle path selection for any node (always allowed)
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  // Double-click to toggle completion (when unlocked)
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "story" && !nodesLocked) {
        onToggleNode(node.id);
      }
    },
    [onToggleNode, nodesLocked]
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

  // Compute path breakdown for selected node
  const selectedNodeBreakdown = useMemo(() => {
    if (!selectedNodeId) return null;
    const pathNodes = findPathToNode(
      selectedNodeId,
      initialNodes,
      initialEdges
    );
    return getPathBreakdown(pathNodes);
  }, [selectedNodeId]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag={!nodesLocked}
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={!nodesLocked}
        nodesConnectable={!nodesLocked}
        elementsSelectable={!nodesLocked}
        className="bg-background"
      >
        <Controls
          className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-muted"
          showInteractive
          onInteractiveChange={(interactive) => setNodesLocked(!interactive)}
        />
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
        {selectedNodeId && selectedNodeBreakdown && (
          <EndingBreakdownPanel
            endingLabel={
              ((
                nodes.find((n) => n.id === selectedNodeId)?.data as Record<
                  string,
                  unknown
                >
              )?.label as string) || selectedNodeId
            }
            breakdown={selectedNodeBreakdown}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
        {/* Controls hint pill at bottom */}
        <Panel position="bottom-center" className="!mb-4">
          <div className="px-4 py-2 rounded-full bg-card/70 backdrop-blur-sm border border-border/50 shadow-lg">
            <p className="text-xs text-muted-foreground">
              Click node to see path • Ctrl+scroll to zoom
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
