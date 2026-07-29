import { STORYLINE_QUESTS } from "@/data/storylineQuests";

export type LightkeeperPath = "batya" | "ticket" | "quests";

export interface LightkeeperStep {
  id: string;
  label: string;
  taskIds?: string[];
  objectiveId?: string;
  mapNodeId?: string;
}

export interface LightkeeperRouteProgress {
  id: LightkeeperPath;
  label: string;
  completed: number;
  total: number;
  isComplete: boolean;
  steps: Array<LightkeeperStep & { isComplete: boolean }>;
  nextStep?: LightkeeperStep;
}

export const LIGHTKEEPER_STAGE_TWO_TASKS = [
  {
    id: "625d6ff5ddc94657c21a1625",
    name: "Network Provider - Part 1",
  },
  {
    id: "625d6ffaf7308432be1d44c5",
    name: "Network Provider - Part 2",
  },
  { id: "625d6ffcaa168e51321d69d7", name: "Assessment - Part 1" },
  { id: "625d6fff4149f1149b5b12c9", name: "Assessment - Part 2" },
  { id: "625d7001c4874104f230c0c5", name: "Assessment - Part 3" },
  { id: "625d70031ed3bb5bcc5bd9e5", name: "Key to the Tower" },
  { id: "625d7005a4eb80027c4f2e09", name: "Knock-Knock" },
  { id: "625d700cc48e6c62a440fab5", name: "Getting Acquainted" },
] as const;

export const NETWORK_PROVIDER_PART_ONE_ID =
  LIGHTKEEPER_STAGE_TWO_TASKS[0].id;
export const GETTING_ACQUAINTED_ID =
  LIGHTKEEPER_STAGE_TWO_TASKS[LIGHTKEEPER_STAGE_TWO_TASKS.length - 1].id;

const batyaQuest = STORYLINE_QUESTS.find((quest) => quest.id === "batya");

export const LIGHTKEEPER_BATYA_STEPS: LightkeeperStep[] =
  batyaQuest?.objectives
    ?.filter(
      (objective) =>
        objective.type === "main" &&
        Number(objective.id.replace("batya-main-", "")) <= 22,
    )
    .map((objective) => ({
      id: objective.id,
      objectiveId: objective.id,
      label: objective.description,
    })) ?? [];

export const LIGHTKEEPER_TICKET_STEPS: LightkeeperStep[] = [
  {
    id: "prapor-comp",
    mapNodeId: "prapor-comp",
    label: "Find compromising material on Prapor",
  },
  {
    id: "lk-access",
    mapNodeId: "lk-access",
    label: "Gain Lightkeeper access",
  },
];

export const LIGHTKEEPER_CLASSIC_STEPS: LightkeeperStep[] = [
  {
    id: "a-fuel-matter",
    label: "A Fuel Matter",
    taskIds: ["608974d01a66564e74191fc0"],
  },
  {
    id: "broadcast-part-2",
    label: "Broadcast - Part 2",
    taskIds: ["63913715f8e5dd32bf4e3aaa"],
  },
  {
    id: "cargo-x-part-4",
    label: "Cargo X - Part 4",
    taskIds: ["61958c366726521dd96828ec"],
  },
  {
    id: "chemical-choice",
    label: "Chemical - Part 4, Out of Curiosity, or Big Customer",
    taskIds: [
      "597a0f5686f774273b74f676",
      "597a160786f77477531d39d2",
      "597a171586f77405ba6887d3",
    ],
  },
  {
    id: "courtesy-visit",
    label: "Courtesy Visit",
    taskIds: ["5d25e48186f77443e625e386"],
  },
  {
    id: "database-part-2",
    label: "Database - Part 2",
    taskIds: ["5ae4493d86f7744b8e15aa8f"],
  },
  {
    id: "gunsmith-part-10",
    label: "Gunsmith - Part 10",
    taskIds: ["5ae327c886f7745c7b3f2f3f"],
  },
  {
    id: "house-arrest-part-1",
    label: "House Arrest - Part 1",
    taskIds: ["639135c3744e452011470807"],
  },
  {
    id: "lost-contact",
    label: "Lost Contact",
    taskIds: ["6179afd0bca27a099552e040"],
  },
  {
    id: "seaside-vacation",
    label: "Seaside Vacation",
    taskIds: ["6179ad56c760af5ad2053587"],
  },
  {
    id: "the-cult-part-2",
    label: "The Cult - Part 2",
    taskIds: ["5a27ba1c86f77461ea5a3c56"],
  },
  {
    id: "forest-cleaning",
    label: "The Huntsman Path - Forest Cleaning",
    taskIds: ["5d25e2cc86f77443e47ae019"],
  },
  {
    id: "the-punisher-part-4",
    label: "The Punisher - Part 4",
    taskIds: ["59ca264786f77445a80ed044"],
  },
];

function withCompletion(
  steps: LightkeeperStep[],
  isComplete: (step: LightkeeperStep) => boolean,
): LightkeeperRouteProgress["steps"] {
  return steps.map((step) => ({ ...step, isComplete: isComplete(step) }));
}

function buildRoute(
  id: LightkeeperPath,
  label: string,
  steps: LightkeeperRouteProgress["steps"],
): LightkeeperRouteProgress {
  const completed = steps.filter((step) => step.isComplete).length;
  const next = steps.find((step) => !step.isComplete);

  return {
    id,
    label,
    completed,
    total: steps.length,
    isComplete: completed === steps.length,
    steps,
    nextStep: next
      ? {
          id: next.id,
          label: next.label,
          taskIds: next.taskIds,
          objectiveId: next.objectiveId,
          mapNodeId: next.mapNodeId,
        }
      : undefined,
  };
}

export interface CalculateLightkeeperProgressInput {
  scavKarma?: number | null;
  completedTasks: Set<string>;
  completedStorylineObjectives: Set<string>;
  completedStorylineMapNodes: Set<string>;
}

export interface LightkeeperProgress {
  karmaComplete: boolean;
  routes: Record<LightkeeperPath, LightkeeperRouteProgress>;
  routeComplete: boolean;
  stageOneReady: boolean;
  stageOneReached: boolean;
  stageTwoCompleted: number;
  stageTwoTotal: number;
  nextStageTwoTask?: (typeof LIGHTKEEPER_STAGE_TWO_TASKS)[number];
  lightkeeperUnlocked: boolean;
}

export function calculateLightkeeperProgress({
  scavKarma,
  completedTasks,
  completedStorylineObjectives,
  completedStorylineMapNodes,
}: CalculateLightkeeperProgressInput): LightkeeperProgress {
  const routes = {
    batya: buildRoute(
      "batya",
      "Batya",
      withCompletion(LIGHTKEEPER_BATYA_STEPS, (step) =>
        completedStorylineObjectives.has(step.objectiveId ?? step.id),
      ),
    ),
    ticket: buildRoute(
      "ticket",
      "The Ticket",
      withCompletion(LIGHTKEEPER_TICKET_STEPS, (step) =>
        completedStorylineMapNodes.has(step.mapNodeId ?? step.id),
      ),
    ),
    quests: buildRoute(
      "quests",
      "Classic Quests",
      withCompletion(LIGHTKEEPER_CLASSIC_STEPS, (step) =>
        (step.taskIds ?? []).some((taskId) => completedTasks.has(taskId)),
      ),
    ),
  };
  const completedStageTwoTasks = LIGHTKEEPER_STAGE_TWO_TASKS.filter((task) =>
    completedTasks.has(task.id),
  );
  const stageOneReached = completedStageTwoTasks.length > 0;
  const karmaComplete = typeof scavKarma === "number" && scavKarma >= 1;
  const routeComplete = Object.values(routes).some((route) => route.isComplete);
  const stageOneReady = (karmaComplete && routeComplete) || stageOneReached;

  return {
    karmaComplete,
    routes,
    routeComplete,
    stageOneReady,
    stageOneReached,
    stageTwoCompleted: completedStageTwoTasks.length,
    stageTwoTotal: LIGHTKEEPER_STAGE_TWO_TASKS.length,
    nextStageTwoTask: LIGHTKEEPER_STAGE_TWO_TASKS.find(
      (task) => !completedTasks.has(task.id),
    ),
    lightkeeperUnlocked: completedTasks.has(GETTING_ACQUAINTED_ID),
  };
}

export function normalizeLightkeeperPath(
  value: string | null | undefined,
): LightkeeperPath {
  return value === "ticket" || value === "quests" ? value : "batya";
}
