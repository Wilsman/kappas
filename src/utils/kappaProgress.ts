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

export const KAPPA_QUEST_TARGETS = [
  {
    id: "597a0f5686f774273b74f676",
    label: "Chemical - Part 4",
    shortLabel: "Chemical",
  },
  {
    id: "5c0bde0986f77479cf22c2f8",
    label: "A Shooter Born in Heaven",
    shortLabel: "Shooter Born",
  },
  {
    id: "5bc480a686f7741af0342e29",
    label: "The Tarkov Shooter - Part 4",
    shortLabel: "Tarkov Shooter",
  },
  {
    id: "5ae4497b86f7744cf402ed00",
    label: "Sew it Good - Part 4",
    shortLabel: "Sew it Good",
  },
] as const;

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
): KappaQuestRoute[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return KAPPA_QUEST_TARGETS.map((target) => {
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
