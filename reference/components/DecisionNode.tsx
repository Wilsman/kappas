import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface DecisionNodeData {
  label: string;
  description?: string;
  isIrreversible?: boolean;
}

function DecisionNode({ data }: { data: DecisionNodeData }) {
  return (
    <div
      className={`decision-node ${data.isIrreversible ? "irreversible" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="decision-icon">⟨⟩</div>
        <span className="node-label">{data.label}</span>
        {data.description && (
          <p className="node-description">{data.description}</p>
        )}
        {data.isIrreversible && (
          <span className="irreversible-badge">Irreversible</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(DecisionNode);
