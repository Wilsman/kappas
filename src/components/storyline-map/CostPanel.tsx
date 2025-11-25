import { Panel } from "@xyflow/react";
import type { Node } from "@xyflow/react";

interface CostPanelProps {
  totalCost: number;
  nodes: Node[];
}

export function CostPanel({ totalCost, nodes }: CostPanelProps) {
  const completedSteps = nodes.filter((n) => n.data.isCompleted).length;
  const totalSteps = nodes.filter((n) => n.type === "story").length;
  const currentStep = nodes.find((n) => n.data.isCurrentStep);

  return (
    <Panel position="top-right" className="!m-4">
      <div className="rounded-lg border bg-card p-4 shadow-lg min-w-[200px]">
        <h3 className="font-bold text-sm mb-3">Progress Tracker</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Steps Completed:</span>
            <span className="font-medium">{completedSteps} / {totalSteps}</span>
          </div>
          
          {currentStep && (
            <div className="flex justify-between text-amber-500">
              <span>Current Step:</span>
              <span className="font-medium truncate max-w-[120px]">
                {currentStep.data.label as string}
              </span>
            </div>
          )}
          
          {totalCost > 0 && (
            <div className="flex justify-between text-yellow-500">
              <span>Total Cost:</span>
              <span className="font-medium">
                {totalCost >= 1000000
                  ? `${(totalCost / 1000000).toFixed(0)}M ₽`
                  : totalCost < 100
                  ? `${totalCost} BTC`
                  : `${totalCost.toLocaleString()} ₽`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Legend</h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Decision</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Ending</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
