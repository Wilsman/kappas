import { describe, expect, it } from "vitest";
import type { Achievement } from "@/types";
import {
  filterAndSortAchievements,
  groupAchievementsByRarity,
  isEventAchievement,
  normalizeAchievementSort,
  normalizeAchievementStatusFilter,
} from "@/utils/achievementFilters";

const make = (id: string, name: string, percent: number, description = ""): Achievement => ({
  id,
  name,
  description,
  imageLink: "",
  hidden: false,
  playersCompletedPercent: percent,
  adjustedPlayersCompletedPercent: percent,
  side: "PMC",
  rarity: "Common",
});

const list = [make("a", "Bravo", 10, "Kill a scav"), make("b", "Alpha", 50), make("c", "Charlie", 2)];
const base = { searchTerm: "", status: "all" as const, sort: "default" as const, completed: new Set(["b"]) };
const ids = (items: Achievement[]) => items.map((a) => a.id);

describe("filterAndSortAchievements", () => {
  it("keeps API order by default", () => {
    expect(ids(filterAndSortAchievements(list, base))).toEqual(["a", "b", "c"]);
  });

  it("filters by completion status", () => {
    expect(ids(filterAndSortAchievements(list, { ...base, status: "completed" }))).toEqual(["b"]);
    expect(ids(filterAndSortAchievements(list, { ...base, status: "incomplete" }))).toEqual(["a", "c"]);
  });

  it("sorts by players percent and name without mutating input", () => {
    expect(ids(filterAndSortAchievements(list, { ...base, sort: "players-desc" }))).toEqual(["b", "a", "c"]);
    expect(ids(filterAndSortAchievements(list, { ...base, sort: "players-asc" }))).toEqual(["c", "a", "b"]);
    expect(ids(filterAndSortAchievements(list, { ...base, sort: "name" }))).toEqual(["b", "a", "c"]);
    expect(ids(list)).toEqual(["a", "b", "c"]);
  });

  it("searches name and description case-insensitively", () => {
    expect(ids(filterAndSortAchievements(list, { ...base, searchTerm: "  SCAV " }))).toEqual(["a"]);
    expect(ids(filterAndSortAchievements(list, { ...base, searchTerm: "alp" }))).toEqual(["b"]);
  });
});

describe("normalizers", () => {
  it("falls back to defaults for unknown URL values", () => {
    expect(normalizeAchievementStatusFilter("bogus")).toBe("all");
    expect(normalizeAchievementStatusFilter(null)).toBe("all");
    expect(normalizeAchievementStatusFilter("completed")).toBe("completed");
    expect(normalizeAchievementSort("nope")).toBe("default");
    expect(normalizeAchievementSort("players-asc")).toBe("players-asc");
  });
});

describe("groupAchievementsByRarity", () => {
  const withRarity = (id: string, rarity: string, normalizedRarity?: string, description = "") => ({
    ...make(id, id, 1, description),
    rarity,
    normalizedRarity,
  });

  it("orders groups by language-independent rarity, not translated labels", () => {
    const groups = groupAchievementsByRarity([
      withRarity("l", "Legendär", "legendary"),
      withRarity("s", "Saisonal", "seasonal"),
      withRarity("c", "Gewöhnlich", "common"),
      withRarity("r", "Selten", "rare"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["common", "rare", "legendary", "seasonal"]);
    expect(groups[2].label).toBe("Legendär");
  });

  it("puts known event achievements in Event in any language", () => {
    const groups = groupAchievementsByRarity([
      withRarity("660fe21454670811e304c045", "Легендарное", "legendary", "Завершить цепочку заданий в событии"),
      withRarity("x", "Legendary", "legendary"),
    ]);
    expect(groups.map((g) => [g.key, g.items.map((a) => a.id)])).toEqual([
      ["legendary", ["x"]],
      ["event", ["660fe21454670811e304c045"]],
    ]);
  });

  it("detects new events by English wording but ignores words like 'prevent'", () => {
    expect(isEventAchievement(make("n", "n", 1, "Complete the Spooky 2027 event task line"))).toBe(true);
    expect(isEventAchievement(make("p", "p", 1, "Prevent the enemy from extracting"))).toBe(false);
  });

  it("falls back to the rarity label for old cached data", () => {
    const groups = groupAchievementsByRarity([withRarity("a", "Rare"), withRarity("b", "Common")]);
    expect(groups.map((g) => g.key)).toEqual(["common", "rare"]);
  });
});

describe("hidden-only filter", () => {
  const items = [make("v", "Visible", 5), { ...make("h1", "Secret", 1), hidden: true }, { ...make("h2", "Secret 2", 3), hidden: true }];

  it("keeps only hidden achievements and still applies status and sort", () => {
    const opts = { ...base, completed: new Set(["h1"]), hiddenOnly: true };
    expect(ids(filterAndSortAchievements(items, opts))).toEqual(["h1", "h2"]);
    expect(ids(filterAndSortAchievements(items, { ...opts, status: "incomplete" }))).toEqual(["h2"]);
    expect(ids(filterAndSortAchievements(items, { ...opts, sort: "players-desc" }))).toEqual(["h2", "h1"]);
  });

  it("shows everything when off", () => {
    expect(ids(filterAndSortAchievements(items, base))).toEqual(["v", "h1", "h2"]);
  });
});
