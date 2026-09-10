export interface StorylineItem {
  id: string;
  name: string;
  iconLink?: string;
  shortName?: string;
}

export interface StorylineRequirement {
  id: string;
  type: string;
  label: string;
  status?: string[];
  targetId?: string;
  items?: StorylineItem[];
  unresolved?: boolean;
}

export interface StorylineRewardEntry {
  id: string;
  type: string;
  label: string;
  description?: string;
  count?: number;
  iconLink?: string;
}

export interface StorylineRewardGroup {
  entries: StorylineRewardEntry[];
}

export interface StorylineObjective {
  id: string;
  description: string;
  type: string;
  optional: boolean;
  count?: number;
  foundInRaid?: boolean;
  maps: string[];
  items: StorylineItem[];
  questItem?: StorylineItem;
  details: string[];
}

export interface StorylineStep {
  id: string;
  index: number;
  name?: string;
  trader?: string;
  traderId?: string;
  minPlayerLevel: number;
  factionName?: string | null;
  map?: string;
  wikiLink?: string;
  delaySecondsMin: number;
  delaySecondsMax: number;
  requirements: StorylineRequirement[];
  objectives: StorylineObjective[];
  startRewards?: StorylineRewardGroup;
  finishRewards?: StorylineRewardGroup;
  failureOutcome?: StorylineRewardGroup;
}

export interface StorylineChapter {
  id: string;
  name: string;
  steps: StorylineStep[];
}

export interface StorylineLoadResult {
  chapters: StorylineChapter[];
  updatedAt: number;
  source: "network" | "cache";
  stale: boolean;
}
