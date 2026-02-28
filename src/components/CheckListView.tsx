import React, {
  Fragment,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQueryState } from "nuqs";
import { Achievement, Task } from "../types";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Link2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MapPin,
  UserCheck,
  Target,
  Search,
  Minus,
  Plus,
  Snowflake,
  SlidersHorizontal,
  ListTodo,
} from "lucide-react";
import { groupTasksByTrader } from "../utils/taskUtils";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { taskStorage } from "@/utils/indexedDB";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  getTaskObjectiveItemProgress,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";

interface CheckListViewProps {
  tasks: Task[];
  achievements: Achievement[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  showKappa: boolean;
  showLightkeeper: boolean;
  onToggleComplete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  mapFilter?: string | null;
  groupBy: "trader" | "map";
  onSetGroupBy: (mode: "trader" | "map") => void;
  activeProfileId: string;
  playerLevel: number;
  workingOnTasks?: Set<string>;
  onToggleWorkingOnTask?: (taskId: string) => void;
  completedTaskObjectives: Set<string>;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string,
  ) => void;
  taskObjectiveItemProgress: Record<string, number>;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string,
  ) => void;
}

interface TaskDisplayGroup {
  key: string;
  tasks: Task[];
  activeTask: Task;
}

const buildTaskMapSignature = (task: Task) => {
  const mapNames =
    task.maps.length > 0
      ? task.maps.map((map) => map.name).sort()
      : [task.map?.name ?? "No specific map"];

  return mapNames.join("|");
};

const buildTaskObjectiveSignature = (task: Task) =>
  JSON.stringify(
    (task.objectives ?? []).map((objective) => ({
      description: objective.description ?? "",
      playerLevel: objective.playerLevel ?? null,
      count: objective.count ?? null,
      foundInRaid: objective.foundInRaid ?? null,
      maps: (objective.maps ?? []).map((map) => map.name).sort(),
      items: (objective.items ?? [])
        .map((item) => item.id ?? item.name)
        .sort(),
    })),
  );

const buildLogicalTaskKey = (task: Task) =>
  [
    task.name,
    task.trader.name,
    task.factionName ?? "Any",
    task.minPlayerLevel,
    task.wikiLink,
    buildTaskMapSignature(task),
    buildTaskObjectiveSignature(task),
    task.kappaRequired ? "kappa" : "no-kappa",
    task.lightkeeperRequired ? "lightkeeper" : "no-lightkeeper",
    task.isEvent ? "event" : "non-event",
  ].join("::");

export const CheckListView: React.FC<CheckListViewProps> = ({
  tasks,
  achievements,
  completedTasks,
  hiddenTraders,
  showKappa,
  showLightkeeper,
  onToggleComplete,
  onTaskClick: _onTaskClick,
  mapFilter,
  groupBy,
  onSetGroupBy,
  activeProfileId,
  playerLevel,
  workingOnTasks = new Set(),
  onToggleWorkingOnTask,
  completedTaskObjectives,
  onToggleTaskObjective,
  taskObjectiveItemProgress,
  onUpdateTaskObjectiveItemProgress,
}) => {
  // Mark intentionally unused while preserving external API
  void _onTaskClick;
  const [urlSearchTerm, setUrlSearchTerm] = useQueryState("tasksSearch", {
    defaultValue: "",
  });
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  // Start with all groups collapsed by default
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [enableLevelFilter, setEnableLevelFilter] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showNextOnly, setShowNextOnly] = useState<boolean>(false);
  const [showEvents, setShowEvents] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<
    | "name-asc"
    | "level-asc"
    | "level-desc"
    | "incomplete-first"
    | "complete-first"
    | "working-on-first"
    | "has-prereqs-first"
    | "kappa-first"
  >("name-asc");

  const setSearchTermImmediately = useCallback(
    (value: string) => {
      setSearchTerm(value);
      void setUrlSearchTerm(value);
    },
    [setUrlSearchTerm],
  );

  // Keep local state in sync with external URL changes (back/forward/deep links).
  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  // Debounce URL updates while typing to avoid excessive history updates.
  useEffect(() => {
    if (searchTerm === urlSearchTerm) return;
    const timeoutId = window.setTimeout(() => {
      void setUrlSearchTerm(searchTerm);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, setUrlSearchTerm, urlSearchTerm]);

  // Load UI prefs from IndexedDB (with migration from localStorage)
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const prefs = await taskStorage.loadUserPreferences();

        // Check if we have IndexedDB data
        const hasIndexedDBData =
          prefs.enableLevelFilter !== undefined ||
          prefs.showCompleted !== undefined ||
          prefs.showEvents !== undefined;

        if (hasIndexedDBData) {
          // Use IndexedDB values
          if (prefs.enableLevelFilter !== undefined)
            setEnableLevelFilter(prefs.enableLevelFilter);
          if (prefs.showCompleted !== undefined)
            setShowCompleted(prefs.showCompleted);
          if (prefs.showEvents !== undefined) setShowEvents(prefs.showEvents);
        } else {
          // Migrate from localStorage if exists
          const storedEnable = localStorage.getItem(
            `taskTracker_enableLevelFilter::${activeProfileId}`,
          );
          const storedShow = localStorage.getItem(
            `taskTracker_showCompleted::${activeProfileId}`,
          );

          const enable = storedEnable != null ? storedEnable === "1" : false;
          const show = storedShow != null ? storedShow === "1" : true;

          setEnableLevelFilter(enable);
          setShowCompleted(show);

          // Migrate to IndexedDB
          await taskStorage.saveUserPreferences({
            enableLevelFilter: enable,
            showCompleted: show,
            showEvents: false,
          });

          // Clean up localStorage
          if (storedEnable)
            localStorage.removeItem(
              `taskTracker_enableLevelFilter::${activeProfileId}`,
            );
          if (storedShow)
            localStorage.removeItem(
              `taskTracker_showCompleted::${activeProfileId}`,
            );
        }
        setPrefsLoaded(true);
      } catch {
        setPrefsLoaded(true);
      }
    };

    setPrefsLoaded(false);
    loadPrefs();
  }, [activeProfileId]);

  // Persist enableLevelFilter to IndexedDB
  useEffect(() => {
    if (!prefsLoaded) return;
    taskStorage.saveUserPreferences({ enableLevelFilter }).catch(() => {
      // ignore
    });
  }, [enableLevelFilter, prefsLoaded]);

  // Persist showCompleted to IndexedDB
  useEffect(() => {
    if (!prefsLoaded) return;
    taskStorage.saveUserPreferences({ showCompleted }).catch(() => {
      // ignore
    });
  }, [showCompleted, prefsLoaded]);

  // Persist showEvents to IndexedDB
  useEffect(() => {
    if (!prefsLoaded) return;
    taskStorage.saveUserPreferences({ showEvents }).catch(() => {
      // ignore
    });
  }, [showEvents, prefsLoaded]);

  const achievementById = useMemo(() => {
    const map = new Map<string, Achievement>();
    achievements.forEach((achievement) => {
      map.set(achievement.id, achievement);
    });
    return map;
  }, [achievements]);

  const achievementByName = useMemo(() => {
    const map = new Map<string, Achievement>();
    achievements.forEach((achievement) => {
      map.set(achievement.name.toLowerCase(), achievement);
    });
    return map;
  }, [achievements]);

  const objectiveProgressByTaskId = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>();
    tasks.forEach((task) => {
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
  }, [tasks, completedTaskObjectives]);

  // Listen for global reset event to reset enableLevelFilter
  useEffect(() => {
    const handler = () => {
      setEnableLevelFilter(false);
    };
    window.addEventListener("taskTracker:reset", handler);
    return () => window.removeEventListener("taskTracker:reset", handler);
  }, []);

  // Map of taskId -> DOM element to scroll into view when selected
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // When selectedTaskId changes, scroll that task into view
  useEffect(() => {
    if (!selectedTaskId) return;
    const el = itemRefs.current.get(selectedTaskId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTaskId]);

  const handleObjectiveItemDelta = useCallback(
    (
      objectiveItemKey: string,
      delta: number,
      maxCount: number,
      legacyObjectiveItemKey?: string,
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
    },
    [onUpdateTaskObjectiveItemProgress, taskObjectiveItemProgress],
  );

  // (moved global search listener below after allGroupNames is defined)

  const baseTasks = useMemo(
    () => tasks.filter((task) => !task.isEvent),
    [tasks],
  );
  const eventTasks = useMemo(
    () => tasks.filter((task) => task.isEvent),
    [tasks],
  );
  const hasEventTasks = eventTasks.length > 0;

  const buildNextQuestIds = useCallback(
    (taskList: Task[]) => {
      const completed = completedTasks;
      const level = Number.isFinite(playerLevel) ? playerLevel : 1;
      return new Set(
        taskList
          .filter((task) => {
            if (completed.has(task.id)) return false;
            if (task.minPlayerLevel > level) return false;
            if (task.taskRequirements?.length > 0) {
              return task.taskRequirements.every((req) =>
                completed.has(req.task.id),
              );
            }
            return true;
          })
          .map((task) => task.id),
      );
    },
    [completedTasks, playerLevel],
  );

  // Apply filters
  const nextQuestIds = useMemo(
    () => buildNextQuestIds(baseTasks),
    [baseTasks, buildNextQuestIds],
  );
  const nextEventQuestIds = useMemo(
    () => buildNextQuestIds(eventTasks),
    [eventTasks, buildNextQuestIds],
  );

  const filterTasks = useCallback(
    (taskList: Task[], nextIds: Set<string>) =>
      taskList.filter((task) => {
        // Kappa/Lightkeeper filters
        if (showKappa && showLightkeeper) {
          if (!(task.kappaRequired || task.lightkeeperRequired)) return false;
        } else if (showKappa && !task.kappaRequired) {
          return false;
        } else if (showLightkeeper && !task.lightkeeperRequired) {
          return false;
        }
        // Map filter (from sidebar)
        if (mapFilter) {
          // Check if task has multiple maps
          if (task.maps && task.maps.length > 0) {
            if (!task.maps.some((m) => m.name === mapFilter)) return false;
          } else if (task.map?.name !== mapFilter) {
            return false;
          }
        }
        // Trader filter
        if (hiddenTraders.has(task.trader.name)) return false;
        // Player level filter
        if (enableLevelFilter) {
          const lvl = Number.isFinite(playerLevel) ? playerLevel : 1;
          if (task.minPlayerLevel > lvl) return false;
        }
        // Completed filter
        if (!showCompleted && completedTasks.has(task.id)) return false;
        // Next quests filter (only immediate successors)
        if (showNextOnly && !nextIds.has(task.id)) return false;
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const nameMatch = task.name.toLowerCase().includes(term);
          const traderMatch = task.trader.name.toLowerCase().includes(term);
          const singleMapMatch = task.map?.name.toLowerCase().includes(term);
          const multiMapMatch = task.maps?.some((m) =>
            m.name.toLowerCase().includes(term),
          );

          if (!nameMatch && !traderMatch && !singleMapMatch && !multiMapMatch) {
            return false;
          }
        }
        return true;
      }),
    [
      showKappa,
      showLightkeeper,
      hiddenTraders,
      searchTerm,
      mapFilter,
      enableLevelFilter,
      playerLevel,
      showCompleted,
      completedTasks,
      showNextOnly,
    ],
  );

  const filteredTasks = useMemo(
    () => filterTasks(baseTasks, nextQuestIds),
    [baseTasks, filterTasks, nextQuestIds],
  );
  const filteredEventTasks = useMemo(
    () =>
      showEvents ? filterTasks(eventTasks, nextEventQuestIds) : ([] as Task[]),
    [showEvents, filterTasks, eventTasks, nextEventQuestIds],
  );

  // Group tasks
  const tasksByGroup = useMemo(() => {
    if (groupBy === "trader") {
      return groupTasksByTrader(filteredTasks);
    }
    // groupBy map - tasks with multiple maps appear under each map
    return filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
      // Check if task has multiple maps
      if (task.maps && task.maps.length > 0) {
        // Add task to each map it belongs to
        task.maps.forEach((map) => {
          const mapName = map.name || "No specific map";
          (acc[mapName] ||= []).push(task);
        });
      } else {
        // Fallback to single map or 'No specific map'
        const mapName = task.map?.name || "No specific map";
        (acc[mapName] ||= []).push(task);
      }
      return acc;
    }, {});
  }, [filteredTasks, groupBy]);

  type GroupEntry = [string, Task[]];
  const sortedGroups = useMemo<GroupEntry[]>(
    () =>
      Object.entries(tasksByGroup)
        .map(([name, groupTasks]) => [name, groupTasks] as GroupEntry)
        .sort(([a], [b]) => a.localeCompare(b)),
    [tasksByGroup],
  );
  const groupsWithEvents = useMemo<GroupEntry[]>(() => {
    if (!hasEventTasks || filteredEventTasks.length === 0) return sortedGroups;
    return [["Seasonal Events", filteredEventTasks], ...sortedGroups];
  }, [sortedGroups, hasEventTasks, filteredEventTasks]);

  const logicalTaskGroupsByTaskId = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach((task) => {
      const key = buildLogicalTaskKey(task);
      const existing = grouped.get(key);
      if (existing) {
        existing.push(task);
      } else {
        grouped.set(key, [task]);
      }
    });

    const byTaskId = new Map<string, Task[]>();
    grouped.forEach((groupTasks) => {
      groupTasks.forEach((task) => {
        byTaskId.set(task.id, groupTasks);
      });
    });

    return byTaskId;
  }, [tasks]);

  const allGroupNames = useMemo(
    () => groupsWithEvents.map(([name]) => name),
    [groupsWithEvents],
  );
  // Only use the explicitly expanded groups
  const finalExpandedGroups = expandedGroups;
  const areAllExpanded = finalExpandedGroups.length === allGroupNames.length;

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };

  const compareTasks = useCallback(
    (a: Task, b: Task) => {
      const compareByName = (left: Task, right: Task) =>
        left.name.localeCompare(right.name, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id);
      const compareByLevelAsc = (left: Task, right: Task) =>
        left.minPlayerLevel - right.minPlayerLevel || compareByName(left, right);
      const compareByLevelDesc = (left: Task, right: Task) =>
        right.minPlayerLevel - left.minPlayerLevel || compareByName(left, right);
      const compareByCompletion = (left: Task, right: Task) => {
        const leftDone = completedTasks.has(left.id);
        const rightDone = completedTasks.has(right.id);
        if (leftDone === rightDone) return compareByName(left, right);
        return leftDone ? 1 : -1;
      };
      const compareByWorkingOn = (left: Task, right: Task) => {
        const leftWorkingOn = workingOnTasks.has(left.id);
        const rightWorkingOn = workingOnTasks.has(right.id);
        if (leftWorkingOn === rightWorkingOn) return compareByName(left, right);
        return leftWorkingOn ? -1 : 1;
      };
      const compareByHasPrereqs = (left: Task, right: Task) => {
        const leftHas = (left.taskRequirements?.length ?? 0) > 0;
        const rightHas = (right.taskRequirements?.length ?? 0) > 0;
        if (leftHas === rightHas) return compareByName(left, right);
        return leftHas ? -1 : 1;
      };
      const compareByKappaRequired = (left: Task, right: Task) => {
        const leftKappa = !!left.kappaRequired;
        const rightKappa = !!right.kappaRequired;
        if (leftKappa === rightKappa) return compareByName(left, right);
        return leftKappa ? -1 : 1;
      };

      switch (sortMode) {
        case "name-asc":
          return compareByName(a, b);
        case "level-asc":
          return compareByLevelAsc(a, b);
        case "level-desc":
          return compareByLevelDesc(a, b);
        case "complete-first":
          return -compareByCompletion(a, b);
        case "incomplete-first":
          return compareByCompletion(a, b);
        case "working-on-first":
          return compareByWorkingOn(a, b);
        case "has-prereqs-first":
          return compareByHasPrereqs(a, b);
        case "kappa-first":
          return compareByKappaRequired(a, b);
        default:
          return compareByName(a, b);
      }
    },
    [completedTasks, sortMode, workingOnTasks],
  );

  const getPreferredTask = useCallback(
    (groupTasks: Task[], preferredTaskId?: string | null) => {
      if (preferredTaskId) {
        const preferredTask = groupTasks.find((task) => task.id === preferredTaskId);
        if (preferredTask) return preferredTask;
      }

      const sorted = [...groupTasks].sort((a, b) => {
        const aCompleted = completedTasks.has(a.id);
        const bCompleted = completedTasks.has(b.id);
        if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;

        const aWorking = workingOnTasks.has(a.id);
        const bWorking = workingOnTasks.has(b.id);
        if (aWorking !== bWorking) return aWorking ? -1 : 1;

        const aUnlocked =
          a.taskRequirements.length === 0 ||
          a.taskRequirements.every((req) => completedTasks.has(req.task.id));
        const bUnlocked =
          b.taskRequirements.length === 0 ||
          b.taskRequirements.every((req) => completedTasks.has(req.task.id));
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

        const aCompletedPrereqs = a.taskRequirements.filter((req) =>
          completedTasks.has(req.task.id),
        ).length;
        const bCompletedPrereqs = b.taskRequirements.filter((req) =>
          completedTasks.has(req.task.id),
        ).length;
        if (aCompletedPrereqs !== bCompletedPrereqs) {
          return bCompletedPrereqs - aCompletedPrereqs;
        }

        return compareTasks(a, b);
      });

      return sorted[0];
    },
    [compareTasks, completedTasks, workingOnTasks],
  );

  const resolveDisplayTaskId = useCallback(
    (taskId: string) => {
      const groupTasks = logicalTaskGroupsByTaskId.get(taskId);
      if (!groupTasks) return taskId;
      return getPreferredTask(groupTasks, taskId).id;
    },
    [getPreferredTask, logicalTaskGroupsByTaskId],
  );

  const isLogicalTaskCompleted = useCallback(
    (taskId: string) => {
      const groupTasks = logicalTaskGroupsByTaskId.get(taskId);
      if (!groupTasks) return completedTasks.has(taskId);
      return groupTasks.some((task) => completedTasks.has(task.id));
    },
    [completedTasks, logicalTaskGroupsByTaskId],
  );

  const collapseTaskVariants = useCallback(
    (taskList: Task[], preferredTaskId?: string | null) => {
      const grouped = new Map<string, Task[]>();

      taskList.forEach((task) => {
        const key = buildLogicalTaskKey(task);
        const existing = grouped.get(key);
        if (existing) {
          existing.push(task);
        } else {
          grouped.set(key, [task]);
        }
      });

      return Array.from(grouped.entries()).map(([key, variantTasks]) => ({
        key,
        tasks: variantTasks,
        activeTask: getPreferredTask(variantTasks, preferredTaskId),
      }));
    },
    [getPreferredTask],
  );

  const getDisplayTaskGroups = useCallback(
    (groupTasks: Task[]) =>
      collapseTaskVariants(groupTasks, selectedTaskId).sort((a, b) =>
        compareTasks(a.activeTask, b.activeTask),
      ),
    [collapseTaskVariants, compareTasks, selectedTaskId],
  );

  // Clicking a breadcrumb: expand proper group, select task (which opens its details)
  const handleBreadcrumbClick = useCallback(
    (taskId: string) => {
      const displayTaskId = resolveDisplayTaskId(taskId);
      const task =
        tasks.find((t) => t.id === displayTaskId) ??
        tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (task.isEvent) {
        setExpandedGroups((prev) =>
          prev.includes("Seasonal Events")
            ? prev
            : [...prev, "Seasonal Events"],
        );
        setSelectedTaskId(displayTaskId);
        setSearchTermImmediately(task.name);
        return;
      }

      if (groupBy === "trader") {
        const groupName = task.trader.name;
        setExpandedGroups((prev) =>
          prev.includes(groupName) ? prev : [...prev, groupName],
        );
      } else {
        // For map grouping, expand all maps the task belongs to
        if (task.maps && task.maps.length > 0) {
          const mapNames = task.maps.map((m) => m.name);
          setExpandedGroups((prev) => {
            const newGroups = [...prev];
            mapNames.forEach((name) => {
              if (!newGroups.includes(name)) newGroups.push(name);
            });
            return newGroups;
          });
        } else {
          const groupName = task.map?.name || "Anywhere";
          setExpandedGroups((prev) =>
            prev.includes(groupName) ? prev : [...prev, groupName],
          );
        }
      }

      setSelectedTaskId(displayTaskId);
      // Also reflect the clicked task in the search bar to filter the view
      setSearchTermImmediately(task.name);
    },
    [tasks, groupBy, resolveDisplayTaskId, setSearchTermImmediately],
  );

  // Listen for global command search and apply to local search box (tasks scope)
  useEffect(() => {
    type GlobalSearchDetail = {
      term?: string;
      scope?: "tasks" | "achievements" | "items";
      taskId?: string;
    };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (
        !detail ||
        detail.scope !== "tasks" ||
        typeof detail.term !== "string"
      )
        return;
      setSearchTermImmediately(detail.term);
      setExpandedGroups(allGroupNames);
      if (detail.taskId) {
        const task = tasks.find((candidate) => candidate.id === detail.taskId);
        if (!task) return;

        const displayTaskId = resolveDisplayTaskId(detail.taskId);
        const displayTask =
          tasks.find((candidate) => candidate.id === displayTaskId) ?? task;

        if (task.isEvent) {
          setExpandedGroups((prev) =>
            prev.includes("Seasonal Events")
              ? prev
              : [...prev, "Seasonal Events"],
          );
          setSelectedTaskId(displayTaskId);
          return;
        }

        if (groupBy === "trader") {
          const groupName = displayTask.trader.name;
          setExpandedGroups((prev) =>
            prev.includes(groupName) ? prev : [...prev, groupName],
          );
        } else if (displayTask.maps && displayTask.maps.length > 0) {
          const mapNames = displayTask.maps.map((map) => map.name);
          setExpandedGroups((prev) => {
            const newGroups = [...prev];
            mapNames.forEach((name) => {
              if (!newGroups.includes(name)) newGroups.push(name);
            });
            return newGroups;
          });
        } else {
          const groupName = displayTask.map?.name || "Anywhere";
          setExpandedGroups((prev) =>
            prev.includes(groupName) ? prev : [...prev, groupName],
          );
        }

        setSelectedTaskId(displayTaskId);
      }
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
  }, [
    allGroupNames,
    groupBy,
    resolveDisplayTaskId,
    setSearchTermImmediately,
    tasks,
  ]);

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Grouping selection moved to sidebar under Quests > Checklist */}

      {/* Search and Controls */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b bg-background px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex w-full items-center gap-3 lg:max-w-3xl">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAll}
              aria-label={areAllExpanded ? "Collapse all" : "Expand all"}
              className="shrink-0"
            >
              {areAllExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <Select
              value={sortMode}
              onValueChange={(v) => setSortMode(v as typeof sortMode)}
            >
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="level-asc">Min level (low-high)</SelectItem>
                <SelectItem value="level-desc">Min level (high-low)</SelectItem>
                <SelectItem value="incomplete-first">
                  Incomplete first
                </SelectItem>
                <SelectItem value="complete-first">Completed first</SelectItem>
                <SelectItem value="working-on-first">
                  Working on first
                </SelectItem>
                <SelectItem value="has-prereqs-first">
                  Has prerequisites first
                </SelectItem>
                <SelectItem value="kappa-first">
                  Kappa required first
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            {/* Group By controls moved here from sidebar */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Group by</Label>
              <ToggleGroup
                type="single"
                value={groupBy}
                onValueChange={(value) => {
                  if (value === "trader" || value === "map")
                    onSetGroupBy(value);
                }}
                className="rounded-lg border bg-card/70 shadow-sm px-1 py-0.5 text-muted-foreground"
              >
                <ToggleGroupItem
                  value="trader"
                  aria-label="Group by Trader"
                  className="gap-2 rounded-md px-2 py-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:shadow-sm"
                >
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium leading-none">
                    Trader
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="map"
                  aria-label="Group by Map"
                  className="gap-2 rounded-md px-2 py-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:shadow-sm"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium leading-none">
                    Map
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showCompleted}
                  onCheckedChange={(checked) => setShowCompleted(!!checked)}
                >
                  Show Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showNextOnly}
                  onCheckedChange={(checked) => setShowNextOnly(!!checked)}
                >
                  Next Only
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={enableLevelFilter}
                  onCheckedChange={(checked) => setEnableLevelFilter(!!checked)}
                >
                  Level Filter
                </DropdownMenuCheckboxItem>
                {hasEventTasks && (
                  <DropdownMenuCheckboxItem
                    checked={showEvents}
                    onCheckedChange={(checked) => setShowEvents(!!checked)}
                  >
                    Show Seasonal Events
                  </DropdownMenuCheckboxItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={handleToggleAll}>
                  {areAllExpanded ? "Collapse All" : "Expand All"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {hasEventTasks && showEvents && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-slate-800/40 px-4 py-2 text-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
              <Snowflake className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold">
              Seasonal Events Available
            </div>
          </div>
        </div>
      )}

      {/* Selected Task Breadcrumb - shows all predecessors and successors */}
      {selectedTaskId && (
        <div className="sticky top-16 z-10 mb-3 border rounded-md bg-card p-3">
          {(() => {
            const taskMap = new Map(tasks.map((t) => [t.id, t]));
            const selectedTaskVariants =
              logicalTaskGroupsByTaskId.get(selectedTaskId) ??
              (taskMap.get(selectedTaskId) ? [taskMap.get(selectedTaskId)!] : []);
            const currentTask =
              getPreferredTask(selectedTaskVariants, selectedTaskId) ??
              taskMap.get(selectedTaskId);
            if (!currentTask) return null;

            const selectedTaskIds = new Set(
              selectedTaskVariants.map((task) => task.id),
            );

            // Get direct predecessors (tasks any variant requires)
            const predecessorCandidates = selectedTaskVariants.flatMap((task) =>
              task.taskRequirements
                .map((req) => {
                  const displayTaskId = resolveDisplayTaskId(req.task.id);
                  return taskMap.get(displayTaskId) ?? taskMap.get(req.task.id);
                })
                .filter((task): task is Task => !!task),
            );
            const predecessors = collapseTaskVariants(predecessorCandidates)
              .map((group) => group.activeTask)
              .sort((a, b) => a.name.localeCompare(b.name));

            // Get direct successors (tasks that require any current variant)
            const successorCandidates = tasks
              .filter((t) =>
                t.taskRequirements?.some(
                  (req) => selectedTaskIds.has(req.task.id),
                ),
              );
            const successors = collapseTaskVariants(successorCandidates)
              .map((group) => group.activeTask)
              .sort((a, b) => a.name.localeCompare(b.name));
            const showsAlternativePreviousPaths =
              selectedTaskVariants.length > 1 && predecessors.length > 1;
            const predecessorNodeHeight = 34;
            const predecessorGap = 8;
            const predecessorColumnWidth = 256;
            const previousConnectorWidth = 88;
            const currentColumnWidth = 104;
            const leadsArrowColumnWidth = 16;
            const connectorHeight =
              predecessors.length * predecessorNodeHeight +
              Math.max(0, predecessors.length - 1) * predecessorGap;
            const connectorCenterY = predecessorNodeHeight / 2;

            if (showsAlternativePreviousPaths) {
              return (
                <div className="overflow-x-auto">
                  <div
                    className="grid w-max gap-x-2 gap-y-3"
                    style={{
                      gridTemplateColumns: `${predecessorColumnWidth}px ${previousConnectorWidth}px ${currentColumnWidth}px ${leadsArrowColumnWidth}px max-content`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400/85">
                        Previous Paths
                      </span>
                    </div>
                    <div />
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400/85">
                      Current
                    </span>
                    <div />
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400/85">
                      Leads to
                    </span>

                    <div className="flex flex-col gap-2">
                      {predecessors.map((t) => (
                        <span
                          key={t.id}
                          className={cn(
                            "inline-flex h-[36px] w-[16rem] items-center rounded-md px-3 text-xs cursor-pointer transition-colors",
                            "bg-gray-800 hover:bg-gray-600",
                            isLogicalTaskCompleted(t.id) &&
                              "line-through opacity-60",
                          )}
                          onClick={() => handleBreadcrumbClick(t.id)}
                        >
                          <span className="truncate">{t.name}</span>
                        </span>
                      ))}
                    </div>

                    <div
                      className="relative"
                      style={{ height: `${connectorHeight}px` }}
                    >
                      <svg
                        className="absolute inset-0 h-full w-full overflow-visible"
                        viewBox={`0 0 ${previousConnectorWidth} ${connectorHeight}`}
                        fill="none"
                        aria-hidden="true"
                      >
                        {predecessors.map((task, index) => {
                          const startY =
                            predecessorNodeHeight / 2 +
                            index * (predecessorNodeHeight + predecessorGap);
                          return (
                            <path
                              key={task.id}
                              d={`M0 ${startY} C 26 ${startY} 28 ${connectorCenterY} ${previousConnectorWidth - 16} ${connectorCenterY}`}
                              stroke="rgba(226, 232, 240, 0.88)"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          );
                        })}
                        <path
                          d={`M${previousConnectorWidth - 18} ${connectorCenterY - 6} L${previousConnectorWidth - 4} ${connectorCenterY} L${previousConnectorWidth - 18} ${connectorCenterY + 6}`}
                          fill="rgba(226, 232, 240, 0.88)"
                        />
                      </svg>
                    </div>

                    <div
                      className="flex items-start pt-1.5"
                      style={{ minHeight: `${connectorHeight}px` }}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs cursor-pointer transition-colors text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                          isLogicalTaskCompleted(selectedTaskId) &&
                            "line-through opacity-60",
                        )}
                        onClick={() => handleBreadcrumbClick(selectedTaskId)}
                      >
                        <span className="truncate">{currentTask.name}</span>
                      </span>
                    </div>

                    <div
                      className="flex items-start justify-center pt-[7px]"
                      style={{ minHeight: `${connectorHeight}px` }}
                    >
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div
                      className="flex items-start pt-1.5"
                      style={{ minHeight: `${connectorHeight}px` }}
                    >
                      <div className="flex max-w-[22rem] flex-wrap gap-1">
                        {successors.map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded-md cursor-pointer transition-colors",
                              "bg-gray-700 hover:bg-gray-600",
                              isLogicalTaskCompleted(t.id) &&
                                "line-through opacity-60",
                            )}
                            onClick={() => handleBreadcrumbClick(t.id)}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Previous tasks */}
                {predecessors.length > 0 && (
                  <>
                    <div
                      className={cn(
                        "flex flex-col gap-1",
                        showsAlternativePreviousPaths &&
                          "rounded-md border border-dashed border-amber-500/30 bg-amber-500/5 px-2 py-2",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {showsAlternativePreviousPaths
                            ? "Previous Paths"
                            : "Previous"}
                        </span>
                        {showsAlternativePreviousPaths && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            Any one
                          </span>
                        )}
                      </div>
                      {showsAlternativePreviousPaths && (
                        <span className="text-[10px] text-muted-foreground">
                          Different branches can unlock this task.
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-1">
                        {predecessors.map((t, index) => (
                          <Fragment key={t.id}>
                            {showsAlternativePreviousPaths && index > 0 && (
                              <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400/80">
                                or
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                                showsAlternativePreviousPaths
                                  ? "bg-slate-800 hover:bg-slate-700"
                                  : "bg-gray-800 hover:bg-gray-600",
                                isLogicalTaskCompleted(t.id) &&
                                  "line-through opacity-60",
                              )}
                              onClick={() => handleBreadcrumbClick(t.id)}
                            >
                              {t.name}
                            </span>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground self-end mb-1" />
                  </>
                )}

                {/* Current task */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Current
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                      "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                      isLogicalTaskCompleted(selectedTaskId) &&
                        "line-through opacity-60",
                    )}
                    onClick={() => handleBreadcrumbClick(selectedTaskId)}
                  >
                    {currentTask.name}
                  </span>
                </div>

                {/* Next tasks (leads to) */}
                {successors.length > 0 && (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground self-end mb-1" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Leads to
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {successors.map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                              "bg-gray-700 hover:bg-gray-600",
                              isLogicalTaskCompleted(t.id) &&
                                "line-through opacity-60",
                            )}
                            onClick={() => handleBreadcrumbClick(t.id)}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Groups */}
      <Accordion
        type="multiple"
        className="w-full space-y-2"
        value={finalExpandedGroups}
        onValueChange={setExpandedGroups}
      >
        {groupsWithEvents.map(([groupName, groupTasks]) => {
          const displayTaskGroups = getDisplayTaskGroups(groupTasks);
          const completedCount = displayTaskGroups.filter((group) =>
            group.tasks.some((task) => completedTasks.has(task.id)),
          ).length;
          const totalCount = displayTaskGroups.length;
          const progress =
            totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          const isEventGroup = groupName === "Seasonal Events";

          return (
            <AccordionItem
              key={groupName}
              value={groupName}
              className={cn(
                "border rounded-lg bg-card",
                isEventGroup && "border-amber-500/40 bg-amber-500/5",
              )}
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    {isEventGroup ? (
                      <span className="inline-flex items-center gap-2 text-amber-500">
                        <Snowflake className="h-4 w-4" />
                        {groupName}
                      </span>
                    ) : (
                      <>
                        {groupBy === "trader" &&
                          groupTasks[0]?.trader?.imageLink && (
                            <img
                              src={groupTasks[0].trader.imageLink}
                              alt={groupName}
                              loading="lazy"
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          )}
                        {groupName}
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {completedCount} / {totalCount}
                    </span>
                    <Progress value={progress} className="w-24 h-2" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 border-t">
                  <div className="pr-2 space-y-1">
                    {displayTaskGroups.map((group) => {
                      const task = group.activeTask;
                      const isCompleted = group.tasks.some((variant) =>
                        completedTasks.has(variant.id),
                      );
                      const isDetailsOpen = group.tasks.some(
                        (variant) => variant.id === selectedTaskId,
                      );
                      const objectiveProgress = objectiveProgressByTaskId.get(
                        task.id,
                      );
                      const objectiveKeys = isDetailsOpen
                        ? buildTaskObjectiveKeys(task)
                        : [];
                      const rewardItems = isDetailsOpen
                        ? [
                            ...(task.startRewards?.items ?? []),
                            ...(task.finishRewards?.items ?? []),
                          ]
                        : [];
                      const traderStandingRewards = isDetailsOpen
                        ? (task.finishRewards?.traderStanding ?? []).filter(
                            (rep) =>
                              typeof rep.standing === "number" &&
                              !!rep.trader?.name,
                          )
                        : [];
                      const skillLevelRewards = isDetailsOpen
                        ? (task.finishRewards?.skillLevelReward ?? []).filter(
                            (skill) =>
                              typeof skill.level === "number" &&
                              !!(skill.name || skill.skill?.name),
                          )
                        : [];
                      const traderUnlockRewards = isDetailsOpen
                        ? (task.finishRewards?.traderUnlock ?? []).filter(
                            (entry) => !!entry.name,
                          )
                        : [];
                      const customizationRewards = isDetailsOpen
                        ? (task.finishRewards?.customization ?? []).filter(
                            (entry) => !!entry.name,
                          )
                        : [];
                      const achievementRewards = isDetailsOpen
                        ? (task.finishRewards?.achievement ?? []).filter(
                            (entry) => !!entry.name,
                          )
                        : [];
                      const achievementRewardBadges = achievementRewards.map(
                        (entry) => {
                          const match =
                            (entry.id ? achievementById.get(entry.id) : undefined) ??
                            achievementByName.get(entry.name.toLowerCase());
                          return {
                            ...entry,
                            imageLink: entry.imageLink ?? match?.imageLink,
                          };
                        },
                      );
                      const hasExperienceReward =
                        isDetailsOpen &&
                        typeof task.experience === "number" &&
                        task.experience > 0;
                      const hasAnyRewards =
                        isDetailsOpen &&
                        (rewardItems.length > 0 ||
                        hasExperienceReward ||
                        traderStandingRewards.length > 0 ||
                        skillLevelRewards.length > 0 ||
                        traderUnlockRewards.length > 0 ||
                        customizationRewards.length > 0 ||
                        achievementRewardBadges.length > 0);
                      return (
                        <div
                          key={group.key}
                          ref={(el) => {
                            group.tasks.forEach((variant) => {
                              itemRefs.current.set(variant.id, el);
                            });
                          }}
                        >
                        <Collapsible
                          open={isDetailsOpen}
                          onOpenChange={(open) => {
                            if (open) setSelectedTaskId(task.id);
                            else if (isDetailsOpen)
                              setSelectedTaskId(null);
                          }}
                        >
                          {/* Main single-row */}
                          <div
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded-md transition-colors group",
                              "hover:bg-muted",
                            )}
                          >
                            <Checkbox
                              id={task.id}
                              checked={isCompleted}
                              onCheckedChange={() => onToggleComplete(task.id)}
                              disabled={false}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {onToggleWorkingOnTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleWorkingOnTask(task.id);
                                }}
                                className={cn(
                                  "p-1 rounded-sm transition-colors",
                                  group.tasks.some((variant) =>
                                    workingOnTasks.has(variant.id),
                                  )
                                    ? "text-blue-500 hover:text-blue-600"
                                    : "text-muted-foreground/40 hover:text-muted-foreground",
                                )}
                                title={
                                  group.tasks.some((variant) =>
                                    workingOnTasks.has(variant.id),
                                  )
                                    ? "Remove from working on"
                                    : "Mark as working on"
                                }
                                aria-label={
                                  group.tasks.some((variant) =>
                                    workingOnTasks.has(variant.id),
                                  )
                                    ? "Remove from working on"
                                    : "Mark as working on"
                                }
                              >
                                  <Target
                                    className="h-4 w-4"
                                    fill={
                                    group.tasks.some((variant) =>
                                      workingOnTasks.has(variant.id),
                                    )
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                            )}
                            {task.wikiLink && (
                              <a
                                href={task.wikiLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Open wiki"
                              >
                                <Link2 className="h-4 w-4" />
                              </a>
                            )}

                            {/* Trigger wraps most of the row (except checkbox & wiki link) */}
                            <CollapsibleTrigger asChild>
                              <div
                                className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer select-none"
                                role="button"
                                aria-label="Toggle details"
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                                <span
                                  className={cn(
                                    "flex-1 min-w-0 text-[15px] leading-tight flex items-center gap-2",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "truncate",
                                      isCompleted && "line-through",
                                    )}
                                  >
                                    {task.name}
                                  </span>
                                  {task.isEvent && (
                                    <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                                      Event
                                    </span>
                                  )}
                                </span>

                                {/* Right-side compact info */}
                                <div className="ml-auto flex items-center gap-2">
                                  {objectiveProgress && (
                                    <span
                                      title={`Objectives: ${objectiveProgress.completed}/${objectiveProgress.total}`}
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                                        objectiveProgress.completed >=
                                          objectiveProgress.total
                                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                                          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
                                      )}
                                    >
                                      <ListTodo className="h-3 w-3" />
                                      {objectiveProgress.completed}/
                                      {objectiveProgress.total}
                                    </span>
                                  )}
                                  {task.trader?.imageLink && (
                                    <img
                                      src={task.trader.imageLink}
                                      alt={task.trader.name}
                                      loading="lazy"
                                      className="h-5 w-5 rounded-full object-cover"
                                    />
                                  )}
                                  {task.factionName === "USEC" && (
                                    <span
                                      title="USEC only"
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-500 font-medium"
                                    >
                                      USEC
                                    </span>
                                  )}
                                  {task.factionName === "BEAR" && (
                                    <span
                                      title="BEAR only"
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/10 text-red-500 font-medium"
                                    >
                                      BEAR
                                    </span>
                                  )}
                                  {task.kappaRequired && (
                                    <span
                                      title="Kappa"
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500"
                                    >
                                      K
                                    </span>
                                  )}
                                  {task.lightkeeperRequired && (
                                    <span
                                      title="Lightkeeper"
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500"
                                    >
                                      LK
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                          </div>

                          {/* Compact dropdown details */}
                          <CollapsibleContent>
                            {isDetailsOpen && (
                              <div className="mx-7 mb-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground space-y-2">
                              {task.map && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground/80">
                                    Map:
                                  </span>
                                  <span>{task.map.name}</span>
                                </div>
                              )}

                              {task.objectives &&
                                task.objectives.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1 text-foreground/80">
                                      <span className="text-[11px] text-yellow-600">
                                        Objectives
                                      </span>
                                    </div>
                                    <ul className="space-y-1">
                                      {task.objectives.map(
                                        (objective, index) => {
                                          const objectiveKey =
                                            objectiveKeys[index] ??
                                            buildLegacyTaskObjectiveKey(
                                              task.id,
                                              index,
                                            );
                                          const legacyObjectiveKey =
                                            buildLegacyTaskObjectiveKey(
                                              task.id,
                                              index,
                                            );
                                          const isObjectiveChecked =
                                            isTaskObjectiveCompleted(
                                              completedTaskObjectives,
                                              objectiveKey,
                                              legacyObjectiveKey,
                                            );
                                          const inlineItem =
                                            objective.items?.length === 1
                                              ? objective.items[0]
                                              : undefined;
                                          const inlineIconLink =
                                            inlineItem?.iconLink ||
                                            (inlineItem?.id
                                              ? `https://assets.tarkov.dev/${inlineItem.id}-icon.webp`
                                              : "");
                                          const showInlineIcon =
                                            inlineIconLink &&
                                            inlineItem &&
                                            objective.description?.includes(
                                              inlineItem.name,
                                            );
                                          const requiredCount = Math.max(
                                            1,
                                            objective.count ?? 1,
                                          );
                                          const usesSharedPool =
                                            (objective.items?.length ?? 0) > 1 &&
                                            requiredCount > 1;
                                          const objectiveItemProgress =
                                            (objective.items ?? []).map((item) => {
                                              const itemKey =
                                                buildTaskObjectiveItemProgressKey(
                                                  objectiveKey,
                                                  item.id || item.name,
                                                );
                                              const legacyItemKey =
                                                buildLegacyTaskObjectiveItemProgressKey(
                                                  task.id,
                                                  index,
                                                  item.id || item.name,
                                                );
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
                                                      sum + progress.currentCount,
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
                                            <li key={index}>
                                              <div
                                                className={cn(
                                                  "flex items-start gap-2 rounded-md p-1",
                                                  isObjectiveChecked &&
                                                    "opacity-60",
                                                )}
                                              >
                                                <Checkbox
                                                  checked={isObjectiveChecked}
                                                  onCheckedChange={() =>
                                                    onToggleTaskObjective(
                                                      task.id,
                                                      objectiveKey,
                                                      legacyObjectiveKey,
                                                    )
                                                  }
                                                  className="mt-0.5 h-4 w-4"
                                                />
                                                <span className="inline-flex items-center gap-2">
                                                  {showInlineIcon && (
                                                    <TooltipProvider
                                                      delayDuration={150}
                                                    >
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <img
                                                            src={inlineIconLink}
                                                            alt={inlineItem?.name}
                                                            className="h-4 w-4 object-contain"
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
                                                                inlineIconLink
                                                              }
                                                              alt={
                                                                inlineItem?.name
                                                              }
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
                                                  <span
                                                    className={cn(
                                                      isObjectiveChecked &&
                                                        "line-through",
                                                    )}
                                                  >
                                                    {"playerLevel" in objective
                                                      ? `Reach level ${objective.playerLevel}`
                                                      : objective.description}
                                                  </span>
                                                  {objective.foundInRaid && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-medium ml-2">
                                                      FIR
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                              {objective.items &&
                                                objective.items.length > 0 && (
                                                  <div className="mt-2 ml-6 space-y-2">
                                                    {usesSharedPool && (
                                                      <div className="text-[11px] text-muted-foreground">
                                                        Progress:{" "}
                                                        <span className="font-medium text-foreground/90">
                                                          {objectiveTotalCollected}
                                                          /{requiredCount}
                                                        </span>{" "}
                                                        ({objectiveRemaining} remaining)
                                                      </div>
                                                    )}
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                    {objective.items.map(
                                                      (item, itemIndex) => {
                                                        const iconLink =
                                                          item.iconLink ||
                                                          (item.id
                                                            ? `https://assets.tarkov.dev/${item.id}-icon.webp`
                                                            : "");
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
                                                            index,
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
                                                            {iconLink ? (
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
                                                                        iconLink
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
                                                                          iconLink
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
                                                                {item.name}
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
                                                                {currentCount}/
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
                                            </li>
                                          );
                                        },
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {hasAnyRewards && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-[1px] flex-1 bg-border/50" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-sky-500/80">
                                      Rewards
                                    </span>
                                    <div className="h-[1px] flex-1 bg-border/50" />
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {traderStandingRewards.map((rep, index) => {
                                      const standing = rep.standing ?? 0;
                                      const sign = standing > 0 ? "+" : "";
                                      return (
                                        <span
                                          key={`rep-${rep.trader?.name}-${index}`}
                                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
                                        >
                                          {`${sign}${standing.toFixed(2)} ${rep.trader?.name}`}
                                        </span>
                                      );
                                    })}
                                    {skillLevelRewards.map((skill, index) => (
                                      <span
                                        key={`skill-${skill.name ?? skill.skill?.name}-${index}`}
                                        className="inline-flex items-center gap-1 rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300"
                                      >
                                        +{skill.level}{" "}
                                        {skill.name || skill.skill?.name}
                                      </span>
                                    ))}
                                    {hasExperienceReward && (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                        {task.experience?.toLocaleString()} XP
                                      </span>
                                    )}
                                    {traderUnlockRewards.map((entry, index) => (
                                      <span
                                        key={`trader-unlock-${entry.id ?? entry.name}-${index}`}
                                        className="inline-flex items-center gap-1 rounded-md border border-orange-500/25 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300"
                                      >
                                        {entry.imageLink && (
                                          <img
                                            src={entry.imageLink}
                                            alt={entry.name}
                                            className="h-3.5 w-3.5 rounded-full object-cover"
                                            loading="lazy"
                                          />
                                        )}
                                        Unlock {entry.name}
                                      </span>
                                    ))}
                                    {achievementRewardBadges.map(
                                      (achievement, index) => (
                                        <span
                                          key={`achievement-${achievement.id ?? achievement.name}-${index}`}
                                          className="inline-flex items-center gap-1 rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300"
                                        >
                                          {achievement.imageLink && (
                                            <img
                                              src={achievement.imageLink}
                                              alt={achievement.name}
                                              className="h-3.5 w-3.5 rounded-sm object-contain"
                                              loading="lazy"
                                            />
                                          )}
                                          {achievement.name}
                                        </span>
                                      ),
                                    )}
                                    {customizationRewards.map((entry, index) => (
                                      <span
                                        key={`customization-${entry.id ?? entry.name}-${index}`}
                                        className="inline-flex items-center gap-1 rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300"
                                      >
                                        {entry.name}
                                      </span>
                                    ))}
                                  </div>
                                  {rewardItems.length > 0 && (
                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                      {rewardItems.map((reward, index) => (
                                        <div
                                          key={`reward-item-${index}`}
                                          className="flex items-center gap-2 rounded-md border border-sky-500/15 bg-sky-500/5 px-2 py-1"
                                        >
                                          <div className="h-5 w-5 shrink-0 rounded-sm bg-black/20 p-0.5 flex items-center justify-center">
                                            {reward.item.iconLink ? (
                                              <img
                                                src={reward.item.iconLink}
                                                alt={reward.item.name}
                                                className="h-full w-full object-contain"
                                                loading="lazy"
                                              />
                                            ) : (
                                              <div className="h-1.5 w-1.5 rounded-full bg-sky-500/40" />
                                            )}
                                          </div>
                                          <span className="min-w-0 truncate text-[11px] text-sky-100/90">
                                            {reward.item.name}
                                            {reward.count > 1
                                              ? ` x${reward.count.toLocaleString()}`
                                              : ""}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {task.finishRewards?.offerUnlock &&
                                task.finishRewards.offerUnlock.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-[1px] flex-1 bg-border/50" />
                                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">
                                        Unlocks
                                      </span>
                                      <div className="h-[1px] flex-1 bg-border/50" />
                                    </div>
                                    <div className="grid gap-2">
                                      {task.finishRewards.offerUnlock.map(
                                        (unlock, index) => (
                                          <div
                                            key={`unlock-${index}`}
                                            className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                                          >
                                            {/* Item Icon */}
                                            <div className="h-10 w-10 shrink-0 rounded-md bg-black/20 flex items-center justify-center p-1 border border-amber-500/20">
                                              {unlock.item.iconLink ? (
                                                <TooltipProvider
                                                  delayDuration={150}
                                                >
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <img
                                                        src={
                                                          unlock.item.iconLink
                                                        }
                                                        alt={unlock.item.name}
                                                        className="h-full w-full object-contain"
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
                                                            unlock.item.iconLink
                                                          }
                                                          alt={unlock.item.name}
                                                          className="h-16 w-16 object-contain"
                                                          loading="lazy"
                                                        />
                                                        <span className="text-xs">
                                                          {unlock.item.name}
                                                        </span>
                                                      </div>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                                              )}
                                            </div>
                                            {/* Trader Icon (smaller, overlaid) */}
                                            <div className="h-6 w-6 shrink-0 rounded-full bg-black/40 flex items-center justify-center overflow-hidden -ml-5 ring-2 ring-amber-500/10 z-10">
                                              {unlock.trader.imageLink ? (
                                                <TooltipProvider
                                                  delayDuration={150}
                                                >
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <img
                                                        src={
                                                          unlock.trader
                                                            .imageLink
                                                        }
                                                        alt={unlock.trader.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                      />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                      side="top"
                                                      align="center"
                                                      className="bg-background text-foreground p-2 shadow-md border"
                                                    >
                                                      <span className="text-xs">
                                                        {unlock.trader.name}
                                                      </span>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-foreground/90 truncate">
                                                {unlock.item.name}
                                              </div>
                                              <div className="text-[10px] text-amber-500/80 font-medium">
                                                {unlock.trader.name} LL
                                                {unlock.level}
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
