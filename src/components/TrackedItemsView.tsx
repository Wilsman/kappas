import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Info,
  ListTodo,
  Search,
  Snowflake,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { HideoutStation, Task } from "@/types";
import {
  buildTrackedItems,
  type TrackedItem,
  type TrackedItemSource,
} from "@/utils/trackedItems";

type TrackedItemsFilter = "all" | "actionable" | "tasks" | "hideout" | "fir";
type TrackedItemsSort =
  | "progression"
  | "name-asc"
  | "remaining-desc"
  | "immediate-first"
  | "progress-desc"
  | "sources-desc"
  | "tasks-first"
  | "hideout-first";
const INITIAL_VISIBLE_ITEMS = 150;

interface TrackedItemsViewProps {
  tasks: Task[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string,
  ) => void;
  hideoutStations: HideoutStation[];
  completedHideoutItems: Set<string>;
  hideoutItemQuantities: Record<string, number>;
  onSetHideoutItems: (items: Set<string>) => void;
  onUpdateHideoutItemQuantity: (itemKey: string, count: number) => void;
  playerLevel: number;
}

const FILTER_LABELS: Record<TrackedItemsFilter, string> = {
  all: "All Needed",
  actionable: "Immediate",
  tasks: "Tasks",
  hideout: "Hideout",
  fir: "FIR",
};

const SORT_LABELS: Record<TrackedItemsSort, string> = {
  progression: "Progression order",
  "name-asc": "Name (A-Z)",
  "remaining-desc": "Remaining (high-low)",
  "immediate-first": "Immediate first",
  "progress-desc": "Most complete",
  "sources-desc": "Most sources",
  "tasks-first": "Tasks first",
  "hideout-first": "Hideout first",
};

const isExcludedFromHeadlineRemaining = (itemName: string) =>
  /\b(roubles|dollars|euros|dogtags?)\b/i.test(itemName);

function buildSourcePreview(item: TrackedItem, limit = 3) {
  const grouped = new Map<string, number>();

  item.sources.forEach((source) => {
    const label =
      source.sourceType === "task"
        ? `${source.sourceName}${source.foundInRaid ? " FIR" : ""}`
        : `${source.sourceName} ${source.sourceDetail.replace("Level ", "L")}`;
    grouped.set(label, (grouped.get(label) ?? 0) + source.requiredCount);
  });

  const parts = [...grouped.entries()].map(
    ([label, count]) => `${label} x${count}`,
  );

  if (parts.length <= limit) {
    return parts.join(" • ");
  }

  return `${parts.slice(0, limit).join(" • ")} • ${parts.length - limit} more`;
}

function sourceSortLabel(source: TrackedItemSource) {
  return source.sourceType === "task"
    ? source.sourceName
    : `${source.sourceName} ${source.sourceDetail}`;
}

function compareItemsByProgression(left: TrackedItem, right: TrackedItem) {
  const getProgressionBucket = (item: TrackedItem) => {
    if (item.taskSourceCount > 0 && item.minTaskLevel != null) {
      return 0;
    }
    if (item.taskSourceCount === 0) {
      return 1;
    }
    return 2;
  };

  const leftBucket = getProgressionBucket(left);
  const rightBucket = getProgressionBucket(right);

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  if (leftBucket === 0) {
    const leftTaskLevel = left.minTaskLevel ?? Number.POSITIVE_INFINITY;
    const rightTaskLevel = right.minTaskLevel ?? Number.POSITIVE_INFINITY;

    if (leftTaskLevel !== rightTaskLevel) {
      return leftTaskLevel - rightTaskLevel;
    }

    const leftTaskDepth = left.minTaskPrerequisiteDepth ?? Number.POSITIVE_INFINITY;
    const rightTaskDepth =
      right.minTaskPrerequisiteDepth ?? Number.POSITIVE_INFINITY;

    if (leftTaskDepth !== rightTaskDepth) {
      return leftTaskDepth - rightTaskDepth;
    }
  }

  const leftHideoutLevel = left.minHideoutLevel ?? Number.POSITIVE_INFINITY;
  const rightHideoutLevel = right.minHideoutLevel ?? Number.POSITIVE_INFINITY;

  if (leftHideoutLevel !== rightHideoutLevel) {
    return leftHideoutLevel - rightHideoutLevel;
  }

  return left.itemName.localeCompare(right.itemName);
}

export function TrackedItemsView({
  tasks,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onUpdateTaskObjectiveItemProgress,
  hideoutStations,
  completedHideoutItems,
  hideoutItemQuantities,
  onSetHideoutItems,
  onUpdateHideoutItemQuantity,
  playerLevel,
}: TrackedItemsViewProps) {
  const [filter, setFilter] = useState<TrackedItemsFilter>("all");
  const [sortMode, setSortMode] = useState<TrackedItemsSort>("progression");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);
  const completedItemOrderRef = useRef<Map<string, Map<string, number>>>(
    new Map(),
  );

  const trackedItems = useMemo(
    () =>
      buildTrackedItems({
        tasks,
        completedTasks,
        completedTaskObjectives,
        taskObjectiveItemProgress,
        hideoutStations,
        completedHideoutItems,
        hideoutItemQuantities,
        playerLevel,
      }),
    [
      tasks,
      completedTasks,
      completedTaskObjectives,
      taskObjectiveItemProgress,
      hideoutStations,
      completedHideoutItems,
      hideoutItemQuantities,
      playerLevel,
    ],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return trackedItems.filter((item) => {
      if (filter === "actionable" && item.actionableSourceCount <= 0) {
        return false;
      }
      if (filter === "tasks" && item.taskSourceCount <= 0) {
        return false;
      }
      if (filter === "hideout" && item.hideoutSourceCount <= 0) {
        return false;
      }
      if (filter === "fir" && item.foundInRaidRequired <= 0) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        item.itemName.toLowerCase().includes(normalizedSearch) ||
        item.sources.some((source) =>
          [source.sourceName, source.sourceDetail, source.objectiveDescription]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch)),
        )
      );
    });
  }, [filter, searchTerm, trackedItems]);

  const totalUnitsRemaining = useMemo(
    () =>
      filteredItems.reduce(
        (sum, item) =>
          isExcludedFromHeadlineRemaining(item.itemName)
            ? sum
            : sum + item.totalRemaining,
        0,
      ),
    [filteredItems],
  );
  const actionableItems = useMemo(
    () => filteredItems.filter((item) => item.actionableSourceCount > 0).length,
    [filteredItems],
  );
  const totalSources = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.sources.length, 0),
    [filteredItems],
  );
  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    const sortContextKey = `${sortMode}::${filter}::${searchTerm
      .trim()
      .toLowerCase()}`;
    const completedItemOrder =
      completedItemOrderRef.current.get(sortContextKey) ?? new Map<string, number>();

    items.sort((left, right) => {
      switch (sortMode) {
        case "progression":
          return compareItemsByProgression(left, right);
        case "remaining-desc":
          if (left.totalRemaining !== right.totalRemaining) {
            return right.totalRemaining - left.totalRemaining;
          }
          break;
        case "immediate-first":
          if (left.actionableSourceCount !== right.actionableSourceCount) {
            return right.actionableSourceCount - left.actionableSourceCount;
          }
          if (left.totalRemaining !== right.totalRemaining) {
            return right.totalRemaining - left.totalRemaining;
          }
          break;
        case "progress-desc": {
          const leftProgress =
            left.totalRequired > 0 ? left.totalCurrent / left.totalRequired : 0;
          const rightProgress =
            right.totalRequired > 0
              ? right.totalCurrent / right.totalRequired
              : 0;
          if (leftProgress !== rightProgress) {
            return rightProgress - leftProgress;
          }
          break;
        }
        case "sources-desc":
          if (left.sources.length !== right.sources.length) {
            return right.sources.length - left.sources.length;
          }
          break;
        case "tasks-first":
          if (left.taskSourceCount !== right.taskSourceCount) {
            return right.taskSourceCount - left.taskSourceCount;
          }
          break;
        case "hideout-first":
          if (left.hideoutSourceCount !== right.hideoutSourceCount) {
            return right.hideoutSourceCount - left.hideoutSourceCount;
          }
          break;
        case "name-asc":
        default:
          break;
      }

      return left.itemName.localeCompare(right.itemName);
    });

    const baseOrder = new Map(
      items.map((item, index) => [item.itemKey, index] as const),
    );

    const positionedItems = [...items].sort((left, right) => {
      const leftIndex =
        left.totalRemaining <= 0
          ? (completedItemOrder.get(left.itemKey) ??
            baseOrder.get(left.itemKey) ??
            0)
          : (baseOrder.get(left.itemKey) ?? 0);
      const rightIndex =
        right.totalRemaining <= 0
          ? (completedItemOrder.get(right.itemKey) ??
            baseOrder.get(right.itemKey) ??
            0)
          : (baseOrder.get(right.itemKey) ?? 0);

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return (
        (baseOrder.get(left.itemKey) ?? 0) - (baseOrder.get(right.itemKey) ?? 0)
      );
    });

    const nextCompletedItemOrder = new Map<string, number>();
    positionedItems.forEach((item, index) => {
      nextCompletedItemOrder.set(
        item.itemKey,
        item.totalRemaining <= 0
          ? (completedItemOrder.get(item.itemKey) ?? index)
          : index,
      );
    });
    completedItemOrderRef.current.set(sortContextKey, nextCompletedItemOrder);

    return positionedItems;
  }, [filter, filteredItems, searchTerm, sortMode]);
  const visibleItems = useMemo(
    () => sortedItems.slice(0, visibleCount),
    [sortedItems, visibleCount],
  );

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const updateSourceCount = (source: TrackedItemSource, nextCount: number) => {
    const clampedCount = Math.max(0, Math.min(source.requiredCount, nextCount));

    if (
      source.sourceType === "task" &&
      (source.objectiveProgressTargets?.length || source.objectiveItemKey)
    ) {
      const progressTargets =
        source.objectiveProgressTargets &&
        source.objectiveProgressTargets.length > 0
          ? source.objectiveProgressTargets
          : source.objectiveItemKey
            ? [
                {
                  objectiveItemKey: source.objectiveItemKey,
                  legacyObjectiveItemKey: source.legacyObjectiveItemKey,
                },
              ]
            : [];

      progressTargets.forEach((target) => {
        onUpdateTaskObjectiveItemProgress(
          target.objectiveItemKey,
          clampedCount,
          target.legacyObjectiveItemKey,
        );
      });
      return;
    }

    if (source.sourceType === "hideout" && source.hideoutItemKey) {
      onUpdateHideoutItemQuantity(source.hideoutItemKey, clampedCount);
      const nextCompleted = new Set(completedHideoutItems);
      if (clampedCount >= source.requiredCount) {
        nextCompleted.add(source.hideoutItemKey);
      } else {
        nextCompleted.delete(source.hideoutItemKey);
      }
      onSetHideoutItems(nextCompleted);
    }
  };

  const resetVisibleCount = () => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS);
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
        <TooltipProvider delayDuration={120}>
          <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex w-full items-center gap-3 lg:max-w-3xl">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        resetVisibleCount();
                      }}
                      placeholder="Search items, tasks, stations..."
                      className="w-full pl-9"
                    />
                  </div>
                  <Select
                    value={sortMode}
                    onValueChange={(value) => {
                      setSortMode(value as TrackedItemsSort);
                      resetVisibleCount();
                    }}
                  >
                    <SelectTrigger className="h-8 w-[190px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SORT_LABELS) as TrackedItemsSort[]).map(
                        (value) => (
                          <SelectItem key={value} value={value}>
                            {SORT_LABELS[value]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                  <ToggleGroup
                    type="single"
                    value={filter}
                    onValueChange={(value) => {
                      if (!value) return;
                      setFilter(value as TrackedItemsFilter);
                      resetVisibleCount();
                    }}
                    className="rounded-lg border bg-card/70 px-1 py-0.5 text-muted-foreground shadow-sm"
                  >
                    {(Object.keys(FILTER_LABELS) as TrackedItemsFilter[]).map(
                      (value) => (
                        <ToggleGroupItem
                          key={value}
                          value={value}
                          aria-label={FILTER_LABELS[value]}
                          className="rounded-md px-3 py-1 text-xs font-medium data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:shadow-sm"
                        >
                          {FILTER_LABELS[value]}
                        </ToggleGroupItem>
                      ),
                    )}
                  </ToggleGroup>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Item tracker info"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-popover px-3 py-2 text-left text-xs text-popover-foreground">
                    Aggregated task items and hideout materials with task and
                    station breakdowns. Cash and dogtags are excluded from the
                    headline remaining count.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CompactStat
                  label="Remaining"
                  value={totalUnitsRemaining.toLocaleString()}
                  tooltip="Total remaining item counts, excluding cash and dogtags."
                />
                <span className="text-border">•</span>
                <CompactStat
                  label="Items"
                  value={filteredItems.length.toLocaleString()}
                  tooltip="Unique tracked item rows in the current filter."
                />
                <span className="text-border">•</span>
                <CompactStat
                  label="Immediate"
                  value={actionableItems.toLocaleString()}
                  tooltip="Items tied to tasks or hideout steps you can work on right now."
                />
                <span className="text-border">•</span>
                <CompactMeta
                  label={`${totalSources} sources`}
                  tooltip="Broad open-ended turn-ins with very large item pools are omitted here so the tracker stays practical."
                />
              </div>
            </div>
          </div>
        </TooltipProvider>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
          {filteredItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No matching tracked items.
            </div>
          ) : (
            visibleItems.map((item, index) => {
              const isExpanded = expandedItems.has(item.itemKey);
              const isComplete = item.totalRemaining <= 0;
              const progressValue =
                item.totalRequired > 0
                  ? (item.totalCurrent / item.totalRequired) * 100
                  : 0;
              const preview = buildSourcePreview(item);
              const taskSources = item.sources.filter(
                (source) => source.sourceType === "task",
              );
              const hideoutSources = item.sources.filter(
                (source) => source.sourceType === "hideout",
              );

              return (
                <div
                  key={item.itemKey}
                  className={cn(
                    "border-border/60 transition-opacity",
                    isComplete && "opacity-60",
                    index < visibleItems.length - 1 && "border-b",
                  )}
                >
                  <div className="flex items-stretch gap-2 px-3 py-3 md:px-4">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.itemKey)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/70">
                        {item.iconLink ? (
                          <img
                            src={item.iconLink}
                            alt={item.itemName}
                            className="h-10 w-10 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium">
                            {item.itemName}
                          </span>
                          {item.foundInRaidRequired > 0 && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                            >
                              <Snowflake className="mr-1 h-3 w-3" />
                              FIR {item.foundInRaidRequired}
                            </Badge>
                          )}
                          {item.hasAlternativeSources && (
                            <Badge variant="outline">Alt</Badge>
                          )}
                          {isComplete && (
                            <Badge variant="outline">Done</Badge>
                          )}
                          {item.actionableSourceCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            >
                              Immediate
                            </Badge>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {preview}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {item.taskSourceCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <ListTodo className="h-3.5 w-3.5" />
                              {item.taskSourceCount} task
                              {item.taskSourceCount === 1 ? "" : "s"}
                            </span>
                          )}
                          {item.hideoutSourceCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Home className="h-3.5 w-3.5" />
                              {item.hideoutSourceCount} station
                              {item.hideoutSourceCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex w-[118px] flex-shrink-0 flex-col justify-center text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {item.totalCurrent}/{item.totalRequired}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isComplete ? "Complete" : `${item.totalRemaining} remaining`}
                      </div>
                      <Progress value={progressValue} className="mt-2 h-1.5" />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-1 h-8 w-8 flex-shrink-0"
                      onClick={() => toggleExpanded(item.itemKey)}
                      aria-label={
                        isExpanded
                          ? `Collapse ${item.itemName}`
                          : `Expand ${item.itemName}`
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/50 bg-background/30 px-4 py-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        {taskSources.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              <ListTodo className="h-3.5 w-3.5" />
                              Tasks
                            </div>
                            <div className="space-y-2">
                              {taskSources.map((source) => (
                                <TrackedSourceRow
                                  key={source.id}
                                  source={source}
                                  onUpdateCount={updateSourceCount}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {hideoutSources.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              <Home className="h-3.5 w-3.5" />
                              Hideout
                            </div>
                            <div className="space-y-2">
                              {hideoutSources.map((source) => (
                                <TrackedSourceRow
                                  key={source.id}
                                  source={source}
                                  onUpdateCount={updateSourceCount}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {sortedItems.length > visibleItems.length && (
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {visibleItems.length} of {sortedItems.length} items.
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setVisibleCount((current) => current + INITIAL_VISIBLE_ITEMS)
              }
            >
              Show more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackedSourceRow({
  source,
  onUpdateCount,
}: {
  source: TrackedItemSource;
  onUpdateCount: (source: TrackedItemSource, nextCount: number) => void;
}) {
  const isComplete = source.currentCount >= source.requiredCount;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/70 p-3",
        isComplete && "opacity-65",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {sourceSortLabel(source)}
            </span>
            {source.foundInRaid && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-300"
              >
                FIR
              </Badge>
            )}
            {source.actionable && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              >
                Immediate
              </Badge>
            )}
            {source.isAlternative && <Badge variant="outline">Alt</Badge>}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {source.sourceDetail}
          </div>
          {source.objectiveDescription && (
            <div className="mt-1 text-xs text-muted-foreground/80">
              {source.objectiveDescription}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateCount(source, source.currentCount - 1)}
            disabled={source.currentCount <= 0}
          >
            -
          </Button>
          <div className="min-w-[72px] text-center">
            <div className="text-sm font-semibold tabular-nums">
              {source.currentCount}/{source.requiredCount}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {source.remainingCount} left
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateCount(source, source.currentCount + 1)}
            disabled={source.currentCount >= source.requiredCount}
          >
            +
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onUpdateCount(source, source.requiredCount)}
            disabled={source.currentCount >= source.requiredCount}
          >
            Max
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompactStat({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            {label}
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground/95">
            {value}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover px-3 py-2 text-left text-xs text-popover-foreground">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function CompactMeta({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover px-3 py-2 text-left text-xs text-popover-foreground">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
