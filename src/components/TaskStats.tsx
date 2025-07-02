import React, { useState } from 'react';
import { Target, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../types';
import { TRADER_COLORS, TraderName } from '../data/traders';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface TaskStatsProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  onToggleTraderVisibility: (trader: string) => void;
}

export const TaskStats: React.FC<TaskStatsProps> = ({ 
  tasks, 
  completedTasks, 
  hiddenTraders, 
  onToggleTraderVisibility 
}) => {
  const totalTasks = tasks.length;
  const completedCount = completedTasks.size;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const traderStats = tasks.reduce((stats, task) => {
    const trader = task.trader.name;
    if (!stats[trader]) {
      stats[trader] = { total: 0, completed: 0 };
    }
    stats[trader]!.total++;
    if (completedTasks.has(task.id)) {
      stats[trader]!.completed++;
    }
    return stats;
  }, {} as Partial<Record<TraderName, { total: number; completed: number }>>);

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className="mb-6 bg-yellow-100 dark:bg-yellow-900/30">
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target size={20} />
                Quest Progress & Trader Visibility
              </CardTitle>
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* Overall progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{completedCount}/{totalTasks}</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="text-right text-sm text-muted-foreground mt-1">
                {completionRate.toFixed(1)}%
              </div>
            </div>

            {/* Trader breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">By Trader:</h3>
              {(Object.entries(traderStats) as [TraderName, { total: number, completed: number }][]).map(([trader, stats]) => {
                const traderColor = TRADER_COLORS[trader] || '#6b7280';
                const traderRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                const isHidden = hiddenTraders.has(trader);
                
                return (
                  <div key={trader} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleTraderVisibility(trader)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        title={isHidden ? 'Show trader' : 'Hide trader'}
                      >
                        {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: traderColor }}
                      />
                      <span className={`${isHidden ? 'opacity-50' : ''}`}>
                        {trader}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isHidden ? 'opacity-50' : ''}`}>
                        {stats.completed}/{stats.total}
                      </span>
                      <div className="w-16 bg-muted rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${traderRate}%`,
                            backgroundColor: traderColor,
                            opacity: isHidden ? 0.5 : 1
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};