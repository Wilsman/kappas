import type { Task } from "@/types";
import {
  LIGHTKEEPER_SIDEQUEST_STEPS,
  type LightkeeperStep,
} from "@/utils/lightkeeperProgress";

export interface LightkeeperSidequestJourneyRow {
  id: string;
  name: string;
  taskIds: string[];
  targetIds: string[];
  targetLabels: string[];
  traderName?: string;
  minPlayerLevel?: number;
  depth: number;
  isComplete: boolean;
  isAvailable: boolean;
}

export interface LightkeeperSidequestJourneyTarget
  extends LightkeeperSidequestJourneyRow {
  label: string;
  prerequisiteIds: string[];
  completed: number;
  total: number;
}

export interface LightkeeperSidequestJourney {
  prerequisites: LightkeeperSidequestJourneyRow[];
  targets: LightkeeperSidequestJourneyTarget[];
  completed: number;
  total: number;
}

function areRequirementsComplete(
  task: Task | undefined,
  completedTasks: Set<string>,
) {
  return (
    !!task &&
    task.taskRequirements.every((requirement) =>
      completedTasks.has(requirement.task.id),
    )
  );
}

export function buildLightkeeperSidequestJourney(
  tasks: Task[],
  completedTasks: Set<string>,
): LightkeeperSidequestJourney {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const targetTaskIds = new Set(
    LIGHTKEEPER_SIDEQUEST_STEPS.flatMap((step) => step.taskIds ?? []),
  );
  const requirementNames = new Map<string, string>();
  const targetDependencies = new Map<string, Set<string>>();
  const targetIdsByTaskId = new Map<string, Set<string>>();

  const collectDependencies = (
    taskId: string,
    dependencies: Set<string>,
    visiting: Set<string>,
  ) => {
    if (visiting.has(taskId)) return;
    visiting.add(taskId);

    const task = tasksById.get(taskId);
    task?.taskRequirements.forEach((requirement) => {
      requirementNames.set(requirement.task.id, requirement.task.name);
      if (!targetTaskIds.has(requirement.task.id)) {
        dependencies.add(requirement.task.id);
      }
      collectDependencies(requirement.task.id, dependencies, visiting);
    });

    visiting.delete(taskId);
  };

  LIGHTKEEPER_SIDEQUEST_STEPS.forEach((target) => {
    const dependencies = new Set<string>();
    target.taskIds?.forEach((taskId) =>
      collectDependencies(taskId, dependencies, new Set()),
    );
    targetDependencies.set(target.id, dependencies);
    dependencies.forEach((taskId) => {
      const targetIds = targetIdsByTaskId.get(taskId) ?? new Set<string>();
      targetIds.add(target.id);
      targetIdsByTaskId.set(taskId, targetIds);
    });
  });

  const depthCache = new Map<string, number>();
  const getDepth = (taskId: string, visiting = new Set<string>()): number => {
    if (depthCache.has(taskId)) return depthCache.get(taskId)!;
    if (visiting.has(taskId)) return 0;
    visiting.add(taskId);
    const task = tasksById.get(taskId);
    const depth =
      !task || task.taskRequirements.length === 0
        ? 0
        : Math.max(
            ...task.taskRequirements.map(
              (requirement) => getDepth(requirement.task.id, visiting) + 1,
            ),
          );
    visiting.delete(taskId);
    depthCache.set(taskId, depth);
    return depth;
  };

  const allDependencyIds = new Set(
    Array.from(targetDependencies.values()).flatMap((ids) => Array.from(ids)),
  );
  const targetById = new Map(
    LIGHTKEEPER_SIDEQUEST_STEPS.map((target) => [target.id, target]),
  );

  const prerequisites = Array.from(allDependencyIds)
    .map((taskId): LightkeeperSidequestJourneyRow => {
      const task = tasksById.get(taskId);
      const targetIds = Array.from(targetIdsByTaskId.get(taskId) ?? []);
      return {
        id: taskId,
        name: task?.name ?? requirementNames.get(taskId) ?? "Unknown quest",
        taskIds: [taskId],
        targetIds,
        targetLabels: targetIds.map(
          (targetId) => targetById.get(targetId)?.label ?? "Sidequest target",
        ),
        traderName: task?.trader.name,
        minPlayerLevel: task?.minPlayerLevel,
        depth: getDepth(taskId),
        isComplete: completedTasks.has(taskId),
        isAvailable: areRequirementsComplete(task, completedTasks),
      };
    })
    .sort(
      (left, right) =>
        left.depth - right.depth ||
        (left.minPlayerLevel ?? 0) - (right.minPlayerLevel ?? 0) ||
        (left.traderName ?? "").localeCompare(right.traderName ?? "") ||
        left.name.localeCompare(right.name),
    );

  const targets = LIGHTKEEPER_SIDEQUEST_STEPS.map(
    (target): LightkeeperSidequestJourneyTarget => {
      const taskIds = target.taskIds ?? [];
      const tasksForTarget = taskIds
        .map((taskId) => tasksById.get(taskId))
        .filter((task): task is Task => !!task);
      const prerequisiteIds = Array.from(
        targetDependencies.get(target.id) ?? [],
      );
      const isComplete = taskIds.some((taskId) => completedTasks.has(taskId));
      const completedPrerequisites = prerequisiteIds.filter((taskId) =>
        completedTasks.has(taskId),
      ).length;
      return {
        id: target.id,
        label: target.label,
        name: target.label,
        taskIds,
        targetIds: [target.id],
        targetLabels: [target.label],
        traderName:
          tasksForTarget.length === 1
            ? tasksForTarget[0].trader.name
            : undefined,
        minPlayerLevel:
          tasksForTarget.length === 1
            ? tasksForTarget[0].minPlayerLevel
            : undefined,
        depth: Math.max(0, ...taskIds.map((taskId) => getDepth(taskId))),
        isComplete,
        isAvailable:
          isComplete ||
          tasksForTarget.some((task) =>
            areRequirementsComplete(task, completedTasks),
          ),
        prerequisiteIds,
        completed: completedPrerequisites + (isComplete ? 1 : 0),
        total: prerequisiteIds.length + 1,
      };
    },
  );

  return {
    prerequisites,
    targets,
    completed:
      prerequisites.filter((task) => task.isComplete).length +
      targets.filter((target) => target.isComplete).length,
    total: prerequisites.length + targets.length,
  };
}

export function filterLightkeeperSidequestJourney(
  journey: LightkeeperSidequestJourney,
  targetId: string,
) {
  if (targetId === "all") {
    return {
      prerequisites: journey.prerequisites,
      targets: journey.targets,
    };
  }

  return {
    prerequisites: journey.prerequisites.filter((task) =>
      task.targetIds.includes(targetId),
    ),
    targets: journey.targets.filter((target) => target.id === targetId),
  };
}

export function normalizeLightkeeperSidequestTarget(
  value: string | null | undefined,
  targets: Pick<LightkeeperStep, "id">[] = LIGHTKEEPER_SIDEQUEST_STEPS,
) {
  return targets.some((target) => target.id === value) ? value! : "all";
}
