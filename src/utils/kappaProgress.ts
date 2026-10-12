import type { Task } from "@/types";

export const KAPPA_LEVEL_REQUIREMENT = 40;
export const KAPPA_FENCE_REPUTATION_REQUIREMENT = 3;

export const KAPPA_LL4_TRADERS = [
  "Therapist",
  "Prapor",
  "Peacekeeper",
  "Mechanic",
  "Jaeger",
  "Skier",
  "Ragman",
] as const;

export type KappaLl4Trader = (typeof KAPPA_LL4_TRADERS)[number];

// Offline/sample-data fallback; live routes come from getKappaRouteTargets.
// Matches Collector's task requirements in the tarkov.dev API.
export const KAPPA_QUEST_TARGETS = [
  {
    id: "597a0e5786f77426d66c0636",
    label: "Chemical - Part 3",
    shortLabel: "Chemical",
  },
  {
    id: "596760e186f7741e11214d58",
    label: "Postman Pat - Part 2",
    shortLabel: "Postman Pat",
  },
  {
    id: "5ae4497b86f7744cf402ed00",
    label: "Sew it Good - Part 2",
    shortLabel: "Sew it Good",
  },
  {
    id: "5c0bde0986f77479cf22c2f8",
    label: "Shooter Born in Heaven",
    shortLabel: "Shooter Born",
  },
  {
    id: "5bc480a686f7741af0342e29",
    label: "The Tarkov Shooter - Part 4",
    shortLabel: "Tarkov Shooter",
  },
] as const;

const COLLECTOR_TASK_ID = "5c51aac186f77432ea65c552";

export interface KappaRouteTarget {
  id: string;
  label: string;
  shortLabel: string;
}

const toRouteTarget = (id: string, name: string): KappaRouteTarget => ({
  id,
  label: name,
  shortLabel: name,
});

const sortByLabel = (targets: KappaRouteTarget[]): KappaRouteTarget[] =>
  targets.sort((a, b) => a.label.localeCompare(b.label));

/**
 * Derive route endpoints from live API data, in order of preference:
 * 1. Collector's own task requirements (the authoritative unlock list).
 * 2. Every kappa-required task (excluding events and Collector) grouped into
 *    chains, one route per terminal task. A terminal is a kappa task required
 *    by no other kappa task, so walking its prerequisites backwards yields
 *    the full start-to-finish chain.
 * 3. KAPPA_QUEST_TARGETS when neither is available (offline/sample data).
 */
export function getKappaRouteTargets(tasks: Task[]): KappaRouteTarget[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  const collectorRequirements = (
    tasksById.get(COLLECTOR_TASK_ID)?.taskRequirements ?? []
  ).filter((requirement) => requirement?.task?.id);
  if (collectorRequirements.length > 0) {
    return sortByLabel(
      collectorRequirements.map(({ task }) =>
        toRouteTarget(task.id, tasksById.get(task.id)?.name ?? task.name),
      ),
    );
  }

  const candidates = tasks.filter(
    (task) =>
      task.kappaRequired === true &&
      task.isEvent !== true &&
      task.id !== COLLECTOR_TASK_ID,
  );
  if (candidates.length === 0) {
    return KAPPA_QUEST_TARGETS.map((target) => ({ ...target }));
  }

  const requiredIds = new Set<string>();
  for (const task of candidates) {
    for (const requirement of task.taskRequirements ?? []) {
      if (requirement?.task?.id) requiredIds.add(requirement.task.id);
    }
  }

  const terminals = candidates.filter((task) => !requiredIds.has(task.id));
  const endpoints = terminals.length > 0 ? terminals : candidates;
  return sortByLabel(endpoints.map((task) => toRouteTarget(task.id, task.name)));
}

export interface KappaJourneyTask {
  id: string;
  name: string;
  traderName?: string;
  minPlayerLevel?: number;
  depth: number;
  isComplete: boolean;
  isAvailable: boolean;
  isMissing: boolean;
  isTarget: boolean;
}

export interface KappaQuestRoute {
  id: string;
  label: string;
  shortLabel: string;
  targetTaskId: string;
  tasks: KappaJourneyTask[];
  completed: number;
  total: number;
  isComplete: boolean;
  hasMissingTasks: boolean;
}

export interface KappaProgress {
  levelComplete: boolean;
  fenceReputationComplete: boolean;
  ll4Completed: number;
  ll4Total: number;
  ll4Complete: boolean;
  accountRequirementsComplete: boolean;
  routes: KappaQuestRoute[];
  questRoutesCompleted: number;
  questRoutesTotal: number;
  questRequirementsComplete: boolean;
  collectorUnlocked: boolean;
}

export interface CalculateKappaProgressInput {
  tasks: Task[];
  completedTasks: Set<string>;
  playerLevel: number;
  fenceReputation: number | null;
  ll4Traders: ReadonlySet<string>;
}

export function normalizeKappaLl4Traders(value: unknown): KappaLl4Trader[] {
  if (!Array.isArray(value)) return [];

  const allowed = new Set<string>(KAPPA_LL4_TRADERS);
  return Array.from(
    new Set(
      value.filter(
        (trader): trader is KappaLl4Trader =>
          typeof trader === "string" && allowed.has(trader),
      ),
    ),
  );
}

export function buildKappaQuestRoutes(
  tasks: Task[],
  completedTasks: Set<string>,
  targets: readonly KappaRouteTarget[] = getKappaRouteTargets(tasks),
): KappaQuestRoute[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return targets.map((target) => {
    const rows = new Map<string, KappaJourneyTask>();
    const requirementNames = new Map<string, string>();
    const visiting = new Set<string>();

    const visit = (taskId: string, fallbackName?: string): number => {
      const existing = rows.get(taskId);
      if (existing) return existing.depth;
      if (visiting.has(taskId)) return 0;

      visiting.add(taskId);
      const task = tasksById.get(taskId);
      let depth = 0;

      task?.taskRequirements.forEach((requirement) => {
        requirementNames.set(requirement.task.id, requirement.task.name);
        depth = Math.max(
          depth,
          visit(requirement.task.id, requirement.task.name) + 1,
        );
      });

      visiting.delete(taskId);
      const isComplete = completedTasks.has(taskId);
      const isAvailable =
        isComplete ||
        (!!task &&
          task.taskRequirements.every((requirement) =>
            completedTasks.has(requirement.task.id),
          ));

      rows.set(taskId, {
        id: taskId,
        name:
          task?.name ??
          fallbackName ??
          requirementNames.get(taskId) ??
          (taskId === target.id ? target.label : "Unknown task"),
        traderName: task?.trader.name,
        minPlayerLevel: task?.minPlayerLevel,
        depth,
        isComplete,
        isAvailable,
        isMissing: !task,
        isTarget: taskId === target.id,
      });

      return depth;
    };

    visit(target.id, target.label);
    const routeTasks = Array.from(rows.values());
    const completed = routeTasks.filter((task) => task.isComplete).length;

    return {
      id: target.id,
      label: target.label,
      shortLabel: target.shortLabel,
      targetTaskId: target.id,
      tasks: routeTasks,
      completed,
      total: routeTasks.length,
      isComplete: completedTasks.has(target.id),
      hasMissingTasks: routeTasks.some((task) => task.isMissing),
    };
  });
}

export function calculateKappaProgress({
  tasks,
  completedTasks,
  playerLevel,
  fenceReputation,
  ll4Traders,
}: CalculateKappaProgressInput): KappaProgress {
  const routes = buildKappaQuestRoutes(tasks, completedTasks);
  const levelComplete =
    Number.isFinite(playerLevel) && playerLevel >= KAPPA_LEVEL_REQUIREMENT;
  const fenceReputationComplete =
    typeof fenceReputation === "number" &&
    Number.isFinite(fenceReputation) &&
    fenceReputation >= KAPPA_FENCE_REPUTATION_REQUIREMENT;
  const ll4Completed = KAPPA_LL4_TRADERS.filter((trader) =>
    ll4Traders.has(trader),
  ).length;
  const ll4Complete = ll4Completed === KAPPA_LL4_TRADERS.length;
  const questRoutesCompleted = routes.filter((route) => route.isComplete).length;
  const questRequirementsComplete = questRoutesCompleted === routes.length;
  const accountRequirementsComplete =
    levelComplete && fenceReputationComplete && ll4Complete;

  return {
    levelComplete,
    fenceReputationComplete,
    ll4Completed,
    ll4Total: KAPPA_LL4_TRADERS.length,
    ll4Complete,
    accountRequirementsComplete,
    routes,
    questRoutesCompleted,
    questRoutesTotal: routes.length,
    questRequirementsComplete,
    collectorUnlocked:
      accountRequirementsComplete && questRequirementsComplete,
  };
}
