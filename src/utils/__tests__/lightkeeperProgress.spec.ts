import { describe, expect, it } from "vitest";
import {
  calculateLightkeeperProgress,
  LIGHTKEEPER_BATYA_STEPS,
  LIGHTKEEPER_SIDEQUEST_STEPS,
  LIGHTKEEPER_STAGE_TWO_TASKS,
  normalizeLightkeeperPath,
} from "@/utils/lightkeeperProgress";

const emptyProgress = () => ({
  completedTasks: new Set<string>(),
  completedStorylineObjectives: new Set<string>(),
  completedStorylineMapNodes: new Set<string>(),
});

describe("calculateLightkeeperProgress", () => {
  it("requires Scav karma and one complete route", () => {
    const completedStorylineObjectives = new Set(
      LIGHTKEEPER_BATYA_STEPS.map((step) => step.id),
    );

    expect(
      calculateLightkeeperProgress({
        scavKarma: 0.99,
        ...emptyProgress(),
        completedStorylineObjectives,
      }).stageOneReady,
    ).toBe(false);

    const progress = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineObjectives,
    });

    expect(progress.routes.batya.completed).toBe(22);
    expect(progress.stageOneReady).toBe(true);
  });

  it("tracks The Ticket from both storyline map nodes", () => {
    const progress = calculateLightkeeperProgress({
      scavKarma: 1.2,
      ...emptyProgress(),
      completedStorylineMapNodes: new Set(["prapor-comp", "lk-access"]),
    });

    expect(progress.routes.ticket.completed).toBe(2);
    expect(progress.routes.ticket.isComplete).toBe(true);
    expect(progress.stageOneReady).toBe(true);
  });

  it("tracks partial progress across the selected route", () => {
    const completedStorylineObjectives = new Set(
      LIGHTKEEPER_BATYA_STEPS.slice(0, 14).map((step) => step.id),
    );
    const progress = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineObjectives,
    });

    expect(progress.routes.batya.completed).toBe(14);
    expect(progress.routes.batya.total).toBe(22);
    expect(progress.routes.batya.steps[14].isComplete).toBe(false);
  });

  it("accepts any Chemical outcome in the sidequests route", () => {
    const completedTasks = new Set(
      LIGHTKEEPER_SIDEQUEST_STEPS.flatMap((step) =>
        step.id === "chemical-choice" ? [step.taskIds![1]] : [step.taskIds![0]],
      ),
    );
    const progress = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedTasks,
    });

    expect(progress.routes.quests.completed).toBe(13);
    expect(progress.routes.quests.label).toBe("Sidequests Route");
    expect(progress.routes.quests.isComplete).toBe(true);
  });

  it("infers Stage 1 was reached from imported Stage 2 progress", () => {
    const progress = calculateLightkeeperProgress({
      scavKarma: null,
      ...emptyProgress(),
      completedTasks: new Set([LIGHTKEEPER_STAGE_TWO_TASKS[3].id]),
    });

    expect(progress.stageOneReached).toBe(true);
    expect(progress.stageOneReady).toBe(true);
    expect(progress.nextStageTwoTask?.name).toBe("Network Provider - Part 1");
  });

  it("only unlocks Lightkeeper at Getting Acquainted", () => {
    const beforeFinal = calculateLightkeeperProgress({
      scavKarma: null,
      ...emptyProgress(),
      completedTasks: new Set([
        ...LIGHTKEEPER_STAGE_TWO_TASKS.slice(0, -1).map((task) => task.id),
      ]),
    });
    expect(beforeFinal.lightkeeperUnlocked).toBe(false);
    expect(beforeFinal.nextStageTwoTask?.name).toBe("Getting Acquainted");

    const complete = calculateLightkeeperProgress({
      scavKarma: null,
      ...emptyProgress(),
      completedTasks: new Set(
        LIGHTKEEPER_STAGE_TWO_TASKS.map((task) => task.id),
      ),
    });
    expect(complete.lightkeeperUnlocked).toBe(true);
    expect(complete.stageTwoCompleted).toBe(8);
  });
});

describe("normalizeLightkeeperPath", () => {
  it("keeps supported routes and defaults to Batya", () => {
    expect(normalizeLightkeeperPath("ticket")).toBe("ticket");
    expect(normalizeLightkeeperPath("quests")).toBe("quests");
    expect(normalizeLightkeeperPath("unknown")).toBe("batya");
  });
});
