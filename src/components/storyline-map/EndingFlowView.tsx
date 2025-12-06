import { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Coins,
  Bitcoin,
  Wrench,
  Gift,
  Hourglass,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import StoryNode from "./StoryNode";
import CraftNode from "./CraftNode";
import DecisionNode from "./DecisionNode";
import EndingNode from "./EndingNode";
import {
  endingInfos,
  getEndingPathData,
  formatRoubles,
  formatHours,
} from "./endingData";

const nodeTypes = {
  story: StoryNode,
  craft: CraftNode,
  decision: DecisionNode,
  ending: EndingNode,
};

interface EndingFlowViewProps {
  endingId: string;
  onBack: () => void;
}

export function EndingFlowView({ endingId, onBack }: EndingFlowViewProps) {
  const endingInfo = endingInfos.find((e) => e.id === endingId);
  const { nodes, edges, breakdown } = useMemo(
    () => getEndingPathData(endingId),
    [endingId]
  );

  if (!endingInfo) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p>Ending not found</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        panOnScroll
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="bg-background"
      >
        <Controls
          className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-muted"
          showInteractive={false}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="!bg-background"
          color="hsl(var(--muted-foreground) / 0.2)"
        />

        {/* Header Panel */}
        <Panel position="top-left" className="!m-4">
          <div
            className="rounded-lg border-2 bg-card p-4 shadow-lg max-w-sm"
            style={{ borderColor: endingInfo.color }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-2xl">{endingInfo.icon}</span>
              <div>
                <h1
                  className="font-bold text-lg"
                  style={{ color: endingInfo.color }}
                >
                  {endingInfo.label} Path
                </h1>
                <p className="text-xs text-muted-foreground">
                  {endingInfo.tagline}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {endingInfo.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {breakdown.totalCraftHours > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Wrench className="h-4 w-4 text-cyan-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Crafts</p>
                    <p className="text-sm font-semibold">
                      {formatHours(breakdown.totalCraftHours)}
                    </p>
                  </div>
                </div>
              )}
              {breakdown.totalTimeGateHours > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Hourglass className="h-4 w-4 text-rose-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Time Gates
                    </p>
                    <p className="text-sm font-semibold">
                      {formatHours(breakdown.totalTimeGateHours)}
                    </p>
                  </div>
                </div>
              )}
              {breakdown.totalCostRoubles > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Roubles</p>
                    <p className="text-sm font-semibold">
                      {formatRoubles(breakdown.totalCostRoubles)}
                    </p>
                  </div>
                </div>
              )}
              {breakdown.totalCostBTC > 0 && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Bitcoin className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Bitcoin</p>
                    <p className="text-sm font-semibold">
                      {breakdown.totalCostBTC} BTC
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                <ListChecks className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Steps</p>
                  <p className="text-sm font-semibold">
                    {breakdown.steps.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Gift className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-medium">Rewards</span>
              </div>
              <div className="space-y-1">
                {endingInfo.rewards.map((reward) => (
                  <div
                    key={reward.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    {reward.icon && <span>{reward.icon}</span>}
                    <span className="font-medium">{reward.name}</span>
                    {reward.description && (
                      <span className="text-muted-foreground">
                        - {reward.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* Controls hint */}
        <Panel position="bottom-center" className="!mb-4">
          <div className="px-4 py-2 rounded-full bg-card/70 backdrop-blur-sm border border-border/50 shadow-lg">
            <p className="text-xs text-muted-foreground">
              Scroll to zoom • Drag to pan
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
