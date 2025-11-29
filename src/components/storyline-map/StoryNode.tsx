import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface StoryNodeData {
  label: string;
  description?: string;
  cost?: number;
  isCompleted?: boolean;
  isCurrentStep?: boolean;
  isIrreversible?: boolean;
  isUndetermined?: boolean;
  isTimeGate?: boolean;
  timeGateHours?: number;
  isCraft?: boolean;
  craftHours?: number;
  note?: string;
}

function StoryNode({ data }: { data: StoryNodeData }) {
  const hasCost = data.cost !== undefined && data.cost > 0;
  const isTimeGate = data.isTimeGate;
  const isCraft = data.isCraft;
  const hasWaitTime = isTimeGate || isCraft;
  const hasCostOrTime = hasCost || hasWaitTime;

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[260px] rounded-lg border-2 bg-card p-3 shadow-lg transition-all",
        // Completed state takes priority
        data.isCompleted && "border-green-500 bg-green-500/10",
        // Current step
        data.isCurrentStep &&
          "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50",
        // Craft styling (when not completed/current) - cyan/blue
        !data.isCompleted &&
          !data.isCurrentStep &&
          isCraft &&
          !isTimeGate &&
          !hasCost &&
          "border-cyan-400/70 bg-cyan-500/5",
        // Time gate styling (when not completed/current) - rose
        !data.isCompleted &&
          !data.isCurrentStep &&
          isTimeGate &&
          !isCraft &&
          !hasCost &&
          "border-rose-400/70 bg-rose-500/5",
        // Both craft and time gate (rare)
        !data.isCompleted &&
          !data.isCurrentStep &&
          isCraft &&
          isTimeGate &&
          !hasCost &&
          "border-purple-400/70 bg-purple-500/5",
        // Cost styling (when not completed/current)
        !data.isCompleted &&
          !data.isCurrentStep &&
          hasCost &&
          !isTimeGate &&
          "border-yellow-500/70 bg-yellow-500/5",
        // Both cost and time gate
        !data.isCompleted &&
          !data.isCurrentStep &&
          hasCost &&
          isTimeGate &&
          "border-orange-500/70 bg-gradient-to-br from-yellow-500/5 to-rose-500/5",
        // Default border
        !data.isCompleted &&
          !data.isCurrentStep &&
          !data.isUndetermined &&
          !hasCostOrTime &&
          "border-border",
        // Undetermined
        data.isUndetermined &&
          "border-purple-500/60 border-dashed bg-purple-500/5",
        data.isIrreversible && !data.isUndetermined && "border-dashed"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "!bg-primary",
          data.isUndetermined && "!bg-purple-500",
          isCraft && !isTimeGate && !data.isCompleted && "!bg-cyan-400",
          isTimeGate && !data.isCompleted && "!bg-rose-400",
          hasCost && !data.isCompleted && "!bg-yellow-500"
        )}
      />
      <div className="space-y-1.5">
        {/* Badges row for craft, time gate, and cost indicators */}
        {hasCostOrTime && !data.isCompleted && (
          <div className="flex flex-wrap gap-1 mb-1">
            {isCraft && (
              <span className="inline-flex items-center gap-0.5 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
                🔧 {data.craftHours ? `${data.craftHours}h craft` : "Craft"}
              </span>
            )}
            {isTimeGate && (
              <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                ⏳ {data.timeGateHours ? `${data.timeGateHours}h wait` : "Wait"}
              </span>
            )}
            {hasCost && (
              <span className="inline-flex items-center gap-0.5 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                💰 Cost
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          {data.isCompleted && <span className="text-green-500">✓</span>}
          {data.isCurrentStep && <span className="text-amber-500">►</span>}
          {data.isUndetermined && <span className="text-purple-500">?</span>}
          <span className="font-semibold text-sm">{data.label}</span>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
        {data.cost !== undefined && data.cost > 0 && (
          <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
            💰{" "}
            {data.cost >= 1000000
              ? `${(data.cost / 1000000).toFixed(0)}M ₽`
              : data.cost < 100
              ? `${data.cost} BTC`
              : `${data.cost.toLocaleString()} ₽`}
          </div>
        )}
        {data.note && (
          <p className="text-xs italic text-muted-foreground">{data.note}</p>
        )}
        {data.isIrreversible && (
          <span className="inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
            Irreversible
          </span>
        )}
        {data.isUndetermined && (
          <span className="inline-block rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
            ⚠ Unconfirmed
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  );
}

export default memo(StoryNode);
