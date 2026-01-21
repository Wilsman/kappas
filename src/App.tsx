import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useIsMobile } from "./hooks/use-mobile";
import { RotateCcw, BarChart3, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import {
  Task,
  CollectorItemsData,
  Achievement,
  HideoutStation,
  Overlay,
} from "./types";
import { QuestProgressPanel } from "./components/QuestProgressPanel";
import { ContentSkeleton } from "./components/ContentSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "./components/SEO";
import {
  taskStorage,
  migrateLegacyDataIfNeeded,
  migrateDefaultDbIfNeeded,
  ExportImportService,
} from "./utils/indexedDB";
import {
  ensureProfiles,
  getProfiles,
  getActiveProfileId,
  setActiveProfileId as setActiveProfileIdLS,
  createProfile,
  renameProfile,
  deleteProfile,
  updateProfileFaction,
  updateProfileEdition,
  getUniqueProfileName,
  type Profile,
} from "@/utils/profile";
import {
  loadCurrentPrestigeSummary,
  PRESTIGE_UPDATED_EVENT,
  PRESTIGE_CONFIGS,
} from "@/utils/prestige";
import { buildTaskDependencyMap, getAllDependencies } from "./utils/taskUtils";
import {
  fetchCombinedData,
  fetchOverlay,
  loadCombinedCache,
  isCombinedCacheFresh,
  type FetchStage,
  buildEventTasksFromOverlay,
} from "./services/tarkovApi";
import { cn } from "@/lib/utils";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TRADER_COLORS } from "./data/traders";
import { Sidebar as LegacySidebar } from "./components/Sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
// Lazily-loaded heavy views
const FlowView = lazy(() =>
  import("./components/FlowView").then((m) => ({ default: m.FlowView })),
);
const MindMap = lazy(() =>
  import("./components/MindMap").then((m) => ({ default: m.MindMap })),
);
const CheckListView = lazy(() =>
  import("./components/CheckListView").then((m) => ({
    default: m.CheckListView,
  })),
);
const CollectorView = lazy(() =>
  import("./components/ItemTrackerView").then((m) => ({
    default: m.CollectorView,
  })),
);
const PrestigesView = lazy(() =>
  import("./components/PrestigesView").then((m) => ({
    default: m.PrestigesView,
  })),
);
const AchievementsView = lazy(() =>
  import("./components/AchievementsView").then((m) => ({
    default: m.AchievementsView,
  })),
);
const StorylineQuestsView = lazy(() =>
  import("./components/StorylineQuestsView").then((m) => ({
    default: m.StorylineQuestsView,
  })),
);
const HideoutRequirementsView = lazy(() =>
  import("./components/HideoutRequirementsView").then((m) => ({
    default: m.HideoutRequirementsView,
  })),
);
const StorylineContainer = lazy(() =>
  import("./components/storyline-map").then((m) => ({
    default: m.StorylineContainer,
  })),
);
const CurrentlyWorkingOnView = lazy(() =>
  import("./components/CurrentlyWorkingOnView").then((m) => ({
    default: m.CurrentlyWorkingOnView,
  })),
);
import { CommandMenu } from "./components/CommandMenu";
import { NotesWidget } from "./components/NotesWidget";
import { OnboardingModal } from "./components/OnboardingModal";
import { LazyLoadErrorBoundary } from "./components/LazyLoadErrorBoundary";
import { STORYLINE_QUESTS } from "@/data/storylineQuests";

const LOADING_STAGES = {
  boot: {
    title: "INIT::QUEST-CORE v1.0",
    detail: "BOOTSTRAP SEQUENCE...",
    progress: 8,
  },
  profiles: {
    title: "SYS::PROFILES",
    detail: "LOADING USER CONTEXT...",
    progress: 16,
  },
  local: {
    title: "SYS::LOCAL",
    detail: "RESTORING SAVED PROGRESS...",
    progress: 28,
  },
  prefs: {
    title: "SYS::PREFERENCES",
    detail: "APPLYING USER SETTINGS...",
    progress: 38,
  },
  cacheCheck: {
    title: "CACHE::CHECK",
    detail: "VERIFYING LOCAL SNAPSHOT...",
    progress: 48,
  },
  cacheApply: {
    title: "CACHE::APPLY",
    detail: "HYDRATING UI FROM CACHE...",
    progress: 58,
  },
  request: {
    title: "NET::REQUEST",
    detail: "REQUESTING QUEST PAYLOAD...",
    progress: 68,
  },
  parse: {
    title: "NET::PARSE",
    detail: "DECODING API RESPONSE...",
    progress: 74,
  },
  overlayFetch: {
    title: "NET::OVERLAY",
    detail: "FETCHING DATA OVERLAY...",
    progress: 80,
  },
  overlayApply: {
    title: "MERGE::OVERLAY",
    detail: "APPLYING PATCHES...",
    progress: 86,
  },
  normalize: {
    title: "MAP::NORMALIZE",
    detail: "BUILDING MAP INDEX...",
    progress: 92,
  },
  finalize: {
    title: "SYS::FINALIZE",
    detail: "FINALIZING SESSION...",
    progress: 97,
  },
} as const;

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [activeProfileFaction, setActiveProfileFaction] = useState<
    "USEC" | "BEAR" | undefined
  >(undefined);
  const [activeProfileEdition, setActiveProfileEdition] = useState<
    string | undefined
  >(undefined);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    const nextFaction = profiles.find((p) => p.id === activeProfileId)?.faction;
    setActiveProfileFaction(nextFaction);
  }, [activeProfileId, profiles]);
  useEffect(() => {
    const nextEdition = profiles.find((p) => p.id === activeProfileId)?.edition;
    setActiveProfileEdition(nextEdition);
  }, [activeProfileId, profiles]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const editionOptions = useMemo(() => {
    const editions = overlay?.editions;
    if (!editions) return [];
    return Object.values(editions).sort((a, b) => a.value - b.value);
  }, [overlay]);
  const tasks = useMemo(() => {
    let filtered = allTasks;
    if (activeProfileFaction) {
      filtered = filtered.filter(
        (t) =>
          !t.factionName ||
          t.factionName === "Any" ||
          t.factionName === activeProfileFaction,
      );
    }

    if (overlay?.editions && activeProfileEdition) {
      const currentEdition = overlay.editions[activeProfileEdition];
      if (currentEdition) {
        const excluded = new Set(currentEdition.excludedTaskIds ?? []);
        const exclusive = new Set(currentEdition.exclusiveTaskIds ?? []);
        const allExclusive = new Set(
          Object.values(overlay.editions).flatMap(
            (edition) => edition.exclusiveTaskIds ?? [],
          ),
        );
        filtered = filtered.filter((task) => {
          if (task.isEvent) return true;
          if (excluded.has(task.id)) return false;
          if (allExclusive.size > 0 && allExclusive.has(task.id)) {
            return exclusive.has(task.id);
          }
          return true;
        });
      }
    }

    return filtered;
  }, [allTasks, activeProfileFaction, activeProfileEdition, overlay]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const traderImageByName = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach((task) => {
      if (task.trader?.name && task.trader.imageLink) {
        if (!map.has(task.trader.name)) {
          map.set(task.trader.name, task.trader.imageLink);
        }
      }
    });
    return map;
  }, [allTasks]);
  const eventTasks = useMemo(() => {
    if (!overlay) return [];
    return buildEventTasksFromOverlay(overlay).map((task) => ({
      ...task,
      trader: {
        ...task.trader,
        imageLink: traderImageByName.get(task.trader.name),
      },
    }));
  }, [overlay, traderImageByName]);
  const tasksWithEvents = useMemo(() => {
    const baseIds = new Set(tasks.map((task) => task.id));
    const uniqueEvents = eventTasks.filter((task) => !baseIds.has(task.id));
    return [...tasks, ...uniqueEvents];
  }, [tasks, eventTasks]);
  const baseTasks = useMemo(
    () => tasks.filter((task) => !task.isEvent),
    [tasks],
  );
  const [completedCollectorItems, setCompletedCollectorItems] = useState<
    Set<string>
  >(new Set());
  const [completedHideoutItems, setCompletedHideoutItems] = useState<
    Set<string>
  >(new Set());
  const [completedStorylineObjectives, setCompletedStorylineObjectives] =
    useState<Set<string>>(new Set());
  const [completedStorylineMapNodes, setCompletedStorylineMapNodes] = useState<
    Set<string>
  >(new Set());
  const [completedTaskObjectives, setCompletedTaskObjectives] = useState<
    Set<string>
  >(new Set());
  const [taskObjectiveItemProgress, setTaskObjectiveItemProgress] = useState<
    Record<string, number>
  >({});
  const [hideoutItemQuantities, setHideoutItemQuantities] = useState<
    Record<string, number>
  >({});
  // Show all traders by default (no hidden traders initially)
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    (typeof LOADING_STAGES)[keyof typeof LOADING_STAGES]
  >(LOADING_STAGES.boot);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const {
        tasks: tasksData,
        collectorItems: collectorData,
        achievements: achievementsData,
        hideoutStations,
        overlay: overlayData,
      } = await fetchCombinedData();
      setAllTasks(tasksData.data.tasks);
      setApiCollectorItems(collectorData);
      setAchievements(achievementsData.data.achievements);
      setHideoutStations(hideoutStations.data.hideoutStations);
      setOverlay(overlayData);
    } catch (err) {
      console.error("Manual refresh error", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  const [showKappa, setShowKappa] = useState(false);
  const [showLightkeeper, setShowLightkeeper] = useState(false);
  const [apiCollectorItems, setApiCollectorItems] =
    useState<CollectorItemsData | null>(null);

  // Transform collector items data to match the expected structure (Patched by Overlay)
  const collectorItems = useMemo(() => {
    // Try API data first (which is already patched by the overlay in tarkovApi.ts)
    if (apiCollectorItems?.data?.task?.objectives) {
      return apiCollectorItems.data.task.objectives.flatMap((objective) =>
        (objective.items || []).map((item) => ({
          name: item.name,
          order: 0,
          img: item.iconLink || "",
          id: item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        })),
      );
    }

    // Fallback to empty if API fails (could use a global constant if needed)
    return [];
  }, [apiCollectorItems]);

  const [viewMode, setViewMode] = useState<
    | "tree"
    | "grouped"
    | "collector"
    | "flow"
    | "prestiges"
    | "achievements"
    | "storyline"
    | "storyline-map"
    | "hideout-requirements"
    | "current"
  >("grouped");
  const [groupBy, setGroupBy] = useState<"trader" | "map">("trader");
  const [collectorGroupBy, setCollectorGroupBy] = useState<
    "collector" | "hideout-stations"
  >("collector");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [playerLevel, setPlayerLevel] = useState<number>(1);

  const handleSetPlayerLevel = useCallback(
    async (level: number) => {
      const safeLevel = Number.isFinite(level) ? Math.max(1, level) : 1;
      setPlayerLevel(safeLevel);
      const profileId = activeProfileId;
      taskStorage.setProfile(profileId);
      await taskStorage.init();
      await taskStorage.saveUserPreferences({ playerLevel: safeLevel });
    },
    [activeProfileId],
  );

  const isMobile = useIsMobile();

  // Always use checklist on mobile
  useEffect(() => {
    if (isMobile) setViewMode("grouped");
  }, [isMobile]);
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [completedAchievements, setCompletedAchievements] = useState<
    Set<string>
  >(new Set());
  const [hideoutStations, setHideoutStations] = useState<HideoutStation[]>([]);

  // Working on items (currently working towards)
  const [workingOnTasks, setWorkingOnTasks] = useState<Set<string>>(new Set());
  const [workingOnStorylineObjectives, setWorkingOnStorylineObjectives] =
    useState<Set<string>>(new Set());
  const [workingOnCollectorItems, setWorkingOnCollectorItems] = useState<
    Set<string>
  >(new Set());
  const [workingOnHideoutStations, setWorkingOnHideoutStations] = useState<
    Set<string>
  >(new Set());

  // Storyline view state for URL synchronization
  const [storylineView, setStorylineView] = useState<
    "selector" | "ending" | "fullMap"
  >("selector");
  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null);

  // Lightweight client-side routing for deep links like /Items/CollectorItems?search=...
  function normalizePath(pathname: string) {
    return pathname.replace(/\/+$/, "");
  }
  function parsePath(pathname: string) {
    const parts = normalizePath(pathname)
      .split("/")
      .filter(Boolean)
      .map((p) => p.toLowerCase());
    // Defaults
    let nextView: typeof viewMode = "grouped";
    let nextCollectorGroupBy: typeof collectorGroupBy | undefined;
    let nextStorylineView: "selector" | "ending" | "fullMap" | undefined;
    let nextEndingId: string | undefined;

    if (parts.length === 0) {
      // root -> default to Quests Checklist
      nextView = "grouped";
    } else if (parts[0] === "quests") {
      // Both /Quests and /Quests/Checklist route to grouped checklist
      nextView = "grouped";
    } else if (parts[0] === "items") {
      nextView = "collector";
      if (parts[1] === "collectoritems") nextCollectorGroupBy = "collector";
      else if (parts[1] === "hideoutstations")
        nextCollectorGroupBy = "hideout-stations";
      else if (parts[1] === "hideoutrequirements")
        nextView = "hideout-requirements";
    } else if (parts[0] === "prestiges") {
      nextView = "prestiges";
    } else if (parts[0] === "achievements") {
      nextView = "achievements";
    } else if (parts[0] === "storyline") {
      if (parts[1] === "choose-ending" || parts[1] === "map") {
        nextView = "storyline-map";
        nextStorylineView = "selector";
      } else if (parts[1] === "ending" && parts[2]) {
        nextView = "storyline-map";
        nextStorylineView = "ending";
        nextEndingId = parts[2];
      } else if (parts[1] === "full-map") {
        nextView = "storyline-map";
        nextStorylineView = "fullMap";
      } else {
        nextView = "storyline";
      }
    } else if (parts[0] === "current") {
      nextView = "current";
    }

    return { nextView, nextCollectorGroupBy, nextStorylineView, nextEndingId };
  }
  // buildPath removed in favor of inlined computation inside effect

  // On initial load + popstate: sync state from URL path
  useEffect(() => {
    const applyFromLocation = () => {
      const { pathname } = window.location;
      const {
        nextView,
        nextCollectorGroupBy,
        nextStorylineView,
        nextEndingId,
      } = parsePath(pathname);
      setViewMode(nextView);
      if (nextCollectorGroupBy) setCollectorGroupBy(nextCollectorGroupBy);
      if (nextStorylineView) {
        setStorylineView(nextStorylineView);
        setSelectedEndingId(nextEndingId || null);
      }
    };
    applyFromLocation();
    // Normalize legacy checklist routes to root (default view), preserving query
    const { pathname: initialPathname, search: initialSearch } =
      window.location;
    if (/^\/(quests\/(checklist)?)\/?$/i.test(initialPathname)) {
      window.history.replaceState(null, "", `/${initialSearch}`);
    }
    const onPop = () => applyFromLocation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When state changes via UI, update the path (preserving existing query string like ?search=...)
  useEffect(() => {
    let nextPath = "/";
    if (viewMode === "grouped") {
      // Default checklist view lives at root
      nextPath = "/";
    } else if (viewMode === "collector") {
      nextPath =
        collectorGroupBy === "hideout-stations"
          ? "/Items/HideoutStations"
          : "/Items/CollectorItems";
    } else if (viewMode === "hideout-requirements") {
      nextPath = "/Items/HideoutRequirements";
    } else if (viewMode === "prestiges") {
      nextPath = "/Prestiges";
    } else if (viewMode === "achievements") {
      nextPath = "/Achievements";
    } else if (viewMode === "storyline") {
      nextPath = "/Storyline";
    } else if (viewMode === "storyline-map") {
      // Generate specific URLs for storyline views
      if (storylineView === "selector") {
        nextPath = "/Storyline/Choose-Ending";
      } else if (storylineView === "ending" && selectedEndingId) {
        nextPath = `/Storyline/Ending/${selectedEndingId}`;
      } else if (storylineView === "fullMap") {
        nextPath = "/Storyline/Full-Map";
      } else {
        nextPath = "/Storyline/Choose-Ending"; // fallback
      }
    } else if (viewMode === "flow") {
      nextPath = "/Quests/Flow";
    } else if (viewMode === "tree") {
      nextPath = "/Quests/Tree";
    } else if (viewMode === "current") {
      nextPath = "/Current";
    }
    const current = normalizePath(window.location.pathname);
    if (normalizePath(nextPath) !== current) {
      // Clear query string (e.g., ?search=...) when navigating to a new view/tab
      window.history.pushState(null, "", nextPath);
    }
  }, [viewMode, groupBy, collectorGroupBy, storylineView, selectedEndingId]);

  // Note: preserve query params (e.g., ?tasksSearch=...) to enable deep links
  // When navigating between views we already replace the path without query above.

  const handleToggleAchievement = useCallback(
    async (id: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedAchievements);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompletedAchievements(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedAchievements(next);
      } catch (err) {
        console.error("Save achievements error", err);
      }
    },
    [completedAchievements, activeProfileId],
  );

  const handleToggleStorylineObjective = useCallback(
    async (id: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedStorylineObjectives);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompletedStorylineObjectives(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedStorylineObjectives(next);
      } catch (err) {
        console.error("Save storyline objectives error", err);
      }
    },
    [completedStorylineObjectives, activeProfileId],
  );

  const handleSetCompletedStorylineObjectives = useCallback(
    async (objectives: Set<string>) => {
      if (!activeProfileId) return;
      setCompletedStorylineObjectives(objectives);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedStorylineObjectives(objectives);
      } catch (err) {
        console.error("Save storyline objectives error", err);
      }
    },
    [activeProfileId],
  );

  const handleToggleStorylineMapNode = useCallback(
    async (id: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedStorylineMapNodes);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompletedStorylineMapNodes(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedStorylineMapNodes(next);
      } catch (err) {
        console.error("Save storyline map nodes error", err);
      }
    },
    [completedStorylineMapNodes, activeProfileId],
  );

  const totalQuests = baseTasks.length;
  const completedQuests = baseTasks.filter((task) =>
    completedTasks.has(task.id),
  ).length;

  // Calculate storyline objectives (only main objectives count towards progress)
  const { totalStorylineObjectives, completedStorylineCount } = useMemo(() => {
    let total = 0;
    let completed = 0;

    STORYLINE_QUESTS.forEach((quest) => {
      quest.objectives?.forEach((obj) => {
        if (obj.type === "main") {
          total++;
          if (completedStorylineObjectives.has(obj.id)) {
            completed++;
          }
        }
      });
    });

    return {
      totalStorylineObjectives: total,
      completedStorylineCount: completed,
    };
  }, [completedStorylineObjectives]);

  // Build progress data for QuestProgressPanel
  const traderProgress = useMemo(() => {
    type TP = { completed: number; total: number; imageLink?: string };
    const map = Object.fromEntries(
      Object.keys(TRADER_COLORS).map((name) => [
        name,
        { completed: 0, total: 0, imageLink: undefined } as TP,
      ]),
    ) as Record<keyof typeof TRADER_COLORS, TP>;

    baseTasks.forEach(({ trader: { name, imageLink }, id }) => {
      if (map[name]) {
        map[name].total++;
        if (completedTasks.has(id)) {
          map[name].completed++;
        }
        // Store the imageLink from the first task we encounter for this trader
        if (!map[name].imageLink && imageLink) {
          map[name].imageLink = imageLink;
        }
      }
    });

    return Object.entries(map).map(
      ([name, { completed, total, imageLink }]) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        completed,
        total,
        color: TRADER_COLORS[name as keyof typeof TRADER_COLORS] || "#6b7280",
        imageLink,
      }),
    );
  }, [baseTasks, completedTasks]);

  // Derived lists for sidebar
  const traderList = useMemo(() => Object.keys(TRADER_COLORS), []);

  // Profile actions
  const handleSwitchProfile = useCallback(
    async (id: string) => {
      if (!id || id === activeProfileId) return;
      setActiveProfileIdLS(id);
      setActiveProfileId(id);
      const profile = getProfiles().find((p) => p.id === id);
      setActiveProfileFaction(profile?.faction);
      setActiveProfileEdition(profile?.edition);
      try {
        try {
          (document.activeElement as HTMLElement | null)?.blur?.();
        } catch {
          /* ignore blur errors */
        }
        taskStorage.setProfile(id);
        await taskStorage.init();
        const savedTasks = await taskStorage.loadCompletedTasks();
        const savedCollectorItems =
          await taskStorage.loadCompletedCollectorItems();
        const savedHideoutItems = await taskStorage.loadCompletedHideoutItems();
        const savedAchievements = await taskStorage.loadCompletedAchievements();
        const savedStorylineObjectives =
          await taskStorage.loadCompletedStorylineObjectives();
        const savedStorylineMapNodes =
          await taskStorage.loadCompletedStorylineMapNodes();
        const savedTaskObjectives =
          await taskStorage.loadCompletedTaskObjectives();
        const savedTaskObjectiveItemProgress =
          await taskStorage.loadTaskObjectiveItemProgress();
        const savedHideoutItemQuantities =
          await taskStorage.loadHideoutItemQuantities();
        const savedWorkingOnItems = await taskStorage.loadWorkingOnItems();
        setCompletedTasks(savedTasks);
        setCompletedCollectorItems(savedCollectorItems);
        setCompletedHideoutItems(savedHideoutItems);
        setCompletedAchievements(savedAchievements);
        setCompletedStorylineObjectives(savedStorylineObjectives);
        setCompletedStorylineMapNodes(savedStorylineMapNodes);
        setCompletedTaskObjectives(savedTaskObjectives);
        setTaskObjectiveItemProgress(savedTaskObjectiveItemProgress);
        setHideoutItemQuantities(savedHideoutItemQuantities);
        setWorkingOnTasks(savedWorkingOnItems.tasks);
        setWorkingOnStorylineObjectives(
          savedWorkingOnItems.storylineObjectives,
        );
        setWorkingOnCollectorItems(savedWorkingOnItems.collectorItems);
        setWorkingOnHideoutStations(savedWorkingOnItems.hideoutStations);
        // Load player level from user preferences
        const savedPrefs = await taskStorage.loadUserPreferences();
        const loadedLevel = Number(savedPrefs.playerLevel);
        if (Number.isFinite(loadedLevel)) {
          setPlayerLevel(Math.max(1, loadedLevel));
        } else {
          setPlayerLevel(1);
        }
        // Notify components like NotesWidget to update their per-profile state
        window.dispatchEvent(new Event("taskTracker:profileChanged"));
      } catch (e) {
        console.error("Switch profile error", e);
      }
    },
    [activeProfileId],
  );

  const handleUpdateFaction = useCallback(
    (id: string, faction: "USEC" | "BEAR") => {
      updateProfileFaction(id, faction);
      setProfiles(getProfiles());
      if (id === activeProfileId) {
        setActiveProfileFaction(faction);
      }
    },
    [activeProfileId],
  );

  const handleUpdateEdition = useCallback(
    (id: string, edition: string) => {
      updateProfileEdition(id, edition);
      setProfiles(getProfiles());
      if (id === activeProfileId) {
        setActiveProfileEdition(edition);
      }
    },
    [activeProfileId],
  );

  const handleCreateProfile = useCallback(
    async (name?: string) => {
      const p = createProfile(name || "New Character");
      setProfiles(getProfiles());
      await handleSwitchProfile(p.id);
    },
    [handleSwitchProfile],
  );

  const handleRenameProfile = useCallback((id: string, name: string) => {
    renameProfile(id, name);
    setProfiles(getProfiles());
  }, []);

  const handleDeleteProfile = useCallback(
    async (id: string) => {
      const wasActive = id === activeProfileId;
      deleteProfile(id);
      const updated = getProfiles();
      setProfiles(updated);
      const nextActive = wasActive ? getActiveProfileId() : activeProfileId;
      if (wasActive) await handleSwitchProfile(nextActive);
    },
    [activeProfileId, handleSwitchProfile],
  );
  const mapList = useMemo(() => {
    const set = new Set<string>();
    tasksWithEvents.forEach((t) => {
      if (t.map?.name) set.add(t.map.name);
      t.maps?.forEach((map) => {
        if (map.name) set.add(map.name);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasksWithEvents]);

  // Calculate Kappa and Lightkeeper task totals
  const {
    totalKappaTasks,
    completedKappaTasks,
    totalLightkeeperTasks,
    completedLightkeeperTasks,
  } = useMemo(() => {
    const kappaTasks = baseTasks.filter((task) => task.kappaRequired);
    const lightkeeperTasks = baseTasks.filter(
      (task) => task.lightkeeperRequired,
    );

    return {
      totalKappaTasks: kappaTasks.length,
      completedKappaTasks: kappaTasks.filter((task) =>
        completedTasks.has(task.id),
      ).length,
      totalLightkeeperTasks: lightkeeperTasks.length,
      completedLightkeeperTasks: lightkeeperTasks.filter((task) =>
        completedTasks.has(task.id),
      ).length,
    };
  }, [baseTasks, completedTasks]);

  useEffect(() => {
    const init = async () => {
      try {
        let overlayLoaded = false;
        setLoadingStage(LOADING_STAGES.profiles);
        const ensured = ensureProfiles();
        setProfiles(ensured.profiles);
        setActiveProfileId(ensured.activeId);

        // One-time migrate legacy single-DB data into the first profile
        await migrateLegacyDataIfNeeded(ensured.activeId);

        // Migrate any data from "default" database (edge case from race conditions)
        await migrateDefaultDbIfNeeded(ensured.activeId);

        // Migrate legacy unscoped UI prefs to active profile if present
        try {
          const lvl = localStorage.getItem("taskTracker_playerLevel");
          const lvlScoped = localStorage.getItem(
            `taskTracker_playerLevel::${ensured.activeId}`,
          );
          if (lvl && !lvlScoped)
            localStorage.setItem(
              `taskTracker_playerLevel::${ensured.activeId}`,
              lvl,
            );
        } catch {
          /* ignore legacy migration errors */
        }
        try {
          const en = localStorage.getItem("taskTracker_enableLevelFilter");
          const enScoped = localStorage.getItem(
            `taskTracker_enableLevelFilter::${ensured.activeId}`,
          );
          if (en && !enScoped)
            localStorage.setItem(
              `taskTracker_enableLevelFilter::${ensured.activeId}`,
              en,
            );
        } catch {
          /* ignore legacy migration errors */
        }
        try {
          const sc = localStorage.getItem("taskTracker_showCompleted");
          const scScoped = localStorage.getItem(
            `taskTracker_showCompleted::${ensured.activeId}`,
          );
          if (sc && !scScoped)
            localStorage.setItem(
              `taskTracker_showCompleted::${ensured.activeId}`,
              sc,
            );
        } catch {
          /* ignore legacy migration errors */
        }

        setLoadingStage(LOADING_STAGES.local);
        taskStorage.setProfile(ensured.activeId);
        await taskStorage.init();
        const savedTasks = await taskStorage.loadCompletedTasks();
        const savedCollectorItems =
          await taskStorage.loadCompletedCollectorItems();
        const savedHideoutItems = await taskStorage.loadCompletedHideoutItems();
        const savedAchievements = await taskStorage.loadCompletedAchievements();
        const savedStorylineObjectives =
          await taskStorage.loadCompletedStorylineObjectives();
        const savedStorylineMapNodes =
          await taskStorage.loadCompletedStorylineMapNodes();
        const savedTaskObjectives =
          await taskStorage.loadCompletedTaskObjectives();
        const savedTaskObjectiveItemProgress =
          await taskStorage.loadTaskObjectiveItemProgress();
        const savedHideoutItemQuantities =
          await taskStorage.loadHideoutItemQuantities();
        const savedWorkingOnItems = await taskStorage.loadWorkingOnItems();
        setCompletedTasks(savedTasks);
        setCompletedCollectorItems(savedCollectorItems);
        setCompletedHideoutItems(savedHideoutItems);
        setCompletedAchievements(savedAchievements);
        setCompletedStorylineObjectives(savedStorylineObjectives);
        setCompletedStorylineMapNodes(savedStorylineMapNodes);
        setCompletedTaskObjectives(savedTaskObjectives);
        setTaskObjectiveItemProgress(savedTaskObjectiveItemProgress);
        setHideoutItemQuantities(savedHideoutItemQuantities);
        setWorkingOnTasks(savedWorkingOnItems.tasks);
        setWorkingOnStorylineObjectives(
          savedWorkingOnItems.storylineObjectives,
        );
        setWorkingOnCollectorItems(savedWorkingOnItems.collectorItems);
        setWorkingOnHideoutStations(savedWorkingOnItems.hideoutStations);
        setLoadingStage(LOADING_STAGES.prefs);
        // Load player level from user preferences (with migration from localStorage)
        const savedPrefs = await taskStorage.loadUserPreferences();
        let loadedLevel = Number(savedPrefs.playerLevel);
        if (!Number.isFinite(loadedLevel)) {
          // Migrate from localStorage if exists
          try {
            const lsLevel = localStorage.getItem(
              `taskTracker_playerLevel::${ensured.activeId}`,
            );
            if (lsLevel) {
              loadedLevel = Number(lsLevel);
              if (Number.isFinite(loadedLevel)) {
                await taskStorage.saveUserPreferences({
                  playerLevel: Math.max(1, loadedLevel),
                });
                localStorage.removeItem(
                  `taskTracker_playerLevel::${ensured.activeId}`,
                );
              }
            }
          } catch {
            /* ignore migration errors */
          }
        }
        if (Number.isFinite(loadedLevel)) {
          setPlayerLevel(Math.max(1, loadedLevel));
        } else {
          setPlayerLevel(1);
        }

        setLoadingStage(LOADING_STAGES.cacheCheck);
        // Load cached API data instantly if present
        const cached = loadCombinedCache();
        if (cached) {
          setLoadingStage(LOADING_STAGES.cacheApply);
          setAllTasks(cached.tasks.data.tasks);
          setApiCollectorItems(cached.collectorItems);
          setAchievements(cached.achievements.data.achievements);
          setHideoutStations(cached.hideoutStations.data.hideoutStations);
          setIsLoading(false);
        }

        const handleFetchStage = (stage: FetchStage) => {
          if (stage === "request") setLoadingStage(LOADING_STAGES.request);
          if (stage === "parse") setLoadingStage(LOADING_STAGES.parse);
          if (stage === "overlay-fetch")
            setLoadingStage(LOADING_STAGES.overlayFetch);
          if (stage === "overlay-apply")
            setLoadingStage(LOADING_STAGES.overlayApply);
          if (stage === "normalize") setLoadingStage(LOADING_STAGES.normalize);
          if (stage === "done") setLoadingStage(LOADING_STAGES.finalize);
        };

        const needsRefresh = !isCombinedCacheFresh();
        if (needsRefresh) {
          // Refresh in background; if no cache, this awaits to ensure UI has data
          try {
            const {
              tasks: tasksData,
              collectorItems: collectorData,
              achievements: achievementsData,
              hideoutStations,
              overlay: overlayData,
            } = await fetchCombinedData(handleFetchStage);
            setAllTasks(tasksData.data.tasks);
            setApiCollectorItems(collectorData);
            setAchievements(achievementsData.data.achievements);
            setHideoutStations(hideoutStations.data.hideoutStations);
            setOverlay(overlayData);
            overlayLoaded = true;
          } catch (err) {
            console.error("API refresh error", err);
            if (!cached) {
              // No cache and API failed → empty state
              setAllTasks([]);
              setApiCollectorItems(null);
              setAchievements([]);
            }
          } finally {
            if (!cached) setIsLoading(false);
          }
        } else if (!cached) {
          // Fresh cache was missing but TTL says fresh (edge) → fetch to populate and render
          try {
            const {
              tasks: tasksData,
              collectorItems: collectorData,
              achievements: achievementsData,
              hideoutStations,
              overlay: overlayData,
            } = await fetchCombinedData(handleFetchStage);
            setAllTasks(tasksData.data.tasks);
            setApiCollectorItems(collectorData);
            setAchievements(achievementsData.data.achievements);
            setHideoutStations(hideoutStations.data.hideoutStations);
            setOverlay(overlayData);
            overlayLoaded = true;
          } catch (err) {
            console.error("API fetch error", err);
            setAllTasks([]);
            setApiCollectorItems(null);
            setAchievements([]);
          } finally {
            setIsLoading(false);
          }
        }

        // If cache existed and was fresh, we're already rendered; nothing more to do.
        if (cached && !needsRefresh) {
          // noop
        }
        if (!overlayLoaded) {
          try {
            const overlayData = await fetchOverlay();
            setOverlay(overlayData);
          } catch (err) {
            console.warn("Overlay fetch error", err);
          }
        }
        // Ensure loading state is always cleared after initialization
        setIsLoading(false);
      } catch (err) {
        console.error("Init error", err);
        // Ensure UI doesn't get stuck loading on init errors
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  // // Persist playerLevel to IndexedDB when it changes
  // useEffect(() => {
  //   if (!activeProfileId) return;
  //   taskStorage.saveUserPreferences({ playerLevel }).catch(() => {
  //     // ignore persistence errors
  //   });
  // }, [playerLevel, activeProfileId]);

  // Compute "next" prestige progress (only one visible at a time)
  const [prestigeProgress, setPrestigeProgress] = useState<{
    id: string;
    completed: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        console.debug("[Prestige] App refresh summary:start");
        const current = await loadCurrentPrestigeSummary();
        setPrestigeProgress(current);
        console.debug("[Prestige] App refresh summary:done", current);
      } catch (e) {
        console.error("Prestige progress load error", e);
        setPrestigeProgress(null);
      }
    };

    refresh();
    const handler = (evt: Event) => {
      console.debug("[Prestige] App event received", evt);
      void refresh();
    };
    window.addEventListener(PRESTIGE_UPDATED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(
        PRESTIGE_UPDATED_EVENT,
        handler as EventListener,
      );
    };
  }, []);

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      if (!activeProfileId) return; // Don't save if profile not initialized
      const next = new Set(completedTasks);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        const depMap = buildTaskDependencyMap(tasksWithEvents);
        const deps = getAllDependencies(taskId, depMap);
        next.add(taskId);
        deps.forEach((id) => next.add(id));
      }
      setCompletedTasks(next);
      try {
        // Ensure taskStorage is using the correct profile before saving
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedTasks(next);
      } catch (err) {
        console.error("Save error", err);
      }
    },
    [completedTasks, tasksWithEvents, activeProfileId],
  );

  // Sidebar trader filter: multi-select toggle
  const handleToggleTraderVisibility = useCallback(
    (trader: string) => {
      const next = new Set(hiddenTraders);
      if (next.has(trader)) next.delete(trader);
      else next.add(trader);
      setHiddenTraders(next);
      setViewMode("grouped");
    },
    [hiddenTraders],
  );
  const handleClearTraderFilter = useCallback(() => {
    setHiddenTraders(new Set());
  }, []);
  const handleSelectMap = useCallback((map: string | null) => {
    setSelectedMap(map);
    setViewMode("grouped");
  }, []);

  // Focus mode derived state and setter for clearer UX
  const focusMode = showKappa
    ? "kappa"
    : showLightkeeper
      ? "lightkeeper"
      : "all";

  const handleSetFocus = useCallback(
    (mode: "all" | "kappa" | "lightkeeper") => {
      if (mode === "kappa") {
        setShowKappa(true);
        setShowLightkeeper(false);
      } else if (mode === "lightkeeper") {
        setShowKappa(false);
        setShowLightkeeper(true);
      } else {
        setShowKappa(false);
        setShowLightkeeper(false);
      }
    },
    [],
  );

  const handleToggleCollectorItem = useCallback(
    async (itemName: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedCollectorItems);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      setCompletedCollectorItems(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedCollectorItems(next);
      } catch (err) {
        console.error("Save collector items error", err);
      }
    },
    [completedCollectorItems, activeProfileId],
  );

  const handleToggleHideoutItem = useCallback(
    async (itemKey: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedHideoutItems);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      setCompletedHideoutItems(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedHideoutItems(next);
      } catch (err) {
        console.error("Save hideout items error", err);
      }
    },
    [completedHideoutItems, activeProfileId],
  );

  const handleSetHideoutItems = useCallback(
    async (items: Set<string>) => {
      if (!activeProfileId) return;
      setCompletedHideoutItems(items);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedHideoutItems(items);
      } catch (err) {
        console.error("Save hideout items error", err);
      }
    },
    [activeProfileId],
  );

  const handleToggleTaskObjective = useCallback(
    async (objectiveKey: string) => {
      if (!activeProfileId) return;
      const next = new Set(completedTaskObjectives);
      if (next.has(objectiveKey)) {
        next.delete(objectiveKey);
      } else {
        next.add(objectiveKey);
      }
      setCompletedTaskObjectives(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveCompletedTaskObjectives(next);
      } catch (err) {
        console.error("Save task objectives error", err);
      }
    },
    [completedTaskObjectives, activeProfileId],
  );

  const handleUpdateTaskObjectiveItemProgress = useCallback(
    (objectiveItemKey: string, count: number) => {
      if (!activeProfileId) return;
      setTaskObjectiveItemProgress((prev) => {
        const next = { ...prev };
        if (count <= 0) delete next[objectiveItemKey];
        else next[objectiveItemKey] = count;
        taskStorage.setProfile(activeProfileId);
        taskStorage
          .init()
          .then(() => taskStorage.saveTaskObjectiveItemProgress(next))
          .catch((err) => {
            console.error("Save task objective item progress error", err);
          });
        return next;
      });
    },
    [activeProfileId],
  );

  const handleUpdateHideoutItemQuantity = useCallback(
    (itemKey: string, count: number) => {
      if (!activeProfileId) return;
      setHideoutItemQuantities((prev) => {
        const next = { ...prev };
        if (count <= 0) delete next[itemKey];
        else next[itemKey] = count;
        taskStorage.setProfile(activeProfileId);
        taskStorage
          .init()
          .then(() => taskStorage.saveHideoutItemQuantities(next))
          .catch((err) => {
            console.error("Save hideout item quantities error", err);
          });
        return next;
      });
    },
    [activeProfileId],
  );

  // Working on toggle handlers
  const handleToggleWorkingOnTask = useCallback(
    async (taskId: string) => {
      if (!activeProfileId) return;
      const next = new Set(workingOnTasks);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      setWorkingOnTasks(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveWorkingOnItems({
          tasks: next,
          storylineObjectives: workingOnStorylineObjectives,
          collectorItems: workingOnCollectorItems,
          hideoutStations: workingOnHideoutStations,
        });
      } catch (err) {
        console.error("Save working on items error", err);
      }
    },
    [
      workingOnTasks,
      workingOnStorylineObjectives,
      workingOnCollectorItems,
      workingOnHideoutStations,
      activeProfileId,
    ],
  );

  const handleToggleWorkingOnStorylineObjective = useCallback(
    async (objectiveId: string) => {
      if (!activeProfileId) return;
      const next = new Set(workingOnStorylineObjectives);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      setWorkingOnStorylineObjectives(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveWorkingOnItems({
          tasks: workingOnTasks,
          storylineObjectives: next,
          collectorItems: workingOnCollectorItems,
          hideoutStations: workingOnHideoutStations,
        });
      } catch (err) {
        console.error("Save working on items error", err);
      }
    },
    [
      workingOnTasks,
      workingOnStorylineObjectives,
      workingOnCollectorItems,
      workingOnHideoutStations,
      activeProfileId,
    ],
  );

  const handleToggleWorkingOnHideoutStation = useCallback(
    async (stationKey: string) => {
      if (!activeProfileId) return;
      const next = new Set(workingOnHideoutStations);
      if (next.has(stationKey)) {
        next.delete(stationKey);
      } else {
        next.add(stationKey);
      }
      setWorkingOnHideoutStations(next);
      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();
        await taskStorage.saveWorkingOnItems({
          tasks: workingOnTasks,
          storylineObjectives: workingOnStorylineObjectives,
          collectorItems: workingOnCollectorItems,
          hideoutStations: next,
        });
      } catch (err) {
        console.error("Save working on items error", err);
      }
    },
    [
      workingOnTasks,
      workingOnStorylineObjectives,
      workingOnCollectorItems,
      workingOnHideoutStations,
      activeProfileId,
    ],
  );

  const handleResetProgress = useCallback(
    async (
      options?: import("@/components/SelectiveResetDialog").ResetOptions,
    ) => {
      if (!activeProfileId) return;

      // Determine which areas to reset (all if no options provided)
      const resetAll = !options;
      const resetStorylineQuests = resetAll || options.storylineQuests;
      const resetNormalTasks = resetAll || options.normalTasks;
      const resetHideoutItems = resetAll || options.hideoutItems;
      const resetCollectorItems = resetAll || options.collectorItems;
      const resetAchievements = resetAll || options.achievements;
      const resetPrestiges = resetAll || options.prestiges;
      const resetWorkingOnItems = resetAll || options.workingOnItems;

      // Reset state for selected areas
      if (resetNormalTasks) setCompletedTasks(new Set());
      if (resetNormalTasks) setTaskObjectiveItemProgress({});
      if (resetCollectorItems) setCompletedCollectorItems(new Set());
      if (resetHideoutItems) setCompletedHideoutItems(new Set());
      if (resetAchievements) setCompletedAchievements(new Set());
      if (resetStorylineQuests) {
        setCompletedStorylineObjectives(new Set());
        setCompletedStorylineMapNodes(new Set());
      }
      if (resetWorkingOnItems) {
        setWorkingOnTasks(new Set());
        setWorkingOnStorylineObjectives(new Set());
        setWorkingOnCollectorItems(new Set());
        setWorkingOnHideoutStations(new Set());
      }

      try {
        taskStorage.setProfile(activeProfileId);
        await taskStorage.init();

        // Save empty sets for selected areas
        if (resetNormalTasks) await taskStorage.saveCompletedTasks(new Set());
        if (resetNormalTasks)
          await taskStorage.saveTaskObjectiveItemProgress({});
        if (resetCollectorItems)
          await taskStorage.saveCompletedCollectorItems(new Set());
        if (resetHideoutItems)
          await taskStorage.saveCompletedHideoutItems(new Set());
        if (resetAchievements)
          await taskStorage.saveCompletedAchievements(new Set());
        if (resetStorylineQuests) {
          await taskStorage.saveCompletedStorylineObjectives(new Set());
          await taskStorage.saveCompletedStorylineMapNodes(new Set());
        }
        if (resetWorkingOnItems) {
          await taskStorage.clearWorkingOnItems();
        }

        // Reset prestige by saving empty entries per prestige id
        if (resetPrestiges) {
          for (const cfg of PRESTIGE_CONFIGS) {
            await taskStorage.savePrestigeProgress(cfg.id, {});
            console.debug("[Prestige] Reset:prestige saved empty", cfg.id);
          }
          // Notify listeners so UI refreshes immediately
          window.dispatchEvent(new Event(PRESTIGE_UPDATED_EVENT));
        }

        // Reset player level filter state only if resetting all or normal tasks
        if (resetAll || resetNormalTasks) {
          await taskStorage.saveUserPreferences({
            playerLevel: 1,
            enableLevelFilter: false,
          });
          window.dispatchEvent(new Event("taskTracker:reset"));
        }
      } catch (err) {
        console.error("Reset error", err);
      }
    },
    [activeProfileId],
  );

  // Check if onboarding should be shown (only once)
  useEffect(() => {
    const onboardingShown = localStorage.getItem(
      "taskTracker_onboarding_shown",
    );
    if (!onboardingShown && !isLoading) {
      setShowOnboarding(true);
    }
  }, [isLoading]);

  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("taskTracker_onboarding_shown", "true");
  }, []);

  // Handler for when import completes - reload all data from IndexedDB
  const handleImportComplete = useCallback(async () => {
    try {
      const savedTasks = await taskStorage.loadCompletedTasks();
      const savedCollectorItems =
        await taskStorage.loadCompletedCollectorItems();
      const savedHideoutItems = await taskStorage.loadCompletedHideoutItems();
      const savedAchievements = await taskStorage.loadCompletedAchievements();
      const savedStorylineObjectives =
        await taskStorage.loadCompletedStorylineObjectives();
      const savedStorylineMapNodes =
        await taskStorage.loadCompletedStorylineMapNodes();
      const savedTaskObjectives =
        await taskStorage.loadCompletedTaskObjectives();
      const savedTaskObjectiveItemProgress =
        await taskStorage.loadTaskObjectiveItemProgress();
      setCompletedTasks(savedTasks);
      setCompletedCollectorItems(savedCollectorItems);
      setCompletedHideoutItems(savedHideoutItems);
      setCompletedAchievements(savedAchievements);
      setCompletedStorylineObjectives(savedStorylineObjectives);
      setCompletedStorylineMapNodes(savedStorylineMapNodes);
      setCompletedTaskObjectives(savedTaskObjectives);
      setTaskObjectiveItemProgress(savedTaskObjectiveItemProgress);
      // Notify components like NotesWidget and PrestigesView to refresh
      window.dispatchEvent(new Event("taskTracker:profileChanged"));
      window.dispatchEvent(new Event(PRESTIGE_UPDATED_EVENT));
    } catch (e) {
      console.error("Import reload error", e);
    }
  }, []);

  // Handler for importing data into a new profile
  const handleImportAsNewProfile = useCallback(
    async (name: string, data: import("@/utils/indexedDB").ExportData) => {
      // Create the new profile
      const newProfile = createProfile(name);
      setProfiles(getProfiles());

      // Switch to the new profile
      setActiveProfileIdLS(newProfile.id);
      setActiveProfileId(newProfile.id);
      taskStorage.setProfile(newProfile.id);
      await taskStorage.init();

      // Import the data into the new profile
      await ExportImportService.importAllData(data);

      // Load the imported data into state
      const savedTasks = await taskStorage.loadCompletedTasks();
      const savedCollectorItems =
        await taskStorage.loadCompletedCollectorItems();
      const savedHideoutItems = await taskStorage.loadCompletedHideoutItems();
      const savedAchievements = await taskStorage.loadCompletedAchievements();
      const savedStorylineObjectives =
        await taskStorage.loadCompletedStorylineObjectives();
      const savedStorylineMapNodes =
        await taskStorage.loadCompletedStorylineMapNodes();
      const savedTaskObjectives =
        await taskStorage.loadCompletedTaskObjectives();
      const savedTaskObjectiveItemProgress =
        await taskStorage.loadTaskObjectiveItemProgress();
      setCompletedTasks(savedTasks);
      setCompletedCollectorItems(savedCollectorItems);
      setCompletedHideoutItems(savedHideoutItems);
      setCompletedAchievements(savedAchievements);
      setCompletedStorylineObjectives(savedStorylineObjectives);
      setCompletedStorylineMapNodes(savedStorylineMapNodes);
      setCompletedTaskObjectives(savedTaskObjectives);
      setTaskObjectiveItemProgress(savedTaskObjectiveItemProgress);

      // Notify components to refresh
      window.dispatchEvent(new Event("taskTracker:profileChanged"));
      window.dispatchEvent(new Event(PRESTIGE_UPDATED_EVENT));
    },
    [],
  );

  // Handler for importing all profiles from a bundle
  const handleImportAllProfiles = useCallback(
    async (data: import("@/utils/indexedDB").AllProfilesExportData) => {
      // Import each profile as a new profile with unique names
      for (const profileData of data.profiles) {
        // Create a new profile with a unique name to avoid duplicates
        const uniqueName = getUniqueProfileName(profileData.name);
        const newProfile = createProfile(uniqueName);

        // Switch to the new profile's database
        taskStorage.setProfile(newProfile.id);
        await taskStorage.init();

        // Import the data
        await ExportImportService.importAllData(profileData.data);
      }

      // Refresh the profiles list
      const updatedProfiles = getProfiles();
      setProfiles(updatedProfiles);

      // Switch to the most recently created profile (last in the list)
      const lastProfile = updatedProfiles[updatedProfiles.length - 1];
      if (lastProfile) {
        const targetProfile = lastProfile;
        {
          setActiveProfileIdLS(targetProfile.id);
          setActiveProfileId(targetProfile.id);
          taskStorage.setProfile(targetProfile.id);
          await taskStorage.init();

          // Load the data into state
          const savedTasks = await taskStorage.loadCompletedTasks();
          const savedCollectorItems =
            await taskStorage.loadCompletedCollectorItems();
          const savedHideoutItems =
            await taskStorage.loadCompletedHideoutItems();
          const savedAchievements =
            await taskStorage.loadCompletedAchievements();
          const savedStorylineObjectives =
            await taskStorage.loadCompletedStorylineObjectives();
          const savedStorylineMapNodes =
            await taskStorage.loadCompletedStorylineMapNodes();
          const savedTaskObjectives =
            await taskStorage.loadCompletedTaskObjectives();
          const savedTaskObjectiveItemProgress =
            await taskStorage.loadTaskObjectiveItemProgress();
          setCompletedTasks(savedTasks);
          setCompletedCollectorItems(savedCollectorItems);
          setCompletedHideoutItems(savedHideoutItems);
          setCompletedAchievements(savedAchievements);
          setCompletedStorylineObjectives(savedStorylineObjectives);
          setCompletedStorylineMapNodes(savedStorylineMapNodes);
          setCompletedTaskObjectives(savedTaskObjectives);
          setTaskObjectiveItemProgress(savedTaskObjectiveItemProgress);
        }
      }

      // Notify components to refresh
      window.dispatchEvent(new Event("taskTracker:profileChanged"));
      window.dispatchEvent(new Event(PRESTIGE_UPDATED_EVENT));
    },
    [],
  );

  const handleTaskClick = useCallback(
    (taskId: string) => {
      setHighlightedTask(taskId);
      setTimeout(() => setHighlightedTask(null), 2000);
      if (viewMode === "grouped") {
        document
          .getElementById(`task-${taskId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [viewMode],
  );

  // Derive which totals to display in the right Progress panel based on Focus mode
  const { displayTotalQuests, displayCompletedQuests } = useMemo(() => {
    if (focusMode === "kappa") {
      return {
        displayTotalQuests: totalKappaTasks,
        displayCompletedQuests: completedKappaTasks,
      };
    }
    if (focusMode === "lightkeeper") {
      return {
        displayTotalQuests: totalLightkeeperTasks,
        displayCompletedQuests: completedLightkeeperTasks,
      };
    }
    return {
      displayTotalQuests: totalQuests,
      displayCompletedQuests: completedQuests,
    };
  }, [
    focusMode,
    totalQuests,
    completedQuests,
    totalKappaTasks,
    completedKappaTasks,
    totalLightkeeperTasks,
    completedLightkeeperTasks,
  ]);

  const progressTitle = useMemo(() => {
    if (focusMode === "kappa") return "Kappa Progress";
    if (focusMode === "lightkeeper") return "Lightkeeper Progress";
    return "Progress Overview";
  }, [focusMode]);

  // Removed full-page loading screen - now showing skeleton layout instead

  return (
    <NuqsAdapter>
      <SEO />
      <SidebarProvider>
        <AppSidebar
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          onSetFocus={handleSetFocus}
          focusMode={focusMode}
          profiles={profiles}
          activeProfileId={activeProfileId}
          editions={editionOptions}
          activeEditionId={activeProfileEdition}
          onSwitchProfile={handleSwitchProfile}
          onCreateProfile={handleCreateProfile}
          onRenameProfile={handleRenameProfile}
          onUpdateFaction={handleUpdateFaction}
          onUpdateEdition={handleUpdateEdition}
          onDeleteProfile={handleDeleteProfile}
          onResetProfile={handleResetProgress}
          onImportComplete={handleImportComplete}
          onImportAsNewProfile={handleImportAsNewProfile}
          onImportAllProfiles={handleImportAllProfiles}
          traders={traderList}
          hiddenTraders={hiddenTraders}
          onToggleTraderVisibility={handleToggleTraderVisibility}
          onClearTraderFilter={handleClearTraderFilter}
          maps={mapList}
          selectedMap={selectedMap}
          onSelectMap={handleSelectMap}
          collectorGroupBy={collectorGroupBy}
          onSetCollectorGroupBy={setCollectorGroupBy}
          playerLevel={playerLevel}
          onSetPlayerLevel={handleSetPlayerLevel}
          side="left"
          isLoading={isLoading}
        />
        <SidebarInset>
          <div className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="px-2">
                <div className="flex flex-col gap-2 py-2 min-[988px]:grid min-[988px]:grid-cols-3 min-[988px]:items-center">
                  {/* Left: title + mobile actions */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <SidebarTrigger className="-ml-1" />
                      <h1 className="text-lg font-semibold truncate sm:text-xl min-[988px]:peer-data-[state=collapsed]:hidden">
                        {isMobile
                          ? "EFT Tracker"
                          : "Escape from Tarkov Task Tracker"}
                      </h1>
                      <span
                        className={cn(
                          "inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                          "bg-orange-600/10 text-orange-600 border-orange-600/20",
                        )}
                      >
                        BETA
                      </span>
                      <span className="hidden min-[988px]:inline-flex min-[988px]:peer-data-[state=collapsed]:hidden text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 border border-emerald-600/20">
                        Live API
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-[988px]:hidden">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          window.dispatchEvent(new Event("open-command-menu"))
                        }
                        aria-label="Search"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setProgressOpen(true)}
                        aria-label="View progress"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        aria-label="Refresh data"
                      >
                        <RotateCcw
                          className={cn(
                            "h-4 w-4",
                            isRefreshing && "animate-spin",
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Center: Focus segmented control */}
                  <div className="hidden min-[988px]:flex items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground">Focus</span>
                    <div className="flex items-center gap-1 p-1 rounded-full border bg-muted/30">
                      <Button
                        variant={focusMode === "all" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-full px-3"
                        onClick={() => handleSetFocus("all")}
                      >
                        All
                      </Button>
                      <Button
                        variant={focusMode === "kappa" ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "rounded-full px-3",
                          focusMode === "kappa"
                            ? "bg-violet-600 text-white hover:bg-violet-600"
                            : "text-violet-600 hover:text-violet-700 border border-violet-500/30",
                        )}
                        onClick={() => handleSetFocus("kappa")}
                      >
                        <span
                          className={cn(
                            "mr-2 h-2 w-2 rounded-full",
                            focusMode === "kappa"
                              ? "bg-white"
                              : "bg-violet-500",
                          )}
                          aria-hidden
                        />
                        Kappa
                      </Button>
                      <Button
                        variant={
                          focusMode === "lightkeeper" ? "default" : "ghost"
                        }
                        size="sm"
                        className={cn(
                          "rounded-full px-3",
                          focusMode === "lightkeeper"
                            ? "bg-amber-600 text-white hover:bg-amber-600"
                            : "text-amber-600 hover:text-amber-700 border border-amber-500/30",
                        )}
                        onClick={() => handleSetFocus("lightkeeper")}
                      >
                        <span
                          className={cn(
                            "mr-2 h-2 w-2 rounded-full",
                            focusMode === "lightkeeper"
                              ? "bg-white"
                              : "bg-amber-500",
                          )}
                          aria-hidden
                        />
                        Lightkeeper
                      </Button>
                    </div>
                  </div>

                  {/* Right: Search hint + Refresh */}
                  <div className="hidden min-[988px]:flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="pl-2 pr-2.5 gap-2"
                      onClick={() =>
                        window.dispatchEvent(new Event("open-command-menu"))
                      }
                    >
                      <Search className="h-4 w-4" />
                      <span className="text-xs text-muted-foreground">
                        Search
                      </span>
                      <span className="ml-1 hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded border bg-background">
                          Ctrl
                        </span>
                        <span className="px-1.5 py-0.5 rounded border bg-background">
                          K
                        </span>
                      </span>
                    </Button>
                    <span className="h-4 w-px bg-border/60" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="pl-2 pr-2.5 gap-2"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      aria-label="Refresh data"
                    >
                      <RotateCcw
                        className={cn(
                          "h-4 w-4",
                          isRefreshing && "animate-spin",
                        )}
                      />
                      <span className="text-xs">
                        {isRefreshing ? "Refreshing…" : "Refresh"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main + Right Progress */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Main Content */}
              <main
                className={cn(
                  "flex-1 min-h-0 bg-background relative",
                  viewMode === "grouped" ||
                    viewMode === "collector" ||
                    viewMode === "flow" ||
                    viewMode === "prestiges" ||
                    viewMode === "storyline" ||
                    viewMode === "current"
                    ? "overflow-y-auto"
                    : "overflow-hidden",
                )}
              >
                {/* Quests sub-tabs removed; view selection handled via sidebar */}
                {isLoading ? (
                  <ContentSkeleton />
                ) : (
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<ContentSkeleton />}>
                      {viewMode === "grouped" ? (
                        <CheckListView
                          key={`${activeProfileId}:${
                            activeProfileFaction ?? "none"
                          }`}
                          tasks={tasksWithEvents}
                          completedTasks={completedTasks}
                          hiddenTraders={hiddenTraders}
                          showKappa={showKappa}
                          showLightkeeper={showLightkeeper}
                          onToggleComplete={handleToggleComplete}
                          onTaskClick={handleTaskClick}
                          mapFilter={selectedMap}
                          groupBy={groupBy}
                          onSetGroupBy={setGroupBy}
                          activeProfileId={activeProfileId}
                          playerLevel={playerLevel}
                          workingOnTasks={workingOnTasks}
                          onToggleWorkingOnTask={handleToggleWorkingOnTask}
                          taskObjectiveItemProgress={taskObjectiveItemProgress}
                          onUpdateTaskObjectiveItemProgress={
                            handleUpdateTaskObjectiveItemProgress
                          }
                        />
                      ) : viewMode === "collector" ? (
                        <CollectorView
                          collectorItems={collectorItems}
                          completedCollectorItems={completedCollectorItems}
                          onToggleCollectorItem={handleToggleCollectorItem}
                          completedHideoutItems={completedHideoutItems}
                          onSetHideoutItems={handleSetHideoutItems}
                          groupBy={collectorGroupBy}
                          hideoutStations={hideoutStations}
                          workingOnHideoutStations={workingOnHideoutStations}
                          onToggleWorkingOnHideoutStation={
                            handleToggleWorkingOnHideoutStation
                          }
                          hideoutItemQuantities={hideoutItemQuantities}
                          onUpdateHideoutItemQuantity={
                            handleUpdateHideoutItemQuantity
                          }
                        />
                      ) : viewMode === "prestiges" ? (
                        <PrestigesView />
                      ) : viewMode === "achievements" ? (
                        <AchievementsView
                          achievements={achievements}
                          completed={completedAchievements}
                          onToggle={handleToggleAchievement}
                        />
                      ) : viewMode === "storyline" ? (
                        <StorylineQuestsView
                          completedObjectives={completedStorylineObjectives}
                          onToggleObjective={handleToggleStorylineObjective}
                          onSetCompletedObjectives={
                            handleSetCompletedStorylineObjectives
                          }
                          onNavigateToMap={() => setViewMode("storyline-map")}
                          workingOnStorylineObjectives={
                            workingOnStorylineObjectives
                          }
                          onToggleWorkingOnStorylineObjective={
                            handleToggleWorkingOnStorylineObjective
                          }
                        />
                      ) : viewMode === "storyline-map" ? (
                        <StorylineContainer
                          completedNodes={completedStorylineMapNodes}
                          onToggleNode={handleToggleStorylineMapNode}
                          onBack={() => setViewMode("storyline")}
                          viewMode={storylineView}
                          selectedEndingId={selectedEndingId}
                          onViewChange={(newView, endingId) => {
                            setStorylineView(newView);
                            setSelectedEndingId(endingId || null);
                          }}
                        />
                      ) : viewMode === "hideout-requirements" ? (
                        <HideoutRequirementsView
                          hideoutStations={hideoutStations}
                          completedHideoutItems={completedHideoutItems}
                          onNavigateToStation={(stationName) => {
                            setCollectorGroupBy("hideout-stations");
                            setViewMode("collector");
                            // Use setTimeout to ensure view switches before search
                            setTimeout(() => {
                              window.dispatchEvent(
                                new CustomEvent("taskTracker:globalSearch", {
                                  detail: { term: stationName, scope: "items" },
                                }),
                              );
                            }, 100);
                          }}
                        />
                      ) : viewMode === "current" ? (
                        <CurrentlyWorkingOnView
                          tasks={tasks}
                          workingOnTasks={workingOnTasks}
                          workingOnStorylineObjectives={
                            workingOnStorylineObjectives
                          }
                          workingOnHideoutStations={workingOnHideoutStations}
                          collectorItems={collectorItems}
                          hideoutStations={hideoutStations}
                          completedCollectorItems={completedCollectorItems}
                          completedTasks={completedTasks}
                          completedStorylineObjectives={
                            completedStorylineObjectives
                          }
                          completedHideoutItems={completedHideoutItems}
                          playerLevel={playerLevel}
                          onToggleWorkingOnTask={handleToggleWorkingOnTask}
                          onToggleWorkingOnStorylineObjective={
                            handleToggleWorkingOnStorylineObjective
                          }
                          onToggleCollectorItem={handleToggleCollectorItem}
                          onToggleWorkingOnHideoutStation={
                            handleToggleWorkingOnHideoutStation
                          }
                          onToggleTask={handleToggleComplete}
                          onToggleStorylineObjective={
                            handleToggleStorylineObjective
                          }
                          onToggleHideoutItem={handleToggleHideoutItem}
                          completedTaskObjectives={completedTaskObjectives}
                          onToggleTaskObjective={handleToggleTaskObjective}
                          taskObjectiveItemProgress={taskObjectiveItemProgress}
                          onUpdateTaskObjectiveItemProgress={
                            handleUpdateTaskObjectiveItemProgress
                          }
                          hideoutItemQuantities={hideoutItemQuantities}
                          onUpdateHideoutItemQuantity={
                            handleUpdateHideoutItemQuantity
                          }
                        />
                      ) : viewMode === "flow" ? (
                        <FlowView
                          tasks={tasks}
                          completedTasks={completedTasks}
                          hiddenTraders={hiddenTraders}
                          showKappa={showKappa}
                          showLightkeeper={showLightkeeper}
                          onToggleComplete={handleToggleComplete}
                          highlightedTaskId={highlightedTask}
                        />
                      ) : (
                        <MindMap
                          tasks={tasks}
                          completedTasks={completedTasks}
                          hiddenTraders={hiddenTraders}
                          showKappa={showKappa}
                          showLightkeeper={showLightkeeper}
                          onToggleComplete={handleToggleComplete}
                          highlightedTaskId={highlightedTask}
                        />
                      )}
                    </Suspense>
                  </LazyLoadErrorBoundary>
                )}
              </main>

              {/* Right Progress */}
              <LegacySidebar
                position="right"
                header={
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Progress
                  </div>
                }
                headerIcon={<BarChart3 className="h-4 w-4" />}
                defaultCollapsed={false}
                width="20rem"
                collapsedWidth="3rem"
                className="hidden min-[988px]:flex"
              >
                <div className="p-2 space-y-3">
                  <QuestProgressPanel
                    totalQuests={displayTotalQuests}
                    completedQuests={displayCompletedQuests}
                    traders={traderProgress}
                    totalCollectorItems={collectorItems.length}
                    completedCollectorItems={completedCollectorItems.size}
                    totalKappaTasks={totalKappaTasks}
                    completedKappaTasks={completedKappaTasks}
                    totalLightkeeperTasks={totalLightkeeperTasks}
                    completedLightkeeperTasks={completedLightkeeperTasks}
                    totalAchievements={achievements.length}
                    completedAchievements={completedAchievements.size}
                    totalStorylineObjectives={totalStorylineObjectives}
                    completedStorylineObjectives={completedStorylineCount}
                    totalPrestigeSteps={prestigeProgress?.total}
                    completedPrestigeSteps={prestigeProgress?.completed}
                    currentPrestigeId={prestigeProgress?.id}
                    progressTitle={progressTitle}
                    isLoading={isLoading}
                  />
                </div>
              </LegacySidebar>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <CommandMenu
        viewMode={viewMode}
        groupBy={groupBy}
        collectorGroupBy={collectorGroupBy}
        traders={traderList}
        hiddenTraders={hiddenTraders}
        maps={mapList}
        selectedMap={selectedMap}
        tasks={tasksWithEvents}
        achievements={achievements}
        collectorItems={collectorItems}
        hideoutStations={hideoutStations}
        completedTasks={completedTasks}
        onSetViewMode={setViewMode}
        onSetGroupBy={setGroupBy}
        onSetCollectorGroupBy={setCollectorGroupBy}
        onClearTraderFilter={handleClearTraderFilter}
        onToggleTraderVisibility={handleToggleTraderVisibility}
        onSelectMap={handleSelectMap}
      />
      <NotesWidget />
      <Sheet open={progressOpen} onOpenChange={setProgressOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto p-0"
        >
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>Progress Overview</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 pt-3">
            <QuestProgressPanel
              totalQuests={displayTotalQuests}
              completedQuests={displayCompletedQuests}
              traders={traderProgress}
              totalCollectorItems={collectorItems.length}
              completedCollectorItems={completedCollectorItems.size}
              totalKappaTasks={totalKappaTasks}
              completedKappaTasks={completedKappaTasks}
              totalLightkeeperTasks={totalLightkeeperTasks}
              completedLightkeeperTasks={completedLightkeeperTasks}
              totalAchievements={achievements.length}
              completedAchievements={completedAchievements.size}
              totalStorylineObjectives={totalStorylineObjectives}
              completedStorylineObjectives={completedStorylineCount}
              totalPrestigeSteps={prestigeProgress?.total}
              completedPrestigeSteps={prestigeProgress?.completed}
              currentPrestigeId={prestigeProgress?.id}
              progressTitle={progressTitle}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </NuqsAdapter>
  );
}

export default App;
