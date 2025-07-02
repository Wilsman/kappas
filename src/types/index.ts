import { TraderName } from '../data/traders';

export interface Task {
  id: string;
  minPlayerLevel: number;
  taskRequirements: TaskRequirement[];
  wikiLink: string;
  name: string;
  trader: {
    name: TraderName;
  };
  kappaRequired?: boolean;
  lightkeeperRequired?: boolean;
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

export interface TaskPosition {
  x: number;
  y: number;
  level: number;
}

export interface TaskPositions {
  [taskId: string]: TaskPosition;
}