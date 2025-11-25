import { Panel } from "@xyflow/react";
import type { Node } from "@xyflow/react";

interface CostPanelProps {
  totalCost: number;
  nodes: Node[];
}

function CostPanel({ totalCost, nodes }: CostPanelProps) {
  const completedSteps = nodes.filter((n) => n.data.isCompleted).length;
  const totalSteps = nodes.filter((n) => n.type === "story").length;
  const currentStep = nodes.find((n) => n.data.isCurrentStep);

  return (
    <Panel position="top-right" className="cost-panel">
      <h3>Progress Tracker</h3>
      <div className="stat-row">
        <span className="stat-label">Steps Completed:</span>
        <span className="stat-value">
          {completedSteps} / {totalSteps}
        </span>
      </div>
      {currentStep && (
        <div className="stat-row current">
          <span className="stat-label">Current Step:</span>
          <span className="stat-value">{currentStep.data.label as string}</span>
        </div>
      )}
      {totalCost > 0 && (
        <div className="stat-row cost">
          <span className="stat-label">Total Cost:</span>
          <span className="stat-value">
            {totalCost >= 1000000
              ? `${(totalCost / 1000000).toFixed(0)}M ₽`
              : totalCost < 100
              ? `${totalCost} BTC`
              : `${totalCost.toLocaleString()} ₽`}
          </span>
        </div>
      )}
      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-color current"></span>
          <span>Current Step</span>
        </div>
        <div className="legend-item">
          <span className="legend-color decision"></span>
          <span>Decision Point</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ending"></span>
          <span>Ending</span>
        </div>
      </div>
    </Panel>
  );
}

export default CostPanel;
