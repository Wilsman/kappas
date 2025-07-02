import { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Filter, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Task } from './types';
import { MindMap } from './components/MindMap';
import { QuestProgressPanel } from './components/QuestProgressPanel';
import { taskStorage } from './utils/indexedDB';
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



function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [hiddenTraders, setHiddenTraders] = useState<Set<string>>(new Set(['Ref', 'Fence', 'BTR Driver', 'Lightkeeper']));
  const [showKappa, setShowKappa] = useState(false);
  const [showLightkeeper, setShowLightkeeper] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const requirementFilterActive = showKappa || showLightkeeper;
  
  // Calculate trader progress for the QuestProgressPanel
  const traderProgress = useMemo(() => {
    const traderMap: Record<string, { completed: number; total: number }> = {};
    
    // Initialize all traders with 0/0
    (Object.keys(TRADER_COLORS) as Array<keyof typeof TRADER_COLORS>).forEach(traderName => {
      traderMap[traderName] = { completed: 0, total: 0 };
    });
    
    // Count completed and total tasks per trader
    tasks.forEach(task => {
      const trader = task.trader.name as keyof typeof TRADER_COLORS;
      if (trader in traderMap) {
        traderMap[trader].total += 1;
        if (completedTasks.has(task.id)) {
          traderMap[trader].completed += 1;
        }
      }
    });
    
    // Convert to array of TraderProgress objects
    return Object.entries(traderMap).map(([name, { completed, total }]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      completed,
      total,
      color: TRADER_COLORS[name as keyof typeof TRADER_COLORS] || '#6b7280',
    }));
  }, [tasks, completedTasks]);
  
  // Calculate total quest stats
  const totalQuests = useMemo(() => {
    return tasks.length;
  }, [tasks]);
  
  const completedQuests = useMemo(() => {
    return completedTasks.size;
  }, [completedTasks]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await taskStorage.init();
        const savedCompletedTasks = await taskStorage.loadCompletedTasks();
        setCompletedTasks(savedCompletedTasks);
        
        // Load sample data initially
        setTasks(sampleData.data.tasks);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleToggleComplete = async (taskId: string) => {
    const newCompletedTasks = new Set(completedTasks);
    
    if (newCompletedTasks.has(taskId)) {
      newCompletedTasks.delete(taskId);
    } else {
      newCompletedTasks.add(taskId);
    }
    
    setCompletedTasks(newCompletedTasks);
    
    try {
      await taskStorage.saveCompletedTasks(newCompletedTasks);
    } catch (error) {
      console.error('Failed to save completed tasks:', error);
    }
  };

  const handleToggleTraderVisibility = (trader: string) => {
    const newHiddenTraders = new Set(hiddenTraders);
    
    if (newHiddenTraders.has(trader)) {
      newHiddenTraders.delete(trader);
    } else {
      newHiddenTraders.add(trader);
    }
    
    setHiddenTraders(newHiddenTraders);
  };

  const handleToggleKappa = () => setShowKappa((prev) => !prev);
  const handleToggleLightkeeper = () => setShowLightkeeper((prev) => !prev);

  const handleResetProgress = async () => {
    setCompletedTasks(new Set());
    try {
      await taskStorage.saveCompletedTasks(new Set());
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Progress value={66} className="w-[200px] h-2" />
        <span className="text-foreground/80 text-sm">Loading tasks...</span>
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
                      This will reset all your completed tasks. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetProgress}>
                      Reset Progress
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebars */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Filters */}
        <Sidebar 
          position="left" 
          header={
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
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
                            "flex items-center gap-2 text-sm",
                            requirementFilterActive && "cursor-not-allowed opacity-50"
                          )}
                        >
                          <span 
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{trader}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Trader/Kappa </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="kappa-required"
                        checked={showKappa}
                        onChange={handleToggleKappa}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label 
                        htmlFor="kappa-required"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Kappa Required
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="lightkeeper-required"
                        checked={showLightkeeper}
                        onChange={handleToggleLightkeeper}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label 
                        htmlFor="lightkeeper-required"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Lightkeeper Required
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4">
          <div className="relative h-full rounded-lg border bg-background">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : (
              <MindMap
                tasks={tasks}
                completedTasks={completedTasks}
                hiddenTraders={hiddenTraders}
                onToggleComplete={handleToggleComplete}
                showKappa={showKappa}
                showLightkeeper={showLightkeeper}
              />
            )}
          </div>
        </main>

        {/* Right Sidebar - Quest Progress */}
        <Sidebar 
          position="right" 
          header={
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Progress</span>
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