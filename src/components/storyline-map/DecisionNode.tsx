import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface DecisionNodeData {
  label: string;
  description?: string;
  isIrreversible?: boolean;
}

function DecisionNode({ data }: { data: DecisionNodeData }) {
  return (
    <div
      className={cn(
        "min-w-[180px] max-w-[240px] rounded-lg border-2 border-yellow-500 bg-yellow-500/10 p-3 shadow-lg",
        data.isIrreversible && "border-dashed"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-yellow-500" />
      <div className="space-y-1.5 text-center">
        <div className="text-lg text-yellow-500">⟨⟩</div>
        <span className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">
          {data.label}
        </span>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
        {data.isIrreversible && (
          <span className="inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
            Irreversible
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500" />
    </div>
  );
}

export default memo(DecisionNode);
