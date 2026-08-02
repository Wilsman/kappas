import {
  STORYLINE_QUESTS,
  type StorylineObjective,
  type StorylineQuest,
} from "@/data/storylineQuests";

export type LightkeeperPath = "batya" | "ticket" | "quests";

export interface LightkeeperStepChoice {
  id: string;
  label: string;
  note?: string;
  wikiUrl?: string;
}

export interface LightkeeperStep {
  id: string;
  label: string;
  taskIds?: string[];
  objectiveId?: string;
  mapNodeId?: string;
  choices?: LightkeeperStepChoice[];
  completionChoiceIds?: string[];
  isOptional?: boolean;
  chapter?: string;
  chapterDescription?: string;
  itemRequirement?: StorylineObjective["itemRequirement"];
  wikiUrl?: string;
}

export interface LightkeeperRouteProgress {
  id: LightkeeperPath;
  label: string;
  completed: number;
  total: number;
  isComplete: boolean;
  steps: Array<LightkeeperStep & { isComplete: boolean }>;
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
const tourQuest = STORYLINE_QUESTS.find((quest) => quest.id === "tour");
const fallingSkiesQuest = STORYLINE_QUESTS.find(
  (quest) => quest.id === "falling-skies",
);

const BATYA_WIKI_URL =
  "https://escapefromtarkov.fandom.com/wiki/Batya";

export const LIGHTKEEPER_BATYA_START_LOCATIONS: LightkeeperStepChoice[] = [
  {
    id: "batya-start-customs",
    label:
      'Mattress below the "жопа" writing on the second floor of the Scav base on Customs',
  },
  {
    id: "batya-start-reserve",
    label: "Radome on top of the white queen radar station building on Reserve",
  },
  {
    id: "batya-start-shoreline",
    label: "Bunker north of the health resort on Shoreline",
  },
  {
    id: "batya-start-woods",
    label: "Mattresses on top of the big rock at the USEC camp on Woods",
  },
];

const BATYA_GUIDE_ANCHORS: Record<number, string> = {
  1: "Locate_the_traces_of_the_BEAR_special_squad",
  2: "Learn_more_about_the_Bogatyr_squad_from_the_traders",
  3: "Locate_the_Ryabina_outpost",
  4: "Find_more_information_about_the_Bogatyr_squad",
  5: "Locate_the_Carousel_outpost",
  6: "Locate_the_Carousel_outpost",
  7: "Find_more_information_about_the_Bogatyr_squad",
  8: "Locate_the_Carousel_outpost",
  9: "Locate_the_Gnezdo_outpost",
  10: "Locate_the_Gnezdo_outpost",
  11: "Locate_the_Gnezdo_outpost",
  12: "Search_the_Gnezdo_outpost",
  13: "Search_the_Gnezdo_outpost",
  14: "Locate_the_ambush_spot",
  15: "Search_the_Gnezdo_outpost",
  16: "Obtain_more_information_about_the_Bogatyr_squad",
  17: "Locate_the_ambush_spot",
  18: "Obtain_more_information_about_the_Bogatyr_squad",
  19: "Locate_the_ambush_spot",
  20: "Retrieve_more_information_about_the_ambush_from_Moreman's_phone",
  21: "Obtain_Intelligence_Center_level_3",
  22: "Contact_the_Bogatyr_squad",
};

const batyaObjectiveSteps: LightkeeperStep[] =
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
      wikiUrl: `${BATYA_WIKI_URL}#${
        BATYA_GUIDE_ANCHORS[
          Number(objective.id.replace("batya-main-", ""))
        ] ?? "Objectives"
      }`,
    })) ?? [];

export const LIGHTKEEPER_BATYA_STEPS: LightkeeperStep[] = [
  {
    id: "batya-start-requirement",
    label: "Start Batya by visiting any one location",
    choices: LIGHTKEEPER_BATYA_START_LOCATIONS,
    wikiUrl: `${BATYA_WIKI_URL}#Requirements`,
  },
  ...batyaObjectiveSteps,
];

const TOUR_WIKI_URL = "https://escapefromtarkov.fandom.com/wiki/Tour";
const FALLING_SKIES_WIKI_URL =
  "https://escapefromtarkov.fandom.com/wiki/Falling_Skies";

function createStorylineStep(
  quest: StorylineQuest | undefined,
  objectiveId: string,
  wikiUrl: string,
  options: Partial<LightkeeperStep> = {},
): LightkeeperStep {
  const objective = quest?.objectives?.find(
    (candidate) => candidate.id === objectiveId,
  );
  return {
    id: objectiveId,
    objectiveId,
    label: options.label ?? objective?.description ?? objectiveId,
    itemRequirement: objective?.itemRequirement,
    wikiUrl,
    ...options,
  };
}

export const LIGHTKEEPER_TICKET_STEPS: LightkeeperStep[] = [
  createStorylineStep(
    tourQuest,
    "tour-main-1",
    `${TOUR_WIKI_URL}#Escape_Ground_Zero`,
    {
      chapter: "Tour",
      chapterDescription:
        "Progress through Tour until Mechanic can be asked about the downed plane.",
    },
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-2",
    `${TOUR_WIKI_URL}#Talk_to_Therapist`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-3",
    `${TOUR_WIKI_URL}#Talk_to_Therapist`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-4",
    `${TOUR_WIKI_URL}#Talk_to_Therapist`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-opt-1",
    `${TOUR_WIKI_URL}#Talk_to_Therapist`,
    { isOptional: true },
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-5",
    `${TOUR_WIKI_URL}#Ragman_-_Interchange`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-6",
    `${TOUR_WIKI_URL}#Ragman_-_Interchange`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-7",
    `${TOUR_WIKI_URL}#Ragman_-_Interchange`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-8",
    `${TOUR_WIKI_URL}#Skier_-_Customs`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-9",
    `${TOUR_WIKI_URL}#Skier_-_Customs`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-opt-2",
    `${TOUR_WIKI_URL}#Skier_-_Customs`,
    { isOptional: true },
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-10",
    `${TOUR_WIKI_URL}#Skier_-_Customs`,
  ),
  createStorylineStep(
    tourQuest,
    "tour-main-11",
    `${TOUR_WIKI_URL}#Mechanic_-_Factory`,
    { label: "Ask Mechanic about the downed plane" },
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-1",
    `${FALLING_SKIES_WIKI_URL}#Locate_the_fallen_plane`,
    {
      chapter: "Falling Skies",
      chapterDescription:
        "Follow Prapor's investigation, then hand over the armored case to unlock the Network Provider shortcut.",
    },
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-2",
    `${FALLING_SKIES_WIKI_URL}#Reach_Loyalty_Level_2_with_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-3",
    `${FALLING_SKIES_WIKI_URL}#Ask_the_traders_about_the_fallen_plane`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-opt-1",
    `${FALLING_SKIES_WIKI_URL}#(Optional)_Hand_over_2,000_USD_to_Therapist_to_learn_details_about_the_SUV`,
    { isOptional: true },
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-5",
    `${FALLING_SKIES_WIKI_URL}#Retrieve_the_flash_drive_from_one_of_the_G-Wagon_SUVs`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-6",
    `${FALLING_SKIES_WIKI_URL}#Speak_to_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-7",
    `${FALLING_SKIES_WIKI_URL}#Wait_for_the_information_from_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-8",
    `${FALLING_SKIES_WIKI_URL}#Retrieve_the_plane's_flight_recorder`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-9",
    `${FALLING_SKIES_WIKI_URL}#Leave_the_flight_recorder_in_the_specified_spot`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-10",
    `${FALLING_SKIES_WIKI_URL}#Visit_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-12",
    `${FALLING_SKIES_WIKI_URL}#Visit_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-13",
    `${FALLING_SKIES_WIKI_URL}#Visit_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-11",
    `${FALLING_SKIES_WIKI_URL}#Visit_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-14",
    `${FALLING_SKIES_WIKI_URL}#Wait_for_the_information_from_Prapor_2`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-15",
    `${FALLING_SKIES_WIKI_URL}#Hand_over_the_flight_crew's_transcript_and_Elektronik's_secure_flash_drive_to_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-16",
    `${FALLING_SKIES_WIKI_URL}#Hand_over_the_flight_crew's_transcript_and_Elektronik's_secure_flash_drive_to_Prapor`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-17",
    `${FALLING_SKIES_WIKI_URL}#Wait_for_the_information_from_Prapor_3`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-main-18",
    `${FALLING_SKIES_WIKI_URL}#Retrieve_the_armored_case/Find_any_additional_clues`,
  ),
  createStorylineStep(
    fallingSkiesQuest,
    "falling-skies-opt-2",
    `${FALLING_SKIES_WIKI_URL}#Retrieve_the_armored_case/Find_any_additional_clues`,
    { isOptional: true },
  ),
  {
    id: "falling-skies-armored-case-decision",
    label: "Choose what to do with the armored case",
    completionChoiceIds: ["falling-skies-main-19"],
    choices: [
      {
        id: "falling-skies-main-20",
        label: "Keep the armored case for yourself",
        note: "Continues the alternate storyline route and does not unlock the Network Provider shortcut.",
        wikiUrl: `${FALLING_SKIES_WIKI_URL}#Decision:_Keep_the_armored_case`,
      },
      {
        id: "falling-skies-main-19",
        label: "Hand over the armored case to Prapor",
        note: "Unlocks the shortcut to Network Provider - Part 1.",
        wikiUrl: `${FALLING_SKIES_WIKI_URL}#Decision:_Hand_over_the_armored_case_directly_to_Prapor`,
      },
    ],
    wikiUrl: `${FALLING_SKIES_WIKI_URL}#Keep_the_armored_case_for_yourself_or_hand_it_over_to_Prapor`,
  },
];

export const LIGHTKEEPER_SIDEQUEST_STEPS: LightkeeperStep[] = [
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
  const requiredSteps = steps.filter((step) => !step.isOptional);
  const completed = requiredSteps.filter((step) => step.isComplete).length;

  return {
    id,
    label,
    completed,
    total: requiredSteps.length,
    isComplete: requiredSteps.length > 0 && completed === requiredSteps.length,
    steps,
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
  const legacyTicketComplete = completedStorylineMapNodes.has("lk-access");
  const routes = {
    batya: buildRoute(
      "batya",
      "Batya",
      withCompletion(LIGHTKEEPER_BATYA_STEPS, (step) => {
        if (step.choices?.length) {
          return step.choices.some((choice) =>
            completedStorylineObjectives.has(choice.id),
          );
        }
        return completedStorylineObjectives.has(step.objectiveId ?? step.id);
      }),
    ),
    ticket: buildRoute(
      "ticket",
      "The Ticket",
      withCompletion(LIGHTKEEPER_TICKET_STEPS, (step) => {
        if (legacyTicketComplete && !step.isOptional) {
          return true;
        }
        if (step.choices?.length) {
          const completionIds = step.completionChoiceIds ??
            step.choices.map((choice) => choice.id);
          return completionIds.some((choiceId) =>
            completedStorylineObjectives.has(choiceId),
          );
        }
        return (
          completedStorylineObjectives.has(step.objectiveId ?? step.id)
        );
      }),
    ),
    quests: buildRoute(
      "quests",
      "Sidequests Route",
      withCompletion(LIGHTKEEPER_SIDEQUEST_STEPS, (step) =>
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
