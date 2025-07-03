import { useState, useEffect, useMemo, useCallback } from 'react';
import { RotateCcw, Filter, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Task } from './types';
import { MindMap } from './components/MindMap';
import { QuestProgressPanel } from './components/QuestProgressPanel';
import { taskStorage } from './utils/indexedDB';
import { buildTaskDependencyMap, getAllDependencies } from './utils/taskUtils';
import { sampleData } from './data/sample-data';
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
import { BrainCircuit, ListChecks } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(
    new Set(['Ref', 'Fence', 'BTR Driver', 'Lightkeeper'])
  );
  const [showKappa, setShowKappa] = useState(false);
  const [showLightkeeper, setShowLightkeeper] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'mindmap' | 'grouped'>('grouped');
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null);

  const requirementFilterActive = showKappa || showLightkeeper;
  const totalQuests = tasks.length;
  const completedQuests = completedTasks.size;

  // Build progress data for QuestProgressPanel
  const traderProgress = useMemo(() => {
    type TP = { completed: number; total: number };
    const map = Object.fromEntries(
      Object.keys(TRADER_COLORS).map(name => [name, { completed: 0, total: 0 } as TP])
    ) as Record<keyof typeof TRADER_COLORS, TP>;

    tasks.forEach(({ trader: { name }, id }) => {
      if (map[name]) {
        map[name].total++;
        if (completedTasks.has(id)) {
          map[name].completed++;
        }
      }
    });

    return Object.entries(map).map(([name, { completed, total }]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      completed,
      total,
      color: TRADER_COLORS[name as keyof typeof TRADER_COLORS] || '#6b7280',
    }));
  }, [tasks, completedTasks]);

  useEffect(() => {
    const init = async () => {
      try {
        await taskStorage.init();
        const saved = await taskStorage.loadCompletedTasks();
        setCompletedTasks(saved);
        setTasks(sampleData.data.tasks);
      } catch (err) {
        console.error('Init error', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
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

  const handleToggleKappa = useCallback(() => setShowKappa(v => !v), []);
  const handleToggleLightkeeper = useCallback(() => setShowLightkeeper(v => !v), []);

  const handleResetProgress = useCallback(async () => {
    setCompletedTasks(new Set());
    try {
      await taskStorage.saveCompletedTasks(new Set());
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
        <Progress value={66} className="w-[200px] h-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Escape from Tarkov Task Tracker</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'mindmap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('mindmap')}
                  className="gap-2"
                >
                  <BrainCircuit size={16} />
                  Mind Map
                </Button>
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                  className="gap-2"
                >
                  <ListChecks size={16} />
                  Checklist View
                </Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
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
          </div>
        </div>
      </header>

      {/* Sidebars + Main */}
      <div
        className={cn(
          'flex flex-1',
          viewMode === 'mindmap' ? 'overflow-auto' : 'overflow-hidden'
        )}
      >
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
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Traders</h3>
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
                            'flex items-center gap-2 text-sm',
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
                <div>
                  <h3 className="mb-2 text-sm font-medium">Kappa / Lightkeeper</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="kappa-required"
                        checked={showKappa}
                        onChange={handleToggleKappa}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="kappa-required" className="text-sm font-medium">
                        Kappa Required ONLY
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lightkeeper-required"
                        checked={showLightkeeper}
                        onChange={handleToggleLightkeeper}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="lightkeeper-required" className="text-sm font-medium">
                        Lightkeeper Required ONLY
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 bg-background relative">
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
              <Settings className="h-4 w-4" />
              Progress
            </div>
          }
          defaultCollapsed={false}
          width="20rem"
          collapsedWidth="3rem"
        >
          <div className="p-2">
            <QuestProgressPanel
              totalQuests={totalQuests}
              completedQuests={completedQuests}
              traders={traderProgress}
            />
          </div>
        </Sidebar>
      </div>
    </div>
  );
}

export default App;
