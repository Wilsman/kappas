import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface StoryNodeData {
  label: string;
  description?: string;
  cost?: number;
  isCompleted?: boolean;
  isCurrentStep?: boolean;
  isIrreversible?: boolean;
  note?: string;
}

function StoryNode({ data }: { data: StoryNodeData }) {
  return (
    <div
      className={`story-node ${data.isCompleted ? "completed" : ""} ${
        data.isCurrentStep ? "current" : ""
      } ${data.isIrreversible ? "irreversible" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-header">
          {data.isCompleted && <span className="check-icon">✓</span>}
          {data.isCurrentStep && <span className="current-icon">►</span>}
          <span className="node-label">{data.label}</span>
        </div>
        {data.description && (
          <p className="node-description">{data.description}</p>
        )}
        {data.cost !== undefined && data.cost > 0 && (
          <div className="node-cost">
            💰{" "}
            {data.cost >= 1000000
              ? `${(data.cost / 1000000).toFixed(0)}M ₽`
              : data.cost < 100
              ? `${data.cost} BTC`
              : `${data.cost.toLocaleString()} ₽`}
          </div>
        )}
        {data.note && <p className="node-note">{data.note}</p>}
        {data.isIrreversible && (
          <span className="irreversible-badge">Irreversible</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(StoryNode);
