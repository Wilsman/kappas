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
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Search,
  Snowflake,
  SlidersHorizontal,
} from "lucide-react";
import { groupTasksByTrader } from "../utils/taskUtils";
import { cn } from "@/lib/utils";
import { taskStorage } from "@/utils/indexedDB";
import { TaskDetailsContent } from "./TaskDetailsContent";
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveKeys,
  formatTaskObjectiveLabel,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";
import {
  areLogicalPrerequisitesCompleted,
  buildLogicalTaskGroupsByTaskId,
  buildLogicalTaskKey,
  getLogicalCompletedPrerequisiteCount,
  isLogicalTaskCompleted as getIsLogicalTaskCompleted,
  normalizeModeVariantTaskName,
} from "@/utils/taskVariants";

interface TaskDeskViewProps {
  tasks: Task[];
  achievements: Achievement[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  focusMode: "all" | "kappa";
  onSetFocus: (mode: "all" | "kappa") => void;
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
    legacyObjectiveKey?: string | string[],
  ) => void;
  taskObjectiveItemProgress: Record<string, number>;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
}

type TaskFilter = "all" | "kappa" | "btr";

const parseTaskFilter = (value: string | null): TaskFilter | null => {
  if (
    value === "all" ||
    value === "kappa" ||
    value === "btr"
  ) {
    return value;
  }

  return null;
};

export const TaskDeskView: React.FC<TaskDeskViewProps> = ({
  tasks,
  achievements,
  completedTasks,
  hiddenTraders,
  focusMode,
  onSetFocus,
  onToggleComplete,
  onTaskClick: _onTaskClick,
  mapFilter,
  groupBy,
  onSetGroupBy,
  activeProfileId,
  playerLevel,
  workingOnTasks = new Set(),
  onToggleWorkingOnTask: _onToggleWorkingOnTask,
  completedTaskObjectives,
  onToggleTaskObjective,
  taskObjectiveItemProgress,
  onUpdateTaskObjectiveItemProgress,
}) => {
  // Mark intentionally unused while preserving external API
  void _onTaskClick;
  void _onToggleWorkingOnTask;
  const [urlSearchTerm, setUrlSearchTerm] = useQueryState("tasksSearch", {
    defaultValue: "",
  });
  const [urlTaskFilter, setUrlTaskFilter] = useQueryState("taskFilter");
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  // Start with all groups collapsed by default
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [enableLevelFilter, setEnableLevelFilter] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showNextOnly, setShowNextOnly] = useState<boolean>(false);
  const [showEvents, setShowEvents] = useState<boolean>(false);
  const [extraTaskFilter, setExtraTaskFilter] = useState<"btr" | null>(null);
  const activeTaskFilter: TaskFilter = extraTaskFilter ?? focusMode;
  const hasAppliedDefaultDeskFocus = useRef(false);
  const lastWrittenTaskFilter = useRef<string | null | undefined>(undefined);
  const previousActiveTaskFilter = useRef<TaskFilter | null>(null);
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

  useEffect(() => {
    if (focusMode !== "all" && extraTaskFilter === "btr") {
      setExtraTaskFilter(null);
    }
  }, [extraTaskFilter, focusMode]);

  useEffect(() => {
    const nextUrlFilter =
      activeTaskFilter === "all" ? null : activeTaskFilter;
    const activeFilterChanged =
      previousActiveTaskFilter.current !== activeTaskFilter;
    previousActiveTaskFilter.current = activeTaskFilter;

    if (activeFilterChanged && urlTaskFilter !== nextUrlFilter) {
      return;
    }

    if (lastWrittenTaskFilter.current === urlTaskFilter) {
      lastWrittenTaskFilter.current = undefined;
      return;
    }

    const nextFilter = parseTaskFilter(urlTaskFilter);
    const nextTaskFilter = nextFilter ?? "all";
    if (nextTaskFilter === activeTaskFilter) return;

    if (nextTaskFilter === "btr") {
      setExtraTaskFilter("btr");
      if (focusMode !== "all") onSetFocus("all");
      return;
    }

    setExtraTaskFilter(null);
    if (nextTaskFilter !== focusMode) {
      onSetFocus(nextTaskFilter);
    }
  }, [activeTaskFilter, focusMode, onSetFocus, urlTaskFilter]);

  useEffect(() => {
    if (groupBy !== "trader") {
      onSetGroupBy("trader");
    }
  }, [groupBy, onSetGroupBy]);

  useEffect(() => {
    if (hasAppliedDefaultDeskFocus.current) return;
    hasAppliedDefaultDeskFocus.current = true;
    if (urlTaskFilter !== null) return;
    if (focusMode === "all" && extraTaskFilter === null) {
      onSetFocus("kappa");
    }
  }, [extraTaskFilter, focusMode, onSetFocus, urlTaskFilter]);

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
  const selectedTaskNameRef = useRef<string | null>(null);
  const selectedTaskLogicalKeyRef = useRef<string | null>(null);
  const prevSearchTermRef = useRef(searchTerm);

  // When selectedTaskId changes, scroll that task into view
  useEffect(() => {
    if (!selectedTaskId) return;
    const el = itemRefs.current.get(selectedTaskId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTaskId]);

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
  const logicalTaskGroupsByTaskId = useMemo(
    () => buildLogicalTaskGroupsByTaskId(tasks),
    [tasks],
  );

  const buildNextQuestIds = useCallback(
    (taskList: Task[]) => {
      const level = Number.isFinite(playerLevel) ? playerLevel : 1;
      const nextIds = new Set<string>();
      const seenLogicalKeys = new Set<string>();

      taskList.forEach((task) => {
        if (task.minPlayerLevel > level) return;
        if (
          !getIsLogicalTaskCompleted(
            task.id,
            completedTasks,
            logicalTaskGroupsByTaskId,
          ) &&
          areLogicalPrerequisitesCompleted(
            task,
            completedTasks,
            logicalTaskGroupsByTaskId,
          )
        ) {
          const logicalKey = buildLogicalTaskKey(task);
          if (!seenLogicalKeys.has(logicalKey)) {
            seenLogicalKeys.add(logicalKey);
            nextIds.add(task.id);
          }
        }
      });

      return nextIds;
    },
    [completedTasks, logicalTaskGroupsByTaskId, playerLevel],
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

  useEffect(() => {
    const nextUrlFilter =
      activeTaskFilter === "all" ? null : activeTaskFilter;
    if (urlTaskFilter === nextUrlFilter) return;

    lastWrittenTaskFilter.current = nextUrlFilter;
    void setUrlTaskFilter(nextUrlFilter);
  }, [activeTaskFilter, setUrlTaskFilter, urlTaskFilter]);

  const taskFilterCounts = useMemo(
    () => ({
      all: baseTasks.length,
      kappa: baseTasks.filter((task) => task.kappaRequired).length,
      btr: baseTasks.filter((task) => task.trader.name === "BTR Driver").length,
    }),
    [baseTasks],
  );

  const filterTasks = useCallback(
    (taskList: Task[], nextIds: Set<string>) =>
      taskList.filter((task) => {
        if (activeTaskFilter === "kappa" && !task.kappaRequired) {
          return false;
        }
        if (activeTaskFilter === "btr" && task.trader.name !== "BTR Driver") {
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
        if (
          !showCompleted &&
          getIsLogicalTaskCompleted(
            task.id,
            completedTasks,
            logicalTaskGroupsByTaskId,
          )
        ) {
          return false;
        }
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
      activeTaskFilter,
      hiddenTraders,
      searchTerm,
      mapFilter,
      enableLevelFilter,
      playerLevel,
      showCompleted,
      completedTasks,
      logicalTaskGroupsByTaskId,
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
        .sort(([a], [b]) => {
          if (groupBy === "trader") {
            if (a === "Fence") return 1;
            if (b === "Fence") return -1;
          }
          return a.localeCompare(b);
        }),
    [groupBy, tasksByGroup],
  );
  const groupsWithEvents = useMemo<GroupEntry[]>(() => {
    if (!hasEventTasks || filteredEventTasks.length === 0) return sortedGroups;
    return [["Seasonal Events", filteredEventTasks], ...sortedGroups];
  }, [sortedGroups, hasEventTasks, filteredEventTasks]);

  const allGroupNames = useMemo(
    () => groupsWithEvents.map(([name]) => name),
    [groupsWithEvents],
  );
  const isTraderBoard = groupBy === "trader";
  const hasAutoExpandedTraderBoardRef = useRef(false);

  useEffect(() => {
    if (!isTraderBoard) {
      hasAutoExpandedTraderBoardRef.current = false;
      return;
    }
    if (hasAutoExpandedTraderBoardRef.current || allGroupNames.length === 0) {
      return;
    }
    setExpandedGroups((prev) => (prev.length > 0 ? prev : allGroupNames));
    hasAutoExpandedTraderBoardRef.current = true;
  }, [allGroupNames, isTraderBoard]);

  // Only use the explicitly expanded groups
  const finalExpandedGroups = expandedGroups;
  const areAllExpanded = finalExpandedGroups.length === allGroupNames.length;

  useEffect(() => {
    const previousSearchTerm = prevSearchTermRef.current;
    prevSearchTermRef.current = searchTerm;
    if (
      previousSearchTerm.trim() ||
      !searchTerm.trim() ||
      allGroupNames.length === 0
    ) {
      return;
    }
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      allGroupNames.forEach((groupName) => next.add(groupName));
      return next.size === prev.length ? prev : Array.from(next);
    });
  }, [allGroupNames, searchTerm]);

  useEffect(() => {
    if (!selectedTaskId) return;

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (selectedTask) {
      selectedTaskNameRef.current = selectedTask.name;
      selectedTaskLogicalKeyRef.current = buildLogicalTaskKey(selectedTask);
      return;
    }

    const previousName = selectedTaskNameRef.current;
    const previousLogicalKey = selectedTaskLogicalKeyRef.current;
    if (!previousName && !previousLogicalKey) {
      setSelectedTaskId(null);
      return;
    }

    const nextTask =
      (previousLogicalKey
        ? tasks.find((task) => buildLogicalTaskKey(task) === previousLogicalKey)
        : undefined) ??
      (previousName
        ? tasks.find(
            (task) =>
              normalizeModeVariantTaskName(task.name) ===
              normalizeModeVariantTaskName(previousName),
          )
        : undefined);

    if (!nextTask) {
      setSelectedTaskId(null);
      return;
    }

    selectedTaskNameRef.current = nextTask.name;
    selectedTaskLogicalKeyRef.current = buildLogicalTaskKey(nextTask);
    setSelectedTaskId(nextTask.id);
    setExpandedGroups((prev) => {
      const groupNames =
        groupBy === "trader"
          ? [nextTask.trader.name]
          : nextTask.maps && nextTask.maps.length > 0
            ? nextTask.maps.map((map) => map.name)
            : [nextTask.map?.name || "Anywhere"];
      const next = new Set(prev);
      groupNames.forEach((groupName) => next.add(groupName));
      return next.size === prev.length ? prev : Array.from(next);
    });
  }, [groupBy, selectedTaskId, tasks]);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };
  const activeFilterLabel =
    activeTaskFilter === "kappa"
      ? "Kappa"
      : activeTaskFilter === "btr"
        ? "BTR"
        : "All";

  const handleTaskFilterChange = useCallback(
    (filter: TaskFilter) => {
      const nextUrlFilter = filter === "all" ? null : filter;
      lastWrittenTaskFilter.current = nextUrlFilter;
      void setUrlTaskFilter(nextUrlFilter);

      if (filter === "btr") {
        setExtraTaskFilter("btr");
        if (focusMode !== "all") onSetFocus("all");
        return;
      }

      setExtraTaskFilter(null);
      onSetFocus(filter);
    },
    [focusMode, onSetFocus, setUrlTaskFilter],
  );

  const compareTasks = useCallback(
    (a: Task, b: Task) => {
      const compareByName = (left: Task, right: Task) =>
        left.name.localeCompare(right.name, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id);
      const compareByLevelAsc = (left: Task, right: Task) =>
        left.minPlayerLevel - right.minPlayerLevel ||
        compareByName(left, right);
      const compareByLevelDesc = (left: Task, right: Task) =>
        right.minPlayerLevel - left.minPlayerLevel ||
        compareByName(left, right);
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
        const preferredTask = groupTasks.find(
          (task) => task.id === preferredTaskId,
        );
        if (preferredTask) return preferredTask;
      }

      const sorted = [...groupTasks].sort((a, b) => {
        const aCompleted = completedTasks.has(a.id);
        const bCompleted = completedTasks.has(b.id);
        if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;

        const aWorking = workingOnTasks.has(a.id);
        const bWorking = workingOnTasks.has(b.id);
        if (aWorking !== bWorking) return aWorking ? -1 : 1;

        const aUnlocked = areLogicalPrerequisitesCompleted(
          a,
          completedTasks,
          logicalTaskGroupsByTaskId,
        );
        const bUnlocked = areLogicalPrerequisitesCompleted(
          b,
          completedTasks,
          logicalTaskGroupsByTaskId,
        );
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

        const aCompletedPrereqs = getLogicalCompletedPrerequisiteCount(
          a,
          completedTasks,
          logicalTaskGroupsByTaskId,
        );
        const bCompletedPrereqs = getLogicalCompletedPrerequisiteCount(
          b,
          completedTasks,
          logicalTaskGroupsByTaskId,
        );
        if (aCompletedPrereqs !== bCompletedPrereqs) {
          return bCompletedPrereqs - aCompletedPrereqs;
        }

        return compareTasks(a, b);
      });

      return sorted[0];
    },
    [compareTasks, completedTasks, logicalTaskGroupsByTaskId, workingOnTasks],
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
    (taskId: string) =>
      getIsLogicalTaskCompleted(
        taskId,
        completedTasks,
        logicalTaskGroupsByTaskId,
      ),
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

  const visibleTaskSummary = useMemo(() => {
    return groupsWithEvents.reduce(
      (summary, [, groupTasks]) => {
        const displayGroups = getDisplayTaskGroups(groupTasks);
        summary.total += displayGroups.length;
        summary.completed += displayGroups.filter((group) =>
          group.tasks.some((task) => completedTasks.has(task.id)),
        ).length;
        return summary;
      },
      { total: 0, completed: 0 },
    );
  }, [completedTasks, getDisplayTaskGroups, groupsWithEvents]);
  const visibleCompletionPct =
    visibleTaskSummary.total > 0
      ? (visibleTaskSummary.completed / visibleTaskSummary.total) * 100
      : 0;

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
    <div className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden bg-background p-4 text-foreground">
      {/* Grouping selection moved to sidebar under Quests > Checklist */}

      <div className="z-20 mb-4 shrink-0 border-b border-border/70 bg-background py-3">
        <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex min-w-0 flex-col gap-3 p-3">
            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {activeFilterLabel} tasks
                </h2>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{visibleTaskSummary.total} visible</span>
                  <span>{visibleTaskSummary.completed} completed</span>
                  <span>
                    {Math.max(
                      0,
                      visibleTaskSummary.total - visibleTaskSummary.completed,
                    )}{" "}
                    remaining
                  </span>
                  <span>{visibleCompletionPct.toFixed(0)}% progress</span>
                  <span>{isTraderBoard ? "Trader board" : "Map groups"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    ["all", "All"],
                    ["kappa", "Kappa"],
                    ["btr", "BTR"],
                  ] as const
                ).map(([value, label]) => {
                  const isActive = activeTaskFilter === value;
                  const count = taskFilterCounts[value];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTaskFilterChange(value)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center">
              <div className="flex min-w-0 w-full items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleAll}
                  aria-label={areAllExpanded ? "Collapse all" : "Expand all"}
                  className="h-9 w-9 shrink-0"
                >
                  {areAllExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks, traders, maps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={sortMode}
                  onValueChange={(v) => setSortMode(v as typeof sortMode)}
                >
                  <SelectTrigger className="h-9 w-[150px] shrink-0">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="level-asc">
                      Min level (low-high)
                    </SelectItem>
                    <SelectItem value="level-desc">
                      Min level (high-low)
                    </SelectItem>
                    <SelectItem value="incomplete-first">
                      Incomplete first
                    </SelectItem>
                    <SelectItem value="complete-first">
                      Completed first
                    </SelectItem>
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

              <div className="flex min-w-0 flex-wrap items-center gap-2 xl:ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
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
                      onCheckedChange={(checked) =>
                        setEnableLevelFilter(!!checked)
                      }
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
        </div>
      </div>

      {hasEventTasks && showEvents && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-foreground shadow-sm">
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
              (taskMap.get(selectedTaskId)
                ? [taskMap.get(selectedTaskId)!]
                : []);
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
            const successorCandidates = tasks.filter((t) =>
              t.taskRequirements?.some((req) =>
                selectedTaskIds.has(req.task.id),
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
      <div
        className={cn(
          "min-w-0 w-full max-w-full flex-1 min-h-0",
          isTraderBoard && "overflow-hidden",
        )}
      >
        <div
          className={cn(
            isTraderBoard
              ? "h-full w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-4"
              : "overflow-visible",
          )}
        >
          <Accordion
            type="multiple"
            className={cn(
              "space-y-2",
              isTraderBoard
                ? "inline-flex h-full min-w-full items-stretch gap-4 space-y-0 pr-4"
                : "w-full",
            )}
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
                    isTraderBoard &&
                      "flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden rounded-[26px] border-border bg-card shadow-sm",
                    isEventGroup && "border-amber-500/40 bg-amber-500/5",
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      "px-4 py-2 hover:no-underline",
                      isTraderBoard && "px-4 py-4",
                    )}
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3">
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold">
                        {isEventGroup ? (
                          <span className="inline-flex min-w-0 items-center gap-2 truncate text-amber-500">
                            <Snowflake className="h-4 w-4" />
                            <span className="truncate">{groupName}</span>
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
                            <span className="truncate">{groupName}</span>
                          </>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {completedCount} / {totalCount}
                        </span>
                        <Progress
                          value={progress}
                          className="h-2 w-20 shrink-0 sm:w-24"
                        />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent
                    className={cn(
                      "border-t px-4 pb-4",
                      isTraderBoard &&
                        "flex min-h-0 flex-1 flex-col overflow-hidden border-white/10 px-0 pb-0",
                    )}
                  >
                    <div
                      className={cn(
                        isTraderBoard
                          ? "flex-1 min-h-0 overflow-y-auto px-4 pb-4 pr-2"
                          : "space-y-1",
                      )}
                    >
                      <div className="space-y-1">
                        {displayTaskGroups.map((group) => {
                          const task = group.activeTask;
                          const isCompleted = group.tasks.some((variant) =>
                            completedTasks.has(variant.id),
                          );
                          const isDetailsOpen = group.tasks.some(
                            (variant) => variant.id === selectedTaskId,
                          );
                          const mapNames =
                            task.maps && task.maps.length > 0
                              ? task.maps.map((map) => map.name)
                              : task.map?.name
                                ? [task.map.name]
                                : [];
                          const prerequisiteNames = (
                            task.taskRequirements ?? []
                          ).map((requirement) => requirement.task.name);
                          const objectiveProgress =
                            objectiveProgressByTaskId.get(task.id);
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
                                    onCheckedChange={() =>
                                      onToggleComplete(task.id)
                                    }
                                    disabled={false}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <a
                                          href={task.wikiLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn(
                                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors",
                                            "hover:border-border hover:bg-background hover:text-foreground",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                          )}
                                          onClick={(e) => e.stopPropagation()}
                                          aria-label={`Open ${task.name} wiki`}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        Open wiki
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  {/* Trigger wraps most of the row (except checkbox & wiki link) */}
                                  <CollapsibleTrigger asChild>
                                    <div
                                      className="flex flex-1 min-w-0 items-center gap-2 overflow-hidden cursor-pointer select-none"
                                      role="button"
                                      aria-label="Toggle details"
                                    >
                                      <span
                                        className={cn(
                                          "flex min-w-0 flex-1 items-center gap-2 text-[15px] leading-tight",
                                        )}
                                      >
                                        <HoverCard
                                          openDelay={1500}
                                          closeDelay={80}
                                        >
                                          <HoverCardTrigger asChild>
                                            <span
                                              className={cn(
                                                "block min-w-0 flex-1 truncate whitespace-nowrap underline-offset-4 hover:underline",
                                                isCompleted && "line-through",
                                              )}
                                            >
                                              {task.name}
                                            </span>
                                          </HoverCardTrigger>
                                          <HoverCardContent
                                            align="start"
                                            side="top"
                                            className="w-80 border-border bg-background p-0 text-foreground shadow-xl"
                                          >
                                            <div className="space-y-3 p-4">
                                              <div className="space-y-1">
                                                <div className="text-sm font-semibold text-foreground">
                                                  {task.name}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                                  <span className="rounded-full border border-border bg-muted px-2 py-1">
                                                    {task.trader.name}
                                                  </span>
                                                  <span className="rounded-full border border-border bg-muted px-2 py-1">
                                                    Level {task.minPlayerLevel}
                                                  </span>
                                                  {task.kappaRequired && (
                                                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
                                                      Kappa
                                                    </span>
                                                  )}
                                                  {task.trader.name ===
                                                    "BTR Driver" && (
                                                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-cyan-400">
                                                      BTR
                                                    </span>
                                                  )}
                                                  {task.factionName && (
                                                    <span className="rounded-full border border-border bg-muted px-2 py-1">
                                                      {task.factionName}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="grid gap-2 sm:grid-cols-2">
                                                <div className="rounded-xl border border-border bg-card p-3">
                                                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Objectives
                                                  </div>
                                                  <div className="mt-1 text-sm font-medium text-foreground">
                                                    {objectiveProgress
                                                      ? `${objectiveProgress.completed}/${objectiveProgress.total}`
                                                      : "No tracked objectives"}
                                                  </div>
                                                </div>
                                                <div className="rounded-xl border border-border bg-card p-3">
                                                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Prerequisites
                                                  </div>
                                                  <div className="mt-1 text-sm font-medium text-foreground">
                                                    {prerequisiteNames.length}
                                                  </div>
                                                </div>
                                              </div>

                                              {mapNames.length > 0 && (
                                                <div className="space-y-1">
                                                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Maps
                                                  </div>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {mapNames.map((mapName) => (
                                                      <span
                                                        key={mapName}
                                                        className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-foreground"
                                                      >
                                                        {mapName}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {prerequisiteNames.length > 0 && (
                                                <div className="space-y-1">
                                                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Requires
                                                  </div>
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {prerequisiteNames
                                                      .slice(0, 6)
                                                      .map((name) => (
                                                        <span
                                                          key={name}
                                                          className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-foreground"
                                                        >
                                                          {name}
                                                        </span>
                                                      ))}
                                                    {prerequisiteNames.length >
                                                      6 && (
                                                      <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                        +
                                                        {prerequisiteNames.length -
                                                          6}{" "}
                                                        more
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {(task.objectives?.length ?? 0) >
                                                0 && (
                                                <div className="space-y-1">
                                                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Important Objectives
                                                  </div>
                                                  <ul className="space-y-1 text-xs text-foreground">
                                                    {(task.objectives ?? [])
                                                      .slice(0, 3)
                                                      .map((objective, index) => (
                                                          <li
                                                            key={`${task.id}-hover-objective-${index}`}
                                                            className="rounded-lg border border-border bg-card px-2 py-1.5"
                                                          >
                                                            {formatTaskObjectiveLabel(
                                                              objective,
                                                            ) ||
                                                              `Objective ${index + 1}`}
                                                          </li>
                                                        ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </HoverCardContent>
                                        </HoverCard>
                                      </span>
                                    </div>
                                  </CollapsibleTrigger>
                                </div>

                                <CollapsibleContent>
                                  {isDetailsOpen && (
                                    <TaskDetailsContent
                                      task={task}
                                      achievements={achievements}
                                      completedTaskObjectives={
                                        completedTaskObjectives
                                      }
                                      taskObjectiveItemProgress={
                                        taskObjectiveItemProgress
                                      }
                                      onToggleTaskObjective={
                                        onToggleTaskObjective
                                      }
                                      onUpdateTaskObjectiveItemProgress={
                                        onUpdateTaskObjectiveItemProgress
                                      }
                                      className="mx-7 mb-2 rounded-md border border-border bg-muted/30"
                                    />
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </div>
  );
};
