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
  note?: string;
}

function StoryNode({ data }: { data: StoryNodeData }) {
  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[260px] rounded-lg border-2 bg-card p-3 shadow-lg transition-all",
        data.isCompleted && "border-green-500 bg-green-500/10",
        data.isCurrentStep &&
          "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50",
        !data.isCompleted &&
          !data.isCurrentStep &&
          !data.isUndetermined &&
          "border-border",
        data.isUndetermined &&
          "border-purple-500/60 border-dashed bg-purple-500/5",
        data.isIrreversible && !data.isUndetermined && "border-dashed"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn("!bg-primary", data.isUndetermined && "!bg-purple-500")}
      />
      <div className="space-y-1.5">
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
