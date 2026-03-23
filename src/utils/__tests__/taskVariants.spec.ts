import type { Task } from "@/types";
import { sampleData } from "@/data/sample-data";
import {
  areLogicalPrerequisitesCompleted,
  buildLogicalTaskKey,
  buildLogicalTaskGroupsByTaskId,
  isLogicalTaskCompleted,
  isLogicalTaskCompletable,
} from "@/utils/taskVariants";
import { buildTaskDependencyMap, canComplete } from "@/utils/taskUtils";

const allTasks = sampleData.data.tasks;

const getTaskById = (taskId: string) => {
  const task = allTasks.find((entry) => entry.id === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }
  return task;
};

const getTasksByName = (name: string) =>
  allTasks.filter((task) => task.name === name);

describe("task variant semantics", () => {
  it("treats Battery Change variants as one logical completion group", () => {
    const batteryVariants = getTasksByName("Battery Change");
    const logicalGroups = buildLogicalTaskGroupsByTaskId(allTasks);
    const completedTasks = new Set<string>([batteryVariants[0].id]);

    expect(batteryVariants).toHaveLength(2);
    expect(
      isLogicalTaskCompleted(
        batteryVariants[0].id,
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
    expect(
      isLogicalTaskCompleted(
        batteryVariants[1].id,
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
  });

  it("blocks sibling Battery Change variants after one branch is completed", () => {
    const batteryVariants = getTasksByName("Battery Change");
    const logicalGroups = buildLogicalTaskGroupsByTaskId(allTasks);
    const completedTasks = new Set<string>([
      batteryVariants[0].taskRequirements[0].task.id,
      batteryVariants[1].taskRequirements[0].task.id,
      batteryVariants[0].id,
    ]);

    expect(
      isLogicalTaskCompletable(
        batteryVariants[0],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(false);
    expect(
      isLogicalTaskCompletable(
        batteryVariants[1],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(false);
  });

  it("considers The Price of Independence unlocked by either Battery Change branch", () => {
    const batteryVariants = getTasksByName("Battery Change");
    const priceVariants = getTasksByName("The Price of Independence");
    const logicalGroups = buildLogicalTaskGroupsByTaskId(allTasks);
    const completedTasks = new Set<string>([
      batteryVariants[1].taskRequirements[0].task.id,
      batteryVariants[1].id,
      getTaskById("6744aca8d3346c216702c583").id,
    ]);

    expect(priceVariants).toHaveLength(2);
    expect(
      areLogicalPrerequisitesCompleted(
        priceVariants[0],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
    expect(
      areLogicalPrerequisitesCompleted(
        priceVariants[1],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
    expect(
      isLogicalTaskCompletable(
        priceVariants[0],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
    expect(
      isLogicalTaskCompletable(
        priceVariants[1],
        completedTasks,
        logicalGroups,
      ),
    ).toBe(true);
  });

  it("does not report already completed tasks as directly completable", () => {
    const dependencyMap = buildTaskDependencyMap(allTasks as Task[]);
    const batteryTask = getTaskById("6744a728352b4da8e003eda9");
    const completedTasks = new Set<string>([
      batteryTask.taskRequirements[0].task.id,
      batteryTask.id,
    ]);

    expect(canComplete(batteryTask.id, completedTasks, dependencyMap)).toBe(
      false,
    );
  });

  it("collapses working-on variants by logical task key", () => {
    const batteryVariants = getTasksByName("Battery Change");
    const workingOnTasks = new Set<string>([batteryVariants[0].id]);
    const workingOnLogicalKeys = new Set(
      Array.from(workingOnTasks)
        .map((taskId) => {
          const task = allTasks.find((entry) => entry.id === taskId);
          return task ? buildLogicalTaskKey(task) : null;
        })
        .filter((key): key is string => key !== null),
    );

    expect(workingOnLogicalKeys.has(buildLogicalTaskKey(batteryVariants[1]))).toBe(
      true,
    );
  });
});
