import type { Task } from "@/types";
import {
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveKeys,
} from "@/utils/taskObjectives";
import { getEquivalentTaskIds } from "@/utils/taskProgressView";
import { buildTaskDependencyMap, getAllDependencies } from "@/utils/taskUtils";

export type TaskCompletionState = {
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
};

type TaskCompletionParams = {
  taskId: string;
  tasks: Task[];
  knownTasksById: Map<string, Task>;
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  logicalTaskIdsByTaskId: Map<string, Set<string>>;
};

type TaskCompletionResult = TaskCompletionState & {
  autoCompletedTaskIds: string[];
};

function findTask(
  taskId: string,
  tasks: Task[],
  knownTasksById: Map<string, Task>,
): Task | undefined {
  return knownTasksById.get(taskId) ?? tasks.find((task) => task.id === taskId);
}

function setTaskObjectiveCompletion(
  targetTaskId: string,
  markComplete: boolean,
  nextTaskObjectives: Set<string>,
  tasks: Task[],
  knownTasksById: Map<string, Task>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
) {
  getEquivalentTaskIds(targetTaskId, logicalTaskIdsByTaskId).forEach(
    (equivalentTaskId) => {
      const task = findTask(equivalentTaskId, tasks, knownTasksById);
      const objectiveKeys = task ? buildTaskObjectiveKeys(task) : [];
      objectiveKeys.forEach((objectiveKey, index) => {
        const legacyKeys = task
          ? buildTaskObjectiveFallbackKeys(task, index, objectiveKey)
          : [buildLegacyTaskObjectiveKey(equivalentTaskId, index)];

        if (markComplete) {
          nextTaskObjectives.add(objectiveKey);
          legacyKeys.forEach((key) => nextTaskObjectives.add(key));
        } else {
          nextTaskObjectives.delete(objectiveKey);
          legacyKeys.forEach((key) => nextTaskObjectives.delete(key));
        }
      });
    },
  );
}

function markTaskComplete(
  targetTaskId: string,
  nextTasks: Set<string>,
  nextTaskObjectives: Set<string>,
  params: Pick<
    TaskCompletionParams,
    "tasks" | "knownTasksById" | "logicalTaskIdsByTaskId"
  >,
) {
  getEquivalentTaskIds(targetTaskId, params.logicalTaskIdsByTaskId).forEach(
    (equivalentTaskId) => nextTasks.add(equivalentTaskId),
  );
  setTaskObjectiveCompletion(
    targetTaskId,
    true,
    nextTaskObjectives,
    params.tasks,
    params.knownTasksById,
    params.logicalTaskIdsByTaskId,
  );
}

export function uncompleteTask(params: TaskCompletionParams): TaskCompletionState {
  const nextTasks = new Set(params.completedTasks);
  const nextTaskObjectives = new Set(params.completedTaskObjectives);

  getEquivalentTaskIds(params.taskId, params.logicalTaskIdsByTaskId).forEach(
    (taskId) => {
      nextTasks.delete(taskId);
      setTaskObjectiveCompletion(
        taskId,
        false,
        nextTaskObjectives,
        params.tasks,
        params.knownTasksById,
        params.logicalTaskIdsByTaskId,
      );
    },
  );

  return {
    completedTasks: nextTasks,
    completedTaskObjectives: nextTaskObjectives,
  };
}

export function uncompleteTasks(
  params: TaskCompletionParams & { taskIds: string[] },
): TaskCompletionState {
  const nextTasks = new Set(params.completedTasks);
  const nextTaskObjectives = new Set(params.completedTaskObjectives);

  params.taskIds.forEach((targetTaskId) => {
    getEquivalentTaskIds(targetTaskId, params.logicalTaskIdsByTaskId).forEach(
      (taskId) => {
        nextTasks.delete(taskId);
        setTaskObjectiveCompletion(
          taskId,
          false,
          nextTaskObjectives,
          params.tasks,
          params.knownTasksById,
          params.logicalTaskIdsByTaskId,
        );
      },
    );
  });

  return {
    completedTasks: nextTasks,
    completedTaskObjectives: nextTaskObjectives,
  };
}

export function completeTaskOnly(
  params: TaskCompletionParams,
): TaskCompletionState {
  const nextTasks = new Set(params.completedTasks);
  const nextTaskObjectives = new Set(params.completedTaskObjectives);

  markTaskComplete(params.taskId, nextTasks, nextTaskObjectives, params);

  return {
    completedTasks: nextTasks,
    completedTaskObjectives: nextTaskObjectives,
  };
}

export function completeTaskWithDependencies(
  params: TaskCompletionParams,
): TaskCompletionResult {
  const nextTasks = new Set(params.completedTasks);
  const nextTaskObjectives = new Set(params.completedTaskObjectives);
  const depMap = buildTaskDependencyMap(params.tasks);
  const dependencies = Array.from(getAllDependencies(params.taskId, depMap));
  const autoCompletedTaskIds = new Set<string>();

  [params.taskId, ...dependencies].forEach((taskId) => {
    if (taskId !== params.taskId) {
      getEquivalentTaskIds(taskId, params.logicalTaskIdsByTaskId).forEach(
        (equivalentTaskId) => {
          if (!params.completedTasks.has(equivalentTaskId)) {
            autoCompletedTaskIds.add(equivalentTaskId);
          }
        },
      );
    }
    markTaskComplete(taskId, nextTasks, nextTaskObjectives, params);
  });

  return {
    completedTasks: nextTasks,
    completedTaskObjectives: nextTaskObjectives,
    autoCompletedTaskIds: Array.from(autoCompletedTaskIds),
  };
}
