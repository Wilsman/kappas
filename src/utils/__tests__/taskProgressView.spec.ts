import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import { buildLegacyTaskObjectiveKey, buildTaskObjectiveKeys } from "../taskObjectives";
import {
  buildLogicalTaskIdGroups,
  expandCompletedTaskObjectives,
  expandCompletedTasks,
} from "../taskProgressView";

function makeTask(id: string, name = "Shared Quest"): Task {
  return {
    id,
    minPlayerLevel: 1,
    factionName: "Any",
    taskRequirements: [],
    wikiLink: "https://example.test/shared-quest",
    name,
    map: { name: "Customs" },
    maps: [{ name: "Customs" }],
    trader: { name: "Prapor" },
    kappaRequired: false,
    lightkeeperRequired: false,
    objectives: [
      {
        description: "Find the item",
        items: [{ id: "item-1", name: "Quest item" }],
        maps: [{ name: "Customs" }],
        count: 1,
        foundInRaid: false,
      },
    ],
  };
}

describe("task progress view mapping", () => {
  it("expands completed tasks across logical PvP/PvE variants", () => {
    const regularTask = makeTask("regular-task");
    const pveTask = makeTask("pve-task");
    const groups = buildLogicalTaskIdGroups({
      regular: [regularTask],
      pve: [pveTask],
    });

    const expanded = expandCompletedTasks(new Set(["regular-task"]), groups);

    expect(expanded.has("regular-task")).toBe(true);
    expect(expanded.has("pve-task")).toBe(true);
  });

  it("does not complete mode-only quests with different logical identity", () => {
    const regularTask = makeTask("regular-task", "PvP Only Quest");
    const pveTask = makeTask("pve-task", "PvE Only Quest");
    const groups = buildLogicalTaskIdGroups({
      regular: [regularTask],
      pve: [pveTask],
    });

    const expanded = expandCompletedTasks(new Set(["regular-task"]), groups);

    expect(expanded.has("regular-task")).toBe(true);
    expect(expanded.has("pve-task")).toBe(false);
  });

  it("expands objective completion from legacy task IDs to equivalent mode IDs", () => {
    const regularTask = makeTask("regular-task");
    const pveTask = makeTask("pve-task");
    const tasksByMode: Partial<Record<"regular" | "pve", Task[]>> = {
      regular: [regularTask],
      pve: [pveTask],
    };
    const tasksById = new Map([
      [regularTask.id, regularTask],
      [pveTask.id, pveTask],
    ]);
    const groups = buildLogicalTaskIdGroups(tasksByMode);
    const regularLegacyObjectiveKey = buildLegacyTaskObjectiveKey(
      regularTask.id,
      0,
    );
    const pveLegacyObjectiveKey = buildLegacyTaskObjectiveKey(pveTask.id, 0);
    const pveStableObjectiveKey = buildTaskObjectiveKeys(pveTask)[0];

    const expanded = expandCompletedTaskObjectives(
      new Set([regularLegacyObjectiveKey]),
      tasksByMode,
      tasksById,
      groups,
    );

    expect(expanded.has(regularLegacyObjectiveKey)).toBe(true);
    expect(expanded.has(pveLegacyObjectiveKey)).toBe(true);
    expect(expanded.has(pveStableObjectiveKey)).toBe(true);
  });
});
