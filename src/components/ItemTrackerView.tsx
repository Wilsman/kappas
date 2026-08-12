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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Target,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HideoutStation } from "@/types";
import {
  filterHideoutStations,
  getHideoutLevelProgress,
  isEditionDefaultHideoutLevel,
  getHideoutSkillRequirementKey,
  getHideoutStationProgress,
  getHideoutStationRequirementKey,
  setHideoutLevelBuilt,
} from "@/utils/hideoutProgress";

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
  completedHideoutRequirements: Set<string>;
  onSetHideoutRequirements: (requirements: Set<string>) => void;
  groupBy: GroupBy;
  hideoutStations: HideoutStation[];
  workingOnHideoutStations?: Set<string>;
  onToggleWorkingOnHideoutStation?: (stationKey: string) => void;
  hideoutItemQuantities?: Record<string, number>;
  onSetHideoutItemQuantities?: (quantities: Record<string, number>) => void;
  onUpdateHideoutItemQuantity?: (itemKey: string, count: number) => void;
  editionDefaultBuiltLevels?: ReadonlySet<string>;
  editionTitle?: string;
}

type GroupBy = "collector" | "hideout-stations";
type CollectorSortMode =
  | "name-asc"
  | "name-desc"
  | "incomplete-first"
  | "complete-first";

const COLLECTOR_SORT_STORAGE_KEY = "taskTracker_collectorSort_v1";
const COLLECTOR_HIDE_COMPLETED_STORAGE_KEY =
  "taskTracker_collectorHideCompleted_v1";
const HIDEOUT_HIDE_BUILT_STORAGE_KEY = "taskTracker_hideoutHideBuilt_v1";
const COLLECTOR_SORT_MODES: CollectorSortMode[] = [
  "name-asc",
  "name-desc",
  "incomplete-first",
  "complete-first",
];

const hasNamedRequirementItem = (
  item: { name?: unknown } | null | undefined,
): item is { name: string; iconLink?: string } =>
  typeof item?.name === "string" && item.name.trim().length > 0;

export const CollectorView: React.FC<CollectorViewProps> = ({
  collectorItems,
  completedCollectorItems,
  onToggleCollectorItem,
  completedHideoutItems,
  onSetHideoutItems,
  completedHideoutRequirements,
  onSetHideoutRequirements,
  groupBy,
  hideoutStations,
  workingOnHideoutStations = new Set(),
  onToggleWorkingOnHideoutStation,
  hideoutItemQuantities = {},
  onSetHideoutItemQuantities,
  onUpdateHideoutItemQuantity,
  editionDefaultBuiltLevels = new Set(),
  editionTitle,
}) => {
  const [searchTerm, setSearchTerm] = useQueryState("itemsSearch", {
    defaultValue: "",
  });
  const [collectorSort, setCollectorSort] =
    useState<CollectorSortMode>("name-asc");
  const [hasLoadedCollectorSortPreference, setHasLoadedCollectorSortPreference] =
    useState(false);
  const [hideCompletedCollectorItems, setHideCompletedCollectorItems] =
    useState(false);
  const [
    hasLoadedHideCompletedPreference,
    setHasLoadedHideCompletedPreference,
  ] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [hideBuiltHideoutLevels, setHideBuiltHideoutLevels] = useState(false);

  useEffect(() => {
    const savedSort = localStorage.getItem(COLLECTOR_SORT_STORAGE_KEY);
    if (COLLECTOR_SORT_MODES.includes(savedSort as CollectorSortMode)) {
      setCollectorSort(savedSort as CollectorSortMode);
    }
    setHasLoadedCollectorSortPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCollectorSortPreference) return;
    localStorage.setItem(COLLECTOR_SORT_STORAGE_KEY, collectorSort);
  }, [collectorSort, hasLoadedCollectorSortPreference]);

  useEffect(() => {
    const savedHideCompleted = localStorage.getItem(
      COLLECTOR_HIDE_COMPLETED_STORAGE_KEY,
    );
    setHideCompletedCollectorItems(savedHideCompleted === "true");
    setHasLoadedHideCompletedPreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedHideCompletedPreference) return;
    localStorage.setItem(
      COLLECTOR_HIDE_COMPLETED_STORAGE_KEY,
      String(hideCompletedCollectorItems),
    );
  }, [hideCompletedCollectorItems, hasLoadedHideCompletedPreference]);

  useEffect(() => {
    setHideBuiltHideoutLevels(
      localStorage.getItem(HIDEOUT_HIDE_BUILT_STORAGE_KEY) === "true",
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(
      HIDEOUT_HIDE_BUILT_STORAGE_KEY,
      String(hideBuiltHideoutLevels),
    );
  }, [hideBuiltHideoutLevels]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return collectorItems;
    const term = searchTerm.toLowerCase();
    return collectorItems.filter((item) =>
      item.name.toLowerCase().includes(term),
    );
  }, [collectorItems, searchTerm]);

  const sortedCollectorItems = useMemo(() => {
    const compareByOriginalOrder = (left: CollectorItem, right: CollectorItem) =>
      left.order - right.order || left.name.localeCompare(right.name);
    const compareByName = (left: CollectorItem, right: CollectorItem) =>
      left.name.localeCompare(right.name) || compareByOriginalOrder(left, right);
    const compareByCompletedStatus = (
      left: CollectorItem,
      right: CollectorItem,
      completedFirst: boolean,
    ) => {
      const leftCompleted = completedCollectorItems.has(left.name);
      const rightCompleted = completedCollectorItems.has(right.name);
      if (leftCompleted === rightCompleted) {
        return compareByName(left, right);
      }
      return leftCompleted === completedFirst ? -1 : 1;
    };

    return [...filteredItems].sort((left, right) => {
      switch (collectorSort) {
        case "name-asc":
          return compareByName(left, right);
        case "name-desc":
          return compareByName(right, left);
        case "incomplete-first":
          return compareByCompletedStatus(left, right, false);
        case "complete-first":
          return compareByCompletedStatus(left, right, true);
        default:
          return compareByName(left, right);
      }
    });
  }, [collectorSort, completedCollectorItems, filteredItems]);

  const visibleCollectorItems = useMemo(() => {
    if (!hideCompletedCollectorItems) return sortedCollectorItems;
    return sortedCollectorItems.filter(
      (item) => !completedCollectorItems.has(item.name),
    );
  }, [
    completedCollectorItems,
    hideCompletedCollectorItems,
    sortedCollectorItems,
  ]);

  const hideoutProgressState = useMemo(
    () => ({
      completedItems: completedHideoutItems,
      itemQuantities: hideoutItemQuantities,
      completedRequirements: completedHideoutRequirements,
      editionDefaultBuiltLevels,
    }),
    [
      completedHideoutItems,
      completedHideoutRequirements,
      editionDefaultBuiltLevels,
      hideoutItemQuantities,
    ],
  );

  const filteredHideoutStations = useMemo(
    () =>
      filterHideoutStations(
        hideoutStations,
        searchTerm,
        hideBuiltHideoutLevels,
        hideoutProgressState,
      ),
    [
      hideBuiltHideoutLevels,
      hideoutProgressState,
      hideoutStations,
      searchTerm,
    ],
  );
  // Handle quantity changes for items
  const handleQuantityChange = (
    itemKey: string,
    delta: number,
    maxQuantity: number,
  ) => {
    const currentQty = hideoutItemQuantities[itemKey] || 0;
    const nextQty = Math.max(0, Math.min(maxQuantity, currentQty + delta));

    // Update via prop callback
    if (onUpdateHideoutItemQuantity) {
      onUpdateHideoutItemQuantity(itemKey, nextQty);
    }

    // Update completed status
    const nextCompleted = new Set(completedHideoutItems);
    if (nextQty >= maxQuantity) nextCompleted.add(itemKey);
    else nextCompleted.delete(itemKey);
    onSetHideoutItems(nextCompleted);
  };

  // Check if an item is a currency (Roubles, Euros, Dollars)
  const isCurrencyItem = (itemName: string) => {
    return /(Roubles|Euros|Dollars)$/i.test(itemName);
  };

  const handleSetLevelBuilt = (
    stationName: string,
    level: HideoutStation["levels"][number],
    built: boolean,
  ) => {
    const next = setHideoutLevelBuilt(
      stationName,
      level,
      built,
      hideoutProgressState,
    );
    onSetHideoutItems(next.completedItems);
    onSetHideoutRequirements(next.completedRequirements);
    if (onSetHideoutItemQuantities) {
      onSetHideoutItemQuantities(next.itemQuantities);
    } else if (onUpdateHideoutItemQuantity) {
      level.itemRequirements.forEach((requirement) => {
        if (!hasNamedRequirementItem(requirement.item)) return;
        onUpdateHideoutItemQuantity(
          `${stationName}-${level.level}-${requirement.item.name}`,
          built ? requirement.count : 0,
        );
      });
    }
  };

  const handleToggleRequirement = (requirementKey: string, checked: boolean) => {
    const next = new Set(completedHideoutRequirements);
    if (checked) next.add(requirementKey);
    else next.delete(requirementKey);
    onSetHideoutRequirements(next);
  };

  // Group items based on the current view mode
  const itemsByGroup = useMemo(() => {
    if (groupBy === "collector") {
      return { "Collector Items": visibleCollectorItems };
    } else if (groupBy === "hideout-stations") {
      const stationsMap: Record<string, HideoutStation> = {};
      hideoutStations.forEach((station) => {
        stationsMap[station.name] = station;
      });
      return stationsMap;
    }
    // Default to collector items if no group matches
    return { "Collector Items": visibleCollectorItems };
  }, [visibleCollectorItems, groupBy, hideoutStations]);

  const sortedGroups = useMemo(
    () => Object.entries(itemsByGroup).sort(([a], [b]) => a.localeCompare(b)),
    [itemsByGroup],
  );

  const allGroupNames = useMemo(() => {
    if (groupBy === "hideout-stations") {
      return filteredHideoutStations.map((station) => station.name);
    }
    return sortedGroups.map(([name]) => name);
  }, [groupBy, filteredHideoutStations, sortedGroups]);

  const areAllExpanded =
    allGroupNames.length > 0 &&
    allGroupNames.every((groupName) => expandedGroups.includes(groupName));

  // Start with Collector Items expanded by default, track initialization
  const [initializedGroupBy, setInitializedGroupBy] = useState<GroupBy | null>(
    null,
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
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "taskTracker:globalSearch",
        handler as EventListener,
      );
  }, [allGroupNames, setSearchTerm]);

  return (
    <TooltipProvider>
      <div className="p-4 bg-background text-foreground">
        {/* Grouping toggles moved to sidebar */}

        {/* Search and Controls */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1 lg:max-w-md">
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
          <div className="flex flex-wrap items-center gap-3">
            {groupBy === "collector" && (
              <Select
                value={collectorSort}
                onValueChange={(value) =>
                  setCollectorSort(value as CollectorSortMode)
                }
              >
                <SelectTrigger className="h-9 w-[190px]">
                  <SelectValue placeholder="Sort items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="incomplete-first">
                    Incomplete first
                  </SelectItem>
                  <SelectItem value="complete-first">Completed first</SelectItem>
                </SelectContent>
              </Select>
            )}
            {groupBy === "collector" && (
              <Button
                variant={hideCompletedCollectorItems ? "secondary" : "outline"}
                size="sm"
                onClick={() =>
                  setHideCompletedCollectorItems((current) => !current)
                }
                className="flex h-9 items-center gap-2"
              >
                {hideCompletedCollectorItems ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {hideCompletedCollectorItems ? "Show complete" : "Hide complete"}
              </Button>
            )}
            {groupBy === "hideout-stations" && (
              <Button
                variant={hideBuiltHideoutLevels ? "secondary" : "outline"}
                size="sm"
                onClick={() =>
                  setHideBuiltHideoutLevels((current) => !current)
                }
                className="flex h-9 items-center gap-2"
                aria-pressed={hideBuiltHideoutLevels}
              >
                {hideBuiltHideoutLevels ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {hideBuiltHideoutLevels ? "Show built" : "Hide built"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="flex h-9 items-center gap-2"
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
            {filteredHideoutStations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm.trim()
                  ? `No remaining stations or requirements found matching "${searchTerm}"`
                  : hideBuiltHideoutLevels
                    ? "All hideout stations and levels are built."
                    : "No hideout stations are available."}
              </div>
            )}
            {filteredHideoutStations.map((station) => {
              const originalStation =
                hideoutStations.find((entry) => entry.name === station.name) ??
                station;
              const stationCompletion = getHideoutStationProgress(
                originalStation,
                hideoutProgressState,
              );
              const stationProgress =
                stationCompletion.totalLevels > 0
                  ? (stationCompletion.builtLevels /
                      stationCompletion.totalLevels) *
                    100
                  : 0;

              return (
                <AccordionItem
                  key={station.name}
                  value={station.name}
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        {station.imageLink && (
                          <img
                            src={station.imageLink}
                            alt={station.name}
                            className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        )}
                        <h3 className="min-w-0 truncate text-base font-semibold sm:text-lg">
                          {station.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-end gap-3 sm:gap-4">
                        <span className="text-sm text-muted-foreground">
                          {stationCompletion.builtLevels} /{" "}
                          {stationCompletion.totalLevels} levels
                        </span>
                        <Progress
                          value={stationProgress}
                          className="w-24 h-2"
                        />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t">
                    <div className="space-y-4">
                      {station.levels.map((level) => {
                        const isEditionDefault =
                          isEditionDefaultHideoutLevel(
                            station.name,
                            level.level,
                            editionDefaultBuiltLevels,
                          );
                        const itemRequirements =
                          level.itemRequirements.filter((req) =>
                            hasNamedRequirementItem(req.item),
                          );
                        const levelCompletion = getHideoutLevelProgress(
                          station.name,
                          level,
                          hideoutProgressState,
                        );
                        const progress =
                          levelCompletion.total > 0
                            ? (levelCompletion.completed /
                                levelCompletion.total) *
                              100
                            : 0;

                        return (
                          <div
                            key={`${station.name}-${level.level}`}
                            className="border rounded-lg p-4 space-y-4"
                          >
                            {/* Level Header with Progress */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className="font-medium text-base">
                                Level {level.level}
                              </h4>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {onToggleWorkingOnHideoutStation &&
                                  !isEditionDefault && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const stationKey = `${station.name}-${level.level}`;
                                      onToggleWorkingOnHideoutStation(
                                        stationKey,
                                      );
                                    }}
                                    className={cn(
                                      "p-1 rounded-sm transition-colors",
                                      workingOnHideoutStations.has(
                                        `${station.name}-${level.level}`,
                                      )
                                        ? "text-blue-500 hover:text-blue-600"
                                        : "text-muted-foreground/40 hover:text-muted-foreground",
                                    )}
                                    title={
                                      workingOnHideoutStations.has(
                                        `${station.name}-${level.level}`,
                                      )
                                        ? "Remove from working on"
                                        : "Mark as working on"
                                    }
                                  >
                                    <Target
                                      className="h-4 w-4"
                                      fill={
                                        workingOnHideoutStations.has(
                                          `${station.name}-${level.level}`,
                                        )
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  </button>
                                )}
                                <label
                                  htmlFor={`built-${station.name}-${level.level}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium",
                                    isEditionDefault
                                      ? "cursor-default"
                                      : "cursor-pointer hover:bg-muted/60",
                                  )}
                                >
                                  <Checkbox
                                    id={`built-${station.name}-${level.level}`}
                                    checked={levelCompletion.isBuilt}
                                    onCheckedChange={(checked) =>
                                      handleSetLevelBuilt(
                                        station.name,
                                        level,
                                        Boolean(checked),
                                      )
                                    }
                                    disabled={isEditionDefault}
                                    aria-label={`Mark ${station.name} level ${level.level} built`}
                                  />
                                  <span>Built</span>
                                  {isEditionDefault && (
                                    <span
                                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                                      title={
                                        editionTitle
                                          ? `Included with ${editionTitle}`
                                          : "Included with this edition"
                                      }
                                    >
                                      Edition default
                                    </span>
                                  )}
                                </label>
                                <span className="text-sm text-muted-foreground">
                                  {levelCompletion.completed} /{" "}
                                  {levelCompletion.total}
                                </span>
                                <Progress
                                  value={progress}
                                  className="w-20 h-2"
                                />
                              </div>
                            </div>

                            {/* Skill Requirements */}
                            {level.skillRequirements.length > 0 && (
                              <div className="bg-muted/30 p-3 rounded-md">
                                <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                  Skill Requirements
                                </h5>
                                <div className="space-y-2">
                                  {level.skillRequirements.map((req) => {
                                    const requirementKey =
                                      getHideoutSkillRequirementKey(
                                        station.name,
                                        level.level,
                                        req,
                                      );
                                    const isCompleted =
                                      isEditionDefault ||
                                      completedHideoutRequirements.has(
                                        requirementKey,
                                      );
                                    return (
                                      <label
                                        key={requirementKey}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-2 text-sm",
                                          isCompleted &&
                                            "text-muted-foreground line-through",
                                        )}
                                      >
                                        <Checkbox
                                          checked={isCompleted}
                                          disabled={isEditionDefault}
                                          onCheckedChange={(checked) =>
                                            handleToggleRequirement(
                                              requirementKey,
                                              Boolean(checked),
                                            )
                                          }
                                          aria-label={`Mark ${req.skill.name} level ${req.level} complete`}
                                        />
                                        <span>
                                          {req.skill.name} Level {req.level}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Station Level Requirements */}
                            {level.stationLevelRequirements.length > 0 && (
                              <div className="bg-muted/30 p-3 rounded-md">
                                <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                  Station Requirements
                                </h5>
                                <div className="space-y-2">
                                  {level.stationLevelRequirements.map(
                                    (req) => {
                                      const requirementKey =
                                        getHideoutStationRequirementKey(
                                          station.name,
                                          level.level,
                                          req,
                                        );
                                      const isCompleted =
                                        isEditionDefault ||
                                        completedHideoutRequirements.has(
                                          requirementKey,
                                        );
                                      return (
                                        <label
                                          key={requirementKey}
                                          className={cn(
                                            "flex cursor-pointer items-center gap-2 text-sm",
                                            isCompleted &&
                                              "text-muted-foreground line-through",
                                          )}
                                        >
                                          <Checkbox
                                            checked={isCompleted}
                                            disabled={isEditionDefault}
                                            onCheckedChange={(checked) =>
                                              handleToggleRequirement(
                                                requirementKey,
                                                Boolean(checked),
                                              )
                                            }
                                            aria-label={`Mark ${req.station.name} level ${req.level} complete`}
                                          />
                                          <span>
                                            {req.station.name} Level {req.level}
                                          </span>
                                        </label>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Item Requirements */}
                            {itemRequirements.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  Required Items
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {itemRequirements.map((req, idx) => {
                                  const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                                  const isCurrency = isCurrencyItem(
                                    req.item.name,
                                  );
                                  const currentQty = isEditionDefault
                                    ? req.count
                                    : hideoutItemQuantities[itemKey] || 0;
                                  const isCompleted =
                                    isEditionDefault ||
                                    completedHideoutItems.has(itemKey) ||
                                    (!isCurrency && currentQty >= req.count);
                                  const progressText = isCurrency
                                    ? ""
                                    : `${currentQty}/${req.count}`;
                                  const foundInRaid = Boolean(
                                    req.attributes?.some(
                                      (attr) =>
                                        (attr.type === "foundInRaid" ||
                                          attr.name === "foundInRaid") &&
                                        attr.value === "true",
                                    ),
                                  );

                                  return (
                                    <div
                                      key={`${station.name}-${level.level}-${idx}`}
                                      className={cn(
                                        "flex flex-col gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                                        isCompleted && "opacity-60",
                                      )}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Checkbox
                                          id={`${station.name}-${level.level}-${req.item.name}`}
                                          checked={isCompleted}
                                          disabled={isEditionDefault}
                                          onCheckedChange={(checked) => {
                                            const isChecked = Boolean(checked);
                                            if (onUpdateHideoutItemQuantity) {
                                              onUpdateHideoutItemQuantity(
                                                itemKey,
                                                isChecked ? req.count : 0,
                                              );
                                            }
                                            const nextCompleted = new Set(
                                              completedHideoutItems,
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
                                          <div className="flex items-center justify-center mb-2 relative">
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
                                            {foundInRaid && (
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
                                          <div
                                            className={cn(
                                              "text-sm font-medium text-center mb-2",
                                              isCompleted &&
                                                "line-through text-muted-foreground",
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
                                                    req.count,
                                                  );
                                                }}
                                                className={cn(
                                                  "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                                  currentQty <= 0 &&
                                                    "opacity-50 cursor-not-allowed",
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
                                                    req.count,
                                                  );
                                                }}
                                                className={cn(
                                                  "w-6 h-6 flex items-center justify-center rounded hover:bg-background/80 transition-colors",
                                                  currentQty >= req.count &&
                                                    "opacity-50 cursor-not-allowed",
                                                )}
                                                disabled={
                                                  currentQty >= req.count
                                                }
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
                            )}
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
                (item) => completedCollectorItems.has(item.name),
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
                            completedCollectorItems.has(item.name) &&
                              "opacity-60",
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
                                "line-through text-muted-foreground",
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
    </TooltipProvider>
  );
};
