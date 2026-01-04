import React, { useState, useMemo, useEffect } from "react";
import { useQueryState } from "nuqs";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  CheckCheck,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HideoutStation } from "@/types";

interface CollectorItem {
  name: string;
  order: number;
  img: string;
}

interface CollectorViewProps {
  collectorItems: CollectorItem[];
  completedCollectorItems: Set<string>;
  onToggleCollectorItem: (itemName: string) => void;
  completedHideoutItems: Set<string>;
  onSetHideoutItems: (items: Set<string>) => void;
  groupBy: GroupBy;
  hideoutStations: HideoutStation[];
  workingOnHideoutStations?: Set<string>;
  onToggleWorkingOnHideoutStation?: (stationKey: string) => void;
}

type GroupBy = "collector" | "hideout-stations";

export const CollectorView: React.FC<CollectorViewProps> = ({
  collectorItems,
  completedCollectorItems,
  onToggleCollectorItem,
  completedHideoutItems,
  onSetHideoutItems,
  groupBy,
  hideoutStations,
  workingOnHideoutStations = new Set(),
  onToggleWorkingOnHideoutStation,
}) => {
  const [searchTerm, setSearchTerm] = useQueryState("itemsSearch", {
    defaultValue: "",
  });
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return collectorItems;
    const term = searchTerm.toLowerCase();
    return collectorItems.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }, [collectorItems, searchTerm]);

  // Filter hideout stations based on search
  const filteredHideoutStations = useMemo(() => {
    if (!searchTerm.trim()) return hideoutStations;
    const term = searchTerm.toLowerCase();
    return hideoutStations
      .map((station) => {
        // Check if station name matches
        const stationMatches = station.name.toLowerCase().includes(term);

        // Filter levels that have matching items
        const filteredLevels = station.levels.filter((level) => {
          const hasMatchingItems = level.itemRequirements.some((req) =>
            req.item.name.toLowerCase().includes(term)
          );
          const hasMatchingSkills = level.skillRequirements.some((req) =>
            req.skill.name.toLowerCase().includes(term)
          );
          const hasMatchingStations = level.stationLevelRequirements.some(
            (req) => req.station.name.toLowerCase().includes(term)
          );
          return hasMatchingItems || hasMatchingSkills || hasMatchingStations;
        });

        // Include station if name matches or if it has matching levels
        if (stationMatches || filteredLevels.length > 0) {
          return {
            ...station,
            levels: stationMatches ? station.levels : filteredLevels,
          };
        }
        return null;
      })
      .filter(Boolean) as HideoutStation[];
  }, [hideoutStations, searchTerm]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(
    {}
  );

  // Handle quantity changes for items
  const handleQuantityChange = (
    itemKey: string,
    delta: number,
    maxQuantity: number
  ) => {
    setItemQuantities((prev) => {
      const nextQty = Math.max(
        0,
        Math.min(maxQuantity, (prev[itemKey] || 0) + delta)
      );
      const nextQuantities = { ...prev, [itemKey]: nextQty };
      const nextCompleted = new Set(completedHideoutItems);
      if (nextQty >= maxQuantity) nextCompleted.add(itemKey);
      else nextCompleted.delete(itemKey);
      onSetHideoutItems(nextCompleted);
      return nextQuantities;
    });
  };

  // Check if an item is a currency (Roubles, Euros, Dollars)
  const isCurrencyItem = (itemName: string) => {
    return /(Roubles|Euros|Dollars)$/i.test(itemName);
  };

  // Mark all items in a level as complete
  const handleMarkLevelComplete = (
    stationName: string,
    levelNum: number,
    level: { itemRequirements: { count: number; item: { name: string } }[] }
  ) => {
    const next = new Set(completedHideoutItems);
    const nextQuantities: Record<string, number> = {};
    const levelItemKeys = level.itemRequirements.map(
      (req) => `${stationName}-${levelNum}-${req.item.name}`
    );
    const isLevelComplete = levelItemKeys.every((key) => next.has(key));

    if (isLevelComplete) {
      level.itemRequirements.forEach((req) => {
        const itemKey = `${stationName}-${levelNum}-${req.item.name}`;
        next.delete(itemKey);
        nextQuantities[itemKey] = 0;
      });
    } else {
      level.itemRequirements.forEach((req) => {
        const itemKey = `${stationName}-${levelNum}-${req.item.name}`;
        next.add(itemKey);
        nextQuantities[itemKey] = req.count;
      });
    }

    setItemQuantities((prev) => ({ ...prev, ...nextQuantities }));
    onSetHideoutItems(next);
  };

  // Group items based on the current view mode
  const itemsByGroup = useMemo(() => {
    if (groupBy === "collector") {
      return { "Collector Items": filteredItems };
    } else if (groupBy === "hideout-stations") {
      const stationsMap: Record<string, HideoutStation> = {};
      hideoutStations.forEach((station) => {
        stationsMap[station.name] = station;
      });
      return stationsMap;
    }
    // Default to collector items if no group matches
    return { "Collector Items": filteredItems };
  }, [filteredItems, groupBy, hideoutStations]);

  const sortedGroups = useMemo(
    () => Object.entries(itemsByGroup).sort(([a], [b]) => a.localeCompare(b)),
    [itemsByGroup]
  );

  const allGroupNames = useMemo(() => {
    if (groupBy === "hideout-stations") {
      return filteredHideoutStations.map((station) => station.name);
    }
    return sortedGroups.map(([name]) => name);
  }, [groupBy, filteredHideoutStations, sortedGroups]);

  const areAllExpanded = expandedGroups.length === allGroupNames.length;

  // Start with Collector Items expanded by default, track initialization
  const [initializedGroupBy, setInitializedGroupBy] = useState<GroupBy | null>(
    null
  );
  useEffect(() => {
    if (initializedGroupBy !== groupBy) {
      // When switching to collector view, expand "Collector Items" by default
      if (groupBy === "collector") {
        setExpandedGroups(["Collector Items"]);
      } else {
        setExpandedGroups([]);
      }
      setInitializedGroupBy(groupBy);
    }
  }, [groupBy, allGroupNames, initializedGroupBy]);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };

  // Listen for global command search and apply to local search (items scope)
  useEffect(() => {
    type GlobalSearchDetail = {
      term?: string;
      scope?: "tasks" | "achievements" | "items";
    };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (
        !detail ||
        detail.scope !== "items" ||
        typeof detail.term !== "string"
      )
        return;
      setSearchTerm(detail.term);
      setExpandedGroups(allGroupNames);
    };
    window.addEventListener(
      "taskTracker:globalSearch",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "taskTracker:globalSearch",
        handler as EventListener
      );
  }, [allGroupNames, setSearchTerm]);

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Grouping toggles moved to sidebar */}

      {/* Search and Controls */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={
              groupBy === "hideout-stations"
                ? "Search stations, items, skills..."
                : "Search items..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAll}
          className="flex items-center gap-2"
        >
          {areAllExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Loading and Error States */}
      {/* Hideout Stations View */}
      {groupBy === "hideout-stations" && (
        <Accordion
          type="multiple"
          className="w-full space-y-2"
          value={expandedGroups}
          onValueChange={setExpandedGroups}
        >
          {filteredHideoutStations.length === 0 && searchTerm.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              No stations or items found matching "{searchTerm}"
            </div>
          )}
          {filteredHideoutStations.map((station) => {
            // Calculate total completion for this station
            const totalStationItems = station.levels.reduce(
              (sum, level) => sum + level.itemRequirements.length,
              0
            );
            const completedStationItems = station.levels.reduce(
              (sum, level) => {
                return (
                  sum +
                  level.itemRequirements.filter((req) => {
                    const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                    return completedHideoutItems.has(itemKey);
                  }).length
                );
              },
              0
            );
            const stationProgress =
              totalStationItems > 0
                ? (completedStationItems / totalStationItems) * 100
                : 0;

            return (
              <AccordionItem
                key={station.name}
                value={station.name}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      {station.imageLink && (
                        <img
                          src={station.imageLink}
                          alt={station.name}
                          className="h-16 w-16 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      )}
                      <h3 className="text-lg font-semibold">{station.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {completedStationItems} / {totalStationItems}
                      </span>
                      <Progress value={stationProgress} className="w-24 h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t">
                  <div className="space-y-4">
                    {station.levels.map((level) => {
                      // Calculate completion for this level
                      const totalItems = level.itemRequirements.length;
                      const completedItems = level.itemRequirements.filter(
                        (req) => {
                          const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                          return completedHideoutItems.has(itemKey);
                        }
                      ).length;
                      const progress =
                        totalItems > 0
                          ? (completedItems / totalItems) * 100
                          : 0;

                      return (
                        <div
                          key={`${station.name}-${level.level}`}
                          className="border rounded-lg p-4 space-y-4"
                        >
                          {/* Level Header with Progress */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-base">
                              Level {level.level}
                            </h4>
                            <div className="flex items-center gap-2">
                              {onToggleWorkingOnHideoutStation && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const stationKey = `${station.name}-${level.level}`;
                                    onToggleWorkingOnHideoutStation(stationKey);
                                  }}
                                  className={cn(
                                    "p-1 rounded-sm transition-colors",
                                    workingOnHideoutStations.has(
                                      `${station.name}-${level.level}`
                                    )
                                      ? "text-blue-500 hover:text-blue-600"
                                      : "text-muted-foreground/40 hover:text-muted-foreground"
                                  )}
                                  title={
                                    workingOnHideoutStations.has(
                                      `${station.name}-${level.level}`
                                    )
                                      ? "Remove from working on"
                                      : "Mark as working on"
                                  }
                                >
                                  <Target
                                    className="h-4 w-4"
                                    fill={
                                      workingOnHideoutStations.has(
                                        `${station.name}-${level.level}`
                                      )
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </button>
                              )}
                              {totalItems > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMarkLevelComplete(
                                      station.name,
                                      level.level,
                                      level
                                    )
                                  }
                                  className="h-7 gap-1.5 text-xs"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">
                                    {completedItems === totalItems
                                      ? "Reset All"
                                      : "Mark All"}
                                  </span>
                                </Button>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {completedItems} / {totalItems}
                              </span>
                              <Progress value={progress} className="w-20 h-2" />
                            </div>
                          </div>

                          {/* Skill Requirements */}
                          {level.skillRequirements.length > 0 && (
                            <div className="bg-muted/30 p-3 rounded-md">
                              <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                Skill Requirements
                              </h5>
                              <div className="space-y-1">
                                {level.skillRequirements.map((req, idx) => (
                                  <div
                                    key={`skill-${station.name}-${level.level}-${idx}`}
                                    className="text-sm"
                                  >
                                    • {req.skill.name} Level {req.level}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Station Level Requirements */}
                          {level.stationLevelRequirements.length > 0 && (
                            <div className="bg-muted/30 p-3 rounded-md">
                              <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                Station Requirements
                              </h5>
                              <div className="space-y-1">
                                {level.stationLevelRequirements.map(
                                  (req, idx) => (
                                    <div
                                      key={`station-req-${station.name}-${level.level}-${idx}`}
                                      className="text-sm"
                                    >
                                      • {req.station.name} Level {req.level}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Item Requirements */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-muted-foreground">
                              Required Items
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {level.itemRequirements.map((req, idx) => {
                                const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                                const isCurrency = isCurrencyItem(
                                  req.item.name
                                );
                                const currentQty = itemQuantities[itemKey] || 0;
                                const isCompleted =
                                  completedHideoutItems.has(itemKey) ||
                                  (!isCurrency && currentQty >= req.count);
                                const progressText = isCurrency
                                  ? ""
                                  : `${currentQty}/${req.count}`;

                                return (
                                  <div
                                    key={`${station.name}-${level.level}-${idx}`}
                                    className={cn(
                                      "flex flex-col gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                                      isCompleted && "opacity-60"
                                    )}
                                  >
                                    <div className="flex items-start gap-2">
                                      <Checkbox
                                        id={`${station.name}-${level.level}-${req.item.name}`}
                                        checked={isCompleted}
                                        onCheckedChange={(checked) => {
                                          const isChecked = Boolean(checked);
                                          setItemQuantities((prev) => ({
                                            ...prev,
                                            [itemKey]: isChecked
                                              ? req.count
                                              : 0,
                                          }));
                                          const nextCompleted = new Set(
                                            completedHideoutItems
                                          );
                                          if (isChecked)
                                            nextCompleted.add(itemKey);
                                          else nextCompleted.delete(itemKey);
                                          onSetHideoutItems(nextCompleted);
                                        }}
                                        className="h-5 w-5 flex-shrink-0 mt-1"
                                      />
                                      <label
                                        htmlFor={`${station.name}-${level.level}-${req.item.name}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div className="flex items-center justify-center mb-2">
                                          {req.item.iconLink && (
                                            <img
                                              src={req.item.iconLink}
                                              alt={req.item.name}
                                              className="h-16 w-16 object-contain"
                                              onError={(e) => {
                                                const target =
                                                  e.target as HTMLImageElement;
                                                target.style.display = "none";
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div
                                          className={cn(
                                            "text-sm font-medium text-center mb-2",
                                            isCompleted &&
                                              "line-through text-muted-foreground"
                                          )}
                                        >
                                          {req.item.name}
                                        </div>
                                        {isCurrency ? (
                                          <div className="text-center text-sm font-semibold text-foreground/90">
                                            {req.count.toLocaleString()}x
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center gap-1 bg-muted/30 rounded-md px-2 py-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(
                                                  itemKey,
                                                  -1,
                                                  req.count
                                                );
                                              }}
                                              className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                                currentQty <= 0 &&
                                                  "opacity-50 cursor-not-allowed"
                                              )}
                                              disabled={currentQty <= 0}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-16 text-center text-sm font-medium">
                                              {progressText}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuantityChange(
                                                  itemKey,
                                                  1,
                                                  req.count
                                                );
                                              }}
                                              className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                                currentQty >= req.count &&
                                                  "opacity-50 cursor-not-allowed"
                                              )}
                                              disabled={currentQty >= req.count}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </button>
                                          </div>
                                        )}
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Regular Items View */}
      {groupBy !== "hideout-stations" && (
        <Accordion
          type="multiple"
          className="w-full space-y-2"
          value={expandedGroups}
          onValueChange={setExpandedGroups}
        >
          {sortedGroups.map(([groupName, groupItems]) => {
            const completedCount = (groupItems as CollectorItem[]).filter(
              (item) => completedCollectorItems.has(item.name)
            ).length;
            const totalCount = groupItems.length;
            const progress =
              totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <AccordionItem
                key={groupName}
                value={groupName}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg font-semibold">{groupName}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {completedCount} / {totalCount}
                      </span>
                      <Progress value={progress} className="w-24 h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {(groupItems as CollectorItem[]).map((item) => (
                      <div
                        key={item.name}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                          completedCollectorItems.has(item.name) && "opacity-60"
                        )}
                      >
                        <Checkbox
                          id={item.name}
                          checked={completedCollectorItems.has(item.name)}
                          onCheckedChange={() =>
                            onToggleCollectorItem(item.name)
                          }
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={item.name}
                          className={cn(
                            "flex-1 flex items-center gap-2 cursor-pointer",
                            completedCollectorItems.has(item.name) &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {item.img && (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          )}
                          <span>{item.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};
