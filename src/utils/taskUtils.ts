import { Task } from '../types';

export function groupTasksByTrader(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((groups, task) => {
    const trader = task.trader.name;
    if (!groups[trader]) {
      groups[trader] = [];
    }
    groups[trader].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
}

export function buildTaskDependencyMap(tasks: Task[]): Record<string, string[]> {
  const dependencyMap: Record<string, string[]> = {};
  
  tasks.forEach(task => {
    dependencyMap[task.id] = task.taskRequirements.map(req => req.task.id);
  });
  
  return dependencyMap;
}

export function canComplete(taskId: string, completedTasks: Set<string>, dependencyMap: Record<string, string[]>): boolean {
  const dependencies = dependencyMap[taskId] || [];
  return dependencies.every(depId => completedTasks.has(depId));
}

export function calculateTaskLevels(tasks: Task[]): Record<string, number> {
  const dependencyMap = buildTaskDependencyMap(tasks);
  const levels: Record<string, number> = {};
  const visited = new Set<string>();
  
  function calculateLevel(taskId: string): number {
    if (visited.has(taskId)) return levels[taskId] || 0;
    visited.add(taskId);
    
    const dependencies = dependencyMap[taskId] || [];
    if (dependencies.length === 0) {
      levels[taskId] = 0;
      return 0;
    }
    
    const maxDependencyLevel = Math.max(
      ...dependencies.map(depId => calculateLevel(depId))
    );
    
    levels[taskId] = maxDependencyLevel + 1;
    return levels[taskId];
  }
  
  tasks.forEach(task => calculateLevel(task.id));
  return levels;
}

export function canCompleteTask(taskId: string, completedTasks: Set<string>, dependencyMap: Record<string, string[]>): boolean {
  const dependencies = dependencyMap[taskId] || [];
  return dependencies.every(depId => completedTasks.has(depId));
}