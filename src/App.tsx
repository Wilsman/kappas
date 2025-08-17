import { useState, useEffect, useMemo, useCallback } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { useIsMobile } from './hooks/use-mobile';
import { RotateCcw, Filter, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Task, CollectorItemsData } from './types';
import { MindMap } from './components/MindMap';
import { FlowView } from './components/FlowView';
import { QuestProgressPanel } from './components/QuestProgressPanel';
import { taskStorage } from './utils/indexedDB';
import { loadCurrentPrestigeSummary, PRESTIGE_UPDATED_EVENT } from '@/utils/prestige';
import { buildTaskDependencyMap, getAllDependencies } from './utils/taskUtils';
import { sampleData, collectorItemsData } from './data/sample-data';
import { fetchCombinedData } from './services/tarkovApi';
import { cn } from '@/lib/utils';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { TRADER_COLORS } from './data/traders';
import { Sidebar } from './components/Sidebar';
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
} from './components/ui/alert-dialog';
import { CheckListView } from './components/CheckListView';
import { CollectorView } from './components/ItemTrackerView';
import { PrestigesView } from './components/PrestigesView';
import { BrainCircuit, ListChecks, Package, GitBranch } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [completedCollectorItems, setCompletedCollectorItems] = useState<Set<string>>(new Set());
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(
    new Set(['Ref', 'Fence', 'BTR Driver', 'Lightkeeper'])
  );
  const [showKappa, setShowKappa] = useState(false);
  const [showLightkeeper, setShowLightkeeper] = useState(false);
  const [apiCollectorItems, setApiCollectorItems] = useState<CollectorItemsData | null>(null);

  // Transform collector items data to match the expected structure
  const collectorItems = useMemo(() => {
    const sourceData = apiCollectorItems ?? collectorItemsData;
    return sourceData.data.task.objectives.flatMap(
      (objective) => 
        objective.items.map(item => ({
          name: item.name,
          order: 0, // Default order since it's not in the source data
          img: item.iconLink,
          id: item.id // Keep the id for reference if needed
        }))
    );
  }, [apiCollectorItems]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'grouped' | 'collector' | 'flow' | 'prestiges'>('grouped');
  const isMobile = useIsMobile();

  // Always use checklist on mobile
  useEffect(() => {
    if (isMobile) setViewMode('grouped');
  }, [isMobile]);
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null);

  const requirementFilterActive = showKappa || showLightkeeper;
  const totalQuests = tasks.length;
  const completedQuests = completedTasks.size;

  // Build progress data for QuestProgressPanel
  const traderProgress = useMemo(() => {
    type TP = { completed: number; total: number; imageLink?: string };
    const map = Object.fromEntries(
      Object.keys(TRADER_COLORS).map(name => [name, { completed: 0, total: 0, imageLink: undefined } as TP])
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

    return Object.entries(map).map(([name, { completed, total, imageLink }]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      completed,
      total,
      color: TRADER_COLORS[name as keyof typeof TRADER_COLORS] || '#6b7280',
      imageLink,
    }));
  }, [tasks, completedTasks]);

  // Calculate Kappa and Lightkeeper task totals
  const { totalKappaTasks, completedKappaTasks, totalLightkeeperTasks, completedLightkeeperTasks } = useMemo(() => {
    const kappaTasks = tasks.filter(task => task.kappaRequired);
    const lightkeeperTasks = tasks.filter(task => task.lightkeeperRequired);
    
    return {
      totalKappaTasks: kappaTasks.length,
      completedKappaTasks: kappaTasks.filter(task => completedTasks.has(task.id)).length,
      totalLightkeeperTasks: lightkeeperTasks.length,
      completedLightkeeperTasks: lightkeeperTasks.filter(task => completedTasks.has(task.id)).length,
    };
  }, [tasks, completedTasks]);

  useEffect(() => {
    const init = async () => {
      try {
        await taskStorage.init();
        const savedTasks = await taskStorage.loadCompletedTasks();
        const savedCollectorItems = await taskStorage.loadCompletedCollectorItems();
        setCompletedTasks(savedTasks);
        setCompletedCollectorItems(savedCollectorItems);

        // Always try Live API first; fallback to static on error
        try {
          const { tasks: tasksData, collectorItems: collectorData } = await fetchCombinedData();
          setTasks(tasksData.data.tasks);
          setApiCollectorItems(collectorData);
        } catch (apiErr) {
          console.error('API error, falling back to static', apiErr);
          setTasks(sampleData.data.tasks);
          setApiCollectorItems(null);
        }
      } catch (err) {
        console.error('Init error', err);
        setTasks(sampleData.data.tasks);
        setApiCollectorItems(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Compute "next" prestige progress (only one visible at a time)
  const [prestigeProgress, setPrestigeProgress] = useState<{ completed: number; total: number } | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const current = await loadCurrentPrestigeSummary();
        setPrestigeProgress(current);
      } catch (e) {
        console.error('Prestige progress load error', e);
        setPrestigeProgress(null);
      }
    };

    refresh();
    const handler = () => { void refresh(); };
    window.addEventListener(PRESTIGE_UPDATED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(PRESTIGE_UPDATED_EVENT, handler as EventListener);
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
        deps.forEach(id => next.add(id));
      }
      setCompletedTasks(next);
      try {
        await taskStorage.saveCompletedTasks(next);
      } catch (err) {
        console.error('Save error', err);
      }
    },
    [completedTasks, tasks]
  );

  const handleToggleTraderVisibility = useCallback(
    (trader: string) => {
      const next = new Set(hiddenTraders);
      if (next.has(trader)) {
        next.delete(trader);
      } else {
        next.add(trader);
      }
      setHiddenTraders(next);
    },
    [hiddenTraders]
  );

  // Focus mode derived state and setter for clearer UX
  const focusMode = showKappa ? 'kappa' : showLightkeeper ? 'lightkeeper' : 'all';

  const handleSetFocus = useCallback((mode: 'all' | 'kappa' | 'lightkeeper') => {
    if (mode === 'kappa') {
      setShowKappa(true);
      setShowLightkeeper(false);
    } else if (mode === 'lightkeeper') {
      setShowKappa(false);
      setShowLightkeeper(true);
    } else {
      setShowKappa(false);
      setShowLightkeeper(false);
    }
  }, []);

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
        console.error('Save collector items error', err);
      }
    },
    [completedCollectorItems]
  );

  const handleResetProgress = useCallback(async () => {
    setCompletedTasks(new Set());
    setCompletedCollectorItems(new Set());
    try {
      await taskStorage.saveCompletedTasks(new Set());
      await taskStorage.saveCompletedCollectorItems(new Set());
      await taskStorage.clearAllPrestigeProgress();
    } catch (err) {
      console.error('Reset error', err);
    }
  }, []);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      setHighlightedTask(taskId);
      setTimeout(() => setHighlightedTask(null), 2000);
      if (viewMode === 'grouped') {
        document
          .getElementById(`task-${taskId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          <p className="text-xs text-muted-foreground">Fetching quests and items…</p>
        </div>
      </div>
    );
  }

  return (
    <NuqsAdapter>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Left: title + primary section selector */}
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl font-semibold truncate">
                  {isMobile ? 'EFT Tracker' : 'Escape from Tarkov Task Tracker'}
                </h1>
                <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 border border-emerald-600/20">
                  Live API
                </span>
                <div className="hidden md:flex items-center gap-1 p-1 rounded-full border bg-muted/30 ml-2">
                  <Button
                    variant={viewMode !== 'collector' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => setViewMode(isMobile ? 'grouped' : 'tree')}
                  >
                    Quests
                  </Button>
                  <Button
                    variant={viewMode === 'collector' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('collector')}
                    className="gap-2 rounded-full px-3"
                  >
                    <Package size={16} />
                    Items
                  </Button>
                  <Button
                    variant={viewMode === 'prestiges' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('prestiges')}
                    className="rounded-full px-3"
                  >
                    Prestiges
                  </Button>
                </div>
              </div>

              {/* Right: Focus segmented control */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Focus</span>
                <div className="flex items-center gap-1 p-1 rounded-full border bg-muted/30">
                  <Button
                    variant={focusMode === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => handleSetFocus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={focusMode === 'kappa' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => handleSetFocus('kappa')}
                  >
                    Kappa
                  </Button>
                  <Button
                    variant={focusMode === 'lightkeeper' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => handleSetFocus('lightkeeper')}
                  >
                    Lightkeeper
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebars + Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Filters */}
          <Sidebar
            position="left"
            header={
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </div>
            }
            defaultCollapsed={false}
            width="16rem"
            collapsedWidth="3rem"
            className="hidden md:flex"
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Filter by Trader</h3>
                    <div className="space-y-2">
                      {Object.entries(TRADER_COLORS).map(([trader, color]) => (
                        <div key={trader} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`trader-${trader}`}
                            checked={!hiddenTraders.has(trader) && !requirementFilterActive}
                            onChange={() => handleToggleTraderVisibility(trader)}
                            disabled={requirementFilterActive}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                          />
                          <label
                            htmlFor={`trader-${trader}`}
                            className={cn(
                              'hidden md:flex items-center gap-2 text-sm',
                              requirementFilterActive && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {trader}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Focus controls moved to header for clarity */}
                </div>
              </CardContent>
            </Card>
          </Sidebar>

          {/* Main Content */}
          <main
            className={cn(
              'flex-1 bg-background relative',
              viewMode === 'grouped' || viewMode === 'collector' || viewMode === 'flow' || viewMode === 'prestiges' ? 'overflow-y-auto' : 'overflow-hidden'
            )}
          >
            {/* Quests sub-tabs below top pane */}
            {(viewMode === 'grouped' || viewMode === 'tree' || viewMode === 'flow') && (
              <div className="p-4 pt-3">
                <div className="hidden md:flex items-center gap-1 p-1 rounded-full border bg-muted/30 w-fit">
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={cn(
                      'px-3 py-1 rounded-full flex items-center gap-2 text-sm',
                      viewMode === 'grouped' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <ListChecks className="h-4 w-4" />
                    Checklist
                  </button>
                  <button
                    onClick={() => { if (!isMobile) setViewMode('tree'); }}
                    disabled={isMobile}
                    className={cn(
                      'px-3 py-1 rounded-full flex items-center gap-2 text-sm',
                      viewMode === 'tree' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                      isMobile && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Tree
                  </button>
                  <button
                    onClick={() => setViewMode('flow')}
                    className={cn(
                      'px-3 py-1 rounded-full flex items-center gap-2 text-sm',
                      viewMode === 'flow' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <GitBranch className="h-4 w-4" />
                    Flow
                  </button>
                </div>
                {/* Mobile: show only Flow and Checklist */}
                <div className="flex md:hidden items-center gap-1 p-1 rounded-full border bg-muted/30 w-fit">
                  <button
                    onClick={() => setViewMode('flow')}
                    className={cn(
                      'px-3 py-1 rounded-full flex items-center gap-2 text-sm',
                      viewMode === 'flow' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <GitBranch className="h-4 w-4" />
                    Flow
                  </button>
                </div>
              </div>
            )}
            {viewMode === 'grouped' ? (
              <CheckListView
                tasks={tasks}
                completedTasks={completedTasks}
                hiddenTraders={hiddenTraders}
                showKappa={showKappa}
                showLightkeeper={showLightkeeper}
                onToggleComplete={handleToggleComplete}
                onTaskClick={handleTaskClick}
              />
            ) : viewMode === 'collector' ? (
              <CollectorView
                collectorItems={collectorItems}
                completedCollectorItems={completedCollectorItems}
                onToggleCollectorItem={handleToggleCollectorItem}
              />
            ) : viewMode === 'prestiges' ? (
              <PrestigesView />
            ) : viewMode === 'flow' ? (
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
          <Sidebar
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
                totalPrestigeSteps={prestigeProgress?.total}
                completedPrestigeSteps={prestigeProgress?.completed}
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
          </Sidebar>
        </div>
      </div>
    </NuqsAdapter>
  );

}

export default App;