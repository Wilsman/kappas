import { describe, expect, it } from "vitest";
import {
  calculateLightkeeperProgress,
  LIGHTKEEPER_BATYA_START_LOCATIONS,
  LIGHTKEEPER_BATYA_STEPS,
  LIGHTKEEPER_SIDEQUEST_STEPS,
  LIGHTKEEPER_STAGE_TWO_TASKS,
  LIGHTKEEPER_TICKET_STEPS,
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
      LIGHTKEEPER_BATYA_STEPS.flatMap((step) =>
        step.choices?.length
          ? [step.choices[0].id]
          : [step.objectiveId ?? step.id],
      ),
    );

    expect(
      calculateLightkeeperProgress({
        scavKarma: 1.99,
        ...emptyProgress(),
        completedStorylineObjectives,
      }).stageOneReady,
    ).toBe(false);

    const progress = calculateLightkeeperProgress({
      scavKarma: 2,
      ...emptyProgress(),
      completedStorylineObjectives,
    });

    expect(progress.routes.batya.completed).toBe(23);
    expect(progress.stageOneReady).toBe(true);
  });

  it("starts Batya after visiting any one listed location", () => {
    LIGHTKEEPER_BATYA_START_LOCATIONS.forEach((location) => {
      const progress = calculateLightkeeperProgress({
        scavKarma: null,
        ...emptyProgress(),
        completedStorylineObjectives: new Set([location.id]),
      });

      expect(progress.routes.batya.steps[0].isComplete).toBe(true);
      expect(progress.routes.batya.completed).toBe(1);
    });
  });

  it("links Batya checkpoints without adding redundant map links to start locations", () => {
    expect(LIGHTKEEPER_BATYA_STEPS).toHaveLength(23);
    expect(
      LIGHTKEEPER_BATYA_STEPS.every((step) => step.wikiUrl?.startsWith("https://")),
    ).toBe(true);
    expect(
      LIGHTKEEPER_BATYA_START_LOCATIONS.every(
        (location) => location.wikiUrl === undefined,
      ),
    ).toBe(true);
  });

  it("tracks Tour and Falling Skies while excluding optional objectives", () => {
    const completedStorylineObjectives = new Set(
      LIGHTKEEPER_TICKET_STEPS.flatMap((step) => {
        if (step.isOptional) return [];
        if (step.completionChoiceIds?.length) {
          return [step.completionChoiceIds[0]];
        }
        return [step.objectiveId ?? step.id];
      }),
    );
    const progress = calculateLightkeeperProgress({
      scavKarma: 2.2,
      ...emptyProgress(),
      completedStorylineObjectives,
    });

    expect(progress.routes.ticket.completed).toBe(29);
    expect(progress.routes.ticket.total).toBe(29);
    expect(progress.routes.ticket.isComplete).toBe(true);
    expect(progress.stageOneReady).toBe(true);
  });

  it("requires handing over the armored case for the Ticket shortcut", () => {
    const completedStorylineObjectives = new Set(
      LIGHTKEEPER_TICKET_STEPS.flatMap((step) => {
        if (step.isOptional || step.completionChoiceIds?.length) return [];
        return [step.objectiveId ?? step.id];
      }),
    );
    completedStorylineObjectives.add("falling-skies-main-20");

    const keepCase = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineObjectives,
    });
    expect(keepCase.routes.ticket.completed).toBe(28);
    expect(keepCase.routes.ticket.isComplete).toBe(false);

    completedStorylineObjectives.add("falling-skies-main-19");
    const handOverCase = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineObjectives,
    });
    expect(handOverCase.routes.ticket.completed).toBe(29);
    expect(handOverCase.routes.ticket.isComplete).toBe(true);
  });

  it("preserves imported legacy Ticket completion from the storyline map", () => {
    const progress = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineMapNodes: new Set(["lk-access"]),
    });

    expect(progress.routes.ticket.completed).toBe(29);
    expect(progress.routes.ticket.isComplete).toBe(true);
  });

  it("provides guide links and FIR counters for the Ticket journey", () => {
    expect(
      LIGHTKEEPER_TICKET_STEPS.every((step) =>
        step.wikiUrl?.startsWith("https://"),
      ),
    ).toBe(true);
    expect(
      LIGHTKEEPER_TICKET_STEPS.filter(
        (step) => step.itemRequirement?.foundInRaid,
      ),
    ).toHaveLength(5);
  });

  it("tracks partial progress across the selected route", () => {
    const completedStorylineObjectives = new Set(
      LIGHTKEEPER_BATYA_STEPS.slice(0, 14).flatMap((step) =>
        step.choices?.length
          ? [step.choices[0].id]
          : [step.objectiveId ?? step.id],
      ),
    );
    const progress = calculateLightkeeperProgress({
      scavKarma: 1,
      ...emptyProgress(),
      completedStorylineObjectives,
    });

    expect(progress.routes.batya.completed).toBe(14);
    expect(progress.routes.batya.total).toBe(23);
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
