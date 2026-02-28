import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { Task } from '../types';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronRight, ChevronDown, ExternalLink, Search, Filter, ArrowRight, Target } from 'lucide-react';
import { buildTaskDependencyMap, canComplete } from '../utils/taskUtils';
import { TRADER_COLORS } from '../data/traders';
import { cn } from '@/lib/utils';

interface QuestTreeViewProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  showKappa: boolean;
  showLightkeeper: boolean;
  onToggleComplete: (taskId: string) => void;
  highlightedTaskId?: string | null;
}

interface TreeNode {
  task: Task;
  children: TreeNode[];
  level: number;
  isRoot: boolean;
}

export const QuestTreeView: React.FC<QuestTreeViewProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  showKappa,
  showLightkeeper,
  onToggleComplete,
  highlightedTaskId,
}) => {
  const [searchTerm, setSearchTerm] = useQueryState('search', { defaultValue: '' });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTrader, setSelectedTrader] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    const baseTasks = tasks.filter(task => {
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
      if (selectedTrader !== 'all' && task.trader.name !== selectedTrader) return false;
      
      return true;
    });

    // If there's a search term, we need to include both matching tasks AND their dependencies
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchingTasks = baseTasks.filter(task => 
        task.name.toLowerCase().includes(term) ||
        task.trader.name.toLowerCase().includes(term) ||
        task.map?.name.toLowerCase().includes(term) ||
        task.maps?.some(m => m.name.toLowerCase().includes(term))
      );
      
      // Get all dependencies for matching tasks
      const taskIds = new Set<string>();
      const addTaskAndDependencies = (task: Task) => {
        if (taskIds.has(task.id)) return;
        taskIds.add(task.id);
        
        // Add all dependencies recursively
        task.taskRequirements.forEach(req => {
          const depTask = baseTasks.find(t => t.id === req.task.id);
          if (depTask) {
            addTaskAndDependencies(depTask);
          }
        });
      };
      
      matchingTasks.forEach(addTaskAndDependencies);
      
      return baseTasks.filter(task => taskIds.has(task.id));
    }
    
    return baseTasks;
  }, [tasks, showKappa, showLightkeeper, hiddenTraders, selectedTrader, searchTerm]);

  // Build dependency map
  const dependencyMap = useMemo(() => buildTaskDependencyMap(filteredTasks), [filteredTasks]);

  // Get the dependency chain for a task (from root to task)
  const getTaskDependencyChain = useCallback((taskId: string, allTasks: Task[]): string[] => {
    const taskMap = new Map(allTasks.map(task => [task.id, task]));
    const visited = new Set<string>();
    const chain: string[] = [];
    
    const buildChain = (currentTaskId: string) => {
      if (visited.has(currentTaskId)) return;
      visited.add(currentTaskId);
      
      const task = taskMap.get(currentTaskId);
      if (!task) return;
      
      // Add dependencies first (depth-first)
      task.taskRequirements.forEach(req => {
        buildChain(req.task.id);
      });
      
      chain.push(currentTaskId);
    };
    
    buildChain(taskId);
    return chain;
  }, []);

  // Find matching tasks and their paths
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    
    const term = searchTerm.toLowerCase();
    const matchingTasks = filteredTasks.filter(task => 
      task.name.toLowerCase().includes(term) ||
      task.trader.name.toLowerCase().includes(term) ||
      task.map?.name.toLowerCase().includes(term) ||
      task.maps?.some(m => m.name.toLowerCase().includes(term))
    );
    
    return matchingTasks.map(task => ({
      task,
      dependencyChain: getTaskDependencyChain(task.id, tasks)
    }));
  }, [searchTerm, filteredTasks, tasks, getTaskDependencyChain]);

  // Auto-expand paths when searching
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const pathsToExpand = new Set<string>();
      searchResults.forEach(result => {
        result.dependencyChain.forEach(taskId => {
          pathsToExpand.add(taskId);
        });
      });
      setExpandedNodes(pathsToExpand);
    }
  }, [searchResults]);

  // Build tree structure
  const treeData = useMemo(() => {
    // Define late-game tasks that should be separated
    const LATE_GAME_TASKS = [
      "Only Business",  // Level 15
      "Grenadier",      // Level 20
      "Profitable Venture"  // Level 61
    ];
    
    // Find the minimum level among late-game tasks
    const lateGameTasks = filteredTasks.filter(task => LATE_GAME_TASKS.includes(task.name));
    const minLateGameLevel = lateGameTasks.length > 0 
      ? Math.min(...lateGameTasks.map(task => task.minPlayerLevel))
      : 15; // Default to 15 if no tasks found (shouldn't happen)

    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes for all tasks
    filteredTasks.forEach(task => {
      nodeMap.set(task.id, {
        task,
        children: [],
        level: 0,
        isRoot: task.taskRequirements.length === 0
      });
    });

    // Build parent-child relationships. A task can have multiple prerequisites,
    // but rendering it under every parent duplicates the same card in the tree.
    // Attach each task once to the first visible prerequisite and let the
    // selected-task breadcrumb show the full predecessor list.
    filteredTasks.forEach(task => {
      const node = nodeMap.get(task.id)!;
      
      if (task.taskRequirements.length === 0) {
        rootNodes.push(node);
      } else {
        const visibleParents = task.taskRequirements
          .map(req => nodeMap.get(req.task.id))
          .filter((parentNode): parentNode is TreeNode => !!parentNode);

        if (visibleParents.length === 0) {
          rootNodes.push(node);
          return;
        }

        const parentNode = visibleParents[0];
        parentNode.children.push(node);
        node.level = parentNode.level + 1;
      }
    });

    // Sort nodes by trader and name, and separate late-game tasks
    const sortAndSeparateNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.task.trader.name !== b.task.trader.name) {
          return a.task.trader.name.localeCompare(b.task.trader.name);
        }
        return a.task.name.localeCompare(b.task.name);
      });
      
      // Separate late-game tasks
      const regularNodes: TreeNode[] = [];
      const lateNodes: TreeNode[] = [];
      
      nodes.forEach(node => {
        if (LATE_GAME_TASKS.includes(node.task.name)) {
          lateNodes.push(node);
        } else {
          regularNodes.push(node);
          sortAndSeparateNodes(node.children);
        }
      });
      
      return { regularNodes, lateNodes };
    };

    // Process root nodes
    const { regularNodes, lateNodes } = sortAndSeparateNodes(rootNodes);
    
    // Add late-game separator and nodes if there are any late-game tasks
    if (lateNodes.length > 0) {
      // Add a special node for the separator
      const separatorNode: TreeNode = {
        task: {
          id: 'late-game-separator',
          name: '',
          trader: { name: 'Fence' },
          minPlayerLevel: minLateGameLevel,
          taskRequirements: [],
          kappaRequired: false,
          lightkeeperRequired: false,
          wikiLink: '',
          map: { name: 'Any' },
          maps: []
        },
        children: lateNodes,
        level: 0,
        isRoot: true
      };
      
      // Add the separator and late-game nodes to the regular nodes
      return [...regularNodes, separatorNode];
    }
    
    return regularNodes;
  }, [filteredTasks]);

  // Get unique traders for filter dropdown
  const availableTraders = useMemo(() => {
    const traders = new Set(filteredTasks.map(task => task.trader.name));
    return Array.from(traders).sort();
  }, [filteredTasks]);

  const toggleExpanded = useCallback((taskId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allTaskIds = new Set(filteredTasks.map(task => task.id));
    setExpandedNodes(allTaskIds);
  }, [filteredTasks]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const renderTreeNode = useCallback((node: TreeNode, depth: number = 0): React.ReactNode => {
    const { task } = node;
    const isSeparator = task.id === 'late-game-separator';
    const isCompleted = completedTasks.has(task.id);
    const isCompletable = canComplete(task.id, completedTasks, dependencyMap);
    const isExpanded = isSeparator ? true : expandedNodes.has(task.id);
    const hasChildren = node.children.length > 0;
    const isHighlighted = highlightedTaskId === task.id;
    const isSelected = selectedTaskId === task.id;
    const traderColor = TRADER_COLORS[task.trader.name] || (isSeparator ? '#6b7280' : '#6b7280');
    
    // Check if this task is in a search result path
    const isInSearchPath = searchResults?.some(result => 
      result.dependencyChain.includes(task.id)
    ) || false;
    
    // Check if this task matches the search term
    const isSearchMatch = searchTerm.trim() && (
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.trader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.map?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.maps?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Special rendering for the separator
    if (isSeparator) {
      return (
        <div key={task.id} className="mt-8 mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-card text-sm font-medium text-muted-foreground">
                {task.name} (Level {task.minPlayerLevel}+)
              </span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">
            These quests unlock at higher levels and are not part of the main progression
          </p>
          {node.children.map(childNode => renderTreeNode(childNode, depth))}
        </div>
      );
    }

    return (
      <div key={task.id} className="select-none">
        <Card
          className={cn(
            'mb-2 transition-all duration-200 hover:shadow-md border-l-4 cursor-pointer',
            isHighlighted && 'ring-2 ring-yellow-400 ring-offset-2',
            isSelected && 'ring-2 ring-blue-400 ring-offset-2',
            isSearchMatch && 'ring-2 ring-orange-400 ring-offset-2',
            isInSearchPath && !isSearchMatch && 'bg-blue-500 bg-blue-950/20 border-l-blue-400',
            isCompleted ? 'bg-green-950/20 border-l-green-500' : 'border-l-blue-500',
            !isCompletable && !isCompleted && 'opacity-60'
          )}
          style={{
            marginLeft: `${depth * 24}px`,
            borderLeftColor: isCompleted ? '#10b981' : (isInSearchPath ? '#3b82f6' : traderColor)
          }}
          onClick={() => setSelectedTaskId(task.id)}
        >
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(task.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {/* Completion Checkbox */}
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleComplete(task.id)}
                disabled={!isCompletable && !isCompleted}
                className="flex-shrink-0"
              />

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {isSearchMatch && <Target className="h-3 w-3 text-orange-500 flex-shrink-0" />}
                    <h3 className={cn(
                      'font-medium text-sm truncate',
                      isCompleted && 'line-through text-muted-foreground',
                      isSearchMatch && 'font-semibold text-orange-700 dark:text-orange-300'
                    )}>
                      {task.name}
                    </h3>
                  </div>
                  
                  {/* Trader Badge */}
                  <span
                    className="px-2 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-300 flex-shrink-0"
                    style={{ backgroundColor: traderColor }}
                  >
                    {task.trader.name}
                  </span>
                </div>

                {/* Task Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Level {task.minPlayerLevel}</span>
                  {task.map && <span>• {task.map.name}</span>}
                  {task.kappaRequired && (
                    <span className="text-red-500">• Kappa Required</span>
                  )}
                  {task.lightkeeperRequired && (
                    <span className="text-orange-500">• Lightkeeper Required</span>
                  )}
                  {task.taskRequirements.length > 0 && (
                    <span>• Requires {task.taskRequirements.length} task{task.taskRequirements.length > 1 ? 's' : ''}</span>
                  )}
                  
                  {/* Objectives - Inline with Popover */}
                  {task.objectives && task.objectives.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-yellow-300 cursor-help hover:underline">
                          • {task.objectives.length} objective{task.objectives.length > 1 ? 's' : ''}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" side="top">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            Objectives ({task.objectives.length})
                          </h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {task.objectives.map((objective, index) => (
                              <div key={index} className="text-sm text-muted-foreground">
                                <span className="text-yellow-600 mr-1">{index + 1}.</span>
                                {'playerLevel' in objective ? (
                                  `Reach level ${objective.playerLevel}`
                                ) : (
                                  objective.description
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  {/* Rewards - Inline with Popover */}
                  {((task.startRewards?.items && task.startRewards.items.length > 0) || 
                    (task.finishRewards?.items && task.finishRewards.items.length > 0)) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-blue-600 cursor-help hover:underline">
                          • {((task.startRewards?.items?.length ?? 0) + (task.finishRewards?.items?.length ?? 0)) || 0} reward{((task.startRewards?.items?.length ?? 0) + (task.finishRewards?.items?.length ?? 0)) !== 1 ? 's' : ''}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" side="top">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Rewards
                          </h4>
                          <div className="space-y-3">
                            {task.startRewards?.items && task.startRewards.items.length > 0 && (
                              <div>
                                <div className="text-green-600 font-medium text-sm mb-1">Start Rewards:</div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {task.startRewards.items.map((reward, index) => (
                                    <div key={index} className="text-sm text-muted-foreground">
                                      • {reward.item.name}{reward.count > 1 ? ` (${reward.count})` : ''}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {task.finishRewards?.items && task.finishRewards.items.length > 0 && (
                              <div>
                                <div className="text-blue-600 font-medium text-sm mb-1">Finish Rewards:</div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {task.finishRewards.items.map((reward, index) => (
                                    <div key={index} className="text-sm text-muted-foreground">
                                      • {reward.item.name}{reward.count > 1 ? ` (${reward.count})` : ''}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              {/* Wiki Link */}
              {task.wikiLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  asChild
                >
                  <a
                    href={task.wikiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(childNode => renderTreeNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [completedTasks, dependencyMap, expandedNodes, highlightedTaskId, selectedTaskId, searchResults, searchTerm, onToggleComplete, toggleExpanded]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Controls */}
      <div className="p-4 border-b bg-card space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quests to see their dependency path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results Summary */}
          {searchResults && searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border">
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3" />
                <span className="font-medium">
                  {searchResults.length} quest
                  {searchResults.length > 1 ? "s" : ""} found
                </span>
              </div>
              <div className="text-xs opacity-75">
                🔍 Orange highlight = Search match • 🔗 Blue highlight =
                Dependency path • Auto-expanded to show paths
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trader Filter */}
          <select
            value={selectedTrader}
            onChange={(e) => setSelectedTrader(e.target.value)}
            className="px-3 py-1 rounded border bg-background text-sm"
          >
            <option value="all">All Traders</option>
            {availableTraders.map((trader) => (
              <option key={trader} value={trader}>
                {trader}
              </option>
            ))}
          </select>

          {/* Expand/Collapse Controls */}
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>

          {/* Clear Search */}
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedTaskId(null);
              }}
            >
              Clear Search
            </Button>
          )}

          {/* Stats */}
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredTasks.filter((task) => completedTasks.has(task.id)).length}{" "}
            / {filteredTasks.length} completed
          </div>
        </div>
      </div>

      {/* Selected Task Breadcrumb - shows all predecessors and successors */}
      {selectedTaskId && (
        <div className="sticky top-0 z-10 border-b bg-card p-3">
          {(() => {
            const taskMap = new Map(tasks.map((t) => [t.id, t]));
            const currentTask = taskMap.get(selectedTaskId);
            if (!currentTask) return null;

            // Get direct predecessors (tasks this one requires)
            const predecessors = currentTask.taskRequirements
              .map((req) => taskMap.get(req.task.id))
              .filter((t): t is Task => !!t)
              .sort((a, b) => a.name.localeCompare(b.name));

            // Get direct successors (tasks that require this one)
            const successors = tasks
              .filter((t) =>
                t.taskRequirements?.some(
                  (req) => req.task.id === selectedTaskId
                )
              )
              .sort((a, b) => a.name.localeCompare(b.name));

            return (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Previous tasks */}
                {predecessors.length > 0 && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Previous
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {predecessors.map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded cursor-pointer transition-colors",
                              "bg-gray-800 hover:bg-gray-600",
                              completedTasks.has(t.id) &&
                                "line-through opacity-60"
                            )}
                            onClick={() => setSelectedTaskId(t.id)}
                          >
                            {t.name}
                          </span>
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
                      completedTasks.has(selectedTaskId) &&
                        "line-through opacity-60"
                    )}
                    onClick={() => setSelectedTaskId(selectedTaskId)}
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
                              completedTasks.has(t.id) &&
                                "line-through opacity-60"
                            )}
                            onClick={() => setSelectedTaskId(t.id)}
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

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {treeData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quests match your current filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {treeData.map((node) => renderTreeNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};
