import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Hammer } from "lucide-react";

export interface CraftNodeData {
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

function CraftNode({ data }: { data: CraftNodeData }) {
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
        // Craft styling (when not completed/current) - cyan/blue with stronger emphasis
        !data.isCompleted &&
          !data.isCurrentStep &&
          "border-cyan-400 bg-cyan-500/10 shadow-cyan-400/20",
        // Has cost or time gate
        hasCostOrTime && "min-w-[220px]",
        // Irreversible decision
        data.isIrreversible && "border-orange-400/70 bg-orange-400/5"
      )}
    >
      <Handle type="target" position={Position.Top} />

      {/* Craft icon indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Hammer className="h-4 w-4 text-cyan-500" />
        <h3
          className={cn(
            "font-semibold text-sm leading-tight",
            data.isCompleted && "text-green-700 dark:text-green-300",
            data.isCurrentStep && "text-amber-700 dark:text-amber-300",
            !data.isCompleted &&
              !data.isCurrentStep &&
              "text-cyan-700 dark:text-cyan-300"
          )}
        >
          {data.label}
        </h3>
      </div>

      {data.description && (
        <p
          className={cn(
            "text-xs mb-2 leading-relaxed",
            data.isCompleted && "text-green-600 dark:text-green-400/80",
            data.isCurrentStep && "text-amber-600 dark:text-amber-400/80",
            !data.isCompleted && !data.isCurrentStep && "text-muted-foreground"
          )}
        >
          {data.description}
        </p>
      )}

      {/* Craft hours display */}
      {isCraft && data.craftHours && (
        <div className="flex items-center gap-1 mb-2">
          <Hammer className="h-3 w-3 text-cyan-500" />
          <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
            {data.craftHours} hour craft
          </span>
        </div>
      )}

      {/* Note display */}
      {data.note && (
        <div
          className={cn(
            "text-xs italic rounded px-2 py-1",
            data.isCompleted &&
              "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
            data.isCurrentStep &&
              "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
            !data.isCompleted &&
              !data.isCurrentStep &&
              "bg-cyan-100/50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
          )}
        >
          {data.note}
        </div>
      )}

      {/* Cost display */}
      {hasCost && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs font-bold">
            {data.cost && data.cost < 100
              ? `${data.cost} BTC`
              : data.cost && data.cost < 1000000
              ? `${(data.cost / 1000).toFixed(0)}K ₽`
              : data.cost && `${(data.cost / 1000000).toFixed(1)}M ₽`}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(CraftNode);
