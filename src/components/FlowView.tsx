import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { calculateTaskLevels } from '@/utils/taskUtils';
import { TaskNode } from './TaskNode';
import { ConnectionLine } from './ConnectionLine';
import { TRADER_COLORS } from '@/data/traders';

interface FlowViewProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  showKappa: boolean;
  showLightkeeper: boolean;
  onToggleComplete: (taskId: string) => void;
  highlightedTaskId?: string | null;
}

// A clean dependency-level layout with absolute positioning and connection lines
export const FlowView: React.FC<FlowViewProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  showKappa,
  showLightkeeper,
  onToggleComplete,
  highlightedTaskId,
}) => {
  const [showCrossTraderLinks, setShowCrossTraderLinks] = useState(false);
  // Apply the same basic filtering semantics as other views
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (hiddenTraders.has(task.trader.name)) return false;
      if (showKappa && showLightkeeper) {
        if (!(task.kappaRequired || task.lightkeeperRequired)) return false;
      } else if (showKappa && !task.kappaRequired) {
        return false;
      } else if (showLightkeeper && !task.lightkeeperRequired) {
        return false;
      }
      return true;
    });
  }, [tasks, hiddenTraders, showKappa, showLightkeeper]);

  const levels = useMemo(() => calculateTaskLevels(filteredTasks), [filteredTasks]);
  const taskMap = useMemo(() => new Map(filteredTasks.map(t => [t.id, t])), [filteredTasks]);

  // Determine trader order visible in this view
  const tradersInData = useMemo(() => {
    const set = new Set<string>();
    filteredTasks.forEach(t => set.add(t.trader.name));
    const preferred = Object.keys(TRADER_COLORS).filter(t => set.has(t));
    const extra = Array.from(set).filter(t => !preferred.includes(t)).sort();
    return [...preferred, ...extra];
  }, [filteredTasks]);

  // Group tasks by level and trader
  const tasksByLevelTrader = useMemo(() => {
    const map: Record<number, Record<string, Task[]>> = {};
    filteredTasks.forEach(task => {
      const lvl = levels[task.id] ?? 0;
      if (!map[lvl]) map[lvl] = {} as Record<string, Task[]>;
      const trader = task.trader.name;
      if (!map[lvl][trader]) map[lvl][trader] = [];
      map[lvl][trader].push(task);
    });
    return map;
  }, [filteredTasks, levels]);

  const levelKeys = useMemo(() => Object.keys(tasksByLevelTrader).map(Number).sort((a,b)=>a-b), [tasksByLevelTrader]);

  // Layout constants (tuned to reduce clutter)
  const columnGap = 320; // horizontal distance between levels
  const rowGap = 110;    // vertical spacing inside a lane
  const laneHeader = 32; // per-trader header height in a lane
  const laneGap = 36;    // gap between trader lanes
  const nodeHalfWidth = 120; // approximate half width of TaskNode for edge offsets
  const paddingX = 200;  // left padding (room for lane labels)
  const paddingY = 40;   // top padding

  // Compute per-trader lane heights based on max items over all levels
  const laneHeights = useMemo(() => {
    const map = new Map<string, number>();
    tradersInData.forEach(trader => {
      let maxItems = 0;
      levelKeys.forEach(lvl => {
        maxItems = Math.max(maxItems, (tasksByLevelTrader[lvl]?.[trader] ?? []).length);
      });
      const h = laneHeader + (maxItems > 0 ? (maxItems - 1) * rowGap + 1 : laneHeader);
      map.set(trader, h);
    });
    return map;
  }, [tradersInData, levelKeys, tasksByLevelTrader]);

  // Iteratively order nodes within each level by the average Y of their predecessors (barycenter-like)
  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();

    // helper to get y of predecessor if already positioned
    const getPredY = (task: Task) => {
      const ys: number[] = [];
      task.taskRequirements.forEach(req => {
        const p = pos.get(req.task.id);
        if (p) ys.push(p.y);
      });
      if (ys.length === 0) return null;
      return ys.reduce((a,b)=>a+b,0) / ys.length;
    };

    // Compute absolute top Y for each trader lane from laneHeights
    const laneTopY = new Map<string, number>();
    let runningY = paddingY;
    tradersInData.forEach(trader => {
      laneTopY.set(trader, runningY);
      runningY += (laneHeights.get(trader) || laneHeader) + laneGap;
    });

    // For each level from left to right
    levelKeys.forEach((lvl, colIndex) => {
      const x = paddingX + colIndex * columnGap;

      // For each trader lane, compute order within the lane
      tradersInData.forEach(trader => {
        const items = (tasksByLevelTrader[lvl]?.[trader] ?? []).slice();
        if (items.length === 0) return;

        // per-trader chaining: group by same-trader root chain id, then barycenter
        const getChainRootId = (t: Task): string => {
          let current: Task | undefined = t;
          while (current) {
            const sameTraderDeps: Task[] = current.taskRequirements
              .map(r => taskMap.get(r.task.id))
              .filter((p): p is Task => p !== undefined)
              .filter((p) => p.trader.name === t.trader.name);
            if (sameTraderDeps.length === 0) return current.id;
            // pick earliest-level ancestor among same-trader deps
            current = sameTraderDeps.reduce<Task>((best, cand) => {
              const bl = levels[best.id] ?? 0;
              const cl = levels[cand.id] ?? 0;
              return cl < bl ? cand : best;
            }, sameTraderDeps[0]);
          }
          return t.id;
        };

        items.sort((a, b) => {
          const aRoot = getChainRootId(a);
          const bRoot = getChainRootId(b);
          if (aRoot !== bRoot) {
            const aName = taskMap.get(aRoot)?.name || aRoot;
            const bName = taskMap.get(bRoot)?.name || bRoot;
            const cmp = aName.localeCompare(bName);
            if (cmp !== 0) return cmp;
          }
          const ay = getPredY(a);
          const by = getPredY(b);
          if (ay !== null && by !== null) return ay - by;
          if (ay !== null) return -1;
          if (by !== null) return 1;
          return a.name.localeCompare(b.name);
        });

        const top = laneTopY.get(trader) ?? paddingY;
        const yBase = top + laneHeader;
        items.forEach((task, rowIndex) => {
          const yy = yBase + rowIndex * rowGap;
          pos.set(task.id, { x, y: yy });
        });
      });
    });

    return pos;
  }, [levelKeys, tradersInData, tasksByLevelTrader, levels, taskMap, laneHeights]);

  // Compute canvas size
  const canvasWidth = useMemo(() => paddingX + (levelKeys.length > 0 ? (levelKeys.length - 1) * columnGap + 600 : 800), [levelKeys]);
  const canvasHeight = useMemo(() => {
    const total = tradersInData.reduce((acc, t) => acc + (laneHeights.get(t) || laneHeader) + laneGap, paddingY) + 200;
    return total;
  }, [tradersInData, laneHeights]);

  return (
    <div className="relative w-full h-full overflow-auto">
      <div
        className="relative"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {/* Controls */}
        <div className="absolute right-2 top-2 z-30 flex items-center gap-2 bg-background/80 backdrop-blur px-2 py-1 rounded border text-xs">
          <input
            id="toggle-cross-trader"
            type="checkbox"
            className="h-3 w-3"
            checked={showCrossTraderLinks}
            onChange={(e) => setShowCrossTraderLinks(e.target.checked)}
          />
          <label htmlFor="toggle-cross-trader">Show cross-trader links</label>
        </div>
        {/* Trader swimlane backgrounds and labels */}
        {tradersInData.reduce<{ y: number; elems: React.ReactNode[] }>((acc, trader) => {
          const h = laneHeights.get(trader) || laneHeader;
          const y = acc.y;
          acc.elems.push(
            <div key={`lane-${trader}`} className="absolute left-0 right-0" style={{ top: y, height: h }}>
              <div className="absolute left-0 top-0 h-full w-40 flex items-start">
                <div className="px-3 py-1 text-xs font-medium rounded bg-muted/40 border mr-2" style={{ borderColor: TRADER_COLORS[trader as keyof typeof TRADER_COLORS] || '#6b7280' }}>
                  {trader}
                </div>
              </div>
              <div className="absolute left-40 right-0 top-0 bottom-0 rounded-sm" style={{ background: 'linear-gradient(to bottom, rgba(148,163,184,0.06), rgba(148,163,184,0.03))' }} />
            </div>
          );
          acc.y += h + laneGap;
          return acc;
        }, { y: paddingY, elems: [] }).elems}

        {/* Connection lines first so nodes render on top */}
        {filteredTasks.map(task => (
          task.taskRequirements.map(req => {
            const fromTask = taskMap.get(req.task.id);
            const from = positions.get(req.task.id);
            const to = positions.get(task.id);
            if (!from || !to || !fromTask) return null;
            const sameTrader = fromTask.trader.name === task.trader.name;
            if (!sameTrader && !showCrossTraderLinks) return null;
            const isCompleted = completedTasks.has(task.id) && completedTasks.has(req.task.id);
            return (
              <ConnectionLine
                key={`${req.task.id}->${task.id}`}
                from={{ x: from.x + nodeHalfWidth, y: from.y }}
                to={{ x: to.x - nodeHalfWidth, y: to.y }}
                isCompleted={isCompleted}
                isDimmed={!sameTrader && showCrossTraderLinks}
              />
            );
          })
        ))}

        {/* Task nodes */}
        {filteredTasks.map(task => {
          const position = positions.get(task.id)!;
          const isCompleted = completedTasks.has(task.id);
          return (
            <TaskNode
              key={task.id}
              task={task}
              isCompleted={isCompleted}
              onToggleComplete={onToggleComplete}
              position={position}
              completedTasks={completedTasks}
              isHighlighted={highlightedTaskId === task.id}
            />
          );
        })}
      </div>
    </div>
  );
};
