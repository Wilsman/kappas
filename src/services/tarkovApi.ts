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

  return { tasks, collectorItems, achievements, hideoutStations };
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
