import type { Achievement } from "@/types";

export type AchievementStatusFilter = "all" | "incomplete" | "completed";
export type AchievementSort = "default" | "players-desc" | "players-asc" | "name";

export const ACHIEVEMENT_STATUS_FILTERS: AchievementStatusFilter[] = [
  "all",
  "incomplete",
  "completed",
];

export const ACHIEVEMENT_SORTS: AchievementSort[] = [
  "default",
  "players-desc",
  "players-asc",
  "name",
];

export function normalizeAchievementStatusFilter(value: unknown): AchievementStatusFilter {
  return ACHIEVEMENT_STATUS_FILTERS.includes(value as AchievementStatusFilter)
    ? (value as AchievementStatusFilter)
    : "all";
}

export function normalizeAchievementSort(value: unknown): AchievementSort {
  return ACHIEVEMENT_SORTS.includes(value as AchievementSort)
    ? (value as AchievementSort)
    : "default";
}

interface FilterOptions {
  searchTerm: string;
  status: AchievementStatusFilter;
  sort: AchievementSort;
  completed: Set<string>;
  /** Show only hidden (secret) achievements. */
  hiddenOnly?: boolean;
}

/** Applies search, completion status, hidden-only and sort order. "default" keeps API order. */
export function filterAndSortAchievements(
  achievements: Achievement[],
  { searchTerm, status, sort, completed, hiddenOnly = false }: FilterOptions,
): Achievement[] {
  const term = searchTerm.trim().toLowerCase();
  const result = achievements.filter((a) => {
    if (hiddenOnly && !a.hidden) return false;
    const isDone = completed.has(a.id);
    if (status === "completed" && !isDone) return false;
    if (status === "incomplete" && isDone) return false;
    if (!term) return true;
    return [a.name, a.description, a.side, a.rarity].some((field) =>
      (field ?? "").toLowerCase().includes(term),
    );
  });

  switch (sort) {
    case "players-desc":
      return result.sort((a, b) => b.playersCompletedPercent - a.playersCompletedPercent);
    case "players-asc":
      return result.sort((a, b) => a.playersCompletedPercent - b.playersCompletedPercent);
    case "name":
      return result.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return result;
  }
}

// Event achievements have no flag in the API, so known ones are listed by ID
// (works in every language). New events are caught by the English wording.
const KNOWN_EVENT_ACHIEVEMENT_IDS = new Set([
  "660fe21454670811e304c045", // Maslenitsa
  "6634c8886e083a141f4aa3f4", // Cardinal Richelieu
  "6634ca69ee506a5c3e61be56", // INVOLVED IN PEACE
  "6634cae870af846d2868dada", // Local Strong Man
  "66742c003a67b164a300fcbf", // A Key to Salvation
  "668bf47c781d446fdc083711", // High Competition
  "66e2a7e5919bad697104f4b3", // Highway to the Danger Zone
  "670feb95a4e71050310cc14b", // Complete Remission
  "670febed5ee0fc738a0965a4", // Fatal Outcome
  "675998a894008342eb04e47f", // Khorovod
  "67a0e57117e34930e50075f3", // In Search of an Exit
  "67a0e57b972c11a3f50773b2", // Dungeon Master
  "693a83434cb1cf587c0a63f9", // Whiteout
  "6984ab58ee0ae2c0d5075f33", // Duck Hunt
  "69de1be5d378f8aef8008409", // Habet, hoc habet!
  "69de1c2be33584b09a098e93", // Morituri te salutant
  "6a04f93d7a6a2b325906bb5c", // Awaiting Departure
  "6a399cb92c8999ddbd01268b", // I Am the Law
  "6a4fbdaf39f54f9c000f1575", // Going Dark
]);

const EVENT_TASK_LINE_PATTERN = /\bevent task\b/i;

export function isEventAchievement(achievement: Achievement): boolean {
  return (
    KNOWN_EVENT_ACHIEVEMENT_IDS.has(achievement.id) ||
    EVENT_TASK_LINE_PATTERN.test(achievement.description ?? "")
  );
}

const RARITY_ORDER = ["common", "rare", "legendary", "seasonal"];

export interface AchievementGroup {
  key: string;
  label: string;
  items: Achievement[];
}

function getRarityKey(achievement: Achievement): string {
  // Old caches lack normalizedRarity; the English label still works there.
  return (achievement.normalizedRarity || achievement.rarity || "unknown").toLowerCase();
}

/** Groups by rarity (Event pulled out separately), in game tab order. */
export function groupAchievementsByRarity(achievements: Achievement[]): AchievementGroup[] {
  const groups = new Map<string, AchievementGroup>();
  for (const achievement of achievements) {
    const isEvent = isEventAchievement(achievement);
    const key = isEvent ? "event" : getRarityKey(achievement);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: isEvent ? "Event" : achievement.rarity || "Unknown", items: [] };
      groups.set(key, group);
    }
    group.items.push(achievement);
  }
  const weight = (key: string) => {
    if (key === "event") return RARITY_ORDER.length;
    const index = RARITY_ORDER.indexOf(key);
    return index === -1 ? 99 : index;
  };
  return Array.from(groups.values()).sort(
    (a, b) => weight(a.key) - weight(b.key) || a.label.localeCompare(b.label),
  );
}
