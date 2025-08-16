import React from 'react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

export interface TraderProgress {
  id: string;
  name: string;
  completed: number;
  total: number;
  color: string;
  icon?: React.ReactNode;
  imageLink?: string;
}

interface QuestProgressPanelProps {
  className?: string;
  totalQuests: number;
  completedQuests: number;
  traders: TraderProgress[];
  totalCollectorItems?: number;
  completedCollectorItems?: number;
  totalKappaTasks?: number;
  completedKappaTasks?: number;
  totalLightkeeperTasks?: number;
  completedLightkeeperTasks?: number;
  totalPrestigeSteps?: number;
  completedPrestigeSteps?: number;
}

export function QuestProgressPanel({
  className,
  totalQuests,
  completedQuests,
  traders,
  totalCollectorItems = 0,
  completedCollectorItems = 0,
  totalKappaTasks = 0,
  completedKappaTasks = 0,
  totalLightkeeperTasks = 0,
  completedLightkeeperTasks = 0,
  totalPrestigeSteps = 0,
  completedPrestigeSteps = 0,
}: QuestProgressPanelProps) {
  const progress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  const itemProgress = totalCollectorItems > 0 ? (completedCollectorItems / totalCollectorItems) * 100 : 0;
  const kappaProgress = totalKappaTasks > 0 ? (completedKappaTasks / totalKappaTasks) * 100 : 0;
  const lightkeeperProgress = totalLightkeeperTasks > 0 ? (completedLightkeeperTasks / totalLightkeeperTasks) * 100 : 0;
  const prestigeProgress = totalPrestigeSteps > 0 ? (completedPrestigeSteps / totalPrestigeSteps) * 100 : 0;

  return (
    <div className={cn("bg-card border rounded-lg p-4 shadow-sm w-72", className)}>
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Progress Overview
      </h2>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{completedQuests}/{totalQuests} Quests</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName="bg-primary"
        />
      </div>

      {totalCollectorItems > 0 && (
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedCollectorItems}/{totalCollectorItems} Items</span>
            <span>{itemProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={itemProgress} 
            className="h-2"
            indicatorClassName="bg-green-500"
          />
        </div>
      )}

      {totalPrestigeSteps > 0 && (
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedPrestigeSteps}/{totalPrestigeSteps} Prestige Steps</span>
            <span>{prestigeProgress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={prestigeProgress} 
            className="h-2"
            indicatorClassName="bg-violet-500"
          />
        </div>
      )}

      {(totalKappaTasks > 0 || totalLightkeeperTasks > 0) && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-muted-foreground">Special Tasks</h3>
          
          {totalKappaTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>🎯 Kappa Required</span>
                <span>{completedKappaTasks}/{totalKappaTasks}</span>
              </div>
              <Progress 
                value={kappaProgress} 
                className="h-2"
                indicatorClassName="bg-yellow-500"
              />
            </div>
          )}
          
          {totalLightkeeperTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>💡 Lightkeeper Required</span>
                <span>{completedLightkeeperTasks}/{totalLightkeeperTasks}</span>
              </div>
              <Progress 
                value={lightkeeperProgress} 
                className="h-2"
                indicatorClassName="bg-orange-500"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Traders</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {traders.map((trader) => {
            const traderProgress = trader.total > 0 
              ? (trader.completed / trader.total) * 100 
              : 0;
            
            return (
              <div key={trader.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: trader.color }}
                  />
                  {trader.imageLink && (
                    <img 
                      src={trader.imageLink} 
                      alt={trader.name}
                      className="w-4 h-4 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="text-sm text-foreground truncate">
                    {trader.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                    {trader.completed}/{trader.total}
                  </span>
                </div>
                <Progress 
                  value={traderProgress}
                  className="h-1.5"
                  indicatorClassName="h-full"
                  style={{
                    '--progress-color': trader.color,
                    '--progress-bg': `${trader.color}20`,
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
