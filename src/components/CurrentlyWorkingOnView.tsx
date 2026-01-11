import { useMemo, useState } from "react";
import { Task, HideoutStation } from "@/types";
import { STORYLINE_QUESTS, StorylineQuest } from "@/data/storylineQuests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  X,
  MapPin,
  User,
  Package,
  Home,
  Target,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
  Plus,
  Minus,
} from "lucide-react";
import { TRADER_COLORS } from "@/data/traders";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrentlyWorkingOnViewProps {
  tasks: Task[];
  workingOnTasks: Set<string>;
  workingOnStorylineObjectives: Set<string>;
  workingOnHideoutStations: Set<string>;
  collectorItems: { id: string; name: string; img: string }[];
  hideoutStations: HideoutStation[];
  completedCollectorItems: Set<string>;
  completedTasks: Set<string>;
  completedStorylineObjectives: Set<string>;
  completedHideoutItems: Set<string>;
  playerLevel: number;
  onToggleWorkingOnTask: (taskId: string) => void;
  onToggleWorkingOnStorylineObjective: (objectiveId: string) => void;
  onToggleCollectorItem: (itemId: string) => void;
  onToggleWorkingOnHideoutStation: (stationKey: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleStorylineObjective: (objectiveId: string) => void;
  onToggleHideoutItem: (itemKey: string) => void;
  completedTaskObjectives: Set<string>;
  onToggleTaskObjective: (objectiveKey: string) => void;
  taskObjectiveItemProgress: Record<string, number>;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number
  ) => void;
}

export function CurrentlyWorkingOnView({
  tasks,
  workingOnTasks,
  workingOnStorylineObjectives,
  workingOnHideoutStations,
  collectorItems,
  hideoutStations,
  completedCollectorItems,
  completedTasks,
  completedStorylineObjectives,
  completedHideoutItems,
  playerLevel,
  onToggleWorkingOnTask,
  onToggleWorkingOnStorylineObjective,
  onToggleCollectorItem,
  onToggleWorkingOnHideoutStation,
  onToggleTask,
  onToggleStorylineObjective,
  onToggleHideoutItem,
  completedTaskObjectives,
  onToggleTaskObjective,
  taskObjectiveItemProgress,
  onUpdateTaskObjectiveItemProgress,
}: CurrentlyWorkingOnViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedHideout, setExpandedHideout] = useState<Set<string>>(
    new Set()
  );
  const [showAllNextTasks, setShowAllNextTasks] = useState(false);

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleHideoutExpanded = (key: string) => {
    setExpandedHideout((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildObjectiveItemKey = (
    taskId: string,
    objectiveIndex: number,
    itemKey: string
  ) => `${taskId}::${objectiveIndex}::${itemKey}`;

  const handleObjectiveItemDelta = (
    objectiveItemKey: string,
    delta: number,
    maxCount: number
  ) => {
    const current = taskObjectiveItemProgress[objectiveItemKey] || 0;
    const next = Math.max(0, Math.min(maxCount, current + delta));
    onUpdateTaskObjectiveItemProgress(objectiveItemKey, next);
  };

  // Filter tasks that are marked as working on
  const activeTasks = useMemo(() => {
    return tasks.filter((task) => workingOnTasks.has(task.id));
  }, [tasks, workingOnTasks]);

  const nextTasks = useMemo(() => {
    const level = Number.isFinite(playerLevel) ? playerLevel : 1;
    return tasks.filter((task) => {
      if (completedTasks.has(task.id)) return false;
      if (workingOnTasks.has(task.id)) return false;
      if (task.minPlayerLevel > level) return false;
      if (task.taskRequirements && task.taskRequirements.length > 0) {
        return task.taskRequirements.every((req) =>
          completedTasks.has(req.task.id)
        );
      }
      return true;
    });
  }, [tasks, completedTasks, workingOnTasks, playerLevel]);

  // Group active tasks by map - tasks with multiple maps appear under each map
  const normalizeMapName = (name?: string | null) => {
    if (!name) return "No specific map";
    if (name.toLowerCase().startsWith("ground zero")) return "Ground Zero";
    return name;
  };

  const tasksByMap = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    const seenByMap = new Map<string, Set<string>>();
    const addTaskToMap = (mapName: string, task: Task) => {
      if (!grouped.has(mapName)) grouped.set(mapName, []);
      if (!seenByMap.has(mapName)) seenByMap.set(mapName, new Set());
      const seen = seenByMap.get(mapName)!;
      if (seen.has(task.id)) return;
      seen.add(task.id);
      grouped.get(mapName)!.push(task);
    };
    activeTasks.forEach((task) => {
      if (task.maps && task.maps.length > 0) {
        task.maps.forEach((map) => {
          const mapName = normalizeMapName(map.name);
          addTaskToMap(mapName, task);
        });
      } else {
        const mapName = normalizeMapName(task.map?.name);
        addTaskToMap(mapName, task);
      }
    });
    return grouped;
  }, [activeTasks]);

  // Filter storyline objectives that are marked as working on
  const activeStorylineObjectives = useMemo(() => {
    const result: Array<{
      quest: StorylineQuest;
      objectiveId: string;
      description: string;
    }> = [];
    STORYLINE_QUESTS.forEach((quest) => {
      quest.objectives?.forEach((obj) => {
        if (obj.type === "main" && workingOnStorylineObjectives.has(obj.id)) {
          result.push({
            quest,
            objectiveId: obj.id,
            description: obj.description,
          });
        }
      });
    });
    return result;
  }, [workingOnStorylineObjectives]);

  // Collector items - always show all
  const activeCollectorItems = useMemo(() => {
    return collectorItems;
  }, [collectorItems]);

  // Filter hideout stations that are marked as working on
  const activeHideoutStations = useMemo(() => {
    return Array.from(workingOnHideoutStations)
      .map((key) => {
        // Key format: "stationName-levelIndex"
        const [stationName, levelIndex] = key.split("-");
        const station = hideoutStations.find((s) => s.name === stationName);
        if (!station) return null;
        const level = station.levels.find(
          (l) => l.level === parseInt(levelIndex)
        );
        if (!level) return null;
        return { station, level, key };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [workingOnHideoutStations, hideoutStations]);

  const totalItems =
    activeTasks.length +
    activeStorylineObjectives.length +
    collectorItems.length +
    activeHideoutStations.length;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Currently Working On</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} in progress
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Section - Only when showing collector items (fresh state) */}
      {activeTasks.length === 0 &&
        activeStorylineObjectives.length === 0 &&
        activeHideoutStations.length === 0 &&
        collectorItems.length > 0 && (
          <Card className="border-border bg-card text-card-foreground">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-muted rounded-lg">
                    <Lightbulb className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Your Progress Dashboard
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Your dashboard is empty!</strong> This overview
                      shows all quests, hideout stations, and objectives you're
                      currently working on.
                    </p>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Start tracking your progress:
                      </p>
                      <ul className="ml-4 space-y-1 text-xs">
                        <li>
                          • <strong>Quests:</strong> Go to Quests tab → click
                          "Working On" on active quests
                        </li>
                        <li>
                          • <strong>Hideout:</strong> Go to Hideout tab → mark
                          stations you're upgrading
                        </li>
                        <li>
                          • <strong>Storyline:</strong> Go to Storyline tab →
                          select current objectives
                        </li>
                        <li>
                          • <strong>Collector Items:</strong> Click items below
                          to mark as found
                        </li>
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      📊 Once you start tracking, everything will appear here in
                      one convenient dashboard!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Next Quests Section */}
      {nextTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>Next Quests ({nextTasks.length})</CardTitle>
            </div>
            <CardDescription>Unlocked by your completed quests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(showAllNextTasks ? nextTasks : nextTasks.slice(0, 3)).map(
              (task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{task.name}</span>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor:
                          TRADER_COLORS[
                            task.trader.name as keyof typeof TRADER_COLORS
                          ] || "#6b7280",
                        color:
                          TRADER_COLORS[
                            task.trader.name as keyof typeof TRADER_COLORS
                          ] || "#6b7280",
                      }}
                    >
                      {task.trader.name}
                    </Badge>
                    <Badge variant="secondary">Lvl {task.minPlayerLevel}</Badge>
                    {task.map?.name && (
                      <Badge variant="outline">{task.map.name}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleWorkingOnTask(task.id)}
                    title="Add to working on"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
            {nextTasks.length > 1 && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllNextTasks((prev) => !prev)}
                >
                  {showAllNextTasks
                    ? "Show less"
                    : `Show all (${nextTasks.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Quests Section */}
      {activeTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Quests ({activeTasks.length})</CardTitle>
            </div>
            <CardDescription>
              Regular tasks you're currently working on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(tasksByMap.entries()).map(([mapName, mapTasks]) => (
              <div key={mapName} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {mapName}
                </div>
                <div className="space-y-2 ml-6">
                  {mapTasks.map((task) => {
                    const isTaskCompleted = completedTasks.has(task.id);
                    const isExpanded = expandedTasks.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-lg border bg-card transition-colors",
                          isTaskCompleted && "opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4 p-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={isTaskCompleted}
                              onCheckedChange={() => onToggleTask(task.id)}
                              className="mt-1 h-5 w-5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={cn(
                                    "font-medium",
                                    isTaskCompleted &&
                                      "line-through text-muted-foreground"
                                  )}
                                >
                                  {task.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor:
                                      TRADER_COLORS[
                                        task.trader
                                          .name as keyof typeof TRADER_COLORS
                                      ] || "#6b7280",
                                    color:
                                      TRADER_COLORS[
                                        task.trader
                                          .name as keyof typeof TRADER_COLORS
                                      ] || "#6b7280",
                                  }}
                                >
                                  {task.trader.name}
                                </Badge>
                                <Badge variant="secondary">
                                  Lvl {task.minPlayerLevel}
                                </Badge>
                                <a
                                  href={task.wikiLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors"
                                  title="View quest wiki"
                                >
                                  <ExternalLink size={12} />
                                  Wiki
                                </a>
                              </div>
                              {task.objectives &&
                                task.objectives.length > 0 && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {task.objectives.length} objective
                                      {task.objectives.length !== 1 ? "s" : ""}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() =>
                                        toggleTaskExpanded(task.id)
                                      }
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="h-3 w-3 mr-1" />
                                          Hide
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          Show
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleWorkingOnTask(task.id)}
                            className="flex-shrink-0"
                            title="Remove from working on"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Expanded objectives */}
                        {isExpanded &&
                          task.objectives &&
                          task.objectives.length > 0 && (
                            <div className="px-3 pb-3 ml-8 space-y-2 border-t mt-2 pt-3">
                              {task.objectives.map((obj, idx) => {
                                const objectiveKey = `${task.id}-${idx}`;
                                const isObjCompleted =
                                  completedTaskObjectives.has(objectiveKey);
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors",
                                      isObjCompleted && "opacity-60"
                                    )}
                                  >
                                    <Checkbox
                                      checked={isObjCompleted}
                                      onCheckedChange={() =>
                                        onToggleTaskObjective(objectiveKey)
                                      }
                                      className="mt-0.5 h-4 w-4"
                                    />
                                    <div className="flex-1">
                                      {(() => {
                                        const inlineItem =
                                          obj.items?.length === 1
                                            ? obj.items[0]
                                            : undefined;
                                        const showInlineIcon =
                                          inlineItem?.iconLink &&
                                          obj.description?.includes(
                                            inlineItem.name
                                          );
                                        return (
                                          <>
                                            <p
                                              className={cn(
                                                "text-muted-foreground",
                                                isObjCompleted && "line-through"
                                              )}
                                            >
                                              {showInlineIcon && (
                                                <TooltipProvider
                                                  delayDuration={150}
                                                >
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <img
                                                        src={
                                                          inlineItem?.iconLink
                                                        }
                                                        alt={inlineItem?.name}
                                                        className="mr-2 inline h-4 w-4 object-contain"
                                                        loading="lazy"
                                                      />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                      side="top"
                                                      align="center"
                                                      className="bg-background text-foreground p-2 shadow-md border"
                                                    >
                                                      <div className="flex flex-col items-center gap-1">
                                                        <img
                                                          src={
                                                            inlineItem?.iconLink
                                                          }
                                                          alt={inlineItem?.name}
                                                          className="h-16 w-16 object-contain"
                                                          loading="lazy"
                                                        />
                                                        <span className="text-xs">
                                                          {inlineItem?.name}
                                                        </span>
                                                      </div>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                              {obj.description}
                                            </p>
                                            {obj.count && obj.count > 1 && (
                                              <span className="text-xs text-primary font-medium">
                                                (×{obj.count})
                                              </span>
                                            )}
                                            {obj.items &&
                                              obj.items &&
                                              obj.items.length > 0 && (
                                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                  {obj.items.map((item) => {
                                                    const requiredCount =
                                                      Math.max(
                                                        1,
                                                        obj.count ?? 1
                                                      );
                                                    const itemKey =
                                                      buildObjectiveItemKey(
                                                        task.id,
                                                        idx,
                                                        item.id || item.name
                                                      );
                                                    const currentCount =
                                                      Math.min(
                                                        requiredCount,
                                                        taskObjectiveItemProgress[
                                                          itemKey
                                                        ] || 0
                                                      );
                                                    const remaining = Math.max(
                                                      0,
                                                      requiredCount -
                                                        currentCount
                                                    );
                                                    const isComplete =
                                                      currentCount >=
                                                      requiredCount;
                                                    return (
                                                      <div
                                                        key={
                                                          item.id || item.name
                                                        }
                                                        className={cn(
                                                          "flex items-center gap-2 rounded-md border bg-background/40 p-2",
                                                          isComplete &&
                                                            "opacity-60"
                                                        )}
                                                      >
                                                        {item.iconLink ? (
                                                          <TooltipProvider
                                                            delayDuration={150}
                                                          >
                                                            <Tooltip>
                                                              <TooltipTrigger
                                                                asChild
                                                              >
                                                                <img
                                                                  src={
                                                                    item.iconLink
                                                                  }
                                                                  alt={
                                                                    item.name
                                                                  }
                                                                  className="h-8 w-8 object-contain"
                                                                  loading="lazy"
                                                                />
                                                              </TooltipTrigger>
                                                              <TooltipContent
                                                                side="top"
                                                                align="center"
                                                                className="bg-background text-foreground p-2 shadow-md border"
                                                              >
                                                                <div className="flex flex-col items-center gap-1">
                                                                  <img
                                                                    src={
                                                                      item.iconLink
                                                                    }
                                                                    alt={
                                                                      item.name
                                                                    }
                                                                    className="h-16 w-16 object-contain"
                                                                    loading="lazy"
                                                                  />
                                                                  <span className="text-xs">
                                                                    {item.name}
                                                                  </span>
                                                                </div>
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          </TooltipProvider>
                                                        ) : (
                                                          <div className="h-8 w-8 rounded bg-muted" />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                          <div className="text-xs font-medium text-foreground/90 truncate">
                                                            {item.name}
                                                          </div>
                                                          <div className="text-[11px] text-muted-foreground">
                                                            {remaining === 0
                                                              ? "Complete"
                                                              : `${remaining} remaining`}
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleObjectiveItemDelta(
                                                                itemKey,
                                                                -1,
                                                                requiredCount
                                                              );
                                                            }}
                                                            className={cn(
                                                              "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                              currentCount <=
                                                                0 &&
                                                                "opacity-50 cursor-not-allowed"
                                                            )}
                                                            disabled={
                                                              currentCount <= 0
                                                            }
                                                            aria-label={`Decrease ${item.name}`}
                                                          >
                                                            <Minus className="h-3 w-3 mx-auto" />
                                                          </button>
                                                          <span className="w-12 text-center text-xs tabular-nums">
                                                            {currentCount}/
                                                            {requiredCount}
                                                          </span>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleObjectiveItemDelta(
                                                                itemKey,
                                                                1,
                                                                requiredCount
                                                              );
                                                            }}
                                                            className={cn(
                                                              "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                              currentCount >=
                                                                requiredCount &&
                                                                "opacity-50 cursor-not-allowed"
                                                            )}
                                                            disabled={
                                                              currentCount >=
                                                              requiredCount
                                                            }
                                                            aria-label={`Increase ${item.name}`}
                                                          >
                                                            <Plus className="h-3 w-3 mx-auto" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Storyline Objectives Section */}
      {activeStorylineObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>
                Storyline Objectives ({activeStorylineObjectives.length})
              </CardTitle>
            </div>
            <CardDescription>
              1.0 storyline objectives in progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeStorylineObjectives.map(
              ({ quest, objectiveId, description }) => {
                const isCompleted =
                  completedStorylineObjectives.has(objectiveId);
                return (
                  <div
                    key={objectiveId}
                    className={cn(
                      "flex items-start justify-between gap-4 p-3 rounded-lg border bg-card transition-colors",
                      isCompleted && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() =>
                          onToggleStorylineObjective(objectiveId)
                        }
                        className="mt-1 h-5 w-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline">{quest.name}</Badge>
                        </div>
                        <p
                          className={cn(
                            "text-sm",
                            isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onToggleWorkingOnStorylineObjective(objectiveId)
                      }
                      className="flex-shrink-0"
                      title="Remove from working on"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Collector Items Section */}
      {activeCollectorItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>
                Collector Items ({activeCollectorItems.length})
              </CardTitle>
            </div>
            <CardDescription>
              Click an item to toggle found status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {activeCollectorItems.map((item) => (
                // show all items; fade completed
                <button
                  key={item.name}
                  onClick={() => onToggleCollectorItem(item.name)}
                  className={cn(
                    "relative group rounded-lg border bg-card p-2 hover:bg-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer text-left",
                    completedCollectorItems.has(item.name) && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-lg transition-opacity bg-green-500/10",
                      completedCollectorItems.has(item.name)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  {item.img && (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full aspect-square object-contain mb-1 group-hover:opacity-30 transition-opacity"
                    />
                  )}
                  <p className="text-xs text-center line-clamp-2 group-hover:opacity-30 transition-opacity">
                    {item.name}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Hideout Stations Section */}
      {activeHideoutStations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <CardTitle>
                Hideout Stations ({activeHideoutStations.length})
              </CardTitle>
            </div>
            <CardDescription>Stations you're upgrading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeHideoutStations.map(({ station, level, key }) => {
              const isExpanded = expandedHideout.has(key);
              const completedCount = level.itemRequirements.filter((req) => {
                const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                return completedHideoutItems.has(itemKey);
              }).length;
              const totalCount = level.itemRequirements.length;
              const progressPercent =
                totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

              return (
                <div
                  key={key}
                  className="rounded-lg border bg-card transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-medium">{station.name}</h4>
                        <Badge variant="secondary">Level {level.level}</Badge>
                        {totalCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {completedCount}/{totalCount} items
                          </span>
                        )}
                      </div>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Progress
                            value={progressPercent}
                            className="h-2 flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => toggleHideoutExpanded(key)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide Items
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show Items
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleWorkingOnHideoutStation(key)}
                      className="flex-shrink-0"
                      title="Remove from working on"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Expanded item requirements */}
                  {isExpanded && totalCount > 0 && (
                    <div className="px-3 pb-3 border-t pt-3 space-y-2">
                      {level.itemRequirements.map((req, idx) => {
                        const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                        const isItemCompleted =
                          completedHideoutItems.has(itemKey);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors",
                              isItemCompleted && "opacity-60"
                            )}
                          >
                            <Checkbox
                              checked={isItemCompleted}
                              onCheckedChange={() =>
                                onToggleHideoutItem(itemKey)
                              }
                              className="h-4 w-4"
                            />
                            {req.item.iconLink && (
                              <img
                                src={req.item.iconLink}
                                alt={req.item.name}
                                className="h-8 w-8 object-contain"
                              />
                            )}
                            <span
                              className={cn(
                                "text-sm flex-1",
                                isItemCompleted &&
                                  "line-through text-muted-foreground"
                              )}
                            >
                              {req.count}x {req.item.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No active items</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Mark quests, storyline objectives, hideout stations, or collector
              items to see them here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
