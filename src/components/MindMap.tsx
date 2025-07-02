import * as dagre from 'dagre';
import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Task, TaskPositions } from "../types";
import { TaskNode } from "./TaskNode";
import { ConnectionLine } from "./ConnectionLine";
import {
  calculateTaskLevels,
  buildTaskDependencyMap,
} from "../utils/taskUtils";

interface MindMapProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  onToggleComplete: (taskId: string) => void;
  showKappa: boolean;
  showLightkeeper: boolean;
  highlightedTaskId?: string | null;
}

export const MindMap: React.FC<MindMapProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  onToggleComplete,
  showKappa,
  showLightkeeper,
  highlightedTaskId = null,
}) => {
  // Filter visible tasks based on requirements and hidden traders
  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Apply Kappa/Lightkeeper filters
      if (showKappa && showLightkeeper) {
        if (!(task.kappaRequired || task.lightkeeperRequired)) return false;
      } else if (showKappa && !task.kappaRequired) {
        return false;
      } else if (showLightkeeper && !task.lightkeeperRequired) {
        return false;
      }

      // Apply trader filter
      if (hiddenTraders.has(task.trader.name)) {
        return false;
      }

      return true;
    });
  }, [tasks, showKappa, showLightkeeper, hiddenTraders]);

  // Build dependency map for tasks
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

  // Container ref is still used for pan/zoom functionality

  // Find all tasks in a dependency chain
  const findTaskChain = useCallback(
    (taskId: string, deps: Record<string, string[]>): Set<string> => {
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
    },
    []
  );

  // Handle task hover to highlight dependencies
  const handleTaskHover = useCallback(
    (taskId: string | null) => {
      setHoveredTaskId(taskId);
      if (!taskId) {
        setHighlightedTaskIds(new Set());
        return;
      }

      const chain = findTaskChain(taskId, dependencyMap);
      setHighlightedTaskIds(chain);
    },
    [dependencyMap, findTaskChain]
  );

  // Handle panning start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest(".task-node")) {
      const container = containerRef.current;
      if (!container) return;

      container.setPointerCapture(e.pointerId);
      setIsPanning(true);
      setStartPos({
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      });
    }
  }, []);

  // Handle panning movement
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;

    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;
    setPosition({ x: newX, y: newY });
  }, []);

  // Handle panning end
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      const container = containerRef.current;
      if (container) {
        container.releasePointerCapture(e.pointerId);
      }
      setIsPanning(false);
    }
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Calculate new zoom level
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const currentZoom = zoomRef.current;
    const newZoom = Math.max(0.3, Math.min(3, currentZoom * (1 + delta)));

    // Only update if zoom level changed
    if (Math.abs(newZoom - currentZoom) > 0.001) {
      const container = containerRef.current;
      if (!container) return;

      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate position in scaled coordinate space
      const currentPos = positionRef.current;
      const mouseInContentX = (mouseX - currentPos.x) / currentZoom;
      const mouseInContentY = (mouseY - currentPos.y) / currentZoom;

      // Calculate new position to zoom toward mouse
      const newX = mouseX - mouseInContentX * newZoom;
      const newY = mouseY - mouseInContentY * newZoom;

      // Apply new zoom and position
      setPosition({ x: newX, y: newY });
      setZoom(newZoom);
    }
  }, []);

  // Update refs when state changes
  useEffect(() => {
    isPanningRef.current = isPanning;
    startPosRef.current = startPos;
    positionRef.current = position;
    zoomRef.current = zoom;
  }, [isPanning, position, zoom, startPos]);

  // Update highlighted tasks when the prop changes
  useEffect(() => {
    if (highlightedTaskId) {
      const chain = findTaskChain(highlightedTaskId, dependencyMap);
      setHighlightedTaskIds(chain);
    } else if (!hoveredTaskId) {
      setHighlightedTaskIds(new Set());
    }
  }, [highlightedTaskId, hoveredTaskId, findTaskChain, dependencyMap]);

  // Calculate task levels for layout
  const taskLevels = useMemo(
    () => calculateTaskLevels(visibleTasks),
    [visibleTasks]
  );

  // Calculate task positions using dagre layout
  const taskPositions = useMemo(() => {
    // 1) Build a compound graph
    const g = new dagre.graphlib.Graph({ compound: true });
    
    // Add a root node for top-level clusters
    g.setNode('root', { width: 0, height: 0 });
    g.setGraph({
      rankdir: 'LR',
      align:  'UL',
      nodesep: 5,   // was 100 → half the horizontal gap
      ranksep: 5,   // was 150 → more compact rows
      marginx: 50,   // was 50 → slimmer left/right margins
      marginy: 50,   // was 50 → slimmer top/bottom margins
      ranker: 'longest-path',
    });
    g.setDefaultEdgeLabel(() => ({}));
  
    // 2) Create one invisible “cluster” node per trader
    visibleTasks.forEach(task => {
      const clusterId = `cluster-${task.trader.name}`;
      if (!g.hasNode(clusterId)) {
        g.setNode(clusterId, {
          width: 0,
          height: 0,
          label: task.trader.name,
        });
        // Set root as parent for top-level clusters
        g.setParent(clusterId, 'root');
      }
    });
  
    // 3) Add your real task-nodes, and assign them to the proper trader-cluster
    visibleTasks.forEach(task => {
      g.setNode(task.id, { width: 200, height: 60, label: task.name });
      g.setParent(task.id, `cluster-${task.trader.name}`);
    });
  
    // 4) Wire up the dependencies
    visibleTasks.forEach(task => {
      task.taskRequirements.forEach(req => {
        // only if the requirement is also visible
        if (visibleTasks.some(t => t.id === req.task.id)) {
          g.setEdge(req.task.id, task.id);
        }
      });
    });
  
    // 5) Lay it out!
    dagre.layout(g);
  
    // 6) Extract positions, then translate them into your coordinate space
    const positions: TaskPositions = {};
    const nodes = g.nodes().filter(id => !id.startsWith('cluster-'));
  
    nodes.forEach(id => {
      const n = g.node(id)!;
      positions[id] = {
        x: n.x,
        y: n.y,
        level: taskLevels[id] || 0,
      };
    });
  
    return positions;
  }, [visibleTasks, taskLevels]);
  

  // Generate connection lines between tasks
  const connectionLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    const processed = new Set<string>();

    visibleTasks.forEach((task) => {
      task.taskRequirements.forEach((req) => {
        const key = `${req.task.id}-${task.id}`;
        if (processed.has(key)) return;
        processed.add(key);

        const startPos = taskPositions[req.task.id];
        const endPos = taskPositions[task.id];

        if (startPos && endPos) {
          const isHighlighted = 
            highlightedTaskIds.has(task.id) || 
            highlightedTaskIds.has(req.task.id);
          
          lines.push(
            <ConnectionLine
              key={key}
              from={startPos}
              to={endPos}
              isCompleted={completedTasks.has(req.task.id)}
              isHighlighted={isHighlighted}
            />
          );
        }
      });
    });

    return lines;
  }, [visibleTasks, taskPositions, completedTasks, highlightedTaskIds]);

  // Render task nodes
  const taskNodes = useMemo(() => {
    return visibleTasks.map((task) => {
      const isHighlighted = 
        highlightedTaskId === task.id || 
        hoveredTaskId === task.id ||
        highlightedTaskIds.has(task.id);
      
      return (
        <div
          key={task.id}
          onMouseEnter={() => handleTaskHover(task.id)}
          onMouseLeave={() => handleTaskHover(null)}
          className={`transition-opacity duration-200 ${
            highlightedTaskIds.size > 0 && !highlightedTaskIds.has(task.id) 
              ? 'opacity-30' 
              : 'opacity-100'
          }`}
        >
          <TaskNode
            task={task}
            isCompleted={completedTasks.has(task.id)}
            onToggleComplete={onToggleComplete}
            position={taskPositions[task.id]}
            completedTasks={completedTasks}
            isHighlighted={isHighlighted}
          />
        </div>
      );
    });
  }, [
    visibleTasks, 
    completedTasks, 
    taskPositions, 
    highlightedTaskId, 
    hoveredTaskId,
    highlightedTaskIds, 
    handleTaskHover, 
    onToggleComplete
  ]);

  return (
    <div
      className="mindmap-container relative w-full h-screen overflow-hidden rounded-lg"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      ref={containerRef}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {connectionLines}
        {taskNodes}
      </div>
    </div>
  );
};
