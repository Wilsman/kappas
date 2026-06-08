import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HideoutStation } from "@/types";
import { cn } from "@/lib/utils";
import { taskStorage } from "@/utils/indexedDB";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  ExternalLink,
  CheckCircle,
  ListFilter,
  Search,
  Minus,
  Plus,
  EyeOff,
} from "lucide-react";

interface HideoutRequirementsViewProps {
  hideoutStations: HideoutStation[];
  completedHideoutItems: Set<string>;
  hideoutItemQuantities: Record<string, number>;
  onSetHideoutItems: (items: Set<string>) => void;
  onUpdateHideoutItemQuantity: (itemKey: string, count: number) => void;
  onNavigateToStation?: (stationName: string) => void;
}

interface RequirementItem {
  itemName: string;
  iconLink?: string;
  totalCount: number;
  foundInRaidCount: number;
  sources: Array<{
    itemKey: string;
    stationName: string;
    stationIconLink?: string;
    level: number;
    count: number;
    requiredCount: number;
    foundInRaid: boolean;
  }>;
  foundInRaid: boolean;
}

type RequirementViewMode = "all" | "fir";

type RequirementSource = RequirementItem["sources"][number];

interface VisibleRequirementItem extends RequirementItem {
  visibleSources: RequirementSource[];
  visibleCount: number;
}

const hasNamedRequirementItem = (
  item: { name?: unknown } | null | undefined,
): item is { name: string; iconLink?: string } =>
  typeof item?.name === "string" && item.name.trim().length > 0;

export const HideoutRequirementsView: React.FC<
  HideoutRequirementsViewProps
> = ({
  hideoutStations,
  completedHideoutItems,
  hideoutItemQuantities,
  onSetHideoutItems,
  onUpdateHideoutItemQuantity,
  onNavigateToStation,
}) => {
  const [viewMode, setViewMode] = useState<RequirementViewMode>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFirLevel, setSelectedFirLevel] = useState<number | "all">(
    "all",
  );
  const [hideFound, setHideFound] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    taskStorage
      .loadUserPreferences()
      .then((prefs) => {
        if (cancelled) {
          return;
        }

        if (prefs.hideoutRequirementsHideFound !== undefined) {
          setHideFound(prefs.hideoutRequirementsHideFound);
        }
        if (prefs.hideoutRequirementsLevelFilter !== undefined) {
          setSelectedFirLevel(prefs.hideoutRequirementsLevelFilter);
        }
      })
      .catch((error) => {
        console.error("Load hideout requirements preferences error", error);
      })
      .finally(() => {
        if (!cancelled) {
          setPrefsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsLoaded) {
      return;
    }

    taskStorage
      .saveUserPreferences({
        hideoutRequirementsHideFound: hideFound,
        hideoutRequirementsLevelFilter: selectedFirLevel,
      })
      .catch((error) => {
        console.error("Save hideout requirements preferences error", error);
      });
  }, [hideFound, prefsLoaded, selectedFirLevel]);

  // Aggregate all remaining items needed across all stations
  const remainingRequirements = useMemo(() => {
    const itemMap = new Map<string, RequirementItem>();

    hideoutStations.forEach((station) => {
      station.levels.forEach((level) => {
        level.itemRequirements.forEach((req) => {
          if (!hasNamedRequirementItem(req.item)) {
            return;
          }

          const itemKey = `${station.name}-${level.level}-${req.item.name}`;

          // Check if this requirement requires FiR
          const foundInRaid = Boolean(
            req.attributes?.some(
              (attr) =>
                (attr.type === "foundInRaid" || attr.name === "foundInRaid") &&
                attr.value === "true",
            ),
          );

          const existing = itemMap.get(req.item.name);
          if (existing) {
            existing.totalCount += req.count;
            existing.foundInRaidCount += foundInRaid ? req.count : 0;
            const existingSource = existing.sources.find(
              (source) =>
                source.stationName === station.name &&
                source.level === level.level &&
                source.foundInRaid === foundInRaid,
            );

            if (existingSource) {
              existingSource.count += req.count;
              existingSource.requiredCount += req.count;
            } else {
              existing.sources.push({
                itemKey,
                stationName: station.name,
                stationIconLink: station.imageLink,
                level: level.level,
                count: req.count,
                requiredCount: req.count,
                foundInRaid,
              });
            }
            // Mark as FiR if any source requires it
            existing.foundInRaid = existing.foundInRaid || foundInRaid;
          } else {
            itemMap.set(req.item.name, {
              itemName: req.item.name,
              iconLink: req.item.iconLink,
              totalCount: req.count,
              foundInRaidCount: foundInRaid ? req.count : 0,
              sources: [
                {
                  itemKey,
                  stationName: station.name,
                  stationIconLink: station.imageLink,
                  level: level.level,
                  count: req.count,
                  requiredCount: req.count,
                  foundInRaid,
                },
              ],
              foundInRaid,
            });
          }
        });
      });
    });

    // Sort by total count descending
    return Array.from(itemMap.values()).sort(
      (a, b) => b.totalCount - a.totalCount,
    );
  }, [hideoutStations]);

  const firLevels = useMemo(() => {
    return Array.from(
      new Set(
        remainingRequirements.flatMap((item) =>
          item.sources
            .filter((source) => source.foundInRaid)
            .map((source) => source.level),
        ),
      ),
    ).sort((a, b) => a - b);
  }, [remainingRequirements]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const getSourceQuantity = useCallback(
    (source: RequirementSource) => {
      if (completedHideoutItems.has(source.itemKey)) {
        return source.requiredCount;
      }

      return Math.max(
        0,
        Math.min(source.requiredCount, hideoutItemQuantities[source.itemKey] || 0),
      );
    },
    [completedHideoutItems, hideoutItemQuantities],
  );

  const isSourceComplete = useCallback(
    (source: RequirementSource) =>
      completedHideoutItems.has(source.itemKey) ||
      getSourceQuantity(source) >= source.requiredCount,
    [completedHideoutItems, getSourceQuantity],
  );

  const updateSourceQuantity = useCallback(
    (source: RequirementSource, delta: number) => {
      const currentQuantity = getSourceQuantity(source);
      const nextQuantity = Math.max(
        0,
        Math.min(source.requiredCount, currentQuantity + delta),
      );

      onUpdateHideoutItemQuantity(source.itemKey, nextQuantity);

      const nextCompleted = new Set(completedHideoutItems);
      if (nextQuantity >= source.requiredCount) {
        nextCompleted.add(source.itemKey);
      } else {
        nextCompleted.delete(source.itemKey);
      }
      onSetHideoutItems(nextCompleted);
    },
    [
      completedHideoutItems,
      getSourceQuantity,
      onSetHideoutItems,
      onUpdateHideoutItemQuantity,
    ],
  );

  const sourceMatchesSearch = useCallback(
    (item: RequirementItem, source: RequirementSource) => {
      if (!normalizedSearchTerm) {
        return true;
      }

      const levelText = `level ${source.level} lvl ${source.level} l${source.level}`;
      return [
        item.itemName,
        source.stationName,
        levelText,
        `${source.stationName} ${levelText}`,
      ].some((value) => value.toLowerCase().includes(normalizedSearchTerm));
    },
    [normalizedSearchTerm],
  );

  const visibleRequirements = useMemo<VisibleRequirementItem[]>(() => {
    if (viewMode === "fir") {
      return remainingRequirements
        .filter((item) => item.foundInRaidCount > 0)
        .map((item) => {
          const visibleSources = item.sources
            .filter((source) => source.foundInRaid)
            .filter(
              (source) =>
                selectedFirLevel === "all" || source.level === selectedFirLevel,
            )
            .filter((source) => sourceMatchesSearch(item, source))
            .filter((source) => !hideFound || !isSourceComplete(source))
            .toSorted((a, b) => {
              if (a.level !== b.level) {
                return a.level - b.level;
              }

              return a.stationName.localeCompare(b.stationName);
            });

          return {
            ...item,
            visibleSources,
            visibleCount: visibleSources.reduce(
              (total, source) => total + source.count,
              0,
            ),
          };
        })
        .filter((item) => item.visibleSources.length > 0)
        .toSorted((a, b) => {
          const aFirstLevel = Math.min(
            ...a.visibleSources.map((source) => source.level),
          );
          const bFirstLevel = Math.min(
            ...b.visibleSources.map((source) => source.level),
          );

          if (aFirstLevel !== bFirstLevel) {
            return aFirstLevel - bFirstLevel;
          }

          if (a.visibleCount !== b.visibleCount) {
            return b.visibleCount - a.visibleCount;
          }

          return a.itemName.localeCompare(b.itemName);
        });
    }

    return remainingRequirements.map((item) => ({
      ...item,
      visibleSources: item.sources
        .filter((source) => !isSourceComplete(source))
        .toSorted((a, b) => {
          if (a.level !== b.level) {
            return a.level - b.level;
          }

          return a.stationName.localeCompare(b.stationName);
        }),
      visibleCount: item.sources
        .filter((source) => !isSourceComplete(source))
        .reduce((total, source) => total + source.count, 0),
    })).filter((item) => item.visibleSources.length > 0);
  }, [
    hideFound,
    isSourceComplete,
    remainingRequirements,
    selectedFirLevel,
    sourceMatchesSearch,
    viewMode,
  ]);

  const totalItems = visibleRequirements.length;
  const allItemsCount = remainingRequirements.filter((item) =>
    item.sources.some((source) => !isSourceComplete(source)),
  ).length;
  const foundInRaidRequirements = remainingRequirements.filter(
    (item) => item.foundInRaidCount > 0,
  );
  const foundInRaidItemsCount = foundInRaidRequirements.length;
  const hasRemainingFirItems = foundInRaidItemsCount > 0;
  const hasActiveFirFilter =
    viewMode === "fir" &&
    (normalizedSearchTerm.length > 0 ||
      selectedFirLevel !== "all" ||
      hideFound);
  const hasSearchOrLevelFilter =
    viewMode === "fir" &&
    (normalizedSearchTerm.length > 0 || selectedFirLevel !== "all");
  const activeFirFilterLabel =
    normalizedSearchTerm.length > 0
      ? searchTerm.trim()
      : selectedFirLevel === "all"
        ? "current filters"
        : `level ${selectedFirLevel}`;

  const handleStationClick = (stationName: string) => {
    if (onNavigateToStation) {
      onNavigateToStation(stationName);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header - Fixed */}
        <div className="p-4 pb-0 flex-shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="text-3xl">{totalItems}</span>
                <span>
                  {viewMode === "fir"
                    ? "FIR Hideout Requirements"
                    : "Total Hideout Requirements"}
                </span>
              </h2>
              <p className="text-muted-foreground">
                {viewMode === "fir"
                  ? "Found in raid items still needed, split by station level."
                  : "All items needed to fully upgrade every station."}
              </p>
            </div>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value === "all" || value === "fir") {
                  setViewMode(value);
                }
              }}
              variant="outline"
              size="sm"
              className="w-fit rounded-lg border bg-card p-1 shadow-sm"
              aria-label="Hideout requirement view"
            >
              <ToggleGroupItem
                value="all"
                className="h-8 gap-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                aria-label="Show all hideout requirements"
              >
                <ListFilter className="h-4 w-4" />
                <span>All</span>
                <span className="text-xs opacity-75">{allItemsCount}</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="fir"
                className="h-8 gap-2 px-3 border border-transparent text-green-500 data-[state=on]:border-green-500/60 data-[state=on]:bg-transparent data-[state=on]:text-green-300"
                aria-label="Show only found in raid requirements"
              >
                <CheckCircle
                  className={
                    viewMode === "fir" ? "h-4 w-4 fill-current" : "h-4 w-4"
                  }
                />
                <span className="font-semibold">FIR</span>
                <span className="text-xs opacity-75">
                  {foundInRaidItemsCount}
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {viewMode === "fir" && (
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search FIR items, stations, or levels..."
                  className="h-10 pl-9"
                />
              </div>

              {firLevels.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHideFound((current) => !current)}
                    className={cn(
                      "h-9 gap-2",
                      hideFound &&
                        "border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/15 hover:text-green-200",
                    )}
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide found
                  </Button>

                  <ToggleGroup
                    type="single"
                    value={
                      selectedFirLevel === "all"
                        ? "all"
                        : String(selectedFirLevel)
                    }
                    onValueChange={(value) => {
                      if (!value) {
                        return;
                      }

                      setSelectedFirLevel(
                        value === "all" ? "all" : Number(value),
                      );
                    }}
                    variant="outline"
                    size="sm"
                    className="w-fit flex-wrap justify-start rounded-lg border bg-card p-1 shadow-sm"
                    aria-label="FIR requirement level filter"
                  >
                    <ToggleGroupItem
                      value="all"
                      className="h-8 px-3 data-[state=on]:border-green-500/50 data-[state=on]:bg-green-500/10 data-[state=on]:text-green-300"
                      aria-label="Show all FIR levels"
                    >
                      All levels
                    </ToggleGroupItem>
                    {firLevels.map((level) => (
                      <ToggleGroupItem
                        key={level}
                        value={String(level)}
                        className="h-8 px-3 data-[state=on]:border-green-500/50 data-[state=on]:bg-green-500/10 data-[state=on]:text-green-300"
                        aria-label={`Show level ${level} FIR requirements`}
                      >
                        L{level}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {visibleRequirements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">
                  {viewMode === "fir" && hasSearchOrLevelFilter
                    ? `No FIR requirements match "${activeFirFilterLabel}".`
                    : viewMode === "fir" && hideFound && hasRemainingFirItems
                    ? "All visible FIR requirements are already found."
                    : viewMode === "fir" && !hasRemainingFirItems
                    ? "No FIR hideout items remaining."
                    : "All hideout items completed!"}
                </p>
              </div>
            ) : (
              visibleRequirements.map((item) => {
                return (
                  <div
                    key={item.itemName}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {/* Item Icon */}
                    <div className="relative">
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
                      {/* FiR Badge */}
                      {item.foundInRaid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-background rounded-full" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Found in Raid Required</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Item Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">
                        {item.itemName}
                      </div>
                      {/* Sources */}
                      <div className="mt-2 flex flex-col items-start gap-1 text-xs">
                        {item.visibleSources.map((source, idx) => {
                          const currentQuantity = getSourceQuantity(source);
                          const isComplete = isSourceComplete(source);

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex min-h-9 min-w-72 items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/40",
                                isComplete && "opacity-60",
                              )}
                            >
                              <span className="flex min-w-0 flex-1 items-center gap-2">
                                {source.stationIconLink && (
                                  <img
                                    src={source.stationIconLink}
                                    alt=""
                                    className="h-5 w-5 object-contain"
                                    loading="lazy"
                                  />
                                )}
                                <span className="truncate font-medium">
                                  {source.stationName}
                                </span>
                              </span>

                              <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                L{source.level}
                              </span>

                              {viewMode === "fir" ? (
                                <div className="flex items-center gap-1 rounded-md bg-muted/30 px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSourceQuantity(source, -1)
                                    }
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded hover:bg-background/80",
                                      currentQuantity <= 0 &&
                                        "cursor-not-allowed opacity-50",
                                    )}
                                    disabled={currentQuantity <= 0}
                                    aria-label={`Decrease ${source.stationName} level ${source.level} ${item.itemName}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-14 text-center text-xs font-medium tabular-nums">
                                    {currentQuantity}/{source.requiredCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateSourceQuantity(source, 1)}
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded hover:bg-background/80",
                                      currentQuantity >= source.requiredCount &&
                                        "cursor-not-allowed opacity-50",
                                    )}
                                    disabled={
                                      currentQuantity >= source.requiredCount
                                    }
                                    aria-label={`Increase ${source.stationName} level ${source.level} ${item.itemName}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="min-w-8 rounded bg-green-500/10 px-1.5 py-0.5 text-center text-[10px] font-bold text-green-400">
                                  x{source.count.toLocaleString()}
                                </span>
                              )}

                              {isComplete && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {source.foundInRaid && viewMode !== "fir" && (
                                <span className="ml-1 rounded bg-green-500/15 px-1 text-[10px] font-semibold text-green-600">
                                  FIR
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleStationClick(source.stationName)
                                }
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-background/80 hover:text-primary"
                                aria-label={`Open ${source.stationName}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Count */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={
                          viewMode === "fir"
                            ? "text-sm font-semibold text-green-400"
                            : "text-lg font-bold"
                        }
                      >
                        {viewMode === "fir"
                          ? hasActiveFirFilter
                            ? `x${item.visibleCount.toLocaleString()} FIR visible`
                            : `x${item.foundInRaidCount.toLocaleString()} FIR total`
                          : `x${item.visibleCount.toLocaleString()}`}
                      </div>
                      {viewMode !== "fir" && item.foundInRaidCount > 0 ? (
                        <div className="text-xs font-medium text-green-600">
                          FIR {item.foundInRaidCount.toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
