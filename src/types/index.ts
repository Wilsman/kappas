import { TraderName } from "../data/traders";

export interface Task {
  id: string;
  minPlayerLevel: number;
  factionName?: string | null;
  taskRequirements: TaskRequirement[];
  wikiLink: string;
  name: string;
  map: {
    name: string;
  } | null;
  maps: {
    name: string;
  }[];
  trader: {
    name: TraderName;
    imageLink?: string;
  };
  kappaRequired?: boolean;
  lightkeeperRequired?: boolean;
  objectives?: TaskObjective[];
  startRewards?: {
    items: RewardItem[];
  };
  finishRewards?: {
    items: RewardItem[];
  };
}

export interface TaskObjective {
  description: string;
  playerLevel?: number;
  maps?: {
    name: string;
  }[];
  items?: {
    id: string;
    name: string;
    iconLink?: string;
  }[];
  count?: number;
}

export interface RewardItem {
  item: {
    name: string;
    iconLink?: string;
  };
  count: number;
}

export interface TaskRequirement {
  task: {
    id: string;
    name: string;
  };
}

export interface TaskData {
  data: {
    tasks: Task[];
  };
}
//{
//   "data": {
//     "task": {
//       "objectives": [
//         {
//           "items": [
//             {
//               "id": "5bc9c377d4351e3bac12251b",
//               "name": "Old firesteel",
//               "iconLink": "https://assets.tarkov.dev/5bc9c377d4351e3bac12251b-icon.webp"
//             }
//           ]
//         },
export interface CollectorItemsData {
  data: {
    task: {
      objectives: {
        items: {
          id: string;
          name: string;
          iconLink: string;
        }[];
      }[];
    };

  };
}

export interface TaskPosition {
  x: number;
  y: number;
  level: number;
}

export interface TaskPositions {
  [taskId: string]: TaskPosition;
}

export interface HideoutStationSkillRequirement {
  name: string;
  skill: {
    name: string;
  };
  level: number;
}

export interface HideoutStationLevelRequirement {
  station: {
    name: string;
  };
  level: number;
}

export interface HideoutStationItemRequirement {
  count: number;
  item: {
    name: string;
    iconLink?: string;
  };
}

export interface HideoutStationLevel {
  level: number;
  skillRequirements: HideoutStationSkillRequirement[];
  stationLevelRequirements: HideoutStationLevelRequirement[];
  itemRequirements: HideoutStationItemRequirement[];
}

export interface HideoutStation {
  name: string;
  imageLink?: string;
  levels: HideoutStationLevel[];
}

export interface HideoutStationsData {
  hideoutStations: HideoutStation[];
}

// Achievements
export interface Achievement {
  id: string;
  imageLink: string;
  name: string;
  description: string;
  hidden: boolean;
  playersCompletedPercent: number;
  adjustedPlayersCompletedPercent: number;
  side: string; // "PMC" | "Scav" | "All"; keep flexible
  rarity: string; // "Common" | "Rare" | "Legendary"; keep flexible
}

export interface AchievementsData {
  data: {
    achievements: Achievement[];
  };
}
