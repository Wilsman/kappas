import type { Task } from "@/types";
import {
  completeTaskOnly,
  completeTaskWithDependencies,
  uncompleteTasks,
} from "@/utils/taskCompletion";
import {
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveKeys,
} from "@/utils/taskObjectives";

const task = (
  id: string,
  requirementIds: string[] = [],
  objectives: Task["objectives"] = [],
): Task => ({
  id,
  name: id,
  minPlayerLevel: 1,
  taskRequirements: requirementIds.map((requirementId) => ({
    task: { id: requirementId, name: requirementId },
  })),
  wikiLink: "",
  map: null,
  maps: [],
  trader: { name: "Prapor" },
  objectives,
});

const buildKnownTasksById = (tasks: Task[]) =>
  new Map(tasks.map((entry) => [entry.id, entry]));

describe("task completion state", () => {
  it("reports newly auto-completed prerequisite tasks", () => {
    const tasks = [task("first"), task("second", ["first"]), task("third", ["second"])];

    const result = completeTaskWithDependencies({
      taskId: "third",
      tasks,
      knownTasksById: buildKnownTasksById(tasks),
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(result.completedTasks).toEqual(new Set(["first", "second", "third"]));
    expect(result.autoCompletedTaskIds).toEqual(["second", "first"]);
  });

  it("does not report prerequisites that were already complete", () => {
    const tasks = [task("first"), task("second", ["first"])];

    const result = completeTaskWithDependencies({
      taskId: "second",
      tasks,
      knownTasksById: buildKnownTasksById(tasks),
      completedTasks: new Set<string>(["first"]),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(result.completedTasks).toEqual(new Set(["first", "second"]));
    expect(result.autoCompletedTaskIds).toEqual([]);
  });

  it("undo state keeps the clicked task complete and removes auto-completed prerequisites", () => {
    const tasks = [task("first"), task("second", ["first"])];
    const knownTasksById = buildKnownTasksById(tasks);
    const previousCompletedTasks = new Set<string>();
    const previousCompletedTaskObjectives = new Set<string>();
    const completed = completeTaskWithDependencies({
      taskId: "second",
      tasks,
      knownTasksById,
      completedTasks: previousCompletedTasks,
      completedTaskObjectives: previousCompletedTaskObjectives,
      logicalTaskIdsByTaskId: new Map(),
    });

    const undoState = completeTaskOnly({
      taskId: "second",
      tasks,
      knownTasksById,
      completedTasks: previousCompletedTasks,
      completedTaskObjectives: previousCompletedTaskObjectives,
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(completed.completedTasks).toEqual(new Set(["first", "second"]));
    expect(undoState.completedTasks).toEqual(new Set(["second"]));
  });

  it("restores objective completion to the clicked task only during undo", () => {
    const prerequisite = task("first", [], [
      { id: "first-objective", description: "Complete the first quest" },
    ]);
    const clicked = task("second", ["first"], [
      { id: "second-objective", description: "Complete the second quest" },
    ]);
    const tasks = [prerequisite, clicked];
    const knownTasksById = buildKnownTasksById(tasks);
    const completed = completeTaskWithDependencies({
      taskId: "second",
      tasks,
      knownTasksById,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map(),
    });
    const prerequisiteObjectiveKey = buildTaskObjectiveKeys(prerequisite)[0];
    const clickedObjectiveKey = buildTaskObjectiveKeys(clicked)[0];
    const prerequisiteFallbackKey = buildTaskObjectiveFallbackKeys(
      prerequisite,
      0,
      prerequisiteObjectiveKey,
    )[0];
    const clickedFallbackKey = buildTaskObjectiveFallbackKeys(
      clicked,
      0,
      clickedObjectiveKey,
    )[0];

    const undoState = completeTaskOnly({
      taskId: "second",
      tasks,
      knownTasksById,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(completed.completedTaskObjectives.has(prerequisiteObjectiveKey)).toBe(true);
    expect(completed.completedTaskObjectives.has(prerequisiteFallbackKey)).toBe(true);
    expect(undoState.completedTaskObjectives.has(prerequisiteObjectiveKey)).toBe(false);
    expect(undoState.completedTaskObjectives.has(prerequisiteFallbackKey)).toBe(false);
    expect(undoState.completedTaskObjectives.has(clickedObjectiveKey)).toBe(true);
    expect(undoState.completedTaskObjectives.has(clickedFallbackKey)).toBe(true);
  });

  it("can undo one stacked auto-completion without removing later clicked tasks", () => {
    const tasks = [
      task("first"),
      task("second", ["first"]),
      task("third", ["second"]),
      task("fourth", ["third"]),
    ];
    const knownTasksById = buildKnownTasksById(tasks);
    const firstCompletion = completeTaskWithDependencies({
      taskId: "third",
      tasks,
      knownTasksById,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map(),
    });
    const secondCompletion = completeTaskWithDependencies({
      taskId: "fourth",
      tasks,
      knownTasksById,
      completedTasks: firstCompletion.completedTasks,
      completedTaskObjectives: firstCompletion.completedTaskObjectives,
      logicalTaskIdsByTaskId: new Map(),
    });

    const afterUndoingFirstToast = completeTaskOnly({
      taskId: "third",
      tasks,
      knownTasksById,
      ...uncompleteTasks({
        taskId: "third",
        taskIds: firstCompletion.autoCompletedTaskIds,
        tasks,
        knownTasksById,
        completedTasks: secondCompletion.completedTasks,
        completedTaskObjectives: secondCompletion.completedTaskObjectives,
        logicalTaskIdsByTaskId: new Map(),
      }),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(firstCompletion.autoCompletedTaskIds).toEqual(["second", "first"]);
    expect(secondCompletion.autoCompletedTaskIds).toEqual([]);
    expect(afterUndoingFirstToast.completedTasks).toEqual(
      new Set(["third", "fourth"]),
    );
  });

  it("snapshot-style undo removes objective keys from every auto-completed prerequisite", () => {
    const first = task("first", [], [
      { id: "first-objective", description: "Complete first" },
    ]);
    const second = task("second", ["first"], [
      { id: "second-objective", description: "Complete second" },
    ]);
    const third = task("third", ["second"], [
      { id: "third-objective", description: "Complete third" },
    ]);
    const tasks = [first, second, third];
    const knownTasksById = buildKnownTasksById(tasks);
    const previousCompletedTasks = new Set<string>();
    const previousCompletedTaskObjectives = new Set<string>();
    const completed = completeTaskWithDependencies({
      taskId: "third",
      tasks,
      knownTasksById,
      completedTasks: previousCompletedTasks,
      completedTaskObjectives: previousCompletedTaskObjectives,
      logicalTaskIdsByTaskId: new Map(),
    });
    const nextTasks = new Set(completed.completedTasks);
    const nextTaskObjectives = new Set(completed.completedTaskObjectives);
    completed.autoCompletedTaskIds.forEach((taskId) => {
      if (!previousCompletedTasks.has(taskId)) {
        nextTasks.delete(taskId);
      }
    });
    Array.from(nextTaskObjectives).forEach((objectiveKey) => {
      if (!previousCompletedTaskObjectives.has(objectiveKey)) {
        nextTaskObjectives.delete(objectiveKey);
      }
    });
    const undoState = completeTaskOnly({
      taskId: "third",
      tasks,
      knownTasksById,
      completedTasks: nextTasks,
      completedTaskObjectives: nextTaskObjectives,
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(undoState.completedTasks).toEqual(new Set(["third"]));
    const thirdObjectiveKey = buildTaskObjectiveKeys(third)[0];
    expect(undoState.completedTaskObjectives).toEqual(
      new Set([
        thirdObjectiveKey,
        ...buildTaskObjectiveFallbackKeys(third, 0, thirdObjectiveKey),
      ]),
    );
  });
});
