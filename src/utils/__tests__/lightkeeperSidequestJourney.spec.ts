import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import { LIGHTKEEPER_SIDEQUEST_STEPS } from "@/utils/lightkeeperProgress";
import {
  buildLightkeeperSidequestJourney,
  filterLightkeeperSidequestJourney,
  normalizeLightkeeperSidequestTarget,
} from "@/utils/lightkeeperSidequestJourney";

const ROOT_ID = "root-task";
const SHARED_ID = "shared-task";
const BRANCH_ID = "branch-task";

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
      task: {
        id: requirementId,
        name:
          requirementId === ROOT_ID
            ? "Root Task"
            : requirementId === SHARED_ID
              ? "Shared Task"
              : "Branch Task",
      },
    })),
    wikiLink: "",
    map: null,
    maps: [],
    trader: { name: "Therapist" },
  };
}

function journeyTasks() {
  const targetTasks = LIGHTKEEPER_SIDEQUEST_STEPS.flatMap((target) =>
    (target.taskIds ?? []).map((taskId) => task(taskId, target.label)),
  );
  const firstTargetId = LIGHTKEEPER_SIDEQUEST_STEPS[0].taskIds![0];
  const secondTargetId = LIGHTKEEPER_SIDEQUEST_STEPS[1].taskIds![0];

  return [
    task(ROOT_ID, "Root Task"),
    task(SHARED_ID, "Shared Task", [ROOT_ID]),
    task(BRANCH_ID, "Branch Task", [SHARED_ID]),
    ...targetTasks.map((targetTask) =>
      targetTask.id === firstTargetId
        ? task(targetTask.id, targetTask.name, [SHARED_ID])
        : targetTask.id === secondTargetId
          ? task(targetTask.id, targetTask.name, [BRANCH_ID])
          : targetTask,
    ),
  ];
}

describe("buildLightkeeperSidequestJourney", () => {
  it("deduplicates shared recursive prerequisites across destination quests", () => {
    const firstTarget = LIGHTKEEPER_SIDEQUEST_STEPS[0];
    const secondTarget = LIGHTKEEPER_SIDEQUEST_STEPS[1];
    const journey = buildLightkeeperSidequestJourney(
      journeyTasks(),
      new Set([ROOT_ID, SHARED_ID, firstTarget.taskIds![0]]),
    );

    expect(journey.prerequisites.map((entry) => entry.id)).toEqual([
      ROOT_ID,
      SHARED_ID,
      BRANCH_ID,
    ]);
    expect(
      journey.prerequisites.find((entry) => entry.id === ROOT_ID)?.targetIds,
    ).toEqual(expect.arrayContaining([firstTarget.id, secondTarget.id]));
    expect(journey.targets.find((target) => target.id === firstTarget.id)).toMatchObject(
      {
        completed: 3,
        total: 3,
        isComplete: true,
      },
    );
    expect(journey.targets.find((target) => target.id === secondTarget.id)).toMatchObject(
      {
        completed: 2,
        total: 4,
        isComplete: false,
      },
    );
    expect(journey.completed).toBe(3);
    expect(journey.total).toBe(16);
  });

  it("filters the shared checklist to one destination chain", () => {
    const secondTarget = LIGHTKEEPER_SIDEQUEST_STEPS[1];
    const journey = buildLightkeeperSidequestJourney(
      journeyTasks(),
      new Set<string>(),
    );
    const filtered = filterLightkeeperSidequestJourney(
      journey,
      secondTarget.id,
    );

    expect(filtered.prerequisites.map((entry) => entry.id)).toEqual([
      ROOT_ID,
      SHARED_ID,
      BRANCH_ID,
    ]);
    expect(filtered.targets.map((target) => target.id)).toEqual([
      secondTarget.id,
    ]);
  });

  it("counts the three Chemical outcomes as one destination requirement", () => {
    const chemicalTarget = LIGHTKEEPER_SIDEQUEST_STEPS.find(
      (target) => target.id === "chemical-choice",
    )!;
    const completedOutcome = chemicalTarget.taskIds![1];
    const journey = buildLightkeeperSidequestJourney(
      journeyTasks(),
      new Set([completedOutcome]),
    );
    const target = journey.targets.find(
      (entry) => entry.id === chemicalTarget.id,
    );

    expect(journey.targets).toHaveLength(13);
    expect(target?.isComplete).toBe(true);
    expect(target?.completed).toBe(1);
    expect(target?.total).toBe(1);
  });
});

describe("normalizeLightkeeperSidequestTarget", () => {
  it("keeps known destination filters and defaults to all quests", () => {
    expect(normalizeLightkeeperSidequestTarget("cargo-x-part-4")).toBe(
      "cargo-x-part-4",
    );
    expect(normalizeLightkeeperSidequestTarget("unknown")).toBe("all");
    expect(normalizeLightkeeperSidequestTarget(null)).toBe("all");
  });
});
