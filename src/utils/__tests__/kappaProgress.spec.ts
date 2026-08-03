import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import {
  buildKappaQuestRoutes,
  calculateKappaProgress,
  KAPPA_LL4_TRADERS,
  KAPPA_QUEST_TARGETS,
  normalizeKappaLl4Traders,
} from "@/utils/kappaProgress";

function task(
  id: string,
  name: string,
  requirementIds: string[] = [],
): Task {
  return {
    id,
    name,
    minPlayerLevel: 1,
    taskRequirements: requirementIds.map((requirementId) => ({
      task: { id: requirementId, name: `Task ${requirementId}` },
    })),
    wikiLink: "",
    map: null,
    maps: [],
    trader: { name: "Mechanic" },
  };
}

function targetTasks(extraTasks: Task[] = []) {
  return [
    ...KAPPA_QUEST_TARGETS.map((target) => task(target.id, target.label)),
    ...extraTasks,
  ];
}

describe("buildKappaQuestRoutes", () => {
  it("walks recursive and branching prerequisites in progression order", () => {
    const target = KAPPA_QUEST_TARGETS[0];
    const tasks = targetTasks([
      task("root", "Root"),
      task("left", "Left", ["root"]),
      task("right", "Right", ["root"]),
    ]).map((entry) =>
      entry.id === target.id
        ? task(entry.id, entry.name, ["left", "right"])
        : entry,
    );

    const route = buildKappaQuestRoutes(
      tasks,
      new Set(["root", "left"]),
    )[0];

    expect(route.tasks.map((entry) => entry.id)).toEqual([
      "root",
      "left",
      "right",
      target.id,
    ]);
    expect(route.completed).toBe(2);
    expect(route.total).toBe(4);
    expect(route.tasks.find((entry) => entry.id === "left")?.isAvailable).toBe(
      true,
    );
    expect(route.tasks.find((entry) => entry.id === "right")?.isAvailable).toBe(
      true,
    );
    expect(route.isComplete).toBe(false);
  });

  it("retains missing tasks and safely stops cyclic traversal", () => {
    const target = KAPPA_QUEST_TARGETS[0];
    const tasks = targetTasks([
      task("cycle-a", "Cycle A", ["cycle-b"]),
      task("cycle-b", "Cycle B", ["cycle-a"]),
    ]).map((entry) =>
      entry.id === target.id
        ? task(entry.id, entry.name, ["cycle-a", "missing"])
        : entry,
    );

    const route = buildKappaQuestRoutes(tasks, new Set())[0];

    expect(route.tasks.map((entry) => entry.id)).toEqual([
      "cycle-b",
      "cycle-a",
      "missing",
      target.id,
    ]);
    expect(route.tasks.find((entry) => entry.id === "missing")).toMatchObject({
      name: "Task missing",
      isMissing: true,
      isAvailable: false,
    });
    expect(route.hasMissingTasks).toBe(true);
  });

  it("uses destination completion as the route requirement", () => {
    const target = KAPPA_QUEST_TARGETS[0];
    const tasks = targetTasks([task("prerequisite", "Prerequisite")]).map(
      (entry) =>
        entry.id === target.id
          ? task(entry.id, entry.name, ["prerequisite"])
          : entry,
    );

    const route = buildKappaQuestRoutes(tasks, new Set([target.id]))[0];

    expect(route.completed).toBe(1);
    expect(route.total).toBe(2);
    expect(route.isComplete).toBe(true);
  });
});

describe("calculateKappaProgress", () => {
  it("requires every account gate and destination task", () => {
    const completedTasks = new Set(
      KAPPA_QUEST_TARGETS.map((target) => target.id),
    );
    const base = {
      tasks: targetTasks(),
      completedTasks,
      playerLevel: 40,
      fenceReputation: 3,
      ll4Traders: new Set<string>(KAPPA_LL4_TRADERS),
    };

    expect(calculateKappaProgress(base).collectorUnlocked).toBe(true);
    expect(
      calculateKappaProgress({ ...base, playerLevel: 39 }).collectorUnlocked,
    ).toBe(false);
    expect(
      calculateKappaProgress({ ...base, fenceReputation: 2.99 })
        .collectorUnlocked,
    ).toBe(false);
    expect(
      calculateKappaProgress({
        ...base,
        ll4Traders: new Set(KAPPA_LL4_TRADERS.slice(0, -1)),
      }).collectorUnlocked,
    ).toBe(false);
    expect(
      calculateKappaProgress({
        ...base,
        completedTasks: new Set(KAPPA_QUEST_TARGETS.slice(0, -1).map((t) => t.id)),
      }).collectorUnlocked,
    ).toBe(false);
  });
});

describe("normalizeKappaLl4Traders", () => {
  it("keeps known unique trader names for persisted profiles", () => {
    expect(
      normalizeKappaLl4Traders([
        "Prapor",
        "Unknown",
        "Prapor",
        "Therapist",
        null,
      ]),
    ).toEqual(["Prapor", "Therapist"]);
    expect(normalizeKappaLl4Traders("Prapor")).toEqual([]);
  });
});
