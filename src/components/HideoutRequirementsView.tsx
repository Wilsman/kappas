import React, { useMemo } from "react";
import { HideoutStation } from "@/types";
import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";

interface HideoutRequirementsViewProps {
  hideoutStations: HideoutStation[];
  completedHideoutItems: Set<string>;
  onNavigateToStation?: (stationName: string) => void;
}

interface RequirementItem {
  itemName: string;
  iconLink?: string;
  totalCount: number;
  sources: Array<{
    stationName: string;
    level: number;
  }>;
}

export const HideoutRequirementsView: React.FC<
  HideoutRequirementsViewProps
> = ({ hideoutStations, completedHideoutItems, onNavigateToStation }) => {
  // Aggregate all remaining items needed across all stations
  const remainingRequirements = useMemo(() => {
    const itemMap = new Map<string, RequirementItem>();

    hideoutStations.forEach((station) => {
      station.levels.forEach((level) => {
        level.itemRequirements.forEach((req) => {
          const itemKey = `${station.name}-${level.level}-${req.item.name}`;

          // Skip if already completed
          if (completedHideoutItems.has(itemKey)) {
            return;
          }

          const existing = itemMap.get(req.item.name);
          if (existing) {
            existing.totalCount += req.count;
            existing.sources.push({
              stationName: station.name,
              level: level.level,
            });
          } else {
            itemMap.set(req.item.name, {
              itemName: req.item.name,
              iconLink: req.item.iconLink,
              totalCount: req.count,
              sources: [
                {
                  stationName: station.name,
                  level: level.level,
                },
              ],
            });
          }
        });
      });
    });

    // Sort by total count descending
    return Array.from(itemMap.values()).sort(
      (a, b) => b.totalCount - a.totalCount
    );
  }, [hideoutStations, completedHideoutItems]);

  const totalItems = remainingRequirements.length;

  const handleStationClick = (stationName: string) => {
    if (onNavigateToStation) {
      onNavigateToStation(stationName);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="p-4 pb-0 flex-shrink-0">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="text-3xl">{totalItems}</span>
          <span>Total Hideout Requirements</span>
        </h2>
        <p className="text-muted-foreground">
          All items needed to fully upgrade every station.
        </p>
      </div>

      {/* Items List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {remainingRequirements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">🎉 All hideout items completed!</p>
            </div>
          ) : (
            remainingRequirements.map((item) => (
              <div
                key={item.itemName}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Item Icon */}
                {item.iconLink && (
                  <img
                    src={item.iconLink}
                    alt={item.itemName}
                    className="h-12 w-12 object-contain flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}

                {/* Item Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate">
                    {item.itemName}
                  </div>
                  {/* Sources */}
                  <div className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    {item.sources.map((source, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleStationClick(source.stationName)}
                      >
                        {source.stationName} Lvl {source.level}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Count */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold">
                    x{item.totalCount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
