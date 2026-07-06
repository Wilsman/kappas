import {
  TaskData,
  TaskObjective,
  CollectorItemsData,
  HideoutStationsData,
  AchievementsData,
  Overlay,
  Task,
  TaskOverride,
  ObjectiveAdd,
  ObjectiveOverride,
  TaskAddObjective,
  TaskAddRewardItem,
  RewardItem,
} from "../types";
import { TraderName } from "../data/traders";
import {
  DEFAULT_GAME_MODE,
  normalizeGameMode,
  type GameMode,
} from "@/utils/gameMode";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type LanguageCode,
} from "@/utils/language";
import { taskStorage } from "@/utils/indexedDB";
const DIRECT_TARKOV_API_URL = "https://api.tarkov.dev/graphql";
const PROXIED_TARKOV_API_URL = "/api/tarkov/graphql";
const TARKOV_JSON_API_BASE_URL = "https://json.tarkov.dev";

type TarkovApiEnv = {
  DEV?: boolean;
  PROD?: boolean;
  VITE_TARKOV_API_URL?: string;
};

export const getTarkovApiUrl = (
  env: TarkovApiEnv = import.meta.env,
): string => {
  const configuredUrl = env.VITE_TARKOV_API_URL?.trim();
  if (configuredUrl) return configuredUrl;
  return env.PROD ? PROXIED_TARKOV_API_URL : DIRECT_TARKOV_API_URL;
};

export const OVERLAY_URL =
  "https://cdn.jsdelivr.net/gh/tarkovtracker-org/tarkov-data-overlay@main/dist/overlay.json";
const COLLECTOR_TASK_ID = "5c51aac186f77432ea65c552";
const REMOVED_COLLECTOR_ITEM_IDS = new Set([
  "5bc9bc53d4351e00367fbcee", // Golden rooster figurine
  "5bc9b156d4351e00367fbce9", // Jar of DevilDog mayo
  "5bd073c986f7747f627e796c", // Kotton beanie
  "5bc9c377d4351e3bac12251b", // Old firesteel
  "5bc9c29cd4351e003562b8a3", // Can of sprats
]);
const MISSING_COLLECTOR_ITEMS: CollectorItemsData["data"]["task"]["objectives"][number]["items"] =
  [
    {
      id: "69f9d547b98cc4120608692a",
      name: "DesmondPilak CD",
      iconLink: "https://assets.tarkov.dev/69f9d547b98cc4120608692a-icon.webp",
    },
    {
      id: "69f9d60b5de6674f08060f2a",
      name: "Dunduk floppy disk",
      iconLink: "https://assets.tarkov.dev/69f9d60b5de6674f08060f2a-icon.webp",
    },
    {
      id: "69f9d319c906cd16da03b374",
      name: "SheefGG piggy bank",
      iconLink: "https://assets.tarkov.dev/69f9d319c906cd16da03b374-icon.webp",
    },
  ];

// Cool down localStorage writes after quota failures without disabling them forever.
const LOCAL_STORAGE_QUOTA_COOLDOWN_MS = 60_000;
let localStorageQuotaExceededUntil = 0;

type TaskOverlayTarget = Task | CollectorItemsData["data"]["task"];
type TaskRequirement = Task["taskRequirements"][number];
type NullableTaskRequirement = {
  task?: { id?: string; name?: string } | null;
};
type RewardContainer = { items?: Array<{ item?: { id?: string } }> } & Record<
  string,
  unknown
>;
type ObjectiveItem = { id?: string; name: string; iconLink?: string };
type ObjectiveWithId = TaskObjective & {
  id?: string;
};
type ObjectiveLike = {
  description?: string;
  items?: ObjectiveItem[];
  count?: number;
  maps?: Array<{ id: string; name: string }>;
};
type TaskOverrideWithExtras = TaskOverride & {
  taskRequirements?: Task["taskRequirements"];
  startRewards?: Task["startRewards"];
  finishRewards?: Task["finishRewards"];
  objectives?: Record<string, ObjectiveOverride>;
  objectivesAdd?: ObjectiveAdd[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isRewardContainer = (value: unknown): value is RewardContainer =>
  isRecord(value);

const buildIconLink = (id?: string) =>
  id ? `https://assets.tarkov.dev/${id}-icon.webp` : "";

const toTraderName = (name?: string): TraderName =>
  (name as TraderName) ?? "Prapor";

const getMapName = (map?: { name?: string } | null): string | null => {
  const name = map?.name?.trim();
  return name ? name : null;
};

const isDevOverlayWarningEnabled =
  import.meta.env.DEV && import.meta.env.MODE !== "test";

const normalizeItemKey = (item?: ObjectiveItem): string | null => {
  if (!item) return null;
  if (item.id) return `id:${item.id}`;

  const normalizedName = item.name.trim().toLowerCase();
  return normalizedName ? `name:${normalizedName}` : null;
};

const collectObjectiveItemKeys = (
  objectives?: ObjectiveLike[],
): Set<string> => {
  const keys = new Set<string>();

  objectives?.forEach((objective) => {
    objective.items?.forEach((item) => {
      const key = normalizeItemKey(item);
      if (key) keys.add(key);
    });
  });

  return keys;
};

const normalizeObjectiveItems = (
  objective: TaskAddObjective,
): ObjectiveItem[] => {
  const items: ObjectiveItem[] = [];
  if (objective.item) {
    items.push({
      id: objective.item.id,
      name: objective.item.name,
      iconLink: buildIconLink(objective.item.id),
    });
  }
  if (objective.markerItem) {
    items.push({
      id: objective.markerItem.id,
      name: objective.markerItem.name,
      iconLink: buildIconLink(objective.markerItem.id),
    });
  }
  if (objective.items && objective.items.length > 0) {
    objective.items.forEach((item) => {
      items.push({
        id: item.id,
        name: item.name,
        iconLink: buildIconLink(item.id),
      });
    });
  }
  return items;
};

export function applyTaskOverlay<T extends TaskOverlayTarget>(
  baseTask: T,
  overlay: Overlay,
): T | null {
  const taskOverride = overlay.tasks?.[baseTask.id] as
    | TaskOverrideWithExtras
    | undefined;
  if (!taskOverride) return baseTask;

  if (taskOverride.disabled === true) return null;

  const result = { ...baseTask } as T & Record<string, unknown>;
  const withIconLink = (item: ObjectiveItem): ObjectiveItem => {
    if (!item || item.iconLink || !item.id) return item;
    return { ...item, iconLink: buildIconLink(item.id) };
  };

  // Fields that need special merge handling (arrays that should append, not replace)
  const arrayMergeFields = ["taskRequirements"];
  const nestedArrayMergeFields = ["finishRewards", "startRewards"]; // These have .items arrays

  // Apply top-level fields
  for (const [key, value] of Object.entries(taskOverride)) {
    if (key === "objectives" || key === "objectivesAdd") continue; // Handle separately

    // Smart merge for taskRequirements (append new ones)
    if (arrayMergeFields.includes(key) && Array.isArray(value)) {
      const existingValue = result[key];
      const existing = Array.isArray(existingValue)
        ? (existingValue as TaskRequirement[])
        : [];
      const existingIds = new Set(existing.map((r) => r.task?.id));
      const newItems = (value as TaskRequirement[]).filter(
        (item) => !existingIds.has(item.task?.id),
      );
      result[key] = [...existing, ...newItems];
      continue;
    }

    // Smart merge for finishRewards/startRewards (append new items)
    if (
      nestedArrayMergeFields.includes(key) &&
      typeof value === "object" &&
      value !== null
    ) {
      const existingRaw = result[key];
      const existingRewards: RewardContainer = isRewardContainer(existingRaw)
        ? existingRaw
        : {};
      const newRewards: RewardContainer = isRewardContainer(value) ? value : {};
      const existingItems = Array.isArray(existingRewards.items)
        ? existingRewards.items
        : [];
      const newItems = Array.isArray(newRewards.items)
        ? newRewards.items.filter(
            (i) =>
              !new Set(
                existingItems.map(
                  (e: { item?: { id?: string } }) => e.item?.id,
                ),
              ).has(i.item?.id),
          )
        : [];
      if (newItems.length > 0) {
        result[key] = {
          ...existingRewards,
          ...newRewards,
          items: [...existingItems, ...newItems],
        };
      } else {
        result[key] = { ...existingRewards, ...newRewards };
      }
      continue;
    }

    // Default: direct assignment
    result[key] = value;
  }

  // Apply objective patches (ID-keyed object)
  if (taskOverride.objectives && typeof taskOverride.objectives === "object") {
    result.objectives = (baseTask.objectives || []).map(
      (obj): TaskObjective => {
        const objWithId = obj as ObjectiveWithId;
        const patch = objWithId.id
          ? taskOverride.objectives?.[objWithId.id]
          : undefined;
        return patch ? { ...obj, ...patch } : obj;
      },
    );
  }

  const expandObjectiveItems = (objective: ObjectiveLike): ObjectiveLike[] => {
    const items = objective.items?.map(withIconLink) || [];
    if (
      items.length > 0 &&
      typeof objective.description === "string" &&
      objective.description.includes("Collector items")
    ) {
      return items.map((item) => ({
        ...objective,
        description: `Hand over the found in raid item: ${item.name}`,
        items: [item],
      }));
    }
    return [{ ...objective, items }];
  };

  // Append missing objectives
  if (taskOverride.objectivesAdd && Array.isArray(taskOverride.objectivesAdd)) {
    const expanded = taskOverride.objectivesAdd.flatMap(expandObjectiveItems);
    const existingItemKeys = collectObjectiveItemKeys(
      result.objectives as ObjectiveLike[] | undefined,
    );
    const skippedOverlayItems: string[] = [];
    const dedupedExpanded = expanded.filter((objective) => {
      if (!objective.items || objective.items.length !== 1) return true;

      const [item] = objective.items;
      const key = normalizeItemKey(item);
      if (!key) return true;

      if (existingItemKeys.has(key)) {
        skippedOverlayItems.push(item.name);
        return false;
      }

      existingItemKeys.add(key);
      return true;
    });

    if (skippedOverlayItems.length > 0 && isDevOverlayWarningEnabled) {
      console.warn(
        `[Overlay] Skipped duplicate overlay items for task ${baseTask.id}: ${skippedOverlayItems.join(", ")}`,
      );
    }

    result.objectives = [
      ...(result.objectives || []),
      ...dedupedExpanded,
    ] as TaskObjective[];
  }

  if (result.objectives) {
    result.objectives = (result.objectives as TaskObjective[]).map(
      (objective) => ({
        ...objective,
        items: objective.items?.map(withIconLink),
      }),
    );
  }

  return result;
}

// Prefixes that indicate a task is a seasonal/temporary event
const EVENT_TASK_PREFIXES = [
  "winter_",
  "halloween_",
  "event_",
  "newyear_",
  "christmas_",
  "easter_",
  "summer_",
  "spring_",
  "autumn_",
  "fall_",
];

/**
 * Determines if a task from tasksAdd is a seasonal event or a permanent addition.
 * Event tasks have specific prefixes in their ID (e.g., winter_2025_missing_in_action).
 * Permanent tasks (e.g., setting_priorities, goals_and_means) do not have these prefixes.
 */
function isEventTask(taskId: string): boolean {
  const lowerCaseId = taskId.toLowerCase();
  return EVENT_TASK_PREFIXES.some((prefix) => lowerCaseId.startsWith(prefix));
}

export function buildEventTasksFromOverlay(overlay: Overlay): Task[] {
  if (!overlay.tasksAdd) return [];

  return Object.values(overlay.tasksAdd).map((task) => {
    const objectiveList = (task.objectives || []).map((objective) => {
      const items = normalizeObjectiveItems(objective);
      return {
        id: objective.id,
        description: objective.description,
        maps: objective.maps
          ?.map((map) => getMapName(map))
          .filter((name): name is string => !!name)
          .map((name) => ({ name })),
        items: items.length > 0 ? items : undefined,
        count: objective.count,
        foundInRaid: objective.foundInRaid,
      } satisfies TaskObjective;
    });

    const mapNames = new Set<string>();
    const taskMapName = getMapName(task.map);
    if (taskMapName) {
      mapNames.add(taskMapName);
    }
    task.maps?.forEach((map) => {
      const name = getMapName(map);
      if (name) mapNames.add(name);
    });
    task.objectives?.forEach((objective) => {
      objective.maps?.forEach((map) => {
        const name = getMapName(map);
        if (name) mapNames.add(name);
      });
    });

    const rewardItems = (task.finishRewards?.items || [])
      .filter((reward): reward is TaskAddRewardItem => !!reward?.item?.name)
      .map((reward) => ({
        count: reward.count,
        item: {
          id: reward.item.id,
          name: reward.item.name,
          shortName: reward.item.shortName,
          iconLink: buildIconLink(reward.item.id),
        },
      }));

    const offerUnlocks = (task.finishRewards?.offerUnlock ?? [])
      .filter((unlock) => !!unlock?.item?.name && !!unlock?.trader?.name)
      .map((unlock) => ({
        item: {
          id: unlock.item.id,
          name: unlock.item.name,
          shortName: unlock.item.shortName,
          iconLink: unlock.item.iconLink ?? buildIconLink(unlock.item.id),
        },
        trader: {
          id: unlock.trader.id,
          name: unlock.trader.name,
          imageLink: unlock.trader.imageLink,
        },
        level: unlock.level,
      }));

    const traderStanding = (task.finishRewards?.traderStanding ?? [])
      .filter((entry) => !!entry?.trader?.name && entry.standing != null)
      .map((entry) => ({
        trader: {
          id: entry.trader?.id,
          name: toTraderName(entry.trader?.name),
        },
        standing: entry.standing,
      }));

    const customizationRewards = (
      task.finishRewards?.customization ?? []
    ).filter((entry) => !!entry?.name);
    const achievementRewards = (task.finishRewards?.achievement ?? []).filter(
      (entry) => !!entry?.name,
    );
    const skillLevelRewards = (
      task.finishRewards?.skillLevelReward ?? []
    ).filter((entry) => !!(entry?.name || entry?.skill?.name));
    const traderUnlockRewards = (task.finishRewards?.traderUnlock ?? []).filter(
      (entry) => !!entry?.name,
    );
    const craftUnlockRewards = (task.finishRewards?.craftUnlock ?? []).filter(
      (entry) => !!entry?.id,
    );

    const finishRewards =
      rewardItems.length > 0 ||
      offerUnlocks.length > 0 ||
      traderStanding.length > 0 ||
      customizationRewards.length > 0 ||
      achievementRewards.length > 0 ||
      skillLevelRewards.length > 0 ||
      traderUnlockRewards.length > 0 ||
      craftUnlockRewards.length > 0
        ? {
            ...(rewardItems.length > 0 ? { items: rewardItems } : {}),
            ...(offerUnlocks.length > 0 ? { offerUnlock: offerUnlocks } : {}),
            ...(traderStanding.length > 0 ? { traderStanding } : {}),
            ...(customizationRewards.length > 0
              ? { customization: customizationRewards }
              : {}),
            ...(achievementRewards.length > 0
              ? { achievement: achievementRewards }
              : {}),
            ...(skillLevelRewards.length > 0
              ? { skillLevelReward: skillLevelRewards }
              : {}),
            ...(traderUnlockRewards.length > 0
              ? { traderUnlock: traderUnlockRewards }
              : {}),
            ...(craftUnlockRewards.length > 0
              ? { craftUnlock: craftUnlockRewards }
              : {}),
          }
        : undefined;

    return {
      id: task.id,
      name: task.name,
      wikiLink: task.wikiLink ?? "",
      experience: task.experience,
      minPlayerLevel: task.minPlayerLevel ?? 1,
      factionName: task.factionName ?? null,
      taskRequirements: task.taskRequirements ?? [],
      map: task.map?.name ? { name: task.map.name } : null,
      maps: Array.from(mapNames).map((name) => ({ name })),
      trader: {
        name: toTraderName(task.trader?.name),
      },
      kappaRequired: task.kappaRequired,
      lightkeeperRequired: task.lightkeeperRequired ?? false,
      objectives: objectiveList.length > 0 ? objectiveList : undefined,
      finishRewards,
      isEvent: isEventTask(task.id),
    };
  });
}

export function sanitizeTaskRewardData(task: Task): Task {
  const startRewardItems = (task.startRewards?.items ?? []).filter(
    (reward) => !!reward?.item?.name,
  );
  const finishRewardItems = (task.finishRewards?.items ?? []).filter(
    (reward) => !!reward?.item?.name,
  );
  const offerUnlocks = (task.finishRewards?.offerUnlock ?? []).filter(
    (unlock) => !!unlock?.item?.name && !!unlock?.trader?.name,
  );

  return {
    ...task,
    startRewards:
      startRewardItems.length > 0 ? { items: startRewardItems } : undefined,
    finishRewards: task.finishRewards
      ? {
          ...task.finishRewards,
          items: finishRewardItems,
          offerUnlock: offerUnlocks,
        }
      : undefined,
  };
}

const BUILDING_FOUNDATIONS_TASK_ID = "673f629c5b555b53460cf827";
const BUILDING_FOUNDATIONS_TASK_NAME = "Building Foundations";
const BUILDING_FOUNDATIONS_SELL_TRADERS = ["Ragman", "Prapor", "Peacekeeper"];

function normalizeBuildingFoundationsObjectives(task: Task): Task {
  if (
    task.id !== BUILDING_FOUNDATIONS_TASK_ID &&
    task.name !== BUILDING_FOUNDATIONS_TASK_NAME
  ) {
    return task;
  }

  return {
    ...task,
    objectives: task.objectives?.map((objective) => {
      const description = objective.description?.toLowerCase() ?? "";
      const traderName = BUILDING_FOUNDATIONS_SELL_TRADERS.find(
        (trader) =>
          /\bsell any items?\b/.test(description) &&
          description.includes(trader.toLowerCase()),
      );

      if (!traderName) return objective;

      const objectiveWithoutItems = { ...objective };
      delete objectiveWithoutItems.items;
      return {
        ...objectiveWithoutItems,
        description: `Sell any 50 items to ${traderName}`,
        count: 50,
      };
    }),
  };
}

export function removeDeprecatedCollectorItems<
  T extends CollectorItemsData["data"]["task"],
>(task: T): T {
  return {
    ...task,
    objectives: task.objectives
      .map((objective) => ({
        ...objective,
        items: objective.items.filter(
          (item) => !item.id || !REMOVED_COLLECTOR_ITEM_IDS.has(item.id),
        ),
      }))
      .filter((objective) => objective.items.length > 0),
  };
}

export function addMissingCollectorItems<
  T extends CollectorItemsData["data"]["task"],
>(task: T): T {
  const existingItemKeys = collectObjectiveItemKeys(task.objectives);
  const objectivesToAdd = MISSING_COLLECTOR_ITEMS.filter((item) => {
    const itemKey = normalizeItemKey(item);
    return itemKey && !existingItemKeys.has(itemKey);
  }).map((item) => ({
    items: [item],
  }));

  if (objectivesToAdd.length === 0) return task;

  return {
    ...task,
    objectives: [...task.objectives, ...objectivesToAdd],
  };
}

export function normalizeCollectorItems<
  T extends CollectorItemsData["data"]["task"],
>(task: T): T {
  const taskWithoutDeprecatedItems = removeDeprecatedCollectorItems(task);
  if (taskWithoutDeprecatedItems.objectives.length === 0) {
    return taskWithoutDeprecatedItems;
  }
  return addMissingCollectorItems(taskWithoutDeprecatedItems);
}

export async function fetchOverlay(): Promise<Overlay> {
  try {
    const response = await fetch(OVERLAY_URL);
    if (!response.ok)
      throw new Error(`Overlay fetch failed: ${response.status}`);
    const data = await response.json();
    console.log(`[Overlay] Successfully fetched latest from: ${OVERLAY_URL}`);
    return data;
  } catch (err) {
    console.error("[Overlay] Failed to fetch remote overlay:", err);
    console.warn(
      "[Overlay] Returning empty overlay - tasksAdd will be unavailable. " +
        'Event/overlay-only tasks marked as "working on" may disappear temporarily.',
    );
    // Return a minimal empty overlay to prevent the app from breaking
    return {
      tasks: {},
      $meta: { version: "0.0.0-empty", generated: new Date().toISOString() },
    };
  }
}

// ============================================================================
// TEMPORARY TASK REQUIREMENT OVERRIDES
// Set to false when the API is fixed and these overrides are no longer needed
// ============================================================================
const ENABLE_TASK_REQUIREMENT_OVERRIDES = true;

// Map of taskId -> array of requirement task IDs to REMOVE
const TASK_REQUIREMENT_OVERRIDES: Record<string, string[]> = {
  // Test Drive - Part 1: Remove incorrect Grenadier dependency
  "5c0bd94186f7747a727f09b2": ["5c0d190cd09282029f5390d8"], // Grenadier
  // Huntsman Path - Justice: Remove incorrect Trophy dependency (both should depend on Secured Perimeter)
  "5d25e43786f7740a212217fa": ["5d25e2c386f77443e7549029"], // Huntsman Path - Trophy
};

function applyTaskRequirementOverrides<
  T extends {
    id?: string;
    taskRequirements?: NullableTaskRequirement[] | null;
  },
>(tasks: Array<T | null | undefined>): T[] {
  if (!ENABLE_TASK_REQUIREMENT_OVERRIDES) return tasks;

  return tasks.flatMap((task) => {
    if (!task?.id) return [];

    const overrides = TASK_REQUIREMENT_OVERRIDES[task.id];
    const taskRequirements = Array.isArray(task.taskRequirements)
      ? task.taskRequirements
      : [];
    const validRequirements = taskRequirements.filter(
      (req): req is NullableTaskRequirement & { task: { id: string } } =>
        !!req?.task?.id,
    );
    if (!overrides || overrides.length === 0) {
      return validRequirements.length === taskRequirements.length
        ? task
        : { ...task, taskRequirements: validRequirements };
    }

    return {
      ...task,
      taskRequirements: validRequirements.filter(
        (req) => !overrides.includes(req.task.id),
      ),
    };
  });
}

interface CombinedApiData {
  data: {
    tasks: TaskData["data"]["tasks"];
    task: CollectorItemsData["data"]["task"];
    achievements: AchievementsData["data"]["achievements"];
    hideoutStations: HideoutStationsData["hideoutStations"];
  };
  errors?: { message: string }[];
}

function formatGraphQLErrors(errors: { message: string }[]): string {
  return errors.map((e) => e.message).join(", ");
}

function hasUsableCombinedTaskData(
  result: CombinedApiData,
): result is CombinedApiData & {
  data: CombinedApiData["data"] & { tasks: TaskData["data"]["tasks"] };
} {
  return Array.isArray(result.data?.tasks);
}

// Simple localStorage cache for combined API payload
export const API_CACHE_KEY = "taskTracker_api_cache_v2";
export const API_CACHE_KEY_PREFIX = "taskTracker_api_cache_v4";
const LEGACY_API_CACHE_KEY_PREFIX = "taskTracker_api_cache_v3";
export const SHARED_CACHE_KEY = "taskTracker_shared_cache_v4";
export const API_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export interface CombinedCacheDebugInfo {
  available: boolean;
  fresh: boolean;
  format: "split" | "legacy-split" | "legacy-mode" | "legacy-default" | null;
  checkedGameMode: GameMode;
  checkedLanguage: LanguageCode;
  ttlMs: number;
  newestUpdatedAt: string | null;
  oldestUpdatedAt: string | null;
  newestAgeMs: number | null;
  oldestAgeMs: number | null;
  keys: string[];
}

type JsonTranslationMap = Record<string, string>;
type JsonTasksResponse = {
  data?: {
    tasks?: Record<string, JsonTask>;
    achievements?: Record<string, JsonAchievement>;
  };
};
type JsonHideoutResponse = {
  data?: Record<string, JsonHideoutStation>;
};

type JsonTask = {
  id?: string;
  name?: string;
  trader?: string;
  wikiLink?: string;
  minPlayerLevel?: number;
  taskRequirements?: Array<{ task?: string | null } | null> | null;
  objectives?: Record<string, JsonTaskObjective> | JsonTaskObjective[];
  startRewards?: JsonTaskRewards;
  finishRewards?: JsonTaskRewards;
  experience?: number;
  factionName?: string | null;
  kappaRequired?: boolean;
  lightkeeperRequired?: boolean;
  map?: string | null;
};

type JsonTaskObjective = {
  id?: string;
  description?: string;
  count?: number;
  playerLevel?: number;
  maps?: string[];
  items?: string[];
  foundInRaid?: boolean;
};

type JsonTaskRewards = {
  items?: Array<{ item?: string; count?: number }>;
  offerUnlock?: Array<{
    item?: string;
    trader?: string;
    level?: number;
  }>;
  traderStanding?: Array<{
    standing?: number;
    trader?: string;
  }>;
  customization?: Array<{
    id?: string;
    name?: string;
    customizationType?: string;
    customizationTypeName?: string;
    imageLink?: string;
  }>;
  achievement?: Array<{
    id?: string;
    name?: string;
    description?: string;
    imageLink?: string;
  }>;
  skillLevelReward?: Array<{
    name?: string;
    level?: number;
    skill?: { id?: string; name?: string } | string;
  }>;
  traderUnlock?: Array<{
    id?: string;
    name?: string;
    imageLink?: string;
  }>;
  craftUnlock?: Array<{
    id?: string;
    level?: number;
    station?: string | { name?: string; imageLink?: string };
  }>;
};

type JsonAchievement = {
  id?: string;
  imageLink?: string;
  name?: string;
  description?: string;
  hidden?: boolean;
  playersCompletedPercent?: number;
  adjustedPlayersCompletedPercent?: number;
  side?: string;
  rarity?: string;
};

type JsonHideoutStation = {
  id?: string;
  name?: string;
  imageLink?: string;
  levels?: Array<{
    level?: number;
    skillRequirements?: Array<{
      name?: string;
      skill?: string | { name?: string };
      level?: number;
    }>;
    stationLevelRequirements?: Array<{
      station?: string | { name?: string };
      level?: number;
    }>;
    itemRequirements?: Array<{
      count?: number;
      item?: string | { name?: string; iconLink?: string };
      attributes?: Record<string, unknown>;
    }>;
  }>;
};

export interface CombinedCachePayload {
  tasks: TaskData;
  collectorItems: CollectorItemsData;
  achievements: AchievementsData;
  hideoutStations: { data: HideoutStationsData };
}

interface StoredCache {
  updatedAt: number;
  payload: CombinedCachePayload;
}

interface TaskOnlyCache {
  updatedAt: number;
  payload: { tasks: TaskData };
}

interface SharedCacheData {
  updatedAt: number;
  collectorItems: CollectorItemsData;
  achievements: AchievementsData;
  hideoutStations: { data: HideoutStationsData };
}

function canAttemptLocalStorageWrite() {
  return Date.now() >= localStorageQuotaExceededUntil;
}

function noteLocalStorageQuotaError(err: unknown) {
  if (err instanceof Error && err.name === "QuotaExceededError") {
    localStorageQuotaExceededUntil =
      Date.now() + LOCAL_STORAGE_QUOTA_COOLDOWN_MS;
  }
}

function noteLocalStorageWriteSuccess() {
  localStorageQuotaExceededUntil = 0;
}

function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof Error ||
    (typeof err === "object" && err !== null && "name" in err)
  ) && (err as { name?: unknown }).name === "QuotaExceededError";
}

function pruneLocalStorageApiCaches(keyToKeep: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key === keyToKeep) continue;
      if (
        key === API_CACHE_KEY ||
        ((key === SHARED_CACHE_KEY || key.startsWith(`${SHARED_CACHE_KEY}::`)) &&
          keyToKeep.startsWith(SHARED_CACHE_KEY)) ||
        key.startsWith(`${API_CACHE_KEY_PREFIX}::`) ||
        key.startsWith(`${LEGACY_API_CACHE_KEY_PREFIX}::`)
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Cache cleanup is best-effort; IndexedDB remains the durable fallback.
  }
}

function setCacheItemWithQuotaRecovery(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    noteLocalStorageWriteSuccess();
    return true;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn("[Cache] Failed to save cache to localStorage:", err);
      return false;
    }
  }

  pruneLocalStorageApiCaches(key);

  try {
    localStorage.setItem(key, value);
    noteLocalStorageWriteSuccess();
    return true;
  } catch (retryErr) {
    if (isQuotaExceededError(retryErr)) {
      noteLocalStorageQuotaError(retryErr);
      console.warn(
        "[Cache] localStorage quota exceeded; using IndexedDB cache fallback.",
      );
    } else {
      console.warn("[Cache] Failed to save cache to localStorage:", retryErr);
    }
    return false;
  }
}

export function buildCombinedCacheKey(
  gameMode: GameMode,
  language: LanguageCode = DEFAULT_LANGUAGE,
): string {
  return `${API_CACHE_KEY_PREFIX}::${normalizeGameMode(gameMode)}::${normalizeLanguage(language)}`;
}

function buildSharedCacheKey(language: LanguageCode = DEFAULT_LANGUAGE): string {
  return `${SHARED_CACHE_KEY}::${normalizeLanguage(language)}`;
}

function buildLegacyCombinedCacheKey(gameMode: GameMode): string {
  return `${LEGACY_API_CACHE_KEY_PREFIX}::${normalizeGameMode(gameMode)}`;
}

function readSplitCache(
  sharedCacheKey: string,
  taskCacheKey: string,
): CombinedCachePayload | null {
  const sharedCacheRaw = localStorage.getItem(sharedCacheKey);
  const taskCacheRaw = localStorage.getItem(taskCacheKey);

  if (!sharedCacheRaw || !taskCacheRaw) return null;

  try {
    const sharedCache: SharedCacheData = JSON.parse(sharedCacheRaw);
    const taskCache: TaskOnlyCache = JSON.parse(taskCacheRaw);

    if (
      sharedCache?.collectorItems &&
      sharedCache?.achievements &&
      sharedCache?.hideoutStations &&
      taskCache?.payload?.tasks
    ) {
      return {
        tasks: taskCache.payload.tasks,
        collectorItems: sharedCache.collectorItems,
        achievements: sharedCache.achievements,
        hideoutStations: sharedCache.hideoutStations,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isSplitCacheFresh(
  sharedCacheKey: string,
  taskCacheKey: string,
  ttlMs: number,
): boolean {
  const sharedCacheRaw = localStorage.getItem(sharedCacheKey);
  const taskCacheRaw = localStorage.getItem(taskCacheKey);

  if (!sharedCacheRaw || !taskCacheRaw) return false;

  try {
    const sharedCache: SharedCacheData = JSON.parse(sharedCacheRaw);
    const taskCache: TaskOnlyCache = JSON.parse(taskCacheRaw);

    if (sharedCache?.updatedAt && taskCache?.updatedAt) {
      const now = Date.now();
      return (
        now - sharedCache.updatedAt < ttlMs && now - taskCache.updatedAt < ttlMs
      );
    }
  } catch {
    return false;
  }

  return false;
}

function readStoredCache(key: string): StoredCache | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: StoredCache = JSON.parse(raw);
    if (!parsed?.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readCacheUpdatedAt(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { updatedAt?: unknown };
    return typeof parsed?.updatedAt === "number" ? parsed.updatedAt : null;
  } catch {
    return null;
  }
}

function buildCacheDebugInfo(
  format: CombinedCacheDebugInfo["format"],
  keys: string[],
  gameMode: GameMode,
  language: LanguageCode,
  ttlMs: number,
): CombinedCacheDebugInfo | null {
  const updatedAtValues = keys
    .map((key) => readCacheUpdatedAt(key))
    .filter((value): value is number => typeof value === "number");

  if (updatedAtValues.length !== keys.length) return null;

  const now = Date.now();
  const newestUpdatedAt = Math.max(...updatedAtValues);
  const oldestUpdatedAt = Math.min(...updatedAtValues);
  const oldestAgeMs = now - oldestUpdatedAt;

  return {
    available: true,
    fresh: updatedAtValues.every((updatedAt) => now - updatedAt < ttlMs),
    format,
    checkedGameMode: normalizeGameMode(gameMode),
    checkedLanguage: normalizeLanguage(language),
    ttlMs,
    newestUpdatedAt: new Date(newestUpdatedAt).toISOString(),
    oldestUpdatedAt: new Date(oldestUpdatedAt).toISOString(),
    newestAgeMs: now - newestUpdatedAt,
    oldestAgeMs,
    keys,
  };
}

export function getCombinedCacheDebugInfo(
  gameMode: GameMode = DEFAULT_GAME_MODE,
  language: LanguageCode = DEFAULT_LANGUAGE,
  ttlMs: number = API_CACHE_TTL_MS,
): CombinedCacheDebugInfo {
  const normalizedGameMode = normalizeGameMode(gameMode);
  const normalizedLanguage = normalizeLanguage(language);
  const emptyInfo: CombinedCacheDebugInfo = {
    available: false,
    fresh: false,
    format: null,
    checkedGameMode: normalizedGameMode,
    checkedLanguage: normalizedLanguage,
    ttlMs,
    newestUpdatedAt: null,
    oldestUpdatedAt: null,
    newestAgeMs: null,
    oldestAgeMs: null,
    keys: [],
  };

  const splitInfo = buildCacheDebugInfo(
    "split",
    [
      buildSharedCacheKey(normalizedLanguage),
      buildCombinedCacheKey(normalizedGameMode, normalizedLanguage),
    ],
    normalizedGameMode,
    normalizedLanguage,
    ttlMs,
  );
  if (splitInfo) return splitInfo;

  if (normalizedLanguage !== DEFAULT_LANGUAGE) return emptyInfo;

  const legacySplitInfo = buildCacheDebugInfo(
    "legacy-split",
    [SHARED_CACHE_KEY, buildLegacyCombinedCacheKey(normalizedGameMode)],
    normalizedGameMode,
    normalizedLanguage,
    ttlMs,
  );
  if (legacySplitInfo) return legacySplitInfo;

  const legacyModeInfo = buildCacheDebugInfo(
    "legacy-mode",
    [buildLegacyCombinedCacheKey(normalizedGameMode)],
    normalizedGameMode,
    normalizedLanguage,
    ttlMs,
  );
  if (legacyModeInfo) return legacyModeInfo;

  if (normalizedGameMode !== DEFAULT_GAME_MODE) return emptyInfo;

  const legacyDefaultInfo = buildCacheDebugInfo(
    "legacy-default",
    [API_CACHE_KEY],
    normalizedGameMode,
    normalizedLanguage,
    ttlMs,
  );

  return legacyDefaultInfo ?? emptyInfo;
}

function isCombinedCachePayload(payload: unknown): payload is CombinedCachePayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<CombinedCachePayload>;
  return (
    Array.isArray(candidate.tasks?.data?.tasks) &&
    Array.isArray(candidate.collectorItems?.data?.task?.objectives) &&
    Array.isArray(candidate.achievements?.data?.achievements) &&
    Array.isArray(candidate.hideoutStations?.data?.hideoutStations)
  );
}

export function loadCombinedCache(
  gameMode: GameMode = DEFAULT_GAME_MODE,
  language: LanguageCode = DEFAULT_LANGUAGE,
): CombinedCachePayload | null {
  const normalizedGameMode = normalizeGameMode(gameMode);
  const normalizedLanguage = normalizeLanguage(language);

  // Try to load from new split cache format (shared + tasks in localStorage)
  const sharedCacheKey = buildSharedCacheKey(normalizedLanguage);
  const taskCacheKey = buildCombinedCacheKey(
    normalizedGameMode,
    normalizedLanguage,
  );
  const splitCache = readSplitCache(sharedCacheKey, taskCacheKey);
  if (splitCache) return splitCache;

  // Fallback to legacy cache for compatibility
  if (normalizedLanguage === DEFAULT_LANGUAGE) {
    const legacySplitCache = readSplitCache(
      SHARED_CACHE_KEY,
      buildLegacyCombinedCacheKey(normalizedGameMode),
    );
    if (legacySplitCache) return legacySplitCache;

    const modeCache = readStoredCache(
      buildLegacyCombinedCacheKey(normalizedGameMode),
    );
    if (modeCache && isCombinedCachePayload(modeCache.payload)) {
      return modeCache.payload;
    }

    if (normalizedGameMode === DEFAULT_GAME_MODE) {
      const legacyCache = readStoredCache(API_CACHE_KEY);
      return legacyCache && isCombinedCachePayload(legacyCache.payload)
        ? legacyCache.payload
        : null;
    }
  }

  return null;
}

export function isCombinedCacheFresh(
  gameMode: GameMode = DEFAULT_GAME_MODE,
  language: LanguageCode = DEFAULT_LANGUAGE,
  ttlMs: number = API_CACHE_TTL_MS,
): boolean {
  const normalizedGameMode = normalizeGameMode(gameMode);
  const normalizedLanguage = normalizeLanguage(language);

  // Check new split cache format
  const splitCacheFresh = isSplitCacheFresh(
    buildSharedCacheKey(normalizedLanguage),
    buildCombinedCacheKey(normalizedGameMode, normalizedLanguage),
    ttlMs,
  );
  if (splitCacheFresh) return true;

  // Fallback to legacy cache
  if (normalizedLanguage === DEFAULT_LANGUAGE) {
    const legacySplitCacheFresh = isSplitCacheFresh(
      SHARED_CACHE_KEY,
      buildLegacyCombinedCacheKey(normalizedGameMode),
      ttlMs,
    );
    if (legacySplitCacheFresh) return true;

    const modeCache = readStoredCache(
      buildLegacyCombinedCacheKey(normalizedGameMode),
    );
    if (modeCache?.updatedAt) {
      return Date.now() - modeCache.updatedAt < ttlMs;
    }

    if (normalizedGameMode === DEFAULT_GAME_MODE) {
      const legacyCache = readStoredCache(API_CACHE_KEY);
      if (legacyCache?.updatedAt) {
        return Date.now() - legacyCache.updatedAt < ttlMs;
      }
    }
  }

  return false;
}

export async function saveCombinedCache(
  payload: CombinedCachePayload,
  gameMode: GameMode = DEFAULT_GAME_MODE,
  language: LanguageCode = DEFAULT_LANGUAGE,
): Promise<void> {
  const normalizedGameMode = normalizeGameMode(gameMode);
  const normalizedLanguage = normalizeLanguage(language);
  const now = Date.now();

  // Save shared data to localStorage (smaller, shared across modes)
  if (canAttemptLocalStorageWrite()) {
    const sharedData: SharedCacheData = {
      updatedAt: now,
      collectorItems: payload.collectorItems,
      achievements: payload.achievements,
      hideoutStations: payload.hideoutStations,
    };
    setCacheItemWithQuotaRecovery(
      buildSharedCacheKey(normalizedLanguage),
      JSON.stringify(sharedData),
    );
  }

  // Save task data to localStorage (mode-specific, smaller now)
  if (canAttemptLocalStorageWrite()) {
    const taskData: TaskOnlyCache = {
      updatedAt: now,
      payload: { tasks: payload.tasks },
    };
    setCacheItemWithQuotaRecovery(
      buildCombinedCacheKey(normalizedGameMode, normalizedLanguage),
      JSON.stringify(taskData),
    );
  }

  // Also save tasks to IndexedDB as backup (async, no quota issues)
  try {
    await taskStorage.saveTaskCache(
      normalizedGameMode,
      payload.tasks.data.tasks,
      normalizedLanguage,
    );
  } catch (err) {
    console.warn(
      "[Cache] Failed to save task cache to IndexedDB (non-critical):",
      err,
    );
  }
}

const buildTarkovJsonUrl = (
  gameMode: GameMode,
  endpoint: string,
  language?: LanguageCode,
): string => {
  const suffix = language ? `_${normalizeLanguage(language)}` : "";
  return `${TARKOV_JSON_API_BASE_URL}/${normalizeGameMode(gameMode)}/${endpoint}${suffix}`;
};

async function fetchJsonEndpoint<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new TypeError("Tarkov JSON API request failed", { cause: err });
  }

  if (!response.ok) {
    await throwTarkovHttpError(response);
  }

  return response.json() as Promise<T>;
}

const translate = (
  translations: JsonTranslationMap,
  key: string | null | undefined,
  fallback = "",
): string => {
  if (!key) return fallback;
  return translations[key] ?? key;
};

const translateIdName = (
  translations: JsonTranslationMap,
  id: string | null | undefined,
  fallback = "",
): string => {
  if (!id) return fallback;
  return translations[`${id} Name`] ?? translations[`${id} name`] ?? id;
};

const translateTraderName = (
  translations: JsonTranslationMap,
  id: string | null | undefined,
): string => {
  if (!id) return "Prapor";
  return (
    translations[`${id} Nickname`] ??
    translations[`${id} Name`] ??
    translations[id] ??
    id
  );
};

const normalizeJsonValueArray = <T>(
  value: Record<string, T> | T[] | null | undefined,
): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
};

const buildJsonItem = (
  itemId: string | null | undefined,
  itemTranslations: JsonTranslationMap,
): { id?: string; name: string; iconLink?: string } | null => {
  if (!itemId) return null;
  return {
    id: itemId,
    name: translateIdName(itemTranslations, itemId),
    iconLink: buildIconLink(itemId),
  };
};

const normalizeJsonRewardItems = (
  rewards: JsonTaskRewards | undefined,
  itemTranslations: JsonTranslationMap,
): RewardItem[] =>
  (rewards?.items ?? []).flatMap((reward) => {
    const item = buildJsonItem(reward.item, itemTranslations);
    return item ? [{ item, count: reward.count ?? 1 }] : [];
  });

const normalizeJsonRewards = (
  rewards: JsonTaskRewards | undefined,
  translations: {
    tasks: JsonTranslationMap;
    items: JsonTranslationMap;
    traders: JsonTranslationMap;
    hideout: JsonTranslationMap;
  },
): Task["finishRewards"] | undefined => {
  if (!rewards) return undefined;

  const items = normalizeJsonRewardItems(rewards, translations.items);
  const offerUnlock = (rewards.offerUnlock ?? []).flatMap((unlock) => {
    const item = buildJsonItem(unlock.item, translations.items);
    if (!item || !unlock.trader) return [];
    return [
      {
        item,
        trader: {
          id: unlock.trader,
          name: translateTraderName(translations.traders, unlock.trader),
        },
        level: unlock.level ?? 1,
      },
    ];
  });
  const traderStanding = (rewards.traderStanding ?? []).map((reward) => ({
    standing: reward.standing,
    trader: reward.trader
      ? {
          id: reward.trader,
          name: toTraderName(translateTraderName(translations.traders, reward.trader)),
        }
      : undefined,
  }));
  const customization = (rewards.customization ?? []).flatMap((reward) => {
    const id = reward.id;
    const name = translate(translations.tasks, reward.name, id ?? "");
    return name
      ? [
          {
            id,
            name,
            customizationType: reward.customizationType,
            customizationTypeName: translate(
              translations.tasks,
              reward.customizationTypeName,
              reward.customizationTypeName ?? "",
            ),
            imageLink: reward.imageLink,
          },
        ]
      : [];
  });
  const achievement = (rewards.achievement ?? []).flatMap((reward) => {
    const id = reward.id;
    const name = translate(translations.tasks, reward.name, id ?? "");
    return name
      ? [
          {
            id,
            name,
            description: translate(
              translations.tasks,
              reward.description,
              reward.description ?? "",
            ),
            imageLink: reward.imageLink,
          },
        ]
      : [];
  });
  const skillLevelReward = (rewards.skillLevelReward ?? []).map((reward) => {
    const skill =
      typeof reward.skill === "string"
        ? { id: reward.skill, name: translate(translations.tasks, reward.skill, reward.skill) }
        : reward.skill;
    return {
      name: translate(translations.tasks, reward.name, reward.name ?? ""),
      level: reward.level,
      skill,
    };
  });
  const traderUnlock = (rewards.traderUnlock ?? []).flatMap((reward) => {
    const id = reward.id;
    const name = reward.name
      ? translate(translations.tasks, reward.name, reward.name)
      : translateTraderName(translations.traders, id);
    return name ? [{ id, name, imageLink: reward.imageLink }] : [];
  });
  const craftUnlock = (rewards.craftUnlock ?? []).map((reward) => {
    const station =
      typeof reward.station === "string"
        ? {
            name: translateIdName(translations.hideout, reward.station),
          }
        : reward.station;
    return {
      id: reward.id,
      level: reward.level,
      station,
    };
  });

  return {
    ...(items.length > 0 ? { items } : {}),
    ...(offerUnlock.length > 0 ? { offerUnlock } : {}),
    ...(traderStanding.length > 0 ? { traderStanding } : {}),
    ...(customization.length > 0 ? { customization } : {}),
    ...(achievement.length > 0 ? { achievement } : {}),
    ...(skillLevelReward.length > 0 ? { skillLevelReward } : {}),
    ...(traderUnlock.length > 0 ? { traderUnlock } : {}),
    ...(craftUnlock.length > 0 ? { craftUnlock } : {}),
  };
};

const normalizeJsonTasks = (
  tasksById: Record<string, JsonTask>,
  translations: {
    tasks: JsonTranslationMap;
    items: JsonTranslationMap;
    traders: JsonTranslationMap;
    maps: JsonTranslationMap;
    hideout: JsonTranslationMap;
  },
): Task[] => {
  const getTaskName = (taskId?: string | null) => {
    if (!taskId) return "";
    const task = tasksById[taskId];
    return translate(translations.tasks, task?.name, translateIdName(translations.tasks, taskId));
  };

  return Object.values(tasksById).flatMap((rawTask): Task[] => {
    if (!rawTask?.id) return [];

    const objectives = normalizeJsonValueArray(rawTask.objectives).map(
      (objective): TaskObjective => ({
        id: objective.id,
        description: translate(
          translations.tasks,
          objective.description,
          objective.description ?? "",
        ),
        count: objective.count,
        playerLevel: objective.playerLevel,
        foundInRaid: objective.foundInRaid,
        maps: (objective.maps ?? []).map((mapId) => ({
          name: translateIdName(translations.maps, mapId),
        })),
        items: (objective.items ?? [])
          .map((itemId) => buildJsonItem(itemId, translations.items))
          .filter((item): item is NonNullable<typeof item> => item !== null),
      }),
    );
    const map = rawTask.map
      ? { name: translateIdName(translations.maps, rawTask.map) }
      : null;
    const maps = Array.from(
      new Set([
        ...(map?.name ? [map.name] : []),
        ...objectives.flatMap(
          (objective) => objective.maps?.map((entry) => entry.name) ?? [],
        ),
      ]),
    ).map((name) => ({ name }));

    return [
      {
        id: rawTask.id,
        name: translate(translations.tasks, rawTask.name, rawTask.id),
        wikiLink: rawTask.wikiLink ?? "",
        experience: rawTask.experience,
        minPlayerLevel: rawTask.minPlayerLevel ?? 1,
        factionName: rawTask.factionName ?? null,
        taskRequirements: (rawTask.taskRequirements ?? []).flatMap((req) => {
          const taskId = req?.task;
          return taskId
            ? [{ task: { id: taskId, name: getTaskName(taskId) } }]
            : [];
        }),
        map,
        maps,
        trader: {
          name: toTraderName(translateTraderName(translations.traders, rawTask.trader)),
        },
        kappaRequired: rawTask.kappaRequired,
        lightkeeperRequired: rawTask.lightkeeperRequired ?? false,
        startRewards: (() => {
          const items = normalizeJsonRewardItems(
            rawTask.startRewards,
            translations.items,
          );
          return items.length > 0 ? { items } : undefined;
        })(),
        finishRewards: normalizeJsonRewards(rawTask.finishRewards, translations),
        objectives: objectives.length > 0 ? objectives : undefined,
      },
    ];
  });
};

const normalizeJsonCollectorItems = (
  collectorTask: JsonTask | undefined,
  itemTranslations: JsonTranslationMap,
): CollectorItemsData["data"]["task"] => ({
  id: COLLECTOR_TASK_ID,
  objectives: normalizeJsonValueArray(collectorTask?.objectives).flatMap(
    (objective) => {
      const items = (objective.items ?? [])
        .map((itemId) => buildJsonItem(itemId, itemTranslations))
        .filter((item): item is NonNullable<typeof item> => item !== null);
      return items.length > 0 ? [{ items }] : [];
    },
  ),
});

const normalizeJsonAchievements = (
  achievementsById: Record<string, JsonAchievement> | undefined,
  taskTranslations: JsonTranslationMap,
): AchievementsData["data"]["achievements"] =>
  Object.values(achievementsById ?? {}).flatMap((achievement) => {
    if (!achievement.id) return [];
    return [
      {
        id: achievement.id,
        imageLink: achievement.imageLink ?? buildIconLink(`achievement-${achievement.id}`),
        name: translate(taskTranslations, achievement.name, achievement.id),
        description: translate(
          taskTranslations,
          achievement.description,
          achievement.description ?? "",
        ),
        hidden: achievement.hidden ?? false,
        playersCompletedPercent: achievement.playersCompletedPercent ?? 0,
        adjustedPlayersCompletedPercent:
          achievement.adjustedPlayersCompletedPercent ?? 0,
        side: translate(taskTranslations, achievement.side, achievement.side ?? ""),
        rarity: translate(
          taskTranslations,
          achievement.rarity,
          achievement.rarity ?? "",
        ),
      },
    ];
  });

const normalizeJsonHideoutStations = (
  stationsById: Record<string, JsonHideoutStation>,
  hideoutTranslations: JsonTranslationMap,
  itemTranslations: JsonTranslationMap,
): HideoutStationsData["hideoutStations"] =>
  Object.values(stationsById).map((station) => ({
    name: translate(hideoutTranslations, station.name, station.id ?? ""),
    imageLink: station.imageLink,
    levels: (station.levels ?? []).map((level) => ({
      level: level.level ?? 1,
      skillRequirements: (level.skillRequirements ?? []).map((requirement) => ({
        name: translate(
          hideoutTranslations,
          requirement.name,
          requirement.name ?? "",
        ),
        skill: {
          name:
            typeof requirement.skill === "string"
              ? translate(
                  hideoutTranslations,
                  requirement.skill,
                  requirement.skill,
                )
              : translate(
                  hideoutTranslations,
                  requirement.skill?.name,
                  requirement.skill?.name ?? "",
                ),
        },
        level: requirement.level ?? 1,
      })),
      stationLevelRequirements: (level.stationLevelRequirements ?? []).map(
        (requirement) => ({
          station: {
            name:
              typeof requirement.station === "string"
                ? translateIdName(hideoutTranslations, requirement.station)
                : translate(
                    hideoutTranslations,
                    requirement.station?.name,
                    requirement.station?.name ?? "",
                  ),
          },
          level: requirement.level ?? 1,
        }),
      ),
      itemRequirements: (level.itemRequirements ?? []).flatMap((requirement) => {
        const item =
          typeof requirement.item === "string"
            ? buildJsonItem(requirement.item, itemTranslations)
            : requirement.item
              ? {
                  name: translate(
                    itemTranslations,
                    requirement.item.name,
                    requirement.item.name ?? "",
                  ),
                  iconLink: requirement.item.iconLink,
                }
              : null;
        return item
          ? [
              {
                count: requirement.count ?? 1,
                item,
                attributes: Object.entries(requirement.attributes ?? {}).map(
                  ([name, value]) => ({
                    type: typeof value,
                    name,
                    value: String(value),
                  }),
                ),
              },
            ]
          : [];
      }),
    })),
  }));

async function fetchCombinedJsonApiData(
  gameMode: GameMode,
  language: LanguageCode,
): Promise<CombinedApiData["data"]> {
  const tasksPayload = await fetchJsonEndpoint<JsonTasksResponse>(
    buildTarkovJsonUrl(gameMode, "tasks"),
  );
  const tasksById = tasksPayload.data?.tasks;
  if (!tasksById || Array.isArray(tasksById)) {
    throw new Error("Tarkov JSON API response did not include keyed tasks.");
  }

  const [
    taskTranslationsPayload,
    hideoutPayload,
    hideoutTranslationsPayload,
    itemTranslationsPayload,
    traderTranslationsPayload,
    mapTranslationsPayload,
  ] = await Promise.all([
    fetchJsonEndpoint<{ data?: JsonTranslationMap }>(
      buildTarkovJsonUrl(gameMode, "tasks", language),
    ),
    fetchJsonEndpoint<JsonHideoutResponse>(buildTarkovJsonUrl(gameMode, "hideout")),
    fetchJsonEndpoint<{ data?: JsonTranslationMap }>(
      buildTarkovJsonUrl(gameMode, "hideout", language),
    ),
    fetchJsonEndpoint<{ data?: JsonTranslationMap }>(
      buildTarkovJsonUrl(gameMode, "items", language),
    ),
    fetchJsonEndpoint<{ data?: JsonTranslationMap }>(
      buildTarkovJsonUrl(gameMode, "traders", language),
    ),
    fetchJsonEndpoint<{ data?: JsonTranslationMap }>(
      buildTarkovJsonUrl(gameMode, "maps", language),
    ),
  ]);

  const taskTranslations = taskTranslationsPayload.data ?? {};
  const hideoutTranslations = hideoutTranslationsPayload.data ?? {};
  const itemTranslations = itemTranslationsPayload.data ?? {};
  const traderTranslations = traderTranslationsPayload.data ?? {};
  const mapTranslations = mapTranslationsPayload.data ?? {};

  const tasks = normalizeJsonTasks(tasksById, {
    tasks: taskTranslations,
    items: itemTranslations,
    traders: traderTranslations,
    maps: mapTranslations,
    hideout: hideoutTranslations,
  });

  return {
    tasks,
    task: normalizeJsonCollectorItems(tasksById[COLLECTOR_TASK_ID], itemTranslations),
    achievements: normalizeJsonAchievements(
      tasksPayload.data?.achievements,
      taskTranslations,
    ),
    hideoutStations: normalizeJsonHideoutStations(
      hideoutPayload.data ?? {},
      hideoutTranslations,
      itemTranslations,
    ),
  };
}

async function fetchTarkovApi(init: RequestInit): Promise<Response> {
  try {
    return await fetch(getTarkovApiUrl(), init);
  } catch (err) {
    throw new TypeError("Tarkov API request failed", { cause: err });
  }
}

async function throwTarkovHttpError(response: Response): Promise<never> {
  let bodyPreview: string | null = null;

  try {
    const body = await response.text();
    const trimmed = body.trim();
    bodyPreview = trimmed
      ? trimmed.length > 1000
        ? `${trimmed.slice(0, 1000)}...`
        : trimmed
      : null;
  } catch {
    bodyPreview = null;
  }

  const contentType = response.headers?.get?.("Content-Type");
  const detailParts = [
    `status: ${response.status}`,
    response.statusText ? `statusText: ${response.statusText}` : null,
    contentType ? `contentType: ${contentType}` : null,
    bodyPreview ? `body: ${bodyPreview}` : null,
  ].filter(Boolean);

  throw new Error(`HTTP error! ${detailParts.join("; ")}`);
}

export async function fetchAchievements(): Promise<AchievementsData> {
  const response = await fetchTarkovApi({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ACHIEVEMENTS_QUERY }),
  });
  if (!response.ok) await throwTarkovHttpError(response);
  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL error: ${formatGraphQLErrors(result.errors)}`);
  }
  return { data: { achievements: result.data.achievements ?? [] } };
}

const HIDEOUT_STATIONS_QUERY = `
  query HideoutStationsRequirements {
    hideoutStations {
      name
      imageLink
      levels {
        level
        skillRequirements {
          name
          skill {
            name
          }
          level
        }
        stationLevelRequirements {
          station {
            name
          }
          level
        }
        itemRequirements {
          count
          item {
            name
            iconLink
          }
          attributes {
            type
            name
            value
          }
        }
      }
    }
  }`;

const ACHIEVEMENTS_QUERY = `
  query AchievementsQuery {
    achievements {
      id
      imageLink
      name
      description
      hidden
      playersCompletedPercent
      adjustedPlayersCompletedPercent
      side
      rarity
    }
  }
`;

const buildCombinedQuery = (gameMode: GameMode, language: LanguageCode) => `
{
  tasks(lang: ${language}, gameMode: ${gameMode}) {
    id
    minPlayerLevel
    factionName
    kappaRequired
    lightkeeperRequired
    map { name }
    taskRequirements { task { id name } }
    trader { name imageLink }
    wikiLink
    name
    experience
    startRewards { items { item { name iconLink } count } }
    finishRewards {
      traderStanding {
        standing
        trader { id name imageLink }
      }
      skillLevelReward {
        name
        level
        skill { id name }
      }
      traderUnlock {
        id
        name
        imageLink
      }
      craftUnlock {
        id
        level
        station { name imageLink }
      }
      achievement {
        id
        name
        description
        imageLink
      }
      customization {
        id
        name
        customizationType
        customizationTypeName
        imageLink
      }
      offerUnlock {
        item { name iconLink }
        trader { name imageLink }
        level
      }
      items { item { name iconLink } count }
    }
      objectives {
        maps { name }
        id
        description
        ... on TaskObjectiveItem { items { id name iconLink } count foundInRaid }
      ... on TaskObjectiveShoot { count }
      ... on TaskObjectivePlayerLevel { playerLevel }
    }
  }
  task(id: "5c51aac186f77432ea65c552", lang: ${language}) {
    id
    objectives { ... on TaskObjectiveItem { items { id name iconLink } } }
  }
  achievements {
    id
    imageLink
    name
    description
    hidden
    playersCompletedPercent
    adjustedPlayersCompletedPercent
    side
    rarity
  }
  hideoutStations {
    name
    imageLink
    levels {
      level
      skillRequirements { name skill { name } level }
      stationLevelRequirements { station { name } level }
      itemRequirements { count item { name iconLink } attributes { type name value } }
    }
  }
}
`;

export type FetchStage =
  | "request"
  | "parse"
  | "overlay-fetch"
  | "overlay-apply"
  | "normalize"
  | "done";

export async function fetchCombinedData(
  gameMode: GameMode = DEFAULT_GAME_MODE,
  language: LanguageCode = DEFAULT_LANGUAGE,
  onStage?: (stage: FetchStage) => void,
): Promise<{
  tasks: TaskData;
  collectorItems: CollectorItemsData;
  achievements: AchievementsData;
  hideoutStations: { data: HideoutStationsData };
  overlay: Overlay;
}> {
  const normalizedGameMode = normalizeGameMode(gameMode);
  const normalizedLanguage = normalizeLanguage(language);

  try {
    onStage?.("request");
    const jsonData = await fetchCombinedJsonApiData(
      normalizedGameMode,
      normalizedLanguage,
    );
    onStage?.("parse");
    return await finalizeCombinedData(
      jsonData,
      normalizedGameMode,
      normalizedLanguage,
      onStage,
    );
  } catch (err) {
    console.warn(
      "[Tarkov API] JSON data fetch failed; falling back to GraphQL.",
      err,
    );
  }

  return fetchCombinedGraphqlData(
    normalizedGameMode,
    normalizedLanguage,
    onStage,
  );
}

async function fetchCombinedGraphqlData(
  normalizedGameMode: GameMode,
  normalizedLanguage: LanguageCode,
  onStage?: (stage: FetchStage) => void,
): Promise<CombinedCachePayload & { overlay: Overlay }> {
  onStage?.("request");
  const response = await fetchTarkovApi({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: buildCombinedQuery(normalizedGameMode, normalizedLanguage),
    }),
  });

  if (!response.ok) {
    await throwTarkovHttpError(response);
  }

  onStage?.("parse");
  const result: CombinedApiData = await response.json();

  if (result.errors) {
    if (!hasUsableCombinedTaskData(result)) {
      throw new Error(`GraphQL error: ${formatGraphQLErrors(result.errors)}`);
    }

    console.warn(
      "[Tarkov API] GraphQL returned partial data; continuing with available task payload.",
      result.errors,
    );
  }

  return finalizeCombinedData(
    result.data,
    normalizedGameMode,
    normalizedLanguage,
    onStage,
  );
}

async function finalizeCombinedData(
  data: CombinedApiData["data"],
  normalizedGameMode: GameMode,
  normalizedLanguage: LanguageCode,
  onStage?: (stage: FetchStage) => void,
): Promise<CombinedCachePayload & { overlay: Overlay }> {
  // Aggregated maps from objectives into task.maps array
  // Apply task requirement overrides before processing
  const tasksWithOverrides = applyTaskRequirementOverrides(data.tasks);

  // Apply Overlay (Remote with Local Fallback)
  onStage?.("overlay-fetch");
  const overlay = await fetchOverlay();
  onStage?.("overlay-apply");
  const tasksWithOverlay = tasksWithOverrides
    .map((task) => applyTaskOverlay(task, overlay))
    .filter((task): task is Task => task !== null);

  onStage?.("normalize");
  const tasksWithMaps = tasksWithOverlay.map((task) => {
    const mapsSet = new Set<string>();

    // Collect unique map names from all objectives
    task.objectives?.forEach((objective) => {
      objective.maps?.forEach((map) => {
        const name = getMapName(map);
        if (name) mapsSet.add(name);
      });
    });

    // Convert Set to array of map objects
    const maps = Array.from(mapsSet).map((name) => ({ name }));

    return normalizeBuildingFoundationsObjectives(sanitizeTaskRewardData({
      ...task,
      wikiLink: task.wikiLink ?? "",
      maps,
    }));
  });

  const tasks: TaskData = {
    data: {
      tasks: tasksWithMaps,
    },
  };

  const collectorItems: CollectorItemsData = {
    data: {
      task: data.task
        ? normalizeCollectorItems(
            applyTaskOverlay(
              data.task,
              overlay,
            ) as CollectorItemsData["data"]["task"],
          )
        : {
            id: COLLECTOR_TASK_ID,
            objectives: [],
          },
    },
  };

  const achievements: AchievementsData = {
    data: {
      achievements: data.achievements ?? [],
    },
  };

  const hideoutStations: { data: HideoutStationsData } = {
    data: {
      hideoutStations: data.hideoutStations || [],
    },
  };

  const combined = { tasks, collectorItems, achievements, hideoutStations };
  // Save fresh data to cache for next startup
  await saveCombinedCache(combined, normalizedGameMode, normalizedLanguage);
  onStage?.("done");
  return { ...combined, overlay };
}

export async function fetchHideoutStations(): Promise<{
  data: HideoutStationsData;
}> {
  const response = await fetchTarkovApi({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: HIDEOUT_STATIONS_QUERY,
    }),
  });

  if (!response.ok) {
    await throwTarkovHttpError(response);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${formatGraphQLErrors(result.errors)}`);
  }

  return {
    data: {
      hideoutStations: result.data.hideoutStations || [],
    },
  };
}
