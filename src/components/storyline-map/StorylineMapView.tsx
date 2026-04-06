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
  useReactFlow,
  getNodesBounds,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";

import StoryNode from "./StoryNode";
import CraftNode from "./CraftNode";
import DecisionNode from "./DecisionNode";
import EndingNode from "./EndingNode";
import AchievementNode from "./AchievementNode";
import UnknownZone from "./UnknownZone";
import { CostPanel } from "./CostPanel";
import { EndingBreakdownPanel } from "./EndingBreakdownPanel";
import { StorylineViewSwitcher } from "./StorylineViewSwitcher";
import {
  initialNodes,
  initialEdges,
  findPathToNode,
  getPathBreakdown,
  getPathEdgeIds,
} from "./storylineMapData";
import { resolveTimingData } from "./timing";
import {
  Map,
  ArrowLeft,
  AlertTriangle,
  Download,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  story: StoryNode,
  craft: CraftNode,
  decision: DecisionNode,
  ending: EndingNode,
  achievement: AchievementNode,
  zone: UnknownZone,
};

interface StorylineMapViewProps {
  completedNodes: Set<string>;
  currentNodeId?: string;
  onToggleNode: (id: string) => void;
  onBack?: () => void;
  onNavigateToEnding?: (endingId: string) => void;
}

// Image export settings
const EXPORT_SCALE = 2; // 2x for high quality
const EXPORT_PADDING = 100; // Padding around nodes

function DownloadButton() {
  const { getNodes } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);

  const onClick = async () => {
    setIsExporting(true);
    try {
      // Get the viewport element
      const viewportEl = document.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (!viewportEl) return;

      // Calculate bounds of all nodes with padding
      const nodesBounds = getNodesBounds(getNodes());
      const imageWidth =
        (nodesBounds.width + EXPORT_PADDING * 2) * EXPORT_SCALE;
      const imageHeight =
        (nodesBounds.height + EXPORT_PADDING * 2) * EXPORT_SCALE;

      // Calculate transform to fit all nodes
      const translateX = (-nodesBounds.x + EXPORT_PADDING) * EXPORT_SCALE;
      const translateY = (-nodesBounds.y + EXPORT_PADDING) * EXPORT_SCALE;

      const dataUrl = await toPng(viewportEl, {
        backgroundColor: "#0a0a0a",
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 1, // We're already scaling via transform
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${translateX}px, ${translateY}px) scale(${EXPORT_SCALE})`,
        },
      });

      // Download the image
      const link = document.createElement("a");
      link.download = `tarkov-storyline-map-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isExporting}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? "Exporting..." : "Export PNG"}
    </Button>
  );
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function formatNodePositionsForPaste(nodes: Node[]): string {
  const positions = nodes.map((n) => ({
    id: n.id,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
  }));

  const lines = positions.map((p) => `  "${p.id}": { x: ${p.x}, y: ${p.y} },`);

  return [
    "export const storylineNodePositions = {",
    ...lines,
    "} as const;",
    "",
  ].join("\n");
}

export function StorylineMapView({
  completedNodes,
  currentNodeId,
  onToggleNode,
  onBack,
  onNavigateToEnding,
}: StorylineMapViewProps): JSX.Element {
  // Track selected node for path highlighting and breakdown view
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Start with node positions unlocked by default
  const [nodesLocked, setNodesLocked] = useState(false);

  const [isExportingPositions, setIsExportingPositions] = useState(false);
  const [didCopyPositions, setDidCopyPositions] = useState(false);

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
    return initialNodes.map((node) => {
      const waitTimeInfo = resolveTimingData(
        node.data as Record<string, unknown>
      );
      return {
        ...node,
        data: {
          ...node.data,
          isCompleted: completedNodes.has(node.id),
          isCurrentStep: node.id === currentNodeId,
          isSelected: node.id === selectedNodeId,
          isOnPath: pathNodeIds.has(node.id),
          ...waitTimeInfo,
        },
      };
    });
  }, [completedNodes, currentNodeId, selectedNodeId, pathNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesWithState);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleExportPositions = useCallback(async () => {
    setIsExportingPositions(true);
    setDidCopyPositions(false);

    try {
      const text = formatNodePositionsForPaste(nodes);
      const didCopy = await copyTextToClipboard(text);
      if (!didCopy) console.log(text);
      setDidCopyPositions(didCopy);
      if (didCopy) setTimeout(() => setDidCopyPositions(false), 1500);
    } finally {
      setIsExportingPositions(false);
    }
  }, [nodes]);

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

  // Double-click to toggle completion
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "story" || node.type === "craft") {
        onToggleNode(node.id);
      }
    },
    [onToggleNode]
  );

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
    <div className="h-full min-h-0 w-full relative overflow-hidden">
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
            const data = node.data as Record<string, unknown>;
            const hasCost = (data.cost as number) > 0;
            const isCraft = data.isCraft as boolean;
            const isTimeGate = data.isTimeGate as boolean;
            if (data.isCurrentStep) return "#f59e0b"; // amber
            if (data.isCompleted) return "#22c55e"; // green
            if (node.type === "decision") return "#eab308";
            if (node.type === "ending") return "#ef4444";
            if (hasCost && isTimeGate) return "#f97316"; // orange (cost + wait)
            if (hasCost) return "#eab308"; // yellow (cost only)
            if (isCraft) return "#22d3ee"; // cyan (craft)
            if (isTimeGate) return "#fb7185"; // rose (time-gate wait)
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
            <div className="mb-2 flex gap-2">
              <DownloadButton />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPositions}
                disabled={isExportingPositions}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {isExportingPositions
                  ? "Exporting..."
                  : didCopyPositions
                  ? "Copied!"
                  : "Export positions"}
              </Button>
            </div>
            {onNavigateToEnding && (
              <div className="mb-3">
                <StorylineViewSwitcher
                  currentViewId="full-map"
                  onSelectEnding={onNavigateToEnding}
                  onSelectFullMap={() => {}}
                />
              </div>
            )}
            <div className="mb-2">
              <a
                href="https://x.com/Callsign_Smokey"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md transition-all duration-200 hover:scale-105 text-xs"
              >
                <svg
                  className="w-3 h-3 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="font-medium text-primary group-hover:text-primary/90">
                  @Callsign_Smokey
                </span>
                <span className="text-muted-foreground group-hover:text-muted-foreground/80">
                  • Storyline Data
                </span>
                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </a>
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
        <CostPanel nodes={nodes} />
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
              {nodesLocked
                ? "Nodes locked • Click to inspect • Ctrl+scroll to zoom"
                : "Nodes unlocked • Drag to reposition • Ctrl+scroll to zoom"}
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
