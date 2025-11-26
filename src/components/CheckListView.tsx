import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { Task } from '../types';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Link2, ChevronDown, ChevronUp, Award, ArrowRight, MapPin, UserCheck } from 'lucide-react';
import { groupTasksByTrader } from '../utils/taskUtils';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface CheckListViewProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  showKappa: boolean;
  showLightkeeper: boolean;
  onToggleComplete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  mapFilter?: string | null;
  groupBy: 'trader' | 'map';
  onSetGroupBy: (mode: 'trader' | 'map') => void;
  activeProfileId: string;
}

export const CheckListView: React.FC<CheckListViewProps> = ({
  tasks,
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
}) => {
  // Mark intentionally unused while preserving external API
  void _onTaskClick;
  const [searchTerm, setSearchTerm] = useQueryState('tasksSearch', { defaultValue: '' });
  // Start with all groups collapsed by default
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [enableLevelFilter, setEnableLevelFilter] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(`taskTracker_enableLevelFilter::${activeProfileId}`);
      return stored != null ? stored === '1' : false;
    } catch {
      return false;
    }
  });
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`taskTracker_playerLevel::${activeProfileId}`);
      const lvl = Math.max(1, Number(stored) || 1);
      return lvl;
    } catch {
      return 1;
    }
  });

  // Show/Hide completed tasks toggle (persisted)
  const [showCompleted, setShowCompleted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(`taskTracker_showCompleted::${activeProfileId}`);
      return stored != null ? stored === '1' : true;
    } catch {
      return true;
    }
  });

  // Reload persisted UI prefs when active profile changes
  useEffect(() => {
    try {
      const storedLvl = localStorage.getItem(`taskTracker_playerLevel::${activeProfileId}`);
      setPlayerLevel(Math.max(1, Number(storedLvl) || 1));
    } catch {
      // Ignore localStorage errors
    }
    try {
      const storedEnable = localStorage.getItem(`taskTracker_enableLevelFilter::${activeProfileId}`);
      setEnableLevelFilter(storedEnable != null ? storedEnable === '1' : false);
    } catch {
      // Ignore localStorage errors
    }
    try {
      const storedShow = localStorage.getItem(`taskTracker_showCompleted::${activeProfileId}`);
      setShowCompleted(storedShow != null ? storedShow === '1' : true);
    } catch {
      // Ignore localStorage errors
    }
  }, [activeProfileId]);

  // (dependency map removed; checklist is always interactive)

  // Persist player level and toggle

  useEffect(() => {
    try {
      localStorage.setItem(`taskTracker_playerLevel::${activeProfileId}`, String(playerLevel));
    } catch (e) {
      console.warn('Failed to persist player level', e);
    }
  }, [playerLevel, activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(`taskTracker_enableLevelFilter::${activeProfileId}`, enableLevelFilter ? '1' : '0');
    } catch (e) {
      console.warn('Failed to persist level filter toggle', e);
    }
  }, [enableLevelFilter, activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(`taskTracker_showCompleted::${activeProfileId}`, showCompleted ? '1' : '0');
    } catch (e) {
      console.warn('Failed to persist show completed toggle', e);
    }
  }, [showCompleted, activeProfileId]);

  // Listen for global reset event to reset level to 1
  useEffect(() => {
    const handler = () => {
      setPlayerLevel(1);
      setEnableLevelFilter(false);
    };
    window.addEventListener('taskTracker:reset', handler);
    return () => window.removeEventListener('taskTracker:reset', handler);
  }, []);

  // Map of taskId -> DOM element to scroll into view when selected
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // When selectedTaskId changes, scroll that task into view
  useEffect(() => {
    if (!selectedTaskId) return;
    const el = itemRefs.current.get(selectedTaskId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedTaskId]);

  // Clicking a breadcrumb: expand proper group, select task (which opens its details)
  const handleBreadcrumbClick = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (groupBy === 'trader') {
      const groupName = task.trader.name;
      setExpandedGroups(prev => (prev.includes(groupName) ? prev : [...prev, groupName]));
    } else {
      // For map grouping, expand all maps the task belongs to
      if (task.maps && task.maps.length > 0) {
        const mapNames = task.maps.map(m => m.name);
        setExpandedGroups(prev => {
          const newGroups = [...prev];
          mapNames.forEach(name => {
            if (!newGroups.includes(name)) newGroups.push(name);
          });
          return newGroups;
        });
      } else {
        const groupName = task.map?.name || 'Anywhere';
        setExpandedGroups(prev => (prev.includes(groupName) ? prev : [...prev, groupName]));
      }
    }
    
    setSelectedTaskId(taskId);
    // Also reflect the clicked task in the search bar to filter the view
    setSearchTerm(task.name);
  }, [tasks, groupBy, setSearchTerm]);

  // (moved global search listener below after allGroupNames is defined)

  // Apply filters
  const filteredTasks = useMemo(
    () => tasks.filter(task => {
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
          if (!task.maps.some(m => m.name === mapFilter)) return false;
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
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = task.name.toLowerCase().includes(term);
        const traderMatch = task.trader.name.toLowerCase().includes(term);
        const singleMapMatch = task.map?.name.toLowerCase().includes(term);
        const multiMapMatch = task.maps?.some(m => m.name.toLowerCase().includes(term));
        
        if (!nameMatch && !traderMatch && !singleMapMatch && !multiMapMatch) {
          return false;
        }
      }
      return true;
    }),
    [tasks, showKappa, showLightkeeper, hiddenTraders, searchTerm, mapFilter, enableLevelFilter, playerLevel, showCompleted, completedTasks],
  );

  // Group tasks
  const tasksByGroup = useMemo(() => {
    if (groupBy === 'trader') {
      return groupTasksByTrader(filteredTasks);
    }
    // groupBy map - tasks with multiple maps appear under each map
    return filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
      // Check if task has multiple maps
      if (task.maps && task.maps.length > 0) {
        // Add task to each map it belongs to
        task.maps.forEach(map => {
          (acc[map.name] ||= []).push(task);
        });
      } else {
        // Fallback to single map or 'Anywhere'
        const mapName = task.map?.name || 'Anywhere';
        (acc[mapName] ||= []).push(task);
      }
      return acc;
    }, {});
  }, [filteredTasks, groupBy]);

  const sortedGroups = useMemo(
    () => Object.entries(tasksByGroup).sort(([a], [b]) => a.localeCompare(b)),
    [tasksByGroup],
  );

  const allGroupNames = useMemo(() => sortedGroups.map(([name]) => name), [sortedGroups]);
  // Only use the explicitly expanded groups
  const finalExpandedGroups = expandedGroups;
  const areAllExpanded = finalExpandedGroups.length === allGroupNames.length;

  // Listen for global command search and apply to local search box (tasks scope)
  useEffect(() => {
    type GlobalSearchDetail = { term?: string; scope?: 'tasks' | 'achievements' | 'items'; taskId?: string };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (!detail || detail.scope !== 'tasks' || typeof detail.term !== 'string') return;
      setSearchTerm(detail.term);
      // Keep current UX of expanding all groups so results are visible
      setExpandedGroups(allGroupNames);
      // If a specific task was chosen, open its details and ensure its group is expanded
      if (detail.taskId) {
        const t = tasks.find(x => x.id === detail.taskId);
        if (t) {
          if (groupBy === 'trader') {
            const groupName = t.trader.name;
            setExpandedGroups(prev => (prev.includes(groupName) ? prev : [...prev, groupName]));
          } else {
            // For map grouping, expand all maps the task belongs to
            if (t.maps && t.maps.length > 0) {
              const mapNames = t.maps.map(m => m.name);
              setExpandedGroups(prev => {
                const newGroups = [...prev];
                mapNames.forEach(name => {
                  if (!newGroups.includes(name)) newGroups.push(name);
                });
                return newGroups;
              });
            } else {
              const groupName = t.map?.name || 'Anywhere';
              setExpandedGroups(prev => (prev.includes(groupName) ? prev : [...prev, groupName]));
            }
          }
          setSelectedTaskId(detail.taskId);
        }
      }
    };
    window.addEventListener('taskTracker:globalSearch', handler as EventListener);
    return () => window.removeEventListener('taskTracker:globalSearch', handler as EventListener);
  }, [allGroupNames, setSearchTerm, tasks, groupBy]);

  // Build the dependency chain (from root to the selected task)
  const getTaskDependencyChain = useCallback((taskId: string, allTasks: Task[]): string[] => {
    const taskMap = new Map(allTasks.map(task => [task.id, task]));
    const visited = new Set<string>();
    const chain: string[] = [];
    const build = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      const t = taskMap.get(currentId);
      if (!t) return;
      t.taskRequirements.forEach(req => build(req.task.id));
      chain.push(currentId);
    };
    build(taskId);
    return chain;
  }, []);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Grouping selection moved to sidebar under Quests > Checklist */}

      {/* Search and Controls */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        {/* Show/Hide Completed toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="show-completed" className="text-sm">
            Show Completed
          </Label>
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAll}
          className="flex items-center gap-2"
        >
          {areAllExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
        {/* Group By controls moved here from sidebar */}
        <div className="flex items-center gap-2">
          <Button
            variant={groupBy === "trader" ? "default" : "outline"}
            size="sm"
            className="px-2"
            onClick={() => onSetGroupBy("trader")}
            aria-label="Group by Trader"
            title="Group by Trader"
          >
            <UserCheck className="h-4 w-4" />
          </Button>
          <Button
            variant={groupBy === "map" ? "default" : "outline"}
            size="sm"
            className="px-2"
            onClick={() => onSetGroupBy("map")}
            aria-label="Group by Map"
            title="Group by Map"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="player-level"
              className="text-sm text-muted-foreground"
            >
              PMC Level
            </Label>
            <Input
              id="player-level"
              type="number"
              min={1}
              value={Number.isFinite(playerLevel) ? playerLevel : ""}
              onChange={(e) =>
                setPlayerLevel(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-20 h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="level-filter" className="text-sm">
              Enable
            </Label>
            <Switch
              id="level-filter"
              checked={enableLevelFilter}
              onCheckedChange={setEnableLevelFilter}
            />
          </div>
        </div>
      </div>

      {/* Selected Task Breadcrumb */}
      {selectedTaskId && (
        <div className="sticky top-0 z-10 mb-3 border rounded-md bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">
            Dependency Path:
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(() => {
              const chain = getTaskDependencyChain(selectedTaskId, tasks);
              const taskMap = new Map(tasks.map((t) => [t.id, t]));
              const crumbs = chain.map((tid, index) => {
                const t = taskMap.get(tid);
                if (!t) return null;
                const isLast = index === chain.length - 1;
                const isDone = completedTasks.has(tid);
                return (
                  <React.Fragment key={tid}>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                        isLast
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-gray-800 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-600",
                        isDone && "line-through opacity-60"
                      )}
                      onClick={() => handleBreadcrumbClick(tid)}
                    >
                      {t.name}
                    </span>
                    {!isLast && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                );
              });

              // Compute a single next task (direct dependent of the current/last)
              const lastId = chain[chain.length - 1];
              const nextCandidates = tasks.filter((t) =>
                t.taskRequirements?.some((req) => req.task.id === lastId)
              );
              const nextTask = nextCandidates.sort((a, b) =>
                a.name.localeCompare(b.name)
              )[0];

              return (
                <>
                  {crumbs}
                  {nextTask && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                          "bg-gray-700 text-white dark:bg-gray-800 hover:bg-gray-600"
                        )}
                        onClick={() => handleBreadcrumbClick(nextTask.id)}
                        title="Go to next task"
                      >
                        {nextTask.name}
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Groups */}
      <Accordion
        type="multiple"
        className="w-full space-y-2"
        value={finalExpandedGroups}
        onValueChange={setExpandedGroups}
      >
        {sortedGroups.map(([groupName, groupTasks]) => {
          const completedCount = groupTasks.filter((t) =>
            completedTasks.has(t.id)
          ).length;
          const totalCount = groupTasks.length;
          const progress =
            totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <AccordionItem
              key={groupName}
              value={groupName}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-semibold flex items-center gap-2">
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
                  {groupTasks.map((task) => {
                    const isCompleted = completedTasks.has(task.id);
                    return (
                      <div
                        key={task.id}
                        ref={(el) => itemRefs.current.set(task.id, el)}
                      >
                        <Collapsible
                          open={selectedTaskId === task.id}
                          onOpenChange={(open) => {
                            if (open) setSelectedTaskId(task.id);
                            else if (selectedTaskId === task.id)
                              setSelectedTaskId(null);
                          }}
                        >
                          {/* Main single-row */}
                          <div
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded-md transition-colors group",
                              "hover:bg-muted"
                            )}
                          >
                            <Checkbox
                              id={task.id}
                              checked={isCompleted}
                              onCheckedChange={() => onToggleComplete(task.id)}
                              disabled={false}
                              onClick={(e) => e.stopPropagation()}
                            />
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
                                    "flex-1 min-w-0 text-[15px] leading-tight flex items-center gap-2"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "truncate",
                                      isCompleted && "line-through"
                                    )}
                                  >
                                    {task.name}
                                  </span>
                                </span>

                                {/* Right-side compact info */}
                                <div className="ml-auto flex items-center gap-2">
                                  {task.trader?.imageLink && (
                                    <img
                                      src={task.trader.imageLink}
                                      alt={task.trader.name}
                                      loading="lazy"
                                      className="h-5 w-5 rounded-full object-cover"
                                    />
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
                                    <ul className="list-disc pl-5 space-y-0.5">
                                      {task.objectives.map(
                                        (objective, index) => (
                                          <li key={index}>
                                            {"playerLevel" in objective
                                              ? `Reach level ${objective.playerLevel}`
                                              : objective.description}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {((task.startRewards?.items &&
                                task.startRewards.items.length > 0) ||
                                (task.finishRewards?.items &&
                                  task.finishRewards.items.length > 0)) && (
                                <div className="space-y-1">
                                  <div className="inline-flex items-center gap-1 text-foreground/80">
                                    <Award className="h-3 w-3" />
                                    <span className="text-[11px]">Rewards</span>
                                  </div>
                                  <ul className="list-disc pl-5 space-y-0.5">
                                    {[
                                      ...(task.startRewards?.items ?? []),
                                      ...(task.finishRewards?.items ?? []),
                                    ].map((reward, index) => (
                                      <li key={index}>
                                        {reward.item.name}
                                        {reward.count > 1
                                          ? ` (${reward.count})`
                                          : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
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
