import { useMemo, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
  ListTodo,
  Plus,
  Minus,
  Search,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { TRADER_COLORS } from "@/data/traders";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  buildLegacyTaskObjectiveProgressKey,
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveProgressKey,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  formatTaskObjectiveLabel,
  getTaskObjectiveProgress,
  getTaskObjectiveItemProgress,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";
import {
  areLogicalPrerequisitesCompleted,
  buildLogicalTaskGroupsByTaskId,
  buildLogicalTaskKey,
  getLogicalCompletedPrerequisiteCount,
  isLogicalTaskCompleted,
  isLogicalTaskCompletable,
} from "@/utils/taskVariants";

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
  ignoredTasks: Set<string>;
  playerLevel: number;
  onToggleWorkingOnTask: (taskId: string) => void;
  onToggleWorkingOnStorylineObjective: (objectiveId: string) => void;
  onToggleCollectorItem: (itemId: string) => void;
  onToggleWorkingOnHideoutStation: (stationKey: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleStorylineObjective: (objectiveId: string) => void;
  onToggleHideoutItem: (itemKey: string) => void;
  onToggleIgnoredTask: (taskId: string) => void;
  completedTaskObjectives: Set<string>;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string | string[],
  ) => void;
  taskObjectiveItemProgress: Record<string, number>;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
  hideoutItemQuantities: Record<string, number>;
  onUpdateHideoutItemQuantity: (itemKey: string, count: number) => void;
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
  ignoredTasks,
  playerLevel,
  onToggleWorkingOnTask,
  onToggleWorkingOnStorylineObjective,
  onToggleCollectorItem,
  onToggleWorkingOnHideoutStation,
  onToggleTask,
  onToggleStorylineObjective,
  onToggleHideoutItem,
  onToggleIgnoredTask,
  completedTaskObjectives,
  onToggleTaskObjective,
  taskObjectiveItemProgress,
  onUpdateTaskObjectiveItemProgress,
  hideoutItemQuantities,
  onUpdateHideoutItemQuantity,
}: CurrentlyWorkingOnViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedHideout, setExpandedHideout] = useState<Set<string>>(
    new Set(),
  );
  const [showAllNextTasks, setShowAllNextTasks] = useState(false);
  const [isCollectorItemsCollapsed, setIsCollectorItemsCollapsed] = useState(
    () => {
      const saved = localStorage.getItem("collectorItemsCollapsed");
      return saved === "true";
    },
  );
  const [isStorylineCollapsed, setIsStorylineCollapsed] = useState(() => {
    const saved = localStorage.getItem("storylineCollapsed");
    return saved === "true";
  });
  const [isHideoutCollapsed, setIsHideoutCollapsed] = useState(() => {
    const saved = localStorage.getItem("hideoutCollapsed");
    return saved === "true";
  });
  const [isQuestsCollapsed, setIsQuestsCollapsed] = useState(() => {
    const saved = localStorage.getItem("questsCollapsed");
    return saved === "true";
  });
  const [isNextQuestsCollapsed, setIsNextQuestsCollapsed] = useState(() => {
    const saved = localStorage.getItem("nextQuestsCollapsed");
    return saved === "true";
  });
  const [layoutMode, setLayoutMode] = useState<"standard" | "compact">(() => {
    const saved = localStorage.getItem("layoutMode");
    return saved === "compact" ? "compact" : "standard";
  });
  const [nextQuestsSearch, setNextQuestsSearch] = useState("");
  const [activeQuestsSearch, setActiveQuestsSearch] = useState("");
  const [nextQuestsSelectedIndex, setNextQuestsSelectedIndex] = useState(0);
  const [activeQuestsSelectedIndex, setActiveQuestsSelectedIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(
      "collectorItemsCollapsed",
      String(isCollectorItemsCollapsed),
    );
  }, [isCollectorItemsCollapsed]);

  useEffect(() => {
    localStorage.setItem("storylineCollapsed", String(isStorylineCollapsed));
  }, [isStorylineCollapsed]);

  useEffect(() => {
    localStorage.setItem("hideoutCollapsed", String(isHideoutCollapsed));
  }, [isHideoutCollapsed]);

  useEffect(() => {
    localStorage.setItem("questsCollapsed", String(isQuestsCollapsed));
  }, [isQuestsCollapsed]);

  useEffect(() => {
    localStorage.setItem("nextQuestsCollapsed", String(isNextQuestsCollapsed));
  }, [isNextQuestsCollapsed]);

  useEffect(() => {
    localStorage.setItem("layoutMode", layoutMode);
  }, [layoutMode]);

  const logicalTaskGroupsByTaskId = useMemo(
    () => buildLogicalTaskGroupsByTaskId(tasks),
    [tasks],
  );

  const workingOnLogicalKeys = useMemo(
    () =>
      new Set(
        Array.from(workingOnTasks)
          .map((taskId) => {
            const task = tasks.find((entry) => entry.id === taskId);
            return task ? buildLogicalTaskKey(task) : null;
          })
          .filter((key): key is string => key !== null),
      ),
    [tasks, workingOnTasks],
  );

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

  const handleObjectiveItemDelta = (
    objectiveItemKey: string,
    delta: number,
    maxCount: number,
    legacyObjectiveItemKey?: string | string[],
  ) => {
    const current = getTaskObjectiveItemProgress(
      taskObjectiveItemProgress,
      objectiveItemKey,
      legacyObjectiveItemKey,
    );
    const next = Math.max(0, Math.min(maxCount, current + delta));
    onUpdateTaskObjectiveItemProgress(
      objectiveItemKey,
      next,
      legacyObjectiveItemKey,
    );
  };

  const handleObjectiveProgressDelta = (
    objectiveProgressKey: string,
    delta: number,
    maxCount: number,
    legacyObjectiveProgressKey?: string | string[],
  ) => {
    const current = getTaskObjectiveProgress(
      taskObjectiveItemProgress,
      objectiveProgressKey,
      legacyObjectiveProgressKey,
    );
    const next = Math.max(0, Math.min(maxCount, current + delta));
    onUpdateTaskObjectiveItemProgress(
      objectiveProgressKey,
      next,
      legacyObjectiveProgressKey,
    );
  };

  const handleHideoutItemDelta = (
    itemKey: string,
    delta: number,
    maxCount: number,
    isCompleted: boolean,
  ) => {
    const current = hideoutItemQuantities[itemKey] || 0;
    const next = Math.max(0, Math.min(maxCount, current + delta));
    onUpdateHideoutItemQuantity(itemKey, next);
    if (next >= maxCount && !isCompleted) {
      onToggleHideoutItem(itemKey);
    }
    if (next < maxCount && isCompleted) {
      onToggleHideoutItem(itemKey);
    }
  };

  const isHideoutRequirementFoundInRaid = (
    req: HideoutStation["levels"][number]["itemRequirements"][number],
  ) =>
    Boolean(
      req.attributes?.some(
        (attr) =>
          (attr.type === "foundInRaid" || attr.name === "foundInRaid") &&
          attr.value === "true",
      ),
    );

  // Filter tasks that are marked as working on
  const activeTasks = useMemo(() => {
    const preferredTaskByLogicalKey = new Map<string, Task>();

    tasks.forEach((task) => {
      const key = buildLogicalTaskKey(task);
      if (!workingOnLogicalKeys.has(key)) return;

      const existing = preferredTaskByLogicalKey.get(key);
      if (!existing || task.id.localeCompare(existing.id) < 0) {
        preferredTaskByLogicalKey.set(key, task);
      }
    });

    return Array.from(preferredTaskByLogicalKey.values());
  }, [tasks, workingOnLogicalKeys]);

  const nextTasks = useMemo(() => {
    const level = Number.isFinite(playerLevel) ? playerLevel : 1;
    const preferredTaskByLogicalKey = new Map<string, Task>();

    const compareTasks = (left: Task, right: Task) => {
      const leftUnlocked = areLogicalPrerequisitesCompleted(
        left,
        completedTasks,
        logicalTaskGroupsByTaskId,
      );
      const rightUnlocked = areLogicalPrerequisitesCompleted(
        right,
        completedTasks,
        logicalTaskGroupsByTaskId,
      );
      if (leftUnlocked !== rightUnlocked) return leftUnlocked ? -1 : 1;

      const leftPrereqCount = getLogicalCompletedPrerequisiteCount(
        left,
        completedTasks,
        logicalTaskGroupsByTaskId,
      );
      const rightPrereqCount = getLogicalCompletedPrerequisiteCount(
        right,
        completedTasks,
        logicalTaskGroupsByTaskId,
      );
      if (leftPrereqCount !== rightPrereqCount) {
        return rightPrereqCount - leftPrereqCount;
      }

      return (
        left.name.localeCompare(right.name, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id)
      );
    };

    tasks.forEach((task) => {
      if (
        !isLogicalTaskCompletable(
          task,
          completedTasks,
          logicalTaskGroupsByTaskId,
        )
      ) {
        return;
      }
      const key = buildLogicalTaskKey(task);
      if (workingOnLogicalKeys.has(key)) return;
      if (task.minPlayerLevel > level) return;
      if (ignoredTasks.has(task.id)) return;

      const existing = preferredTaskByLogicalKey.get(key);
      if (!existing || compareTasks(task, existing) < 0) {
        preferredTaskByLogicalKey.set(key, task);
      }
    });

    return Array.from(preferredTaskByLogicalKey.values());
  }, [
    tasks,
    completedTasks,
    playerLevel,
    logicalTaskGroupsByTaskId,
    workingOnLogicalKeys,
    ignoredTasks,
  ]);

  const searchableTasks = useMemo(() => {
    return tasks.filter((task) => {
      const key = buildLogicalTaskKey(task);
      return (
        !isLogicalTaskCompleted(
          task.id,
          completedTasks,
          logicalTaskGroupsByTaskId,
        ) && !workingOnLogicalKeys.has(key)
      );
    });
  }, [tasks, completedTasks, logicalTaskGroupsByTaskId, workingOnLogicalKeys]);

  const filteredNextTasks = useMemo(() => {
    if (!nextQuestsSearch.trim()) return nextTasks;
    const query = nextQuestsSearch.toLowerCase();
    return nextTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        task.trader?.name.toLowerCase().includes(query),
    );
  }, [nextTasks, nextQuestsSearch]);

  const activeQuestsSearchResults = useMemo(() => {
    if (!activeQuestsSearch.trim()) return [];
    const query = activeQuestsSearch.toLowerCase();
    return searchableTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        task.trader?.name.toLowerCase().includes(query) ||
        task.map?.name.toLowerCase().includes(query),
    );
  }, [searchableTasks, activeQuestsSearch]);

  useEffect(() => {
    setNextQuestsSelectedIndex(0);
  }, [filteredNextTasks]);

  useEffect(() => {
    setActiveQuestsSelectedIndex(0);
  }, [activeQuestsSearchResults]);

  const objectiveProgressByTaskId = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>();
    activeTasks.forEach((task) => {
      const total = task.objectives?.length ?? 0;
      if (total <= 0) return;
      const objectiveKeys = buildTaskObjectiveKeys(task);
      let completed = 0;
      objectiveKeys.forEach((objectiveKey, index) => {
        if (
          isTaskObjectiveCompleted(
            completedTaskObjectives,
            objectiveKey,
            buildLegacyTaskObjectiveKey(task.id, index),
          )
        ) {
          completed += 1;
        }
      });
      map.set(task.id, { completed, total });
    });
    return map;
  }, [activeTasks, completedTaskObjectives]);

  // Group active tasks by map - tasks with multiple maps appear under each map
  const normalizeMapName = (name?: string | null) => {
    if (!name) return "No specific map";
    if (name.toLowerCase().startsWith("ground zero")) return "Ground Zero";
    return name;
  };

  const filteredActiveTasks = useMemo(() => {
    if (!activeQuestsSearch.trim()) return activeTasks;
    const query = activeQuestsSearch.toLowerCase();
    return activeTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        task.trader?.name.toLowerCase().includes(query) ||
        task.map?.name.toLowerCase().includes(query),
    );
  }, [activeTasks, activeQuestsSearch]);

  const filteredTasksByMap = useMemo(() => {
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
    filteredActiveTasks.forEach((task) => {
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
  }, [filteredActiveTasks]);

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
          (l) => l.level === parseInt(levelIndex),
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

  const renderCompactTaskObjectivesPopup = (
    task: Task,
    objectiveKeys: string[],
    objectiveProgress: { completed: number; total: number } | undefined,
  ) => {
    if (!task.objectives?.length) return null;

    return (
      <HoverCardContent
        align="start"
        side="top"
        sideOffset={10}
        className="w-[22rem] max-w-[calc(100vw-2rem)] border-border bg-popover p-0 text-popover-foreground shadow-xl"
      >
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight text-foreground">
                  {task.name}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                    {task.trader.name}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                    Lvl {task.minPlayerLevel}
                  </span>
                </div>
              </div>
              {objectiveProgress && (
                <div className="rounded-lg border border-border bg-card px-2 py-1 text-right">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Objectives
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {objectiveProgress.completed}/{objectiveProgress.total}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {task.objectives.map((obj, idx) => {
              const objectiveKey =
                objectiveKeys[idx] ?? buildLegacyTaskObjectiveKey(task.id, idx);
              const legacyObjectiveKey = buildTaskObjectiveFallbackKeys(
                task,
                idx,
                objectiveKey,
              );
              const isObjCompleted = isTaskObjectiveCompleted(
                completedTaskObjectives,
                objectiveKey,
                legacyObjectiveKey,
              );
              const requiredCount = Math.max(1, obj.count ?? 1);
              const objectiveProgressKey =
                buildTaskObjectiveProgressKey(objectiveKey);
              const legacyObjectiveProgressKey = [
                ...legacyObjectiveKey.map((key) =>
                  buildTaskObjectiveProgressKey(key),
                ),
                buildLegacyTaskObjectiveProgressKey(task.id, idx),
              ];
              const countOnlyProgress = Math.min(
                requiredCount,
                getTaskObjectiveProgress(
                  taskObjectiveItemProgress,
                  objectiveProgressKey,
                  legacyObjectiveProgressKey,
                ),
              );
              const itemProgress = (obj.items ?? []).map((item) => {
                const itemKey = buildTaskObjectiveItemProgressKey(
                  objectiveKey,
                  item.id || item.name,
                );
                const legacyItemKey = [
                  ...legacyObjectiveKey.map((key) =>
                    buildTaskObjectiveItemProgressKey(key, item.id || item.name),
                  ),
                  buildLegacyTaskObjectiveItemProgressKey(
                    task.id,
                    idx,
                    item.id || item.name,
                  ),
                ];
                return Math.min(
                  requiredCount,
                  getTaskObjectiveItemProgress(
                    taskObjectiveItemProgress,
                    itemKey,
                    legacyItemKey,
                  ),
                );
              });
              const usesSharedPool =
                (obj.items?.length ?? 0) > 1 && requiredCount > 1;
              const itemProgressTotal = usesSharedPool
                ? Math.min(
                    requiredCount,
                    itemProgress.reduce((sum, count) => sum + count, 0),
                  )
                : itemProgress[0] ?? 0;
              const progressText = isObjCompleted
                ? "Complete"
                : !obj.items?.length && typeof obj.count === "number" && obj.count > 1
                  ? `${countOnlyProgress}/${requiredCount}`
                  : obj.items?.length
                    ? `${itemProgressTotal}/${requiredCount}`
                    : "Not complete";

              return (
                <div
                  key={`${task.id}-compact-popup-objective-${idx}`}
                  className={cn(
                    "rounded-lg border border-border bg-card px-3 py-2",
                    isObjCompleted && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full border",
                        isObjCompleted
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground/50",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-xs leading-snug text-foreground",
                          isObjCompleted && "line-through",
                        )}
                      >
                        {formatTaskObjectiveLabel(obj)}
                      </div>
                      {obj.items && obj.items.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {obj.items.slice(0, 4).map((item, itemIndex) => (
                            <span
                              key={`${task.id}-compact-popup-objective-${idx}-${item.id || item.name}`}
                              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {usesSharedPool
                                ? item.name
                                : `${itemProgress[itemIndex] ?? 0}/${requiredCount} ${item.name}`}
                            </span>
                          ))}
                          {obj.items.length > 4 && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              +{obj.items.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums",
                        isObjCompleted
                          ? "border-green-500/30 bg-green-500/10 text-green-500"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {progressText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </HoverCardContent>
    );
  };

  const renderLayoutToggle = () => (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={layoutMode === "standard" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setLayoutMode("standard")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Standard view</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={layoutMode === "compact" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setLayoutMode("compact")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Compact view</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Currently Working On</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "items"} in progress
          </p>
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
                          • <strong>Quick Add:</strong> Use the search in Next
                          Quests or Quests to find and track any task
                        </li>
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
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg py-3 px-4 pb-4"
            onClick={() => setIsNextQuestsCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <CardTitle className="text-base">
                Next Quests ({nextTasks.length})
              </CardTitle>
              {isNextQuestsCollapsed ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronUp className="h-4 w-4 ml-auto" />
              )}
            </div>
            <CardDescription className="text-xs">
              Unlocked by your completed quests
            </CardDescription>
          </CardHeader>
          {!isNextQuestsCollapsed && (
            <CardContent className="space-y-3 px-4 pb-3 pt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={nextQuestsSearch}
                  onChange={(e) => setNextQuestsSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setNextQuestsSelectedIndex((prev) =>
                        Math.min(prev + 1, filteredNextTasks.length - 1),
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setNextQuestsSelectedIndex((prev) =>
                        Math.max(prev - 1, 0),
                      );
                    } else if (
                      e.key === "Enter" &&
                      filteredNextTasks.length > 0
                    ) {
                      onToggleWorkingOnTask(
                        filteredNextTasks[nextQuestsSelectedIndex].id,
                      );
                      setNextQuestsSearch("");
                    }
                  }}
                  className="pl-9 h-8 text-sm"
                  onClick={(ev) => ev.stopPropagation()}
                />
              </div>
              <div className="space-y-1">
                {(showAllNextTasks
                  ? filteredNextTasks
                  : filteredNextTasks.slice(0, 2)
                ).map((task, index) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5",
                      index === nextQuestsSelectedIndex && nextQuestsSearch
                        ? "bg-accent/50 border-accent-foreground/20"
                        : "bg-card",
                    )}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {task.trader?.imageLink && (
                        <img
                          src={task.trader.imageLink}
                          alt={task.trader.name}
                          loading="lazy"
                          className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <span className="font-medium text-sm truncate">
                        {task.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0"
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
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0"
                      >
                        Lvl {task.minPlayerLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => onToggleIgnoredTask(task.id)}
                        title="Ignore this task"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => onToggleWorkingOnTask(task.id)}
                        title="Add to working on"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredNextTasks.length === 0 && nextQuestsSearch && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No quests match your search
                  </p>
                )}
              </div>
              {filteredNextTasks.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={() => setShowAllNextTasks((prev) => !prev)}
                >
                  {showAllNextTasks
                    ? "Show less"
                    : `Show all (${filteredNextTasks.length})`}
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Active Quests Section */}
      {activeTasks.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-4"
            onClick={() => setIsQuestsCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Quests ({activeTasks.length})</CardTitle>
              <div
                className="flex items-center gap-1 ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {renderLayoutToggle()}
                {isQuestsCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </div>
            </div>
            <CardDescription>
              Regular tasks you're currently working on
            </CardDescription>
          </CardHeader>
          {!isQuestsCollapsed && (
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all tasks..."
                  value={activeQuestsSearch}
                  onChange={(e) => setActiveQuestsSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveQuestsSelectedIndex((prev) =>
                        Math.min(
                          prev + 1,
                          activeQuestsSearchResults.length - 1,
                        ),
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveQuestsSelectedIndex((prev) =>
                        Math.max(prev - 1, 0),
                      );
                    } else if (
                      e.key === "Enter" &&
                      activeQuestsSearchResults.length > 0
                    ) {
                      onToggleWorkingOnTask(
                        activeQuestsSearchResults[activeQuestsSelectedIndex].id,
                      );
                      setActiveQuestsSearch("");
                    }
                  }}
                  className="pl-9 h-8 text-sm"
                  onClick={(ev) => ev.stopPropagation()}
                />
              </div>
              {activeQuestsSearch.trim() ? (
                <div className="space-y-1">
                  {activeQuestsSearchResults.map((task, index) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5",
                        index === activeQuestsSelectedIndex
                          ? "bg-accent/50 border-accent-foreground/20"
                          : "bg-card",
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {task.trader?.imageLink && (
                          <img
                            src={task.trader.imageLink}
                            alt={task.trader.name}
                            loading="lazy"
                            className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="font-medium text-sm truncate">
                          {task.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
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
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                        >
                          Lvl {task.minPlayerLevel}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => onToggleWorkingOnTask(task.id)}
                        title="Add to working on"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {activeQuestsSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No tasks match your search
                    </p>
                  )}
                </div>
              ) : (
                Array.from(filteredTasksByMap.entries()).map(
                  ([mapName, mapTasks]) => (
                    <div key={mapName} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {mapName}
                      </div>
                      <div
                        className={cn(
                          layoutMode === "compact"
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-6"
                            : "space-y-2 ml-6",
                        )}
                      >
                        {mapTasks.map((task) => {
                          const isTaskCompleted = isLogicalTaskCompleted(
                            task.id,
                            completedTasks,
                            logicalTaskGroupsByTaskId,
                          );
                          const isExpanded =
                            layoutMode === "compact"
                              ? false
                              : expandedTasks.has(task.id);
                          const objectiveKeys = buildTaskObjectiveKeys(task);
                          const objectiveProgress =
                            objectiveProgressByTaskId.get(task.id);
                          return (
                            <HoverCard
                              key={task.id}
                              openDelay={180}
                              closeDelay={80}
                            >
                              <HoverCardTrigger asChild>
                                <div
                                  className={cn(
                                    "rounded-xl border bg-card transition-all duration-300",
                                    isTaskCompleted && "opacity-60",
                                    layoutMode === "compact"
                                      ? "group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/60 backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
                                      : "rounded-lg hover:shadow-md",
                                  )}
                                >
                              {layoutMode === "compact" &&
                                task.trader?.name && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all group-hover:w-[4px]"
                                    style={{
                                      backgroundColor:
                                        TRADER_COLORS[
                                          task.trader
                                            .name as keyof typeof TRADER_COLORS
                                        ] || "#6b7280",
                                    }}
                                  />
                                )}
                              <div
                                className={cn(
                                  "flex items-start justify-between gap-2",
                                  layoutMode === "compact" ? "pr-1" : "p-3",
                                )}
                              >
                                {layoutMode === "compact" ? (
                                  <div className="flex items-start gap-2 flex-1 min-w-0 p-3 pl-4">
                                    <Checkbox
                                      checked={isTaskCompleted}
                                      onCheckedChange={() =>
                                        onToggleTask(task.id)
                                      }
                                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {task.trader?.imageLink && (
                                            <img
                                              src={task.trader.imageLink}
                                              alt={task.trader.name}
                                              loading="lazy"
                                              className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                                            />
                                          )}
                                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
                                            {task.trader.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {objectiveProgress && (
                                            <span className="text-[10px] tabular-nums font-medium text-muted-foreground">
                                              {objectiveProgress.completed}/
                                              {objectiveProgress.total}
                                            </span>
                                          )}
                                          <span className="text-[10px] text-muted-foreground/60">
                                            Lvl {task.minPlayerLevel}
                                          </span>
                                        </div>
                                      </div>
                                      <h4
                                        className={cn(
                                          "text-xs font-semibold leading-snug line-clamp-2",
                                          isTaskCompleted &&
                                            "line-through text-muted-foreground",
                                        )}
                                      >
                                        {task.name}
                                      </h4>
                                      {objectiveProgress && (
                                        <div className="flex items-center gap-2">
                                          <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                                            <div
                                              className="h-full rounded-full transition-all duration-500"
                                              style={{
                                                width: `${(objectiveProgress.completed / objectiveProgress.total) * 100}%`,
                                                backgroundColor:
                                                  TRADER_COLORS[
                                                    task.trader
                                                      .name as keyof typeof TRADER_COLORS
                                                  ] || "#6b7280",
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <Checkbox
                                      checked={isTaskCompleted}
                                      onCheckedChange={() =>
                                        onToggleTask(task.id)
                                      }
                                      className="mt-1 h-5 w-5 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {task.trader?.imageLink && (
                                          <img
                                            src={task.trader.imageLink}
                                            alt={task.trader.name}
                                            loading="lazy"
                                            className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                                          />
                                        )}
                                        <h4
                                          className={cn(
                                            "font-medium",
                                            isTaskCompleted &&
                                              "line-through text-muted-foreground",
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
                                        {objectiveProgress && (
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "inline-flex items-center gap-1",
                                              objectiveProgress.completed >=
                                                objectiveProgress.total
                                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
                                            )}
                                          >
                                            <ListTodo className="h-3 w-3" />
                                            {objectiveProgress.completed}/
                                            {objectiveProgress.total}
                                          </Badge>
                                        )}
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
                                              {task.objectives.length !== 1
                                                ? "s"
                                                : ""}
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
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onToggleWorkingOnTask(task.id)}
                                  className={cn(
                                    "flex-shrink-0",
                                    layoutMode === "compact"
                                      ? "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                      : "",
                                  )}
                                  title="Remove from working on"
                                >
                                  <X
                                    className={cn(
                                      layoutMode === "compact"
                                        ? "h-3 w-3"
                                        : "h-4 w-4",
                                    )}
                                  />
                                </Button>
                              </div>
                              {/* Compact objectives */}
                              {layoutMode === "compact" &&
                                task.objectives &&
                                task.objectives.length > 0 && (
                                  <div className="px-3 pb-3 pl-4 space-y-1 border-t border-border/20 mt-1 pt-2">
                                    {task.objectives.map((obj, idx) => {
                                      const objectiveKey =
                                        objectiveKeys[idx] ??
                                        buildLegacyTaskObjectiveKey(
                                          task.id,
                                          idx,
                                        );
                                      const legacyObjectiveKey =
                                        buildTaskObjectiveFallbackKeys(
                                          task,
                                          idx,
                                          objectiveKey,
                                        );
                                      const isObjCompleted =
                                        isTaskObjectiveCompleted(
                                          completedTaskObjectives,
                                          objectiveKey,
                                          legacyObjectiveKey,
                                        );
                                      return (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "flex items-center gap-1.5",
                                            isObjCompleted &&
                                              "opacity-50 line-through",
                                          )}
                                        >
                                          <Checkbox
                                            checked={isObjCompleted}
                                            onCheckedChange={() =>
                                              onToggleTaskObjective(
                                                task.id,
                                                objectiveKey,
                                                legacyObjectiveKey,
                                              )
                                            }
                                            className="h-3 w-3 flex-shrink-0"
                                          />
                                          <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                                            {formatTaskObjectiveLabel(obj)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              {/* Expanded objectives */}
                              {layoutMode === "standard" &&
                                isExpanded &&
                                task.objectives &&
                                task.objectives.length > 0 && (
                                  <div className="px-3 pb-3 ml-8 space-y-2 border-t mt-2 pt-3">
                                    {task.objectives.map((obj, idx) => {
                                      const objectiveKey =
                                        objectiveKeys[idx] ??
                                        buildLegacyTaskObjectiveKey(
                                          task.id,
                                          idx,
                                        );
                                      const legacyObjectiveKey =
                                        buildTaskObjectiveFallbackKeys(
                                          task,
                                          idx,
                                          objectiveKey,
                                        );
                                      const isObjCompleted =
                                        isTaskObjectiveCompleted(
                                          completedTaskObjectives,
                                          objectiveKey,
                                          legacyObjectiveKey,
                                        );
                                      return (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors",
                                            isObjCompleted && "opacity-60",
                                          )}
                                        >
                                          <Checkbox
                                            checked={isObjCompleted}
                                            onCheckedChange={() =>
                                              onToggleTaskObjective(
                                                task.id,
                                                objectiveKey,
                                                legacyObjectiveKey,
                                              )
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
                                                  inlineItem.name,
                                                );
                                              const requiredCount = Math.max(
                                                1,
                                                obj.count ?? 1,
                                              );
                                              const objectiveLabel =
                                                formatTaskObjectiveLabel(obj);
                                              const objectiveProgressKey =
                                                buildTaskObjectiveProgressKey(
                                                  objectiveKey,
                                                );
                                              const legacyObjectiveProgressKey =
                                                [
                                                  ...legacyObjectiveKey.map(
                                                    (key) =>
                                                      buildTaskObjectiveProgressKey(
                                                        key,
                                                      ),
                                                  ),
                                                  buildLegacyTaskObjectiveProgressKey(
                                                    task.id,
                                                    idx,
                                                  ),
                                                ];
                                              const currentObjectiveCount =
                                                Math.min(
                                                  requiredCount,
                                                  getTaskObjectiveProgress(
                                                    taskObjectiveItemProgress,
                                                    objectiveProgressKey,
                                                    legacyObjectiveProgressKey,
                                                  ),
                                                );
                                              const isCountOnlyObjective =
                                                !obj.items?.length &&
                                                typeof obj.count === "number" &&
                                                obj.count > 1;
                                              const objectiveProgressRemaining =
                                                Math.max(
                                                  0,
                                                  requiredCount -
                                                    currentObjectiveCount,
                                                );
                                              const usesSharedPool =
                                                (obj.items?.length ?? 0) > 1 &&
                                                requiredCount > 1;
                                              const objectiveItemProgress = (
                                                obj.items ?? []
                                              ).map((item) => {
                                                const itemKey =
                                                  buildTaskObjectiveItemProgressKey(
                                                    objectiveKey,
                                                    item.id || item.name,
                                                  );
                                                const legacyItemKey = [
                                                  ...legacyObjectiveKey.map(
                                                    (key) =>
                                                      buildTaskObjectiveItemProgressKey(
                                                        key,
                                                        item.id || item.name,
                                                      ),
                                                  ),
                                                  buildLegacyTaskObjectiveItemProgressKey(
                                                    task.id,
                                                    idx,
                                                    item.id || item.name,
                                                  ),
                                                ];
                                                const currentCount = Math.min(
                                                  requiredCount,
                                                  getTaskObjectiveItemProgress(
                                                    taskObjectiveItemProgress,
                                                    itemKey,
                                                    legacyItemKey,
                                                  ),
                                                );
                                                return {
                                                  itemKey,
                                                  legacyItemKey,
                                                  currentCount,
                                                };
                                              });
                                              const objectiveTotalCollected =
                                                usesSharedPool
                                                  ? Math.min(
                                                      requiredCount,
                                                      objectiveItemProgress.reduce(
                                                        (sum, progress) =>
                                                          sum +
                                                          progress.currentCount,
                                                        0,
                                                      ),
                                                    )
                                                  : 0;
                                              const objectiveRemaining =
                                                usesSharedPool
                                                  ? Math.max(
                                                      0,
                                                      requiredCount -
                                                        objectiveTotalCollected,
                                                    )
                                                  : 0;
                                              return (
                                                <>
                                                  <p
                                                    className={cn(
                                                      "text-muted-foreground",
                                                      isObjCompleted &&
                                                        "line-through",
                                                    )}
                                                  >
                                                    {showInlineIcon && (
                                                      <TooltipProvider
                                                        delayDuration={150}
                                                      >
                                                        <Tooltip>
                                                          <TooltipTrigger
                                                            asChild
                                                          >
                                                            <img
                                                              src={
                                                                inlineItem?.iconLink
                                                              }
                                                              alt={
                                                                inlineItem?.name
                                                              }
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
                                                                alt={
                                                                  inlineItem?.name
                                                                }
                                                                className="h-16 w-16 object-contain"
                                                                loading="lazy"
                                                              />
                                                              <span className="text-xs">
                                                                {
                                                                  inlineItem?.name
                                                                }
                                                              </span>
                                                            </div>
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                    )}
                                                    {objectiveLabel}
                                                  </p>
                                                  {isCountOnlyObjective && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleObjectiveProgressDelta(
                                                            objectiveProgressKey,
                                                            -1,
                                                            requiredCount,
                                                            legacyObjectiveProgressKey,
                                                          );
                                                        }}
                                                        className={cn(
                                                          "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                          currentObjectiveCount <=
                                                            0 &&
                                                            "opacity-50 cursor-not-allowed",
                                                        )}
                                                        disabled={
                                                          currentObjectiveCount <=
                                                          0
                                                        }
                                                        aria-label={`Decrease progress for ${objectiveLabel}`}
                                                      >
                                                        <Minus className="h-3 w-3 mx-auto" />
                                                      </button>
                                                      <span className="w-16 text-center text-xs tabular-nums">
                                                        {currentObjectiveCount}/
                                                        {requiredCount}
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleObjectiveProgressDelta(
                                                            objectiveProgressKey,
                                                            1,
                                                            requiredCount,
                                                            legacyObjectiveProgressKey,
                                                          );
                                                        }}
                                                        className={cn(
                                                          "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                          currentObjectiveCount >=
                                                            requiredCount &&
                                                            "opacity-50 cursor-not-allowed",
                                                        )}
                                                        disabled={
                                                          currentObjectiveCount >=
                                                          requiredCount
                                                        }
                                                        aria-label={`Increase progress for ${objectiveLabel}`}
                                                      >
                                                        <Plus className="h-3 w-3 mx-auto" />
                                                      </button>
                                                      <span className="text-[11px] text-muted-foreground">
                                                        {objectiveProgressRemaining ===
                                                        0
                                                          ? "Complete"
                                                          : `${objectiveProgressRemaining} remaining`}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {obj.items &&
                                                    obj.items &&
                                                    obj.items.length > 0 && (
                                                      <div className="mt-2 space-y-2">
                                                        {usesSharedPool && (
                                                          <div className="text-[11px] text-muted-foreground">
                                                            Progress:{" "}
                                                            <span className="font-medium text-foreground/90">
                                                              {
                                                                objectiveTotalCollected
                                                              }
                                                              /{requiredCount}
                                                            </span>{" "}
                                                            (
                                                            {objectiveRemaining}{" "}
                                                            remaining)
                                                          </div>
                                                        )}
                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                          {obj.items.map(
                                                            (
                                                              item,
                                                              itemIndex,
                                                            ) => {
                                                              const itemProgress =
                                                                objectiveItemProgress[
                                                                  itemIndex
                                                                ];
                                                              const itemKey =
                                                                itemProgress?.itemKey ??
                                                                buildTaskObjectiveItemProgressKey(
                                                                  objectiveKey,
                                                                  item.id ||
                                                                    item.name,
                                                                );
                                                              const legacyItemKey =
                                                                itemProgress?.legacyItemKey ??
                                                                buildLegacyTaskObjectiveItemProgressKey(
                                                                  task.id,
                                                                  idx,
                                                                  item.id ||
                                                                    item.name,
                                                                );
                                                              const currentCount =
                                                                itemProgress?.currentCount ??
                                                                0;
                                                              const maxCountForItem =
                                                                usesSharedPool
                                                                  ? Math.max(
                                                                      currentCount,
                                                                      requiredCount -
                                                                        (objectiveTotalCollected -
                                                                          currentCount),
                                                                    )
                                                                  : requiredCount;
                                                              const remaining =
                                                                usesSharedPool
                                                                  ? objectiveRemaining
                                                                  : Math.max(
                                                                      0,
                                                                      requiredCount -
                                                                        currentCount,
                                                                    );
                                                              const isComplete =
                                                                usesSharedPool
                                                                  ? objectiveTotalCollected >=
                                                                    requiredCount
                                                                  : currentCount >=
                                                                    requiredCount;
                                                              return (
                                                                <div
                                                                  key={
                                                                    item.id ||
                                                                    item.name
                                                                  }
                                                                  className={cn(
                                                                    "flex items-center gap-2 rounded-md border bg-background/40 p-2",
                                                                    isComplete &&
                                                                      "opacity-60",
                                                                  )}
                                                                >
                                                                  {item.iconLink ? (
                                                                    <TooltipProvider
                                                                      delayDuration={
                                                                        150
                                                                      }
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
                                                                              {
                                                                                item.name
                                                                              }
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
                                                                      {
                                                                        item.name
                                                                      }
                                                                    </div>
                                                                    <div className="text-[11px] text-muted-foreground">
                                                                      {usesSharedPool
                                                                        ? `Contributed: ${currentCount}`
                                                                        : remaining ===
                                                                            0
                                                                          ? "Complete"
                                                                          : `${remaining} remaining`}
                                                                    </div>
                                                                  </div>
                                                                  <div className="flex items-center gap-1">
                                                                    <button
                                                                      type="button"
                                                                      onClick={(
                                                                        e,
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        handleObjectiveItemDelta(
                                                                          itemKey,
                                                                          -1,
                                                                          maxCountForItem,
                                                                          legacyItemKey,
                                                                        );
                                                                      }}
                                                                      className={cn(
                                                                        "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                                        currentCount <=
                                                                          0 &&
                                                                          "opacity-50 cursor-not-allowed",
                                                                      )}
                                                                      disabled={
                                                                        currentCount <=
                                                                        0
                                                                      }
                                                                      aria-label={`Decrease ${item.name}`}
                                                                    >
                                                                      <Minus className="h-3 w-3 mx-auto" />
                                                                    </button>
                                                                    <span className="w-12 text-center text-xs tabular-nums">
                                                                      {
                                                                        currentCount
                                                                      }
                                                                      /
                                                                      {usesSharedPool
                                                                        ? requiredCount
                                                                        : maxCountForItem}
                                                                    </span>
                                                                    <button
                                                                      type="button"
                                                                      onClick={(
                                                                        e,
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        handleObjectiveItemDelta(
                                                                          itemKey,
                                                                          1,
                                                                          maxCountForItem,
                                                                          legacyItemKey,
                                                                        );
                                                                      }}
                                                                      className={cn(
                                                                        "h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors",
                                                                        currentCount >=
                                                                          maxCountForItem &&
                                                                          "opacity-50 cursor-not-allowed",
                                                                      )}
                                                                      disabled={
                                                                        currentCount >=
                                                                        maxCountForItem
                                                                      }
                                                                      aria-label={`Increase ${item.name}`}
                                                                    >
                                                                      <Plus className="h-3 w-3 mx-auto" />
                                                                    </button>
                                                                  </div>
                                                                </div>
                                                              );
                                                            },
                                                          )}
                                                        </div>
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
                              </HoverCardTrigger>
                              {layoutMode === "compact" &&
                                renderCompactTaskObjectivesPopup(
                                  task,
                                  objectiveKeys,
                                  objectiveProgress,
                                )}
                            </HoverCard>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Active Storyline Objectives Section */}
      {activeStorylineObjectives.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-4"
            onClick={() => setIsStorylineCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>
                Storyline Objectives ({activeStorylineObjectives.length})
              </CardTitle>
              {isStorylineCollapsed ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronUp className="h-4 w-4 ml-auto" />
              )}
            </div>
            <CardDescription>
              1.0 storyline objectives in progress
            </CardDescription>
          </CardHeader>
          {!isStorylineCollapsed && (
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
                        isCompleted && "opacity-60",
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
                              isCompleted &&
                                "line-through text-muted-foreground",
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
                },
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Active Collector Items Section */}
      {activeCollectorItems.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-4"
            onClick={() => setIsCollectorItemsCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>
                Collector Items ({activeCollectorItems.length})
              </CardTitle>
              {isCollectorItemsCollapsed ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronUp className="h-4 w-4 ml-auto" />
              )}
            </div>
            <CardDescription>
              Click an item to toggle found status
            </CardDescription>
          </CardHeader>
          {!isCollectorItemsCollapsed && (
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {activeCollectorItems.map((item) => (
                  // show all items; fade completed
                  <button
                    key={item.name}
                    onClick={() => onToggleCollectorItem(item.name)}
                    className={cn(
                      "relative group rounded-lg border bg-card p-2 hover:bg-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer text-left",
                      completedCollectorItems.has(item.name) && "opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-lg transition-opacity bg-green-500/10",
                        completedCollectorItems.has(item.name)
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
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
          )}
        </Card>
      )}

      {/* Active Hideout Stations Section */}
      {activeHideoutStations.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-4"
            onClick={() => setIsHideoutCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <CardTitle>
                Hideout Stations ({activeHideoutStations.length})
              </CardTitle>
              <div
                className="ml-auto flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {renderLayoutToggle()}
                {isHideoutCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </div>
            </div>
            <CardDescription>Stations you're upgrading</CardDescription>
          </CardHeader>
          {!isHideoutCollapsed && (
            <CardContent className="space-y-3">
              {activeHideoutStations.map(({ station, level, key }) => {
                const isExpanded = expandedHideout.has(key);
                const completedCount = level.itemRequirements.filter((req) => {
                  const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                  return completedHideoutItems.has(itemKey);
                }).length;
                const totalCount = level.itemRequirements.length;
                const remainingCount = Math.max(
                  0,
                  totalCount - completedCount,
                );
                const progressPercent =
                  totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                if (layoutMode === "compact") {
                  return (
                    <div
                      key={key}
                      className="rounded-lg border bg-card p-3 transition-colors"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-semibold">
                              {station.name}
                            </h4>
                            <Badge variant="secondary" className="h-5 text-[11px]">
                              Level {level.level}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {remainingCount === 0
                              ? "All items found"
                              : `${remainingCount} item${remainingCount === 1 ? "" : "s"} left`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleWorkingOnHideoutStation(key)}
                          className="h-7 w-7 flex-shrink-0"
                          title="Remove from working on"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {totalCount > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {level.itemRequirements.map((req, idx) => {
                            const itemKey = `${station.name}-${level.level}-${req.item.name}`;
                            const isItemCompleted =
                              completedHideoutItems.has(itemKey);
                            const currentCount =
                              hideoutItemQuantities[itemKey] || 0;
                            const isFirRequired =
                              isHideoutRequirementFoundInRaid(req);

                            return (
                              <div
                                key={`${itemKey}-${idx}`}
                                className={cn(
                                  "group flex min-w-0 items-center gap-2 rounded-md border bg-background/40 p-2 transition-colors hover:bg-muted/50",
                                  isFirRequired &&
                                    "border-amber-500/50 bg-amber-500/10",
                                  isItemCompleted &&
                                    "border-border bg-muted/30 opacity-55",
                                )}
                              >
                                <Checkbox
                                  checked={isItemCompleted}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      onUpdateHideoutItemQuantity(
                                        itemKey,
                                        req.count,
                                      );
                                      if (!isItemCompleted) {
                                        onToggleHideoutItem(itemKey);
                                      }
                                    } else {
                                      onUpdateHideoutItemQuantity(itemKey, 0);
                                      if (isItemCompleted) {
                                        onToggleHideoutItem(itemKey);
                                      }
                                    }
                                  }}
                                  className="h-4 w-4 flex-shrink-0"
                                  aria-label={`Toggle ${req.item.name} found`}
                                />
                                {req.item.iconLink && (
                                  <img
                                    src={req.item.iconLink}
                                    alt={req.item.name}
                                    className="h-8 w-8 flex-shrink-0 object-contain"
                                    loading="lazy"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "truncate text-xs font-medium text-foreground",
                                        isItemCompleted &&
                                          "line-through text-muted-foreground",
                                      )}
                                    >
                                      {req.item.name}
                                    </span>
                                    {isFirRequired && (
                                      <Badge
                                        variant="outline"
                                        className="h-4 border-amber-500/70 bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-200"
                                      >
                                        FIR
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span>
                                      {currentCount}/{req.count} found
                                    </span>
                                    {isItemCompleted && (
                                      <span className="font-medium text-green-400">
                                        Done
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleHideoutItemDelta(
                                        itemKey,
                                        -1,
                                        req.count,
                                        isItemCompleted,
                                      );
                                    }}
                                    disabled={currentCount <= 0}
                                    aria-label={`Decrease ${req.item.name}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleHideoutItemDelta(
                                        itemKey,
                                        1,
                                        req.count,
                                        isItemCompleted,
                                      );
                                    }}
                                    disabled={currentCount >= req.count}
                                    aria-label={`Increase ${req.item.name}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
                          Ready to upgrade.
                        </div>
                      )}
                    </div>
                  );
                }

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
                          const currentCount =
                            hideoutItemQuantities[itemKey] || 0;
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group",
                                isItemCompleted && "opacity-60",
                              )}
                            >
                              <Checkbox
                                checked={isItemCompleted}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onUpdateHideoutItemQuantity(
                                      itemKey,
                                      req.count,
                                    );
                                    if (!isItemCompleted) {
                                      onToggleHideoutItem(itemKey);
                                    }
                                  } else {
                                    onUpdateHideoutItemQuantity(itemKey, 0);
                                    if (isItemCompleted) {
                                      onToggleHideoutItem(itemKey);
                                    }
                                  }
                                }}
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
                                  "text-sm",
                                  isItemCompleted &&
                                    "line-through text-muted-foreground",
                                )}
                              >
                                {currentCount}/{req.count}x {req.item.name}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHideoutItemDelta(
                                      itemKey,
                                      -1,
                                      req.count,
                                      isItemCompleted,
                                    );
                                  }}
                                  disabled={currentCount <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHideoutItemDelta(
                                      itemKey,
                                      1,
                                      req.count,
                                      isItemCompleted,
                                    );
                                  }}
                                  disabled={currentCount >= req.count}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
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
