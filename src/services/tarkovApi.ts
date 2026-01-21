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
  TaskAddRewardItem
} from '../types';
import { TraderName } from '../data/traders';
const TARKOV_API_URL = 'https://api.tarkov.dev/graphql';
export const OVERLAY_URL = 'https://cdn.jsdelivr.net/gh/tarkovtracker-org/tarkov-data-overlay@main/dist/overlay.json';

type TaskOverlayTarget = Task | CollectorItemsData['data']['task'];
type TaskRequirement = Task['taskRequirements'][number];
type RewardContainer = { items?: Array<{ item?: { id?: string } }> } & Record<string, unknown>;
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
  taskRequirements?: Task['taskRequirements'];
  startRewards?: Task['startRewards'];
  finishRewards?: Task['finishRewards'];
  objectives?: Record<string, ObjectiveOverride>;
  objectivesAdd?: ObjectiveAdd[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRewardContainer = (value: unknown): value is RewardContainer =>
  isRecord(value);

const buildIconLink = (id?: string) =>
  id ? `https://assets.tarkov.dev/${id}-icon.webp` : "";

const toTraderName = (name?: string): TraderName =>
  (name as TraderName) ?? "Prapor";

const normalizeObjectiveItems = (objective: TaskAddObjective): ObjectiveItem[] => {
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

export function applyTaskOverlay<T extends TaskOverlayTarget>(baseTask: T, overlay: Overlay): T | null {
  const taskOverride = overlay.tasks?.[baseTask.id] as TaskOverrideWithExtras | undefined;
  if (!taskOverride) return baseTask;

  if (taskOverride.disabled === true) return null;

  const result = { ...baseTask } as T & Record<string, unknown>;
  const withIconLink = (item: ObjectiveItem): ObjectiveItem => {
    if (!item || item.iconLink || !item.id) return item;
    return { ...item, iconLink: buildIconLink(item.id) };
  };

  // Fields that need special merge handling (arrays that should append, not replace)
  const arrayMergeFields = ['taskRequirements'];
  const nestedArrayMergeFields = ['finishRewards', 'startRewards']; // These have .items arrays

  // Apply top-level fields
  for (const [key, value] of Object.entries(taskOverride)) {
    if (key === 'objectives' || key === 'objectivesAdd') continue; // Handle separately

    // Smart merge for taskRequirements (append new ones)
    if (arrayMergeFields.includes(key) && Array.isArray(value)) {
      const existingValue = result[key];
      const existing = Array.isArray(existingValue) ? (existingValue as TaskRequirement[]) : [];
      const existingIds = new Set(existing.map((r) => r.task?.id));
      const newItems = (value as TaskRequirement[]).filter(
        (item) => !existingIds.has(item.task?.id)
      );
      result[key] = [...existing, ...newItems];
      continue;
    }

    // Smart merge for finishRewards/startRewards (append new items)
    if (nestedArrayMergeFields.includes(key) && typeof value === 'object' && value !== null) {
      const existingRewards = isRewardContainer(result[key]) ? result[key] : {};
      const newRewards = isRewardContainer(value) ? value : {};
      const existingItems = Array.isArray(existingRewards.items)
        ? existingRewards.items
        : [];
      const newItems = Array.isArray(newRewards.items)
        ? newRewards.items.filter(
          (i) => !new Set(existingItems.map((e) => e.item?.id)).has(i.item?.id)
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
  if (taskOverride.objectives && typeof taskOverride.objectives === 'object') {
    result.objectives = (baseTask.objectives || []).map((obj): TaskObjective => {
      const objWithId = obj as ObjectiveWithId;
      const patch = objWithId.id ? taskOverride.objectives?.[objWithId.id] : undefined;
      return patch ? { ...obj, ...patch } : obj;
    });
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
    result.objectives = [
      ...(result.objectives || []),
      ...expanded,
    ] as TaskObjective[];
  }

  if (result.objectives) {
    result.objectives = (result.objectives as TaskObjective[]).map((objective) => ({
      ...objective,
      items: objective.items?.map(withIconLink),
    }));
  }

  return result;
}

// Prefixes that indicate a task is a seasonal/temporary event
const EVENT_TASK_PREFIXES = [
  'winter_',
  'halloween_',
  'event_',
  'newyear_',
  'christmas_',
  'easter_',
  'summer_',
  'spring_',
  'autumn_',
  'fall_',
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
        description: objective.description,
        maps: objective.maps?.map((map) => ({ name: map.name })),
        items: items.length > 0 ? items : undefined,
        count: objective.count,
      } satisfies TaskObjective;
    });

    const mapNames = new Set<string>();
    task.maps?.forEach((map) => mapNames.add(map.name));
    task.objectives?.forEach((objective) => {
      objective.maps?.forEach((map) => mapNames.add(map.name));
    });

    const rewardItems = (task.finishRewards?.items || [])
      .filter((reward): reward is TaskAddRewardItem => !!reward?.item?.name)
      .map((reward) => ({
        count: reward.count,
        item: {
          name: reward.item.name,
          iconLink: buildIconLink(reward.item.id),
        },
      }));

    return {
      id: task.id,
      name: task.name,
      wikiLink: task.wikiLink ?? "",
      minPlayerLevel: 1,
      factionName: null,
      taskRequirements: task.taskRequirements ?? [],
      map: null,
      maps: Array.from(mapNames).map((name) => ({ name })),
      trader: {
        name: toTraderName(task.trader?.name),
      },
      kappaRequired: task.kappaRequired,
      lightkeeperRequired: false,
      objectives: objectiveList.length > 0 ? objectiveList : undefined,
      finishRewards: rewardItems.length > 0 ? { items: rewardItems } : undefined,
      isEvent: isEventTask(task.id),
    };
  });
}


export async function fetchOverlay(): Promise<Overlay> {
  try {
    const response = await fetch(OVERLAY_URL);
    if (!response.ok) throw new Error(`Overlay fetch failed: ${response.status}`);
    const data = await response.json();
    console.log(`[Overlay] Successfully fetched latest from: ${OVERLAY_URL}`);
    return data;
  } catch (err) {
    console.error('Failed to fetch remote overlay:', err);
    // Return a minimal empty overlay to prevent the app from breaking
    return { tasks: {}, $meta: { version: '0.0.0-empty', generated: new Date().toISOString() } };
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
  '5c0bd94186f7747a727f09b2': ['5c0d190cd09282029f5390d8'], // Grenadier
  // Huntsman Path - Justice: Remove incorrect Trophy dependency (both should depend on Secured Perimeter)
  '5d25e43786f7740a212217fa': ['5d25e2c386f77443e7549029'], // Huntsman Path - Trophy
};

function applyTaskRequirementOverrides<T extends { id: string; taskRequirements: { task: { id: string; name: string } }[] }>(tasks: T[]): T[] {
  if (!ENABLE_TASK_REQUIREMENT_OVERRIDES) return tasks;

  return tasks.map(task => {
    const overrides = TASK_REQUIREMENT_OVERRIDES[task.id];
    if (!overrides || overrides.length === 0) return task;

    return {
      ...task,
      taskRequirements: task.taskRequirements.filter(
        req => !overrides.includes(req.task.id)
      ),
    };
  });
}

interface CombinedApiData {
  data: {
    tasks: TaskData['data']['tasks'];
    task: CollectorItemsData['data']['task'];
    achievements: AchievementsData['data']['achievements'];
    hideoutStations: HideoutStationsData['hideoutStations'];
  };
  errors?: { message: string }[];
}

// Simple localStorage cache for combined API payload
export const API_CACHE_KEY = 'taskTracker_api_cache_v2';
export const API_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

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

export function loadCombinedCache(): CombinedCachePayload | null {
  try {
    const raw = localStorage.getItem(API_CACHE_KEY);
    if (!raw) return null;
    const parsed: StoredCache = JSON.parse(raw);
    if (!parsed?.payload) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export function isCombinedCacheFresh(ttlMs: number = API_CACHE_TTL_MS): boolean {
  try {
    const raw = localStorage.getItem(API_CACHE_KEY);
    if (!raw) return false;
    const parsed: StoredCache = JSON.parse(raw);
    if (!parsed?.updatedAt) return false;
    return Date.now() - parsed.updatedAt < ttlMs;
  } catch {
    return false;
  }
}

export function saveCombinedCache(payload: CombinedCachePayload): void {
  try {
    const toStore: StoredCache = { updatedAt: Date.now(), payload };
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore quota/storage errors
  }
}

export async function fetchAchievements(): Promise<AchievementsData> {
  const response = await fetch(TARKOV_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: ACHIEVEMENTS_QUERY }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
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

const COMBINED_QUERY = `
{
  tasks(lang: en) {
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
    startRewards { items { item { name iconLink } count } }
    finishRewards { items { item { name iconLink } count } }
    objectives {
      maps { name }
      description
      ... on TaskObjectiveItem { items { id name iconLink } count }
      ... on TaskObjectivePlayerLevel { playerLevel }
    }
  }
  task(id: "5c51aac186f77432ea65c552", lang: en) {
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
      itemRequirements { count item { name iconLink } }
    }
  }
}
`;

export type FetchStage =
  | 'request'
  | 'parse'
  | 'overlay-fetch'
  | 'overlay-apply'
  | 'normalize'
  | 'done';

export async function fetchCombinedData(
  onStage?: (stage: FetchStage) => void
): Promise<{
  tasks: TaskData;
  collectorItems: CollectorItemsData;
  achievements: AchievementsData;
  hideoutStations: { data: HideoutStationsData };
  overlay: Overlay;
}> {
  onStage?.('request');
  const response = await fetch(TARKOV_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: COMBINED_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  onStage?.('parse');
  const result: CombinedApiData = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  // Aggregated maps from objectives into task.maps array
  // Apply task requirement overrides before processing
  const tasksWithOverrides = applyTaskRequirementOverrides(result.data.tasks);

  // Apply Overlay (Remote with Local Fallback)
  onStage?.('overlay-fetch');
  const overlay = await fetchOverlay();
  onStage?.('overlay-apply');
  const tasksWithOverlay = tasksWithOverrides
    .map(task => applyTaskOverlay(task, overlay))
    .filter((task): task is Task => task !== null);

  onStage?.('normalize');
  const tasksWithMaps = tasksWithOverlay.map(task => {
    const mapsSet = new Set<string>();

    // Collect unique map names from all objectives
    task.objectives?.forEach(objective => {
      objective.maps?.forEach(map => {
        if (map.name) mapsSet.add(map.name);
      });
    });

    // Convert Set to array of map objects
    const maps = Array.from(mapsSet).map(name => ({ name }));

    return {
      ...task,
      maps
    };
  });

  const tasks: TaskData = {
    data: {
      tasks: tasksWithMaps
    }
  };

  const collectorItems: CollectorItemsData = {
    data: {
      task: result.data.task
        ? (applyTaskOverlay(result.data.task, overlay) as CollectorItemsData['data']['task'])
        : result.data.task
    }
  };

  const achievements: AchievementsData = {
    data: {
      achievements: result.data.achievements ?? []
    }
  };

  const hideoutStations: { data: HideoutStationsData } = {
    data: {
      hideoutStations: result.data.hideoutStations || []
    }
  };

  const combined = { tasks, collectorItems, achievements, hideoutStations };
  // Save fresh data to cache for next startup
  saveCombinedCache(combined);
  onStage?.('done');
  return { ...combined, overlay };
}

export async function fetchHideoutStations(): Promise<{ data: HideoutStationsData }> {
  const response = await fetch(TARKOV_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: HIDEOUT_STATIONS_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return {
    data: {
      hideoutStations: result.data.hideoutStations || []
    }
  };
}
