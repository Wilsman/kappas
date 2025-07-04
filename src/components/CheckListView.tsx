import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { ListChecks, MapPin, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { groupTasksByTrader, buildTaskDependencyMap, canComplete } from '../utils/taskUtils';
import { cn } from '@/lib/utils';

interface CheckListViewProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  showKappa: boolean;
  showLightkeeper: boolean;
  onToggleComplete: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
}

type GroupBy = 'trader' | 'map';

export const CheckListView: React.FC<CheckListViewProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  showKappa,
  showLightkeeper,
  onToggleComplete,
  onTaskClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('trader');
  // Start with all groups collapsed by default
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Dependency map for completion logic
  const dependencyMap = useMemo(() => buildTaskDependencyMap(tasks), [tasks]);

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
      // Trader filter
      if (hiddenTraders.has(task.trader.name)) return false;
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!task.name.toLowerCase().includes(term) && !task.trader.name.toLowerCase().includes(term)) {
          if (!task.map?.name.toLowerCase().includes(term)) return false;
        }
      }
      return true;
    }),
    [tasks, showKappa, showLightkeeper, hiddenTraders, searchTerm],
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

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups(allGroupNames);
    }
  };

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Toggle grouping */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setGroupBy('trader')}
          className={cn(
            'px-3 py-1 rounded',
            groupBy === 'trader' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <ListChecks className="inline-block mr-1" /> By Trader
        </button>
        <button
          onClick={() => setGroupBy('map')}
          className={cn(
            'px-3 py-1 rounded',
            groupBy === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <MapPin className="inline-block mr-1" /> By Map
        </button>
      </div>

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
                  <span className="text-lg font-semibold">{groupName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {completedCount} / {totalCount}
                    </span>
                    <Progress value={progress} className="w-24 h-2" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 border-t">
                <div className="pr-2 space-y-3">
                  {groupTasks.map(task => {
                    const isCompletable = canComplete(task.id, completedTasks, dependencyMap);
                    const isCompleted = completedTasks.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md transition-colors group",
                          !isCompletable && !isCompleted ? "opacity-50 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                        )}
                        onClick={() => onTaskClick(task.id)}
                      >
                        <Checkbox
                          id={task.id}
                          checked={isCompleted}
                          onCheckedChange={() => onToggleComplete(task.id)}
                          disabled={false}
                        />
                        <label
                          htmlFor={task.id}
                          className={cn(
                            "flex-1 text-sm flex items-center gap-3",
                            isCompleted && "text-muted-foreground",
                            !isCompletable && !isCompleted ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn(isCompleted && "line-through")}>{task.name}</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>{task.trader.name}</span>
                              {task.map && <span>• {task.map.name}</span>}
                              {task.kappaRequired && (
                                <span className="text-red-500">• Kappa Required</span>
                              )}
                              {task.lightkeeperRequired && (
                                <span className="text-green-500">• Lightkeeper Required</span>
                              )}
                            </div>
                          </div>
                        </label>
                        {task.wikiLink && (
                          <a
                            href={task.wikiLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={e => e.stopPropagation()}
                          >
                            <Link2 className="h-4 w-4" />
                          </a>
                        )}
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
