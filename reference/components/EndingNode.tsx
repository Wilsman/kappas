import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface EndingNodeData {
  label: string;
  description?: string;
  endingType:
    | "survivor"
    | "debtor"
    | "savior"
    | "fallen"
    | "cultist"
    | "utopia";
}

const endingColors: Record<string, string> = {
  survivor: "#3b82f6",
  debtor: "#ef4444",
  savior: "#22c55e",
  utopia: "#22c55e",
  fallen: "#6b7280",
  cultist: "#8b5cf6",
};

const endingIcons: Record<string, string> = {
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
      className="ending-node"
      style={{ borderColor: color, boxShadow: `0 0 20px ${color}40` }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="ending-icon">{icon}</div>
        <span className="node-label" style={{ color }}>
          {data.label}
        </span>
        {data.description && (
          <p className="node-description">{data.description}</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(EndingNode);
