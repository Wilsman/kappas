import type { Task } from "@/types";
import type { GameMode } from "@/utils/gameMode";
import {
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveKeys,
} from "@/utils/taskObjectives";
import { buildLogicalTaskKey } from "@/utils/taskVariants";

type TasksByMode = Partial<Record<GameMode, Task[]>>;

const OBJECTIVE_KEY_MARKER = "::objective::";
const OBJECTIVE_ID_KEY_MARKER = "::objective-id::";

export function buildLogicalTaskIdGroups(
  tasksByMode: TasksByMode,
): Map<string, Set<string>> {
  const byLogicalKey = new Map<string, Set<string>>();

  Object.values(tasksByMode).forEach((tasks) => {
    tasks?.forEach((task) => {
      const logicalKey = buildLogicalTaskKey(task);
      const ids = byLogicalKey.get(logicalKey) ?? new Set<string>();
      ids.add(task.id);
      byLogicalKey.set(logicalKey, ids);
    });
  });

  const byTaskId = new Map<string, Set<string>>();
  byLogicalKey.forEach((ids) => {
    ids.forEach((id) => byTaskId.set(id, ids));
  });

  return byTaskId;
}

export function getEquivalentTaskIds(
  taskId: string,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): string[] {
  return Array.from(logicalTaskIdsByTaskId.get(taskId) ?? [taskId]);
}

export function expandCompletedTasks(
  completedTasks: Set<string>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): Set<string> {
  const expanded = new Set(completedTasks);
  completedTasks.forEach((taskId) => {
    getEquivalentTaskIds(taskId, logicalTaskIdsByTaskId).forEach((id) =>
      expanded.add(id),
    );
  });
  return expanded;
}

function getObjectiveKeySuffix(objectiveKey: string): string | null {
  const marker =
    objectiveKey.includes(OBJECTIVE_KEY_MARKER)
      ? OBJECTIVE_KEY_MARKER
      : objectiveKey.includes(OBJECTIVE_ID_KEY_MARKER)
        ? OBJECTIVE_ID_KEY_MARKER
        : null;
  if (!marker) return null;
  const markerIndex = objectiveKey.indexOf(marker);
  return objectiveKey.slice(markerIndex + marker.length);
}

function getObjectiveIndexForKey(task: Task, objectiveKey: string): number | null {
  const primaryIndex = buildTaskObjectiveKeys(task).findIndex(
    (key) => key === objectiveKey,
  );
  if (primaryIndex >= 0) return primaryIndex;

  const fallbackIndex = (task.objectives ?? []).findIndex((_, index) =>
    buildTaskObjectiveFallbackKeys(task, index).includes(objectiveKey),
  );
  return fallbackIndex >= 0 ? fallbackIndex : null;
}

function getLegacyObjectiveIndex(
  taskId: string,
  legacyObjectiveKey?: string,
): number | null {
  // Legacy objective keys are assumed to be `${taskId}-${index}` where index
  // is a decimal integer. Update this parser if the key format gains segments.
  const prefix = `${taskId}-`;
  if (!legacyObjectiveKey?.startsWith(prefix)) return null;
  const parsed = Number(legacyObjectiveKey.slice(prefix.length));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function getEquivalentTaskObjectiveKeys(
  taskId: string,
  objectiveKey: string,
  tasksById: Map<string, Task>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): string[] {
  const suffix = getObjectiveKeySuffix(objectiveKey);
  if (!suffix) return [objectiveKey];

  const keys = new Set<string>([objectiveKey]);
  const sourceTask = tasksById.get(taskId);
  const objectiveIndex = sourceTask
    ? getObjectiveIndexForKey(sourceTask, objectiveKey)
    : null;
  getEquivalentTaskIds(taskId, logicalTaskIdsByTaskId).forEach((id) => {
    const task = tasksById.get(id);
    if (!task) return;
    const taskObjectiveKeys = buildTaskObjectiveKeys(task);
    taskObjectiveKeys.forEach((key) => {
      if (getObjectiveKeySuffix(key) === suffix) {
        keys.add(key);
      }
    });
    if (objectiveIndex !== null) {
      const equivalentKey = taskObjectiveKeys[objectiveIndex];
      if (equivalentKey) keys.add(equivalentKey);
      buildTaskObjectiveFallbackKeys(
        task,
        objectiveIndex,
        equivalentKey,
      ).forEach((key) => keys.add(key));
    }
  });

  return Array.from(keys);
}

export function getEquivalentLegacyTaskObjectiveKeys(
  taskId: string,
  legacyObjectiveKey: string | undefined,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): string[] {
  const index = getLegacyObjectiveIndex(taskId, legacyObjectiveKey);
  if (index === null) return legacyObjectiveKey ? [legacyObjectiveKey] : [];

  return getEquivalentTaskIds(taskId, logicalTaskIdsByTaskId).map((id) =>
    buildLegacyTaskObjectiveKey(id, index),
  );
}

export function createObjectiveEquivalentsMap(
  tasksByMode: TasksByMode,
  tasksById: Map<string, Task>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): Map<string, string[]> {
  const equivalentsByKey = new Map<string, string[]>();

  Object.values(tasksByMode).forEach((tasks) => {
    tasks?.forEach((task) => {
      buildTaskObjectiveKeys(task).forEach((objectiveKey, index) => {
        const legacyKey = buildLegacyTaskObjectiveKey(task.id, index);
        const equivalentKeys = [
          ...getEquivalentTaskObjectiveKeys(
            task.id,
            objectiveKey,
            tasksById,
            logicalTaskIdsByTaskId,
          ),
          ...getEquivalentLegacyTaskObjectiveKeys(
            task.id,
            legacyKey,
            logicalTaskIdsByTaskId,
          ),
        ];

        equivalentKeys.forEach((key) => {
          equivalentsByKey.set(key, equivalentKeys);
        });
      });
    });
  });

  return equivalentsByKey;
}

export function expandCompletedTaskObjectives(
  completedTaskObjectives: Set<string>,
  tasksByMode: TasksByMode,
  tasksById: Map<string, Task>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
  objectiveEquivalentsByKey: Map<string, string[]> = createObjectiveEquivalentsMap(
    tasksByMode,
    tasksById,
    logicalTaskIdsByTaskId,
  ),
): Set<string> {
  const expanded = new Set(completedTaskObjectives);

  completedTaskObjectives.forEach((key) => {
    const equivalentKeys = objectiveEquivalentsByKey.get(key);
    equivalentKeys?.forEach((equivalentKey) => expanded.add(equivalentKey));
  });

  return expanded;
}
