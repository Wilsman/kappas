import { describe, expect, it } from "vitest";
import type { HideoutStation, HideoutStationLevel } from "@/types";
import {
  filterHideoutStations,
  getHideoutItemKey,
  getHideoutLevelProgress,
  getHideoutSkillRequirementKey,
  getHideoutStationProgress,
  getHideoutStationRequirementKey,
  getRequirementFreeLevelKey,
  setHideoutLevelBuilt,
  type HideoutProgressState,
} from "@/utils/hideoutProgress";

const level: HideoutStationLevel = {
  level: 2,
  itemRequirements: [
    { count: 2, item: { name: "Bolts" } },
    { count: 1, item: { name: "Wires" } },
  ],
  skillRequirements: [
    { name: "skill", skill: { name: "Health" }, level: 2 },
  ],
  stationLevelRequirements: [
    { station: { name: "Generator" }, level: 1 },
  ],
};

const emptyState = (): HideoutProgressState => ({
  completedItems: new Set(),
  itemQuantities: {},
  completedRequirements: new Set(),
});

describe("hideout progress", () => {
  it("counts item quantities and manually completed requirements", () => {
    const state = emptyState();
    state.itemQuantities[getHideoutItemKey("Workbench", 2, "Bolts")] = 2;
    state.completedRequirements.add(
      getHideoutSkillRequirementKey(
        "Workbench",
        2,
        level.skillRequirements[0],
      ),
    );

    expect(getHideoutLevelProgress("Workbench", level, state)).toEqual({
      completed: 2,
      total: 4,
      isBuilt: false,
    });

    state.completedItems.add(getHideoutItemKey("Workbench", 2, "Wires"));
    state.completedRequirements.add(
      getHideoutStationRequirementKey(
        "Workbench",
        2,
        level.stationLevelRequirements[0],
      ),
    );

    expect(getHideoutLevelProgress("Workbench", level, state).isBuilt).toBe(
      true,
    );
  });

  it("uses an explicit marker for a requirement-free level", () => {
    const requirementFreeLevel: HideoutStationLevel = {
      level: 1,
      itemRequirements: [],
      skillRequirements: [],
      stationLevelRequirements: [],
    };
    const state = emptyState();

    expect(
      getHideoutLevelProgress("Christmas Tree", requirementFreeLevel, state),
    ).toEqual({ completed: 0, total: 1, isBuilt: false });

    state.completedRequirements.add(
      getRequirementFreeLevelKey("Christmas Tree", 1),
    );
    expect(
      getHideoutLevelProgress("Christmas Tree", requirementFreeLevel, state)
        .isBuilt,
    ).toBe(true);
  });

  it("keeps prerequisite completion stable when its display name changes", () => {
    expect(
      getHideoutStationRequirementKey("Workbench", 2, {
        station: { id: "generator-id", name: "Generator" },
        level: 1,
      }),
    ).toBe(
      getHideoutStationRequirementKey("Workbench", 2, {
        station: { id: "generator-id", name: "Generador" },
        level: 1,
      }),
    );
  });

  it("marks or clears every requirement in only the selected level", () => {
    const unrelatedItemKey = getHideoutItemKey("Generator", 1, "Fuel");
    const state = emptyState();
    state.completedItems.add(unrelatedItemKey);

    const built = setHideoutLevelBuilt("Workbench", level, true, state);
    expect(getHideoutLevelProgress("Workbench", level, built).isBuilt).toBe(
      true,
    );
    expect(built.itemQuantities).toMatchObject({
      [getHideoutItemKey("Workbench", 2, "Bolts")]: 2,
      [getHideoutItemKey("Workbench", 2, "Wires")]: 1,
    });
    expect(built.completedItems.has(unrelatedItemKey)).toBe(true);

    const cleared = setHideoutLevelBuilt("Workbench", level, false, built);
    expect(getHideoutLevelProgress("Workbench", level, cleared).isBuilt).toBe(
      false,
    );
    expect(cleared.completedItems.has(unrelatedItemKey)).toBe(true);
    expect(cleared.itemQuantities).not.toHaveProperty(
      getHideoutItemKey("Workbench", 2, "Bolts"),
    );
  });

  it("counts built levels for station completion", () => {
    const station: HideoutStation = {
      name: "Workbench",
      levels: [level, { ...level, level: 3 }],
    };
    const state = setHideoutLevelBuilt("Workbench", level, true, emptyState());

    expect(getHideoutStationProgress(station, state)).toEqual({
      builtLevels: 1,
      totalLevels: 2,
      isBuilt: false,
    });
  });

  it("combines remaining-level filtering with search", () => {
    const station: HideoutStation = {
      name: "Workbench",
      levels: [level, { ...level, level: 3 }],
    };
    const state = setHideoutLevelBuilt("Workbench", level, true, emptyState());

    const remaining = filterHideoutStations(
      [station],
      "workbench",
      true,
      state,
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].levels.map((entry) => entry.level)).toEqual([3]);

    expect(filterHideoutStations([station], "generator", true, state)).toEqual([
      { ...station, levels: [{ ...level, level: 3 }] },
    ]);

    const allBuilt = setHideoutLevelBuilt(
      "Workbench",
      { ...level, level: 3 },
      true,
      state,
    );
    expect(filterHideoutStations([station], "", true, allBuilt)).toEqual([]);
  });
});
