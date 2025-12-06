import { useState } from "react";
import {
  Coins,
  Bitcoin,
  Gift,
  ChevronRight,
  Wrench,
  Map,
  Hourglass,
  ListChecks,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { endingInfos, formatRoubles, formatHours } from "./endingData";
import type { EndingInfo } from "./endingData";

interface EndingSelectorProps {
  onSelectEnding: (endingId: string) => void;
  onViewFullMap: () => void;
}

function EndingCard({
  ending,
  onSelect,
  onShowRewards,
}: {
  ending: EndingInfo;
  onSelect: () => void;
  onShowRewards: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col rounded-xl border-2 bg-card p-4 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl text-left w-full"
      style={{
        borderColor: ending.color,
        boxShadow: `0 4px 20px ${ending.color}20`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ending.icon}</span>
          <div>
            <h3 className="font-bold text-lg" style={{ color: ending.color }}>
              {ending.label}
            </h3>
            <p className="text-xs text-muted-foreground">{ending.tagline}</p>
          </div>
        </div>
        <ChevronRight
          className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: ending.color }}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">{ending.description}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ending.totalCraftHours > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <Wrench className="h-4 w-4 text-cyan-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Craft Time</p>
              <p className="text-sm font-semibold">
                {formatHours(ending.totalCraftHours)}
              </p>
            </div>
          </div>
        )}
        {ending.totalTimeGateHours > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <Hourglass className="h-4 w-4 text-rose-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Time Gates</p>
              <p className="text-sm font-semibold">
                {formatHours(ending.totalTimeGateHours)}
              </p>
            </div>
          </div>
        )}
        {ending.totalCostRoubles > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <Coins className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Roubles</p>
              <p className="text-sm font-semibold">
                {formatRoubles(ending.totalCostRoubles)}
              </p>
            </div>
          </div>
        )}
        {ending.totalCostBTC > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <Bitcoin className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Bitcoin</p>
              <p className="text-sm font-semibold">{ending.totalCostBTC} BTC</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
          <ListChecks className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-[10px] text-muted-foreground">Steps</p>
            <p className="text-sm font-semibold">{ending.totalSteps}</p>
          </div>
        </div>
      </div>

      {/* Rewards Preview */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">
              Rewards
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowRewards();
            }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors rounded-full bg-muted/50 hover:bg-muted px-2 py-0.5"
            title="View all rewards"
          >
            <Info className="h-3 w-3" />
            <span>View all</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ending.rewards.slice(0, 3).map((reward) => (
            <span
              key={reward.name}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]"
              title={reward.description}
            >
              {reward.icon && <span>{reward.icon}</span>}
              {reward.name}
            </span>
          ))}
          {ending.rewards.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{ending.rewards.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Key Decisions */}
      <div className="mt-3 pt-3 border-t">
        <p className="text-[10px] text-muted-foreground mb-1">Key decisions:</p>
        <p className="text-xs text-muted-foreground/80">
          {ending.keyDecisions.join(" → ")}
        </p>
      </div>
    </button>
  );
}

export function EndingSelector({
  onSelectEnding,
  onViewFullMap,
}: EndingSelectorProps) {
  const [rewardsDialogEnding, setRewardsDialogEnding] =
    useState<EndingInfo | null>(null);

  return (
    <>
      {/* Rewards Dialog */}
      <Dialog
        open={!!rewardsDialogEnding}
        onOpenChange={(open) => !open && setRewardsDialogEnding(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {rewardsDialogEnding && (
                <>
                  <span className="text-2xl">{rewardsDialogEnding.icon}</span>
                  <span style={{ color: rewardsDialogEnding.color }}>
                    {rewardsDialogEnding.label} Rewards
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {rewardsDialogEnding?.rewards.map((reward) => (
                <div
                  key={reward.name}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-2"
                >
                  {reward.icon && (
                    <span className="text-lg">{reward.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {reward.name}
                    </p>
                    {reward.description && (
                      <p className="text-xs text-muted-foreground">
                        {reward.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          {rewardsDialogEnding?.id === "savior" && (
            <p className="text-xs text-muted-foreground text-center border-t pt-3">
              All items are Found in Raid (FIR)
            </p>
          )}
        </DialogContent>
      </Dialog>

      <div className="h-full w-full overflow-auto bg-background p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Choose Your Ending</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Each ending has different requirements, costs, and rewards. Select
              one to see the detailed path, or view the full map to explore all
              options.
            </p>
          </div>

          {/* Ending Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {endingInfos.map((ending) => (
              <EndingCard
                key={ending.id}
                ending={ending}
                onSelect={() => onSelectEnding(ending.id)}
                onShowRewards={() => setRewardsDialogEnding(ending)}
              />
            ))}
          </div>

          {/* Full Map Button */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={onViewFullMap}
              className="gap-2"
            >
              <Map className="h-5 w-5" />
              View Full Storyline Map
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              See all paths and endings in one interactive flowchart
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
