import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Task, TaskPositions } from "../types";
import { TaskNode } from "./TaskNode";
import { ConnectionLine } from "./ConnectionLine";
import {
  groupTasksByTrader,
  calculateTaskLevels,
  buildTaskDependencyMap,
  canComplete as canCompleteTask,
} from "../utils/taskUtils";

interface MindMapProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  onToggleComplete: (taskId: string) => void;
  showKappa: boolean;
  showLightkeeper: boolean;
}

export const MindMap: React.FC<MindMapProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  onToggleComplete,
  showKappa,
  showLightkeeper,
}) => {
  const visibleTasks = useMemo(() => {
    const requirementFilterActive = showKappa || showLightkeeper;

    if (requirementFilterActive) {
      return tasks.filter(task => {
        if (showKappa && showLightkeeper) {
          return task.kappaRequired || task.lightkeeperRequired;
        }
        if (showKappa) {
          return task.kappaRequired;
        }
        if (showLightkeeper) {
          return task.lightkeeperRequired;
        }
        return false;
      });
    }
    
    return tasks.filter(task => !hiddenTraders.has(task.trader.name));
  }, [tasks, hiddenTraders, showKappa, showLightkeeper]);

  const tasksByTrader = useMemo(
    () => groupTasksByTrader(visibleTasks),
    [visibleTasks]
  );
  // Calculate dependency map first
  const dependencyMap = useMemo(
    () => buildTaskDependencyMap(visibleTasks),
    [visibleTasks]
  );

  // State hooks
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<Set<string>>(new Set());
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(isPanning);
  const startPosRef = useRef(startPos);
  const positionRef = useRef(position);
  const zoomRef = useRef(zoom);
  
  // Memoized callbacks
  const findTaskChain = useCallback((taskId: string, deps: Record<string, string[]>): Set<string> => {
    const visited = new Set<string>();
    const queue = [taskId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      const dependencies = deps[currentId] || [];
      queue.push(...dependencies);
    }
    
    return visited;
  }, []);

  const handleTaskHover = useCallback((taskId: string | null) => {
    setHoveredTaskId(taskId);
    if (!taskId) {
      setHighlightedTaskIds(new Set());
      return;
    }
    
    const chain = findTaskChain(taskId, dependencyMap);
    setHighlightedTaskIds(chain);
  }, [dependencyMap, findTaskChain]);



  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning with left mouse button and not on a task node
    if (e.button === 0 && !(e.target as HTMLElement).closest('.task-node')) {
      setIsPanning(true);
      setStartPos({
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      });
      document.body.style.cursor = 'grabbing';
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = 0.1;
    const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
    const newZoom = Math.max(0.3, Math.min(3, zoomRef.current + delta));
    
    if (newZoom !== zoomRef.current) {
      // Get mouse position relative to the container
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom center point
        const zoomCenterX = (mouseX - positionRef.current.x) / zoomRef.current;
        const zoomCenterY = (mouseY - positionRef.current.y) / zoomRef.current;
        
        // Update position to zoom around mouse cursor
        const newX = mouseX - zoomCenterX * newZoom;
        const newY = mouseY - zoomCenterY * newZoom;
        
        setPosition({ x: newX, y: newY });
        setZoom(newZoom);
      }
    }
  }, []);

  // Update refs when state changes - this effect runs on every render
  useEffect(() => {
    isPanningRef.current = isPanning;
    startPosRef.current = startPos;
    positionRef.current = position;
    zoomRef.current = zoom;
  }); // No dependency array means this runs after every render
  const taskLevels = useMemo(
    () => calculateTaskLevels(visibleTasks),
    [visibleTasks]
  );
  const taskPositions = useMemo(() => {
    const positions: TaskPositions = {};
    const traderNames = Object.keys(tasksByTrader);
    // Increased vertical spacing to prevent card overlap

    traderNames.forEach((traderName, traderIndex) => {
      const traderTasks = tasksByTrader[traderName];
      const levelGroups: Record<number, Task[]> = {};

      // Group tasks by level within trader
      traderTasks.forEach((task) => {
        const level = taskLevels[task.id];
        if (!levelGroups[level]) {
          levelGroups[level] = [];
        }
        levelGroups[level].push(task);
      });

      // Position tasks with better spacing
      Object.entries(levelGroups).forEach(([level, tasks]) => {
        const levelNum = parseInt(level);
        tasks.forEach((task, taskIndex) => {
          const x = 200 + levelNum * 300;
          // Increase vertical spacing between cards by using larger multipliers
          const y = 120 + traderIndex * 180 + taskIndex * 250;

          positions[task.id] = { x, y, level: levelNum };
        });
      });
    });

    return positions;
  }, [tasksByTrader, taskLevels]);

  const connections = useMemo(() => {
    const connections: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      fromId: string;
      toId: string;
      isCompleted: boolean;
      isInHighlightedChain: boolean;
    }> = [];

    visibleTasks.forEach((task) => {
      const toPos = taskPositions[task.id];
      if (!toPos) return;

      task.taskRequirements.forEach((req) => {
        const fromPos = taskPositions[req.task.id];
        if (!fromPos) return;
        
        const isInHighlightedChain = highlightedTaskIds.has(req.task.id) && 
                                  highlightedTaskIds.has(task.id);

        connections.push({
          from: { x: fromPos.x, y: fromPos.y },
          to: { x: toPos.x, y: toPos.y },
          fromId: req.task.id,
          toId: task.id,
          isCompleted: completedTasks.has(req.task.id) && completedTasks.has(task.id),
          isInHighlightedChain,
        });
      });
    });

    return connections;
  }, [visibleTasks, taskPositions, completedTasks, highlightedTaskIds]);

  // Set up and clean up event listeners
  useEffect(() => {
    let mouseMoveHandler: (e: MouseEvent) => void;
    let mouseUpHandler: () => void;

    if (isPanning) {
      mouseMoveHandler = (e: MouseEvent) => {
        if (!isPanningRef.current) return;
        
        const newX = e.clientX - startPosRef.current.x;
        const newY = e.clientY - startPosRef.current.y;
        setPosition({ x: newX, y: newY });
      };
      
      mouseUpHandler = () => {
        if (isPanningRef.current) {
          setIsPanning(false);
          document.body.style.cursor = '';
        }
      };
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    }
    
    return () => {
      if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
      }
      if (mouseUpHandler) {
        document.removeEventListener('mouseup', mouseUpHandler);
      }
    };
  }, [isPanning]); // Only depend on isPanning since we're using refs for other values

  // Reset cursor when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  if (visibleTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center">
          <p className="text-lg mb-2">No visible tasks</p>
          <p className="text-sm">
            {tasks.length > 0
              ? "All traders are hidden. Use the eye icons in Progress Overview to show traders."
              : "Paste your JSON data above to get started"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-slate-900 rounded-lg"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      ref={containerRef}
    >
      <div
        className="relative transition-transform duration-100 ease-out will-change-transform"
        style={{
          width: "100%",
          height: "100%",
          minWidth: "1400px",
          minHeight: "900px",
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
      >
        {/* Render connections */}
        {connections.map((conn, index) => {
        const isHighlighted = hoveredTaskId !== null && 
                            (conn.isInHighlightedChain || 
                             (highlightedTaskIds.has(conn.fromId) && 
                              highlightedTaskIds.has(conn.toId)));
        
        return (
          <ConnectionLine
            key={`${conn.fromId}-${conn.toId}-${index}`}
            from={conn.from}
            to={conn.to}
            isCompleted={conn.isCompleted}
            isHighlighted={isHighlighted}
            isDimmed={hoveredTaskId !== null && !isHighlighted}
          />
        );
      })}

        {/* Render task nodes */}
        {visibleTasks.map((task) => {
        const pos = taskPositions[task.id];
        if (!pos) return null;

        const isCompleted = completedTasks.has(task.id);
        const canComplete = !isCompleted && canCompleteTask(task.id, completedTasks, dependencyMap);
        const isHighlighted = hoveredTaskId === task.id || highlightedTaskIds.has(task.id);
        const isDimmed = hoveredTaskId !== null && !isHighlighted;

        return (
          <div
            key={task.id}
            onMouseEnter={() => handleTaskHover(task.id)}
            onMouseLeave={() => handleTaskHover(null)}
            className={`transition-opacity duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
          >
            <TaskNode
              task={task}
              isCompleted={isCompleted}
              canComplete={canComplete}
              onToggleComplete={onToggleComplete}
              position={pos}
              completedTasks={completedTasks}
              isHighlighted={isHighlighted}
            />
          </div>
        );
      })}

        {/* Legend (collapsed) */}
        <details
          className="absolute top-4 right-4 bg-slate-800 rounded-lg border border-slate-700 shadow-lg w-56"
          style={{ zIndex: 20 }}
        >
          <summary className="cursor-pointer p-3 flex items-center justify-between outline-none select-none text-white font-semibold">
            Legend
            <span className="ml-2 text-xs text-slate-400">(expand)</span>
          </summary>
          <div className="p-3 pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-slate-300">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-slate-300">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-600 rounded"></div>
                <span className="text-slate-300">Locked</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
              Click cards to expand details
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
