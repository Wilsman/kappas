import { useState, useEffect, useMemo, useCallback } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useIsMobile } from "./hooks/use-mobile";
import { RotateCcw, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { Task, CollectorItemsData, Achievement } from "./types";
import { MindMap } from "./components/MindMap";
import { FlowView } from "./components/FlowView";
import { QuestProgressPanel } from "./components/QuestProgressPanel";
import { taskStorage } from "./utils/indexedDB";
import {
  loadCurrentPrestigeSummary,
  PRESTIGE_UPDATED_EVENT,
  PRESTIGE_CONFIGS,
} from "@/utils/prestige";
import { buildTaskDependencyMap, getAllDependencies } from "./utils/taskUtils";
import { sampleData, collectorItemsData } from "./data/sample-data";
import { fetchCombinedData, fetchAchievements } from "./services/tarkovApi";
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
import { CheckListView } from "./components/CheckListView";
import { CollectorView } from "./components/ItemTrackerView";
import { PrestigesView } from "./components/PrestigesView";
import { AchievementsView } from "./components/AchievementsView";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completedCollectorItems, setCompletedCollectorItems] = useState<
    Set<string>
  >(new Set());
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(
    new Set(["Ref", "Fence", "BTR Driver", "Lightkeeper"])
  );
  const [showKappa, setShowKappa] = useState(false);
  const [showLightkeeper, setShowLightkeeper] = useState(false);
  const [apiCollectorItems, setApiCollectorItems] =
    useState<CollectorItemsData | null>(null);

  // Transform collector items data to match the expected structure
  const collectorItems = useMemo(() => {
    const sourceData = apiCollectorItems ?? collectorItemsData;
    return sourceData.data.task.objectives.flatMap((objective) =>
      objective.items.map((item) => ({
        name: item.name,
        order: 0, // Default order since it's not in the source data
        img: item.iconLink,
        id: item.id, // Keep the id for reference if needed
      }))
    );
  }, [apiCollectorItems]);
  const [isLoading, setIsLoading] = useState(true);
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
        await taskStorage.init();
        const savedTasks = await taskStorage.loadCompletedTasks();
        const savedCollectorItems = await taskStorage.loadCompletedCollectorItems();
        const savedAchievements = await taskStorage.loadCompletedAchievements();
        setCompletedTasks(savedTasks);
        setCompletedCollectorItems(savedCollectorItems);
        setCompletedAchievements(savedAchievements);

        // Always try Live API first; fallback to static on error
        try {
          const { tasks: tasksData, collectorItems: collectorData } = await fetchCombinedData();
          setTasks(tasksData.data.tasks);
          setApiCollectorItems(collectorData);
          try {
            const achievementsData = await fetchAchievements();
            setAchievements(achievementsData.data.achievements);
          } catch (e) {
            console.error("Achievements API error", e);
            setAchievements([]);
          }
        } catch (apiErr) {
          console.error("API error, falling back to static", apiErr);
          setTasks(sampleData.data.tasks);
          setApiCollectorItems(null);
          setAchievements([]);
        }
      } catch (err) {
        console.error("Init error", err);
        setTasks(sampleData.data.tasks);
        setApiCollectorItems(null);
        setAchievements([]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
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
      console.debug("[Prestige] Reset:event dispatched");
    } catch (err) {
      console.error("Reset error", err);
    }
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
          traders={traderList}
          hiddenTraders={hiddenTraders}
          onToggleTraderVisibility={handleToggleTraderVisibility}
          onClearTraderFilter={handleClearTraderFilter}
          maps={mapList}
          onSelectMap={handleSelectMap}
          groupBy={groupBy}
          onSetGroupBy={setGroupBy}
          collectorGroupBy={collectorGroupBy}
          onSetCollectorGroupBy={setCollectorGroupBy}
          side="left"
        />
        <SidebarInset>
          <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="px-2">
                <div className="flex items-center justify-between gap-3 py-2">
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

                  {/* Right: Focus segmented control */}
                  <div className="hidden md:flex items-center gap-2">
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
                        className="rounded-full px-3"
                        onClick={() => handleSetFocus("kappa")}
                      >
                        Kappa
                      </Button>
                      <Button
                        variant={focusMode === "lightkeeper" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-full px-3"
                        onClick={() => handleSetFocus("lightkeeper")}
                      >
                        Lightkeeper
                      </Button>
                    </div>
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
                  />
                ) : viewMode === "collector" ? (
                  <CollectorView
                    collectorItems={collectorItems}
                    completedCollectorItems={completedCollectorItems}
                    onToggleCollectorItem={handleToggleCollectorItem}
                    groupBy={collectorGroupBy}
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
                    totalQuests={totalQuests}
                    completedQuests={completedQuests}
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
    </NuqsAdapter>
  );
}

export default App;
