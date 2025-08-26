import { TaskData, CollectorItemsData, HideoutStationsData, AchievementsData } from '../types';

const TARKOV_API_URL = 'https://api.tarkov.dev/graphql';

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
export const API_CACHE_KEY = 'taskTracker_api_cache_v1';
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
      description
      ... on TaskObjectiveItem { items { id name iconLink } count }
      ... on TaskObjectivePlayerLevel { playerLevel }
    }
  }
  task(id: "5c51aac186f77432ea65c552") {
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

export async function fetchCombinedData(): Promise<{
  tasks: TaskData;
  collectorItems: CollectorItemsData;
  achievements: AchievementsData;
  hideoutStations: { data: HideoutStationsData };
}> {
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

  const result: CombinedApiData = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  // Transform the combined result into separate TaskData and CollectorItemsData
  const tasks: TaskData = {
    data: {
      tasks: result.data.tasks
    }
  };

  const collectorItems: CollectorItemsData = {
    data: {
      task: result.data.task
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
  return combined;
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
