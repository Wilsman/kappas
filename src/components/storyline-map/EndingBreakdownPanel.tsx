import { Panel } from "@xyflow/react";
import { X, Clock, Coins, Bitcoin, ChevronRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PathBreakdown } from "./storylineMapData";

interface EndingBreakdownPanelProps {
  endingLabel: string;
  breakdown: PathBreakdown;
  onClose: () => void;
}

export function EndingBreakdownPanel({
  endingLabel,
  breakdown,
  onClose,
}: EndingBreakdownPanelProps) {
  const {
    steps,
    totalCostRoubles,
    totalCostBTC,
    totalCraftHours,
    totalTimeGateHours,
  } = breakdown;

  // Filter to show only significant steps (with costs, crafts, or time gates)
  const significantSteps = steps.filter(
    (s) => s.cost || s.isCraft || s.isTimeGate
  );

  return (
    <Panel position="bottom-right" className="!m-4">
      <div className="rounded-lg border bg-card shadow-xl w-[320px] max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div>
            <h3 className="font-bold text-sm">Path to {endingLabel}</h3>
            <p className="text-xs text-muted-foreground">
              {steps.length} steps total
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Totals Summary */}
        <div className="p-3 border-b bg-muted/10 grid grid-cols-4 gap-2 text-center">
          {totalCraftHours > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-cyan-500">
                <Wrench className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Crafts</span>
              </div>
              <p className="text-sm font-bold">{totalCraftHours}h</p>
            </div>
          )}
          {totalTimeGateHours > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-rose-500">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Wait</span>
              </div>
              <p className="text-sm font-bold">{totalTimeGateHours}h</p>
            </div>
          )}
          {totalCostRoubles > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-yellow-500">
                <Coins className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Roubles</span>
              </div>
              <p className="text-sm font-bold">
                {totalCostRoubles >= 1000000
                  ? `${(totalCostRoubles / 1000000).toFixed(0)}M`
                  : totalCostRoubles.toLocaleString()}
              </p>
            </div>
          )}
          {totalCostBTC > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-orange-500">
                <Bitcoin className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Bitcoin</span>
              </div>
              <p className="text-sm font-bold">{totalCostBTC} BTC</p>
            </div>
          )}
          {totalCraftHours === 0 &&
            totalTimeGateHours === 0 &&
            totalCostRoubles === 0 &&
            totalCostBTC === 0 && (
              <div className="col-span-4 text-xs text-muted-foreground">
                No major costs or time requirements
              </div>
            )}
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{step.label}</p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {step.description}
                    </p>
                  )}
                  {step.note && (
                    <p className="text-[10px] text-blue-400/70 italic truncate">
                      {step.note}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {step.isCraft && step.craftHours && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-500">
                        <Wrench className="h-2.5 w-2.5" />
                        {step.craftHours}h craft
                      </span>
                    )}
                    {step.isTimeGate && step.timeGateHours && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500">
                        <Clock className="h-2.5 w-2.5" />
                        {step.timeGateHours}h wait
                      </span>
                    )}
                    {step.cost !== undefined && step.cost > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-500">
                        <Coins className="h-2.5 w-2.5" />
                        {step.cost >= 1000000
                          ? `${(step.cost / 1000000).toFixed(0)}M ₽`
                          : step.cost < 1000
                          ? `${step.cost} BTC`
                          : `${step.cost.toLocaleString()} ₽`}
                      </span>
                    )}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with significant items */}
        {significantSteps.length > 0 && (
          <div className="p-2 border-t bg-muted/10">
            <p className="text-[10px] text-muted-foreground mb-1">
              Key requirements:
            </p>
            <div className="flex flex-wrap gap-1">
              {significantSteps.map((step) => (
                <span
                  key={step.id}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted"
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
