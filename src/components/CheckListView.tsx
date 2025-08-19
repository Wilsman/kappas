import React, { useState, useMemo, useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { Task } from '../types';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Link2, ChevronDown, ChevronUp, Award } from 'lucide-react';
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
}) => {
  // Mark intentionally unused while preserving external API
  void _onTaskClick;
  const [searchTerm, setSearchTerm] = useQueryState('tasksSearch', { defaultValue: '' });
  // Start with all groups collapsed by default
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [enableLevelFilter, setEnableLevelFilter] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('taskTracker_enableLevelFilter');
      return stored != null ? stored === '1' : false;
    } catch {
      return false;
    }
  });
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('taskTracker_playerLevel');
      const lvl = Math.max(1, Number(stored) || 1);
      return lvl;
    } catch {
      return 1;
    }
  });

  // (dependency map removed; checklist is always interactive)

  // Persist player level and toggle

  useEffect(() => {
    try {
      localStorage.setItem('taskTracker_playerLevel', String(playerLevel));
    } catch (e) {
      console.warn('Failed to persist player level', e);
    }
  }, [playerLevel]);

  useEffect(() => {
    try {
      localStorage.setItem('taskTracker_enableLevelFilter', enableLevelFilter ? '1' : '0');
    } catch (e) {
      console.warn('Failed to persist level filter toggle', e);
    }
  }, [enableLevelFilter]);

  // Listen for global reset event to reset level to 1
  useEffect(() => {
    const handler = () => {
      setPlayerLevel(1);
      setEnableLevelFilter(false);
    };
    window.addEventListener('taskTracker:reset', handler);
    return () => window.removeEventListener('taskTracker:reset', handler);
  }, []);

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
      if (mapFilter && task.map?.name !== mapFilter) return false;
      // Trader filter
      if (hiddenTraders.has(task.trader.name)) return false;
      // Player level filter
      if (enableLevelFilter) {
        const lvl = Number.isFinite(playerLevel) ? playerLevel : 1;
        if (task.minPlayerLevel > lvl) return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!task.name.toLowerCase().includes(term) && !task.trader.name.toLowerCase().includes(term)) {
          if (!task.map?.name.toLowerCase().includes(term)) return false;
        }
      }
      return true;
    }),
    [tasks, showKappa, showLightkeeper, hiddenTraders, searchTerm, mapFilter, enableLevelFilter, playerLevel],
  );

  // Group tasks
  const tasksByGroup = useMemo(() => {
    if (groupBy === 'trader') {
      return groupTasksByTrader(filteredTasks);
    }
    // groupBy map
    return filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
      const mapName = task.map?.name || 'Anywhere';
      (acc[mapName] ||= []).push(task);
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
    type GlobalSearchDetail = { term?: string; scope?: 'tasks' | 'achievements' | 'items' };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (!detail || detail.scope !== 'tasks' || typeof detail.term !== 'string') return;
      setSearchTerm(detail.term);
      setExpandedGroups(allGroupNames);
    };
    window.addEventListener('taskTracker:globalSearch', handler as EventListener);
    return () => window.removeEventListener('taskTracker:globalSearch', handler as EventListener);
  }, [allGroupNames, setSearchTerm]);

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
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
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
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="player-level" className="text-sm text-muted-foreground">PMC Level</Label>
            <Input
              id="player-level"
              type="number"
              min={1}
              value={Number.isFinite(playerLevel) ? playerLevel : ''}
              onChange={e => setPlayerLevel(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="level-filter" className="text-sm">Enable</Label>
            <Switch id="level-filter" checked={enableLevelFilter} onCheckedChange={setEnableLevelFilter} />
          </div>
        </div>
      </div>

      {/* Groups */}
      <Accordion
        type="multiple"
        className="w-full space-y-2"
        value={finalExpandedGroups}
        onValueChange={setExpandedGroups}
      >
        {sortedGroups.map(([groupName, groupTasks]) => {
          const completedCount = groupTasks.filter(t => completedTasks.has(t.id)).length;
          const totalCount = groupTasks.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <AccordionItem key={groupName} value={groupName} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    {groupBy === 'trader' && groupTasks[0]?.trader?.imageLink && (
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
                  {groupTasks.map(task => {
                    const isCompleted = completedTasks.has(task.id);
                    return (
                      <Collapsible key={task.id}>
                        {/* Main single-row */}
                        <div
                          className={
                            cn(
                              "flex items-center gap-2 p-1.5 rounded-md transition-colors group",
                              "hover:bg-muted"
                            )
                          }
                        >
                          <Checkbox
                            id={task.id}
                            checked={isCompleted}
                            onCheckedChange={() => onToggleComplete(task.id)}
                            disabled={false}
                            onClick={e => e.stopPropagation()}
                          />
                          {task.wikiLink && (
                            <a
                              href={task.wikiLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={e => e.stopPropagation()}
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
                                <span className={cn("truncate", isCompleted && "line-through")}>{task.name}</span>
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
                                  <span title="Kappa" className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">K</span>
                                )}
                                {task.lightkeeperRequired && (
                                  <span title="Lightkeeper" className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">LK</span>
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
                                <span className="font-medium text-foreground/80">Map:</span>
                                <span>{task.map.name}</span>
                              </div>
                            )}

                            {task.objectives && task.objectives.length > 0 && (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 text-foreground/80">
                                  <span className="text-[11px] text-yellow-600">Objectives</span>
                                </div>
                                <ul className="list-disc pl-5 space-y-0.5">
                                  {task.objectives.map((objective, index) => (
                                    <li key={index}>
                                      {'playerLevel' in objective
                                        ? `Reach level ${objective.playerLevel}`
                                        : objective.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {((task.startRewards?.items && task.startRewards.items.length > 0) ||
                              (task.finishRewards?.items && task.finishRewards.items.length > 0)) && (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 text-foreground/80">
                                  <Award className="h-3 w-3" />
                                  <span className="text-[11px]">Rewards</span>
                                </div>
                                <ul className="list-disc pl-5 space-y-0.5">
                                  {[...(task.startRewards?.items ?? []), ...(task.finishRewards?.items ?? [])].map((reward, index) => (
                                    <li key={index}>
                                      {reward.item.name}
                                      {reward.count > 1 ? ` (${reward.count})` : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
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
