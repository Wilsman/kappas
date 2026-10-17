export interface ResetOptions {
  storylineQuests: boolean;
  normalTasks: boolean;
  hideoutItems: boolean;
  collectorItems: boolean;
  achievements: boolean;
  prestiges: boolean;
  workingOnItems: boolean;
  trackedItems: boolean;
}

export const EMPTY_RESET_OPTIONS: ResetOptions = {
  storylineQuests: false,
  normalTasks: false,
  hideoutItems: false,
  collectorItems: false,
  achievements: false,
  prestiges: false,
  workingOnItems: false,
  trackedItems: false,
};

/** Display labels for each reset area, in dialog order. */
export const RESET_OPTION_LABELS: ReadonlyArray<[keyof ResetOptions, string]> = [
  ["storylineQuests", "Storyline Quests (1.0 objectives & map nodes)"],
  ["normalTasks", "Normal Tasks (regular quests)"],
  ["hideoutItems", "Hideout Progress"],
  ["collectorItems", "Collector Items"],
  ["achievements", "Achievements"],
  ["prestiges", "Prestige roubles & skills"],
  ["workingOnItems", "Currently Working On"],
  ["trackedItems", "Tracked Items"],
];
