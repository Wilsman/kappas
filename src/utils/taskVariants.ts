import type { Task } from "@/types";

const buildTaskMapSignature = (task: Task) => {
  const mapNames =
    task.maps.length > 0
      ? task.maps.map((map) => map.name).sort()
      : [task.map?.name ?? "No specific map"];

  return mapNames.join("|");
};

const buildTaskObjectiveSignature = (task: Task) =>
  JSON.stringify(
    (task.objectives ?? []).map((objective) => ({
      description: objective.description ?? "",
      playerLevel: objective.playerLevel ?? null,
      count: objective.count ?? null,
      foundInRaid: objective.foundInRaid ?? null,
      maps: (objective.maps ?? []).map((map) => map.name).sort(),
      items: (objective.items ?? [])
        .map((item) => item.id ?? item.name)
        .sort(),
    })),
  );

export const normalizeModeVariantTaskName = (name: string) =>
  name.replace(/\s+\[(?:PVP|PVE) ZONE\]$/i, "").trim().toLowerCase();

export const buildLogicalTaskKey = (task: Task) =>
  [
    task.name,
    task.trader.name,
    task.factionName ?? "Any",
    task.minPlayerLevel,
    task.wikiLink,
    buildTaskMapSignature(task),
    buildTaskObjectiveSignature(task),
    task.kappaRequired ? "kappa" : "no-kappa",
    task.lightkeeperRequired ? "lightkeeper" : "no-lightkeeper",
    task.isEvent ? "event" : "non-event",
  ].join("::");

export const buildLogicalTaskGroupsByTaskId = (tasks: Task[]) => {
  const grouped = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const key = buildLogicalTaskKey(task);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(task);
    } else {
      grouped.set(key, [task]);
    }
  });

  const byTaskId = new Map<string, Task[]>();
  grouped.forEach((groupTasks) => {
    groupTasks.forEach((task) => {
      byTaskId.set(task.id, groupTasks);
    });
  });

  return byTaskId;
};

export const isLogicalTaskCompleted = (
  taskId: string,
  completedTasks: Set<string>,
  groupsByTaskId: Map<string, Task[]>,
) => {
  const groupTasks = groupsByTaskId.get(taskId);
  if (!groupTasks) return completedTasks.has(taskId);
  return groupTasks.some((task) => completedTasks.has(task.id));
};

export const getLogicalCompletedPrerequisiteCount = (
  task: Task,
  completedTasks: Set<string>,
  groupsByTaskId: Map<string, Task[]>,
) =>
  task.taskRequirements.filter((req) =>
    isLogicalTaskCompleted(req.task.id, completedTasks, groupsByTaskId),
  ).length;

export const areLogicalPrerequisitesCompleted = (
  task: Task,
  completedTasks: Set<string>,
  groupsByTaskId: Map<string, Task[]>,
) =>
  task.taskRequirements.every((req) =>
    isLogicalTaskCompleted(req.task.id, completedTasks, groupsByTaskId),
  );

export const isLogicalTaskCompletable = (
  task: Task,
  completedTasks: Set<string>,
  groupsByTaskId: Map<string, Task[]>,
) => {
  const groupTasks = groupsByTaskId.get(task.id) ?? [task];
  if (groupTasks.some((variant) => completedTasks.has(variant.id))) {
    return false;
  }

  return groupTasks.some((variant) =>
    areLogicalPrerequisitesCompleted(variant, completedTasks, groupsByTaskId),
  );
};
