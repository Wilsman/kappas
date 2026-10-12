import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import {
  buildKappaQuestRoutes,
  calculateKappaProgress,
  getKappaRouteTargets,
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

describe("getKappaRouteTargets", () => {
  function kappaTask(
    id: string,
    name: string,
    requirementIds: string[] = [],
    extra: Partial<Task> = {},
  ): Task {
    return {
      ...task(id, name, requirementIds),
      kappaRequired: true,
      ...extra,
    };
  }

  it("groups kappa tasks into one route per terminal task", () => {
    const tasks = [
      kappaTask("pp1", "Postman Pat 1"),
      kappaTask("pp2", "Postman Pat 2", ["pp1"]),
      kappaTask("chem1", "Chemical 1"),
      kappaTask("chem2", "Chemical 2", ["chem1"]),
      kappaTask("chem3", "Chemical 3", ["chem2"]),
    ];

    expect(getKappaRouteTargets(tasks).map((t) => t.id)).toEqual([
      "chem3",
      "pp2",
    ]);
  });

  it("covers every kappa task through its terminal chain", () => {
    const tasks = [
      kappaTask("pp1", "Postman Pat 1"),
      kappaTask("pp2", "Postman Pat 2", ["pp1"]),
      kappaTask("chem3", "Chemical 3", ["chem2"]),
      kappaTask("chem2", "Chemical 2", ["chem1"]),
      kappaTask("chem1", "Chemical 1"),
    ];

    const routes = buildKappaQuestRoutes(tasks, new Set());
    const covered = new Set(routes.flatMap((route) => route.tasks.map((t) => t.id)));
    for (const id of ["pp1", "pp2", "chem1", "chem2", "chem3"]) {
      expect(covered.has(id)).toBe(true);
    }
  });

  it("excludes Collector and event tasks from route targets", () => {
    const tasks = [
      kappaTask("pp2", "Postman Pat 2", ["pp1"]),
      kappaTask("pp1", "Postman Pat 1"),
      kappaTask("5c51aac186f77432ea65c552", "Collector", ["pp2"]),
      kappaTask("event_1", "Event Task", [], { isEvent: true }),
    ];

    expect(getKappaRouteTargets(tasks).map((t) => t.id)).toEqual(["pp2"]);
  });

  it("prefers Collector's task requirements over kappa flags", () => {
    const tasks = [
      kappaTask("pp1", "Postman Pat 1"),
      kappaTask("pp2", "Postman Pat 2", ["pp1"]),
      task("chem3", "Chemical 3"),
      task("5c51aac186f77432ea65c552", "Collector", ["pp2", "chem3"]),
    ];

    expect(getKappaRouteTargets(tasks).map((t) => t.id)).toEqual([
      "chem3",
      "pp2",
    ]);
  });

  it("falls back to legacy targets when no kappa flags are present", () => {
    expect(
      getKappaRouteTargets([task("a", "A")]).map((t) => t.id),
    ).toEqual(KAPPA_QUEST_TARGETS.map((t) => t.id));
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
