import React, { useState } from "react";
import { ExternalLink, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Task } from "../types";
import { TRADER_COLORS } from "../data/traders";
import { Card} from "./ui/card";
import { Button } from "./ui/button";

interface TaskNodeProps {
  task: Task;
  isCompleted: boolean;
  canComplete: boolean;
  onToggleComplete: (taskId: string) => void;
  position: { x: number; y: number };
  completedTasks: Set<string>;
  isHighlighted?: boolean;
}

export const TaskNode: React.FC<TaskNodeProps> = ({
  task,
  isCompleted,
  canComplete,
  onToggleComplete,
  position,
  completedTasks,
  isHighlighted = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const traderColor = TRADER_COLORS[task.trader.name] || "#6b7280";

  return (
    <div
      className={`task-node absolute transform -translate-x-1/2 -translate-y-1/2 ${
        isExpanded ? "z-10" : ""
      }`}
      style={{ left: position.x, top: position.y }}
    >
      <Card
        className={`
          relative shadow-lg transition-all duration-200 hover:shadow-xl border-2
          ${isExpanded ? "min-w-64" : "min-w-48"}
          ${isHighlighted 
            ? 'ring-2 ring-yellow-400 ring-offset-2 z-20 scale-105' 
            : ''}
          ${isCompleted 
            ? "border-green-500 bg-card/90" 
            : canComplete 
            ? "border-primary bg-card/90" 
            : "border-muted bg-card/50"}
        `}
      >
        {/* Completion checkbox */}
        <Button
          onClick={() => onToggleComplete(task.id)}
          disabled={!canComplete && !isCompleted}
          size="sm"
          variant={isCompleted ? "default" : canComplete ? "secondary" : "ghost"}
          className={`
            absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 z-10
            transition-all duration-200 hover:scale-110
            ${
              isCompleted
                ? "bg-green-500 hover:bg-green-600 border-green-500 text-white"
                : canComplete
                ? "border-primary hover:bg-primary hover:text-primary-foreground"
                : "cursor-not-allowed opacity-50"
            }
          `}
        >
          {isCompleted && <Check size={12} />}
        </Button>

        {/* Collapsed view */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-card-foreground font-medium text-sm leading-tight truncate pr-2">
                {task.name}
              </h3>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
              {/* Trader and level */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 rounded text-primary-foreground font-medium text-xs"
                  style={{ 
                    backgroundColor: isCompleted ? 'hsl(142, 76%, 36%)' : traderColor,
                    opacity: isCompleted ? 0.9 : 1
                  }}
                >
                  {task.trader.name}
                </span>
                <span className="text-muted-foreground/80 text-xs">
                  Level {task.minPlayerLevel}
                </span>
              </div>

              {/* Kappa and Lightkeeper requirements */}
              {(task.kappaRequired !== undefined ||
                task.lightkeeperRequired !== undefined) && (
                <div className="flex items-center gap-3 text-xs">
                  {task.kappaRequired !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/80">Kappa:</span>
                      {task.kappaRequired ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <X size={12} className="text-red-400" />
                      )}
                    </div>
                  )}
                  {task.lightkeeperRequired !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground/80">Lightkeeper:</span>
                      {task.lightkeeperRequired ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <X size={12} className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dependencies */}
              {task.taskRequirements.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground/80 mb-1">
                    Requires {task.taskRequirements.length} task
                    {task.taskRequirements.length > 1 ? "s" : ""}:
                  </div>
                  <div className="space-y-1">
                    {task.taskRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`text-xs pl-2 border-l-2 ${
                          completedTasks.has(req.task.id)
                            ? 'text-green-400 border-green-500/50'
                            : 'text-muted-foreground/80 border-border/50'
                        }`}
                      >
                        {req.task.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wiki link */}
              <div>
                <a
                  href={task.wikiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors"
                >
                  <ExternalLink size={12} />
                  View Wiki
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
