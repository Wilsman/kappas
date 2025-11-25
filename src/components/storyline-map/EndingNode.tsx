import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

export type EndingType = "survivor" | "debtor" | "savior" | "fallen" | "cultist" | "utopia";

export interface EndingNodeData {
  label: string;
  description?: string;
  endingType: EndingType;
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
  const color = endingColors[data.endingType] || "#64748b";
  const icon = endingIcons[data.endingType] || "🏁";

  return (
    <div
      className="min-w-[180px] max-w-[240px] rounded-lg border-2 bg-card p-3 shadow-lg"
      style={{ borderColor: color, boxShadow: `0 0 20px ${color}40` }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div className="space-y-1.5 text-center">
        <div className="text-2xl">{icon}</div>
        <span className="font-bold text-sm" style={{ color }}>
          {data.label}
        </span>
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

export default memo(EndingNode);
