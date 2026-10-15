import { describe, expect, it } from "vitest";
import type { HideoutStation, Prestige, Task } from "@/types";
import { getHideoutItemKey } from "@/utils/hideoutProgress";
import {
  createPrestigeTaskFilter,
  EMPTY_PRESTIGE_STATE,
  evaluatePrestige,
  getNextPrestige,
  getPrestigeModeNotes,
  migrateLegacyPrestigeState,
  normalizePrestigeState,
  ROUBLES_ITEM_ID,
  type PrestigeTrackerState,
} from "@/utils/prestige";
import { buildTaskObjectiveKeys } from "@/utils/taskObjectives";

const INTEL_ID = "5d484fdf654e7600691aadf8";

const intelCenter: HideoutStation = {
  id: INTEL_ID,
  name: "Intelligence Center",
  levels: [1, 2, 3].map((level) => ({
    level,
    skillRequirements: [],
    stationLevelRequirements: [],
    itemRequirements: [{ count: 1, item: { name: `Part ${level}` } }],
  })),
};

const newBeginning: Task = {
  id: "nb-1",
  name: "New Beginning",
  minPlayerLevel: 1,
  taskRequirements: [],
  wikiLink: "",
  map: null,
  maps: [],
  trader: { name: "Prapor" },
  objectives: [
    { id: "obj-1", description: "Eliminate PMCs" },
    { id: "obj-2", description: "Extract from Labs" },
  ],
};

const prestige1: Prestige = {
  id: "p1",
  name: "Prestige 1",
  prestigeLevel: 1,
  conditions: [
    { id: "c-money", type: "haveItem", itemId: ROUBLES_ITEM_ID, itemName: "Roubles", count: 10_000_000, foundInRaid: false },
    { id: "c-level", type: "playerLevel", level: 25 },
    { id: "c-task", type: "taskStatus", taskId: "nb-1", taskName: "New Beginning" },
    { id: "c-intel", type: "hideoutStation", stationId: INTEL_ID, stationName: "Intelligence Center", level: 2 },
    { id: "c-str", type: "skill", skillId: "Strength", skillName: "Strength", level: 10 },
  ],
};

const prestige2: Prestige = {
  id: "p2",
  name: "Prestige 2",
  prestigeLevel: 2,
  conditions: [{ id: "c-level-2", type: "playerLevel", level: 30 }],
};

function trackerState(
  overrides: Partial<PrestigeTrackerState> = {},
): PrestigeTrackerState {
  return {
    playerLevel: 1,
    completedTasks: new Set(),
    completedTaskObjectives: new Set(),
    tasksById: new Map([[newBeginning.id, newBeginning]]),
    hideoutStations: [intelCenter],
    hideout: {
      completedItems: new Set(),
      itemQuantities: {},
      completedRequirements: new Set(),
    },
    manual: { ...EMPTY_PRESTIGE_STATE },
    ...overrides,
  };
}

describe("evaluatePrestige", () => {
  it("orders requirements and reports nothing done for a fresh profile", () => {
    const progress = evaluatePrestige(prestige1, trackerState());

    expect(progress.requirements.map((r) => r.condition.type)).toEqual([
      "playerLevel",
      "taskStatus",
      "hideoutStation",
      "skill",
      "haveItem",
    ]);
    expect(progress.completed).toBe(0);
    expect(progress.total).toBe(5);
    expect(progress.ready).toBe(false);
  });

  it("derives level, task and hideout progress from tracker state", () => {
    const progress = evaluatePrestige(
      prestige1,
      trackerState({
        playerLevel: 30,
        completedTasks: new Set(["nb-1"]),
        hideout: {
          completedItems: new Set([
            getHideoutItemKey("Intelligence Center", 1, "Part 1"),
            getHideoutItemKey("Intelligence Center", 2, "Part 2"),
          ]),
          itemQuantities: {},
          completedRequirements: new Set(),
        },
        manual: { currentLevel: 0, roubles: 12_000_000, skills: { Strength: 10 } },
      }),
    );

    expect(progress.requirements.every((r) => r.done)).toBe(true);
    expect(progress.ready).toBe(true);
    const intel = progress.requirements.find(
      (r) => r.condition.type === "hideoutStation",
    );
    expect(intel?.current).toBe(2);
    expect(intel?.link).toEqual({ type: "hideout", stationName: "Intelligence Center" });
  });

  it("only counts contiguous built hideout levels", () => {
    const progress = evaluatePrestige(
      prestige1,
      trackerState({
        hideout: {
          completedItems: new Set([
            getHideoutItemKey("Intelligence Center", 2, "Part 2"),
          ]),
          itemQuantities: {},
          completedRequirements: new Set(),
        },
      }),
    );
    const intel = progress.requirements.find(
      (r) => r.condition.type === "hideoutStation",
    );
    expect(intel?.current).toBe(0);
    expect(intel?.help).toMatch(/Not built yet/);
  });

  it("reports partial task objective progress and help", () => {
    const [firstKey] = buildTaskObjectiveKeys(newBeginning);
    const progress = evaluatePrestige(
      prestige1,
      trackerState({ completedTaskObjectives: new Set([firstKey]) }),
    );
    const task = progress.requirements.find(
      (r) => r.condition.type === "taskStatus",
    );

    expect(task?.done).toBe(false);
    expect(task?.progress).toBeGreaterThan(0.4);
    expect(task?.progress).toBeLessThan(1);
    expect(task?.help).toContain("1 objective left");
    expect(task?.link).toEqual({ type: "task", taskId: "nb-1", taskName: "New Beginning" });
  });

  it("tells the player which prerequisite tasks block a prestige task", () => {
    const locked: Task = {
      ...newBeginning,
      taskRequirements: [{ task: { id: "pre", name: "Setup" } }],
    };
    const progress = evaluatePrestige(
      prestige1,
      trackerState({ tasksById: new Map([[locked.id, locked]]) }),
    );
    const task = progress.requirements.find(
      (r) => r.condition.type === "taskStatus",
    );
    expect(task?.help).toContain('"Setup"');
  });

  it("marks skills and roubles as manual inputs", () => {
    const progress = evaluatePrestige(prestige1, trackerState());
    const manual = progress.requirements
      .filter((r) => r.source === "manual")
      .map((r) => r.condition.type);
    expect(manual).toEqual(["skill", "haveItem"]);
  });
});

describe("getNextPrestige", () => {
  it("returns the prestige after the current level", () => {
    expect(getNextPrestige([prestige1, prestige2], 0)?.id).toBe("p1");
    expect(getNextPrestige([prestige1, prestige2], 1)?.id).toBe("p2");
    expect(getNextPrestige([prestige1, prestige2], 2)).toBeNull();
  });
});

describe("getPrestigeModeNotes", () => {
  it("explains missing quest and hideout requirements in PvE", () => {
    expect(getPrestigeModeNotes(prestige2, "pve")).toEqual([
      "PvE: no prestige quest required.",
      "PvE: no hideout requirements.",
    ]);
    expect(getPrestigeModeNotes(prestige2, "regular")).toEqual([]);
    expect(getPrestigeModeNotes(prestige1, "pve")).toEqual([]);
  });
});

describe("createPrestigeTaskFilter", () => {
  const prestige5: Prestige = {
    id: "p5",
    name: "Prestige 5",
    prestigeLevel: 5,
    conditions: [{ id: "c", type: "taskStatus", taskId: "collector", taskName: "Collector" }],
  };
  const prestige6: Prestige = { ...prestige5, id: "p6", prestigeLevel: 6 };
  const all = [prestige1, prestige2, prestige5, prestige6];

  it("hides tasks that need a higher prestige", () => {
    const gated = { id: "nb-2", requiredPrestigeId: "p1" };
    expect(createPrestigeTaskFilter(all, 0)(gated)).toBe(false);
    expect(createPrestigeTaskFilter(all, 1)(gated)).toBe(true);
  });

  it("keeps tasks whose required prestige is unknown", () => {
    expect(
      createPrestigeTaskFilter(all, 0)({ id: "x", requiredPrestigeId: "nope" }),
    ).toBe(true);
  });

  it("hides a prestige-only quest once that prestige is reached", () => {
    expect(createPrestigeTaskFilter(all, 0)({ id: "nb-1" })).toBe(true);
    expect(createPrestigeTaskFilter(all, 1)({ id: "nb-1" })).toBe(false);
  });

  it("keeps quests shared by several prestiges, like Collector", () => {
    expect(createPrestigeTaskFilter(all, 6)({ id: "collector" })).toBe(true);
  });
});

describe("prestige state", () => {
  it("normalizes stored values", () => {
    expect(
      normalizePrestigeState({
        currentLevel: 9,
        roubles: -5,
        skills: { Strength: 12, Charisma: "x" },
      }),
    ).toEqual({ currentLevel: 6, roubles: 0, skills: { Strength: 12 } });
    expect(normalizePrestigeState(null)).toEqual(EMPTY_PRESTIGE_STATE);
  });

  it("carries roubles and skills over from the latest legacy record", () => {
    expect(
      migrateLegacyPrestigeState({
        1: { strength: 5, hideout: { roubles: 1_000_000 } },
        2: { strength: 10, endurance: 8, charisma: 0, hideout: { roubles: 15_000_000 } },
        3: { level: 20 },
      }),
    ).toEqual({
      currentLevel: 0,
      roubles: 15_000_000,
      skills: { Strength: 10, Endurance: 8 },
    });
  });

  it("returns an empty state when no legacy values exist", () => {
    expect(migrateLegacyPrestigeState({ 1: {} })).toEqual(EMPTY_PRESTIGE_STATE);
  });
});
