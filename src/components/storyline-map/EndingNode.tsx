import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export type EndingType =
  | "survivor"
  | "debtor"
  | "savior"
  | "fallen"
  | "cultist"
  | "utopia";

export interface EndingNodeData {
  label: string;
  description?: string;
  endingType: EndingType;
  isSelected?: boolean;
  isUndetermined?: boolean;
}

const endingColors: Record<EndingType, string> = {
  survivor: "#3b82f6",
  debtor: "#ef4444",
  savior: "#22c55e",
  utopia: "#22c55e",
  fallen: "#6b7280",
  cultist: "#8b5cf6",
};

const endingIcons: Record<EndingType, string> = {
  survivor: "🛡️",
  debtor: "⛓️",
  savior: "⭐",
  utopia: "🌟",
  fallen: "💀",
  cultist: "🔮",
};

function EndingNode({ data }: { data: EndingNodeData }) {
  const baseColor = endingColors[data.endingType] || "#64748b";
  const color = data.isUndetermined ? "#a855f7" : baseColor;
  const icon = endingIcons[data.endingType] || "🏁";

  return (
    <div
      className={cn(
        "min-w-[180px] max-w-[240px] rounded-lg border-2 bg-card p-3 shadow-lg cursor-pointer transition-all hover:scale-105",
        data.isSelected && "ring-4 ring-offset-2 ring-offset-background",
        data.isUndetermined && "border-dashed"
      )}
      style={{
        borderColor: color,
        boxShadow: data.isSelected
          ? `0 0 30px ${color}80`
          : `0 0 20px ${color}40`,
        // @ts-expect-error CSS custom property for ring color
        "--tw-ring-color": color,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color }}
      />
      <div className="space-y-1.5 text-center">
        <div className="text-2xl">{data.isUndetermined ? "❓" : icon}</div>
        <span className="font-bold text-sm" style={{ color }}>
          {data.label}
        </span>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
        {data.isUndetermined && (
          <span className="inline-block rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
            ⚠ Path Unconfirmed
          </span>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Click to see path breakdown
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color }}
      />
    </div>
  );
}

export default memo(EndingNode);
