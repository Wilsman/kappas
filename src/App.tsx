import { useState, useEffect, useMemo, useCallback } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useIsMobile } from "./hooks/use-mobile";
import { RotateCcw, BarChart3, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { Task, CollectorItemsData, Achievement, HideoutStation } from "./types";
import { MindMap } from "./components/MindMap";
import { FlowView } from "./components/FlowView";
import { QuestProgressPanel } from "./components/QuestProgressPanel";
import { taskStorage, migrateLegacyDataIfNeeded } from "./utils/indexedDB";
import {
  ensureProfiles,
  getProfiles,
  getActiveProfileId,
  setActiveProfileId as setActiveProfileIdLS,
  createProfile,
  renameProfile,
  deleteProfile,
  type Profile,
} from "@/utils/profile";
import {
  loadCurrentPrestigeSummary,
  PRESTIGE_UPDATED_EVENT,
  PRESTIGE_CONFIGS,
} from "@/utils/prestige";
import { buildTaskDependencyMap, getAllDependencies } from "./utils/taskUtils";
import { fetchCombinedData, loadCombinedCache, isCombinedCacheFresh } from "./services/tarkovApi";
import { cn } from "@/lib/utils";
import { Button } from "./components/ui/button";
import { TRADER_COLORS } from "./data/traders";
import { Sidebar as LegacySidebar } from "./components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { CheckListView } from './components/CheckListView';
import { CollectorView } from './components/ItemTrackerView';
import { PrestigesView } from './components/PrestigesView';
import { AchievementsView } from './components/AchievementsView';
import { CommandMenu } from './components/CommandMenu';
import { NotesWidget } from './components/NotesWidget';
import { OnboardingModal } from './components/OnboardingModal';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completedCollectorItems, setCompletedCollectorItems] = useState<
    Set<string>
  >(new Set());
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(
    new Set(["Ref", "Fence", "BTR Driver", "Lightkeeper"])
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const { tasks: tasksData, collectorItems: collectorData, achievements: achievementsData, hideoutStations } = await fetchCombinedData();
      setTasks(tasksData.data.tasks);
      setApiCollectorItems(collectorData);
      setAchievements(achievementsData.data.achievements);
      setHideoutStations(hideoutStations.data.hideoutStations);
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

  // Transform collector items data to match the expected structure (Live API only)
  const collectorItems = useMemo(() => {
    if (!apiCollectorItems) return [] as { name: string; order: number; img: string; id: string }[];
    return apiCollectorItems.data.task.objectives.flatMap((objective) =>
      objective.items.map((item) => ({
        name: item.name,
        order: 0,
        img: item.iconLink || "",
        id: item.id,
      }))
    );
  }, [apiCollectorItems]);

  const [viewMode, setViewMode] = useState<
    "tree" | "grouped" | "collector" | "flow" | "prestiges" | "achievements"
  >("grouped");
  const [groupBy, setGroupBy] = useState<"trader" | "map">("trader");
  const [collectorGroupBy, setCollectorGroupBy] = useState<"collector" | "hideout-stations">("collector");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Always use checklist on mobile
  useEffect(() => {
    if (isMobile) setViewMode("grouped");
  }, [isMobile]);
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [completedAchievements, setCompletedAchievements] = useState<Set<string>>(new Set());
  const [hideoutStations, setHideoutStations] = useState<HideoutStation[]>([]);

  // Lightweight client-side routing for deep links like /Items/CollectorItems?search=...
  function normalizePath(pathname: string) {
    return pathname.replace(/\/+$/, "");
  }
  function parsePath(pathname: string) {
    const parts = normalizePath(pathname).split("/").filter(Boolean).map(p => p.toLowerCase());
    // Defaults
    let nextView: typeof viewMode = "grouped";
    let nextCollectorGroupBy: typeof collectorGroupBy | undefined;

    if (parts.length === 0) {
      // root -> default to Quests Checklist
      nextView = "grouped";
    } else if (parts[0] === "quests") {
      // Both /Quests and /Quests/Checklist route to grouped checklist
      nextView = "grouped";
    } else if (parts[0] === "items") {
      nextView = "collector";
      if (parts[1] === "collectoritems") nextCollectorGroupBy = "collector";
      else if (parts[1] === "hideoutstations") nextCollectorGroupBy = "hideout-stations";
    } else if (parts[0] === "prestiges") {
      nextView = "prestiges";
    } else if (parts[0] === "achievements") {
      nextView = "achievements";
    }

    return { nextView, nextCollectorGroupBy };
  }
  // buildPath removed in favor of inlined computation inside effect

  // On initial load + popstate: sync state from URL path
  useEffect(() => {
    const applyFromLocation = () => {
      const { pathname } = window.location;
      const { nextView, nextCollectorGroupBy } = parsePath(pathname);
      setViewMode(nextView);
      if (nextCollectorGroupBy) setCollectorGroupBy(nextCollectorGroupBy);
    };
    applyFromLocation();
    // Normalize root or /Quests to canonical /Quests/Checklist, preserving query
    const { pathname: initialPathname, search: initialSearch } = window.location;
    if (initialPathname === "/" || /^\/quests\/?$/i.test(initialPathname)) {
      window.history.replaceState(null, "", `/Quests/Checklist${initialSearch}`);
    }
    const onPop = () => applyFromLocation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When state changes via UI, update the path (preserving existing query string like ?search=...)
  useEffect(() => {
    let nextPath = "/Quests/Checklist";
    if (viewMode === "grouped") {
      // Canonical checklist URL no longer encodes groupBy
      nextPath = "/Quests/Checklist";
    } else if (viewMode === "collector") {
      nextPath = collectorGroupBy === "hideout-stations" ? "/Items/HideoutStations" : "/Items/CollectorItems";
    } else if (viewMode === "prestiges") {
      nextPath = "/Prestiges";
    } else if (viewMode === "achievements") {
      nextPath = "/Achievements";
    } else if (viewMode === "flow") {
      nextPath = "/Quests/Flow";
    } else if (viewMode === "tree") {
      nextPath = "/Quests/Tree";
    }
    const current = normalizePath(window.location.pathname);
    if (normalizePath(nextPath) !== current) {
      // Clear query string (e.g., ?search=...) when navigating to a new view/tab
      window.history.pushState(null, "", nextPath);
    }
  }, [viewMode, groupBy, collectorGroupBy]);

  // Extra guard: if any view/group change occurs, strip lingering ?search from current URL
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [viewMode, groupBy, collectorGroupBy]);

  const handleToggleAchievement = useCallback(
    async (id: string) => {
      const next = new Set(completedAchievements);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCompletedAchievements(next);
      try {
        await taskStorage.saveCompletedAchievements(next);
      } catch (err) {
        console.error("Save achievements error", err);
      }
    },
    [completedAchievements]
  );

  const totalQuests = tasks.length;
  const completedQuests = completedTasks.size;

  // Build progress data for QuestProgressPanel
  const traderProgress = useMemo(() => {
    type TP = { completed: number; total: number; imageLink?: string };
    const map = Object.fromEntries(
      Object.keys(TRADER_COLORS).map((name) => [
        name,
        { completed: 0, total: 0, imageLink: undefined } as TP,
      ])
    ) as Record<keyof typeof TRADER_COLORS, TP>;

    tasks.forEach(({ trader: { name, imageLink }, id }) => {
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
      })
    );
  }, [tasks, completedTasks]);

  // Derived lists for sidebar
  const traderList = useMemo(
    () => Object.keys(TRADER_COLORS),
    []
  );

  // Profile actions
  const handleSwitchProfile = useCallback(async (id: string) => {
    if (!id || id === activeProfileId) return;
    setActiveProfileIdLS(id);
    setActiveProfileId(id);
    try {
      try { (document.activeElement as HTMLElement | null)?.blur?.() } catch { /* ignore blur errors */ }
      taskStorage.setProfile(id);
      await taskStorage.init();
      const savedTasks = await taskStorage.loadCompletedTasks();
      const savedCollectorItems = await taskStorage.loadCompletedCollectorItems();
      const savedAchievements = await taskStorage.loadCompletedAchievements();
      setCompletedTasks(savedTasks);
      setCompletedCollectorItems(savedCollectorItems);
      setCompletedAchievements(savedAchievements);
      // Notify components like NotesWidget to update their per-profile state
      window.dispatchEvent(new Event('taskTracker:profileChanged'));
    } catch (e) {
      console.error('Switch profile error', e);
    }
  }, [activeProfileId]);

  const handleCreateProfile = useCallback(async (name?: string) => {
    const p = createProfile(name || 'New Character');
    setProfiles(getProfiles());
    await handleSwitchProfile(p.id);
  }, [handleSwitchProfile]);

  const handleRenameProfile = useCallback((id: string, name: string) => {
    renameProfile(id, name);
    setProfiles(getProfiles());
  }, []);

  const handleDeleteProfile = useCallback(async (id: string) => {
    const wasActive = id === activeProfileId;
    deleteProfile(id);
    const updated = getProfiles();
    setProfiles(updated);
    const nextActive = wasActive ? getActiveProfileId() : activeProfileId;
    if (wasActive) await handleSwitchProfile(nextActive);
  }, [activeProfileId, handleSwitchProfile]);
  const mapList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.map?.name && set.add(t.map.name));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  // Calculate Kappa and Lightkeeper task totals
  const {
    totalKappaTasks,
    completedKappaTasks,
    totalLightkeeperTasks,
    completedLightkeeperTasks,
  } = useMemo(() => {
    const kappaTasks = tasks.filter((task) => task.kappaRequired);
    const lightkeeperTasks = tasks.filter((task) => task.lightkeeperRequired);

    return {
      totalKappaTasks: kappaTasks.length,
      completedKappaTasks: kappaTasks.filter((task) =>
        completedTasks.has(task.id)
      ).length,
      totalLightkeeperTasks: lightkeeperTasks.length,
      completedLightkeeperTasks: lightkeeperTasks.filter((task) =>
        completedTasks.has(task.id)
      ).length,
    };
  }, [tasks, completedTasks]);

  useEffect(() => {
    const init = async () => {
      try {
        const ensured = ensureProfiles();
        setProfiles(ensured.profiles);
        setActiveProfileId(ensured.activeId);

        // One-time migrate legacy single-DB data into the first profile
        await migrateLegacyDataIfNeeded(ensured.activeId);

        // Migrate legacy unscoped UI prefs to active profile if present
        try {
          const lvl = localStorage.getItem('taskTracker_playerLevel');
          const lvlScoped = localStorage.getItem(`taskTracker_playerLevel::${ensured.activeId}`);
          if (lvl && !lvlScoped) localStorage.setItem(`taskTracker_playerLevel::${ensured.activeId}`, lvl);
        } catch { /* ignore legacy migration errors */ }
        try {
          const en = localStorage.getItem('taskTracker_enableLevelFilter');
          const enScoped = localStorage.getItem(`taskTracker_enableLevelFilter::${ensured.activeId}`);
          if (en && !enScoped) localStorage.setItem(`taskTracker_enableLevelFilter::${ensured.activeId}`, en);
        } catch { /* ignore legacy migration errors */ }
        try {
          const sc = localStorage.getItem('taskTracker_showCompleted');
          const scScoped = localStorage.getItem(`taskTracker_showCompleted::${ensured.activeId}`);
          if (sc && !scScoped) localStorage.setItem(`taskTracker_showCompleted::${ensured.activeId}`, sc);
        } catch { /* ignore legacy migration errors */ }

        taskStorage.setProfile(ensured.activeId);
        await taskStorage.init();
        const savedTasks = await taskStorage.loadCompletedTasks();
        const savedCollectorItems = await taskStorage.loadCompletedCollectorItems();
        const savedAchievements = await taskStorage.loadCompletedAchievements();
        setCompletedTasks(savedTasks);
        setCompletedCollectorItems(savedCollectorItems);
        setCompletedAchievements(savedAchievements);

        // Load cached API data instantly if present
        const cached = loadCombinedCache();
        if (cached) {
          setTasks(cached.tasks.data.tasks);
          setApiCollectorItems(cached.collectorItems);
          setAchievements(cached.achievements.data.achievements);
          setHideoutStations(cached.hideoutStations.data.hideoutStations);
          setIsLoading(false);
        }

        const needsRefresh = !isCombinedCacheFresh();
        if (needsRefresh) {
          // Refresh in background; if no cache, this awaits to ensure UI has data
          try {
            const { tasks: tasksData, collectorItems: collectorData, achievements: achievementsData, hideoutStations } = await fetchCombinedData();
            setTasks(tasksData.data.tasks);
            setApiCollectorItems(collectorData);
            setAchievements(achievementsData.data.achievements);
            setHideoutStations(hideoutStations.data.hideoutStations);
          } catch (err) {
            console.error("API refresh error", err);
            if (!cached) {
              // No cache and API failed → empty state
              setTasks([]);
              setApiCollectorItems(null);
              setAchievements([]);
            }
          } finally {
            if (!cached) setIsLoading(false);
          }
        } else if (!cached) {
          // Fresh cache was missing but TTL says fresh (edge) → fetch to populate and render
          try {
            const { tasks: tasksData, collectorItems: collectorData, achievements: achievementsData, hideoutStations } = await fetchCombinedData();
            setTasks(tasksData.data.tasks);
            setApiCollectorItems(collectorData);
            setAchievements(achievementsData.data.achievements);
            setHideoutStations(hideoutStations.data.hideoutStations);
          } catch (err) {
            console.error("API fetch error", err);
            setTasks([]);
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
      } catch (err) {
        console.error("Init error", err);
        // Ensure UI doesn't get stuck loading on init errors
        setIsLoading(false);
      }
    };
    void init();
  }, []);

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
        handler as EventListener
      );
    };
  }, []);

  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      const next = new Set(completedTasks);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        const depMap = buildTaskDependencyMap(tasks);
        const deps = getAllDependencies(taskId, depMap);
        next.add(taskId);
        deps.forEach((id) => next.add(id));
      }
      setCompletedTasks(next);
      try {
        await taskStorage.saveCompletedTasks(next);
      } catch (err) {
        console.error("Save error", err);
      }
    },
    [completedTasks, tasks]
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
    [hiddenTraders]
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
    []
  );

  const handleToggleCollectorItem = useCallback(
    async (itemName: string) => {
      const next = new Set(completedCollectorItems);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      setCompletedCollectorItems(next);
      try {
        await taskStorage.saveCompletedCollectorItems(next);
      } catch (err) {
        console.error("Save collector items error", err);
      }
    },
    [completedCollectorItems]
  );

  const handleResetProgress = useCallback(async () => {
    setCompletedTasks(new Set());
    setCompletedCollectorItems(new Set());
    setCompletedAchievements(new Set());
    try {
      console.debug("[Prestige] Reset:start");
      await taskStorage.saveCompletedTasks(new Set());
      await taskStorage.saveCompletedCollectorItems(new Set());
      await taskStorage.saveCompletedAchievements(new Set());
      // Reset prestige by saving empty entries per prestige id, mirroring other save-based resets
      for (const cfg of PRESTIGE_CONFIGS) {
        await taskStorage.savePrestigeProgress(cfg.id, {});
        console.debug("[Prestige] Reset:prestige saved empty", cfg.id);
      }
      // Notify listeners so UI refreshes immediately
      window.dispatchEvent(new Event(PRESTIGE_UPDATED_EVENT));
      // Also reset player level filter state persisted in localStorage and notify listeners
      try {
        localStorage.setItem(`taskTracker_playerLevel::${activeProfileId}`, '1');
        localStorage.setItem(`taskTracker_enableLevelFilter::${activeProfileId}`, '0');
      } catch (e) {
        console.warn('LocalStorage reset failed', e);
      }
      window.dispatchEvent(new Event('taskTracker:reset'));
      console.debug("[Prestige] Reset:event dispatched");
    } catch (err) {
      console.error("Reset error", err);
    }
  }, [activeProfileId]);

  // Check if onboarding should be shown (only once)
  useEffect(() => {
    const onboardingShown = localStorage.getItem('taskTracker_onboarding_shown');
    if (!onboardingShown && !isLoading) {
      setShowOnboarding(true);
    }
  }, [isLoading]);

  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('taskTracker_onboarding_shown', 'true');
  }, []);

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
    [viewMode]
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
  }, [focusMode, totalQuests, completedQuests, totalKappaTasks, completedKappaTasks, totalLightkeeperTasks, completedLightkeeperTasks]);

  const progressTitle = useMemo(() => {
    if (focusMode === "kappa") return "Kappa Progress";
    if (focusMode === "lightkeeper") return "Lightkeeper Progress";
    return "Progress Overview";
  }, [focusMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <TextShimmerWave
            as="h1"
            className="text-2xl md:text-3xl font-semibold tracking-wide"
            duration={1}
            zDistance={120}
            xDistance={30}
            yDistance={-30}
            spread={1.2}
            scaleDistance={1.2}
            rotateYDistance={12}
          >
            Loading... Making donuts
          </TextShimmerWave>
          <Progress value={66} className="w-[240px] h-2" />
          <p className="text-xs text-muted-foreground">
            Fetching quests and items…
          </p>
        </div>
      </div>
    );
  }

  return (
    <NuqsAdapter>
      <SidebarProvider>
        <AppSidebar
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          onSetFocus={handleSetFocus}
          focusMode={focusMode}
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSwitchProfile={handleSwitchProfile}
          onCreateProfile={handleCreateProfile}
          onRenameProfile={handleRenameProfile}
          onDeleteProfile={handleDeleteProfile}
          traders={traderList}
          hiddenTraders={hiddenTraders}
          onToggleTraderVisibility={handleToggleTraderVisibility}
          onClearTraderFilter={handleClearTraderFilter}
          maps={mapList}
          selectedMap={selectedMap}
          onSelectMap={handleSelectMap}
          collectorGroupBy={collectorGroupBy}
          onSetCollectorGroupBy={setCollectorGroupBy}
          side="left"
        />
        <SidebarInset>
          <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="px-2">
                <div className="grid grid-cols-3 items-center gap-3 py-2">
                  {/* Left: title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold truncate md:peer-data-[state=collapsed]:hidden">
                      {isMobile ? "EFT Tracker" : "Escape from Tarkov Task Tracker"}
                    </h1>
                    <span className="hidden md:inline-flex md:peer-data-[state=collapsed]:hidden text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 border border-emerald-600/20">
                      Live API
                    </span>
                  </div>

                  {/* Center: Focus segmented control */}
                  <div className="hidden md:flex items-center justify-center gap-2">
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
                            : "text-violet-600 hover:text-violet-700 border border-violet-500/30"
                        )}
                        onClick={() => handleSetFocus("kappa")}
                      >
                        <span
                          className={cn(
                            "mr-2 h-2 w-2 rounded-full",
                            focusMode === "kappa" ? "bg-white" : "bg-violet-500"
                          )}
                          aria-hidden
                        />
                        Kappa
                      </Button>
                      <Button
                        variant={focusMode === "lightkeeper" ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "rounded-full px-3",
                          focusMode === "lightkeeper"
                            ? "bg-amber-600 text-white hover:bg-amber-600"
                            : "text-amber-600 hover:text-amber-700 border border-amber-500/30"
                        )}
                        onClick={() => handleSetFocus("lightkeeper")}
                      >
                        <span
                          className={cn(
                            "mr-2 h-2 w-2 rounded-full",
                            focusMode === "lightkeeper" ? "bg-white" : "bg-amber-500"
                          )}
                          aria-hidden
                        />
                        Lightkeeper
                      </Button>
                    </div>
                  </div>

                  {/* Right: Search hint + Refresh */}
                  <div className="hidden md:flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="pl-2 pr-2.5 gap-2"
                      onClick={() => window.dispatchEvent(new Event("open-command-menu"))}
                    >
                      <Search className="h-4 w-4" />
                      <span className="text-xs text-muted-foreground">Search</span>
                      <span className="ml-1 hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded border bg-background">Ctrl</span>
                        <span className="px-1.5 py-0.5 rounded border bg-background">K</span>
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
                      <RotateCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                      <span className="text-xs">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main + Right Progress */}
            <div className="flex flex-1 overflow-hidden">
              {/* Main Content */}
              <main
                className={cn(
                  "flex-1 bg-background relative",
                  viewMode === "grouped" ||
                    viewMode === "collector" ||
                    viewMode === "flow" ||
                    viewMode === "prestiges"
                    ? "overflow-y-auto"
                    : "overflow-hidden"
                )}
              >
                {/* Quests sub-tabs removed; view selection handled via sidebar */}
                {viewMode === "grouped" ? (
                  <CheckListView
                    tasks={tasks}
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
                  />
                ) : viewMode === "collector" ? (
                  <CollectorView
                    collectorItems={collectorItems}
                    completedCollectorItems={completedCollectorItems}
                    onToggleCollectorItem={handleToggleCollectorItem}
                    groupBy={collectorGroupBy}
                    hideoutStations={hideoutStations}
                  />
                ) : viewMode === "prestiges" ? (
                  <PrestigesView />
                ) : viewMode === "achievements" ? (
                  <AchievementsView
                    achievements={achievements}
                    completed={completedAchievements}
                    onToggle={handleToggleAchievement}
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
                defaultCollapsed={false}
                width="20rem"
                collapsedWidth="3rem"
                className="hidden md:flex"
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
                    totalPrestigeSteps={prestigeProgress?.total}
                    completedPrestigeSteps={prestigeProgress?.completed}
                    currentPrestigeId={prestigeProgress?.id}
                    progressTitle={progressTitle}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Progress
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset all completed tasks and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetProgress}>
                          Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
        tasks={tasks}
        achievements={achievements}
        collectorItems={collectorItems}
        hideoutStations={hideoutStations}
        onSetViewMode={setViewMode}
        onSetGroupBy={setGroupBy}
        onSetCollectorGroupBy={setCollectorGroupBy}
        onClearTraderFilter={handleClearTraderFilter}
        onToggleTraderVisibility={handleToggleTraderVisibility}
        onSelectMap={handleSelectMap}
      />
      <NotesWidget />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />
    </NuqsAdapter>
  );
}

export default App;
