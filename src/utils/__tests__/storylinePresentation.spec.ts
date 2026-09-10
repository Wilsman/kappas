import { describe, expect, it } from "vitest";
import type { StorylineObjective, StorylineStep } from "@/types/storyline";
import {
  getStorylineDisplayProgress,
  getStorylineStepTitle,
  groupStorylineObjectives,
  isStorylineObjectiveGroupCompleted,
  isStorylineObjectiveGroupPartiallyCompleted,
  isStorylineObjectiveGroupWorkingOn,
} from "@/utils/storylinePresentation";

const objective = (
  overrides: Partial<StorylineObjective> & Pick<StorylineObjective, "id" | "type">,
): StorylineObjective => ({
  description: overrides.id,
  optional: false,
  maps: [],
  items: [],
  details: [],
  ...overrides,
});

const step = (objectives: StorylineObjective[]): StorylineStep => ({
  id: "step",
  index: 2,
  minPlayerLevel: 0,
  delaySecondsMin: 0,
  delaySecondsMax: 0,
  requirements: [],
  objectives,
});

describe("storylinePresentation", () => {
  it("groups an exact collect and hand-over pair without changing API order", () => {
    const dialogue = objective({ id: "dialogue", type: "dialogue" });
    const give = objective({
      id: "give",
      type: "giveItem",
      count: 3,
      items: [{ id: "battery", name: "Battery" }],
    });
    const find = objective({
      id: "find",
      type: "findItem",
      count: 3,
      optional: true,
      items: [{ id: "battery", name: "Battery" }],
    });

    const groups = groupStorylineObjectives([dialogue, give, find]);

    expect(groups).toHaveLength(2);
    expect(groups[0].objectiveIds).toEqual(["dialogue"]);
    expect(groups[1]).toMatchObject({
      objectiveIds: ["give", "find"],
      canonicalObjectiveId: "give",
      paired: true,
    });
  });

  it("matches item order and quest items but rejects different counts and types", () => {
    const items = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ];
    const itemPair = groupStorylineObjectives([
      objective({ id: "find", type: "findItem", count: 2, items }),
      objective({
        id: "give",
        type: "giveItem",
        count: 2,
        items: [...items].reverse(),
      }),
    ]);
    const questPair = groupStorylineObjectives([
      objective({
        id: "quest-find",
        type: "findQuestItem",
        questItem: { id: "drive", name: "Drive" },
      }),
      objective({
        id: "quest-give",
        type: "giveQuestItem",
        questItem: { id: "drive", name: "Drive" },
      }),
    ]);
    const nonPairs = groupStorylineObjectives([
      objective({ id: "find-count", type: "findItem", count: 2, items }),
      objective({ id: "give-count", type: "giveItem", count: 3, items }),
      objective({ id: "plant", type: "plantItem", count: 2, items }),
    ]);

    expect(itemPair).toHaveLength(1);
    expect(questPair).toHaveLength(1);
    expect(nonPairs).toHaveLength(3);
  });

  it("uses the first required non-dialogue objective as an unnamed step title", () => {
    const unnamedStep = step([
      objective({ id: "talk", type: "dialogue", description: "Talk to Prapor" }),
      objective({
        id: "handover",
        type: "giveItem",
        description: "Hand over the supplies",
        items: [{ id: "supply", name: "Supply" }],
      }),
    ]);

    expect(getStorylineStepTitle(unnamedStep)).toBe("Hand over the supplies");
    expect(getStorylineStepTitle({ ...unnamedStep, name: "Translated task" })).toBe(
      "Translated task",
    );
  });

  it("treats partial pairs as indeterminate and counts a completed pair once", () => {
    const pairedStep = step([
      objective({
        id: "find",
        type: "findItem",
        items: [{ id: "cash", name: "Roubles" }],
      }),
      objective({
        id: "give",
        type: "giveItem",
        items: [{ id: "cash", name: "Roubles" }],
      }),
    ]);
    const [group] = groupStorylineObjectives(pairedStep.objectives);

    expect(
      isStorylineObjectiveGroupPartiallyCompleted(group, new Set(["find"])),
    ).toBe(true);
    expect(
      isStorylineObjectiveGroupCompleted(group, new Set(["find", "give"])),
    ).toBe(true);
    expect(
      isStorylineObjectiveGroupWorkingOn(group, new Set(["find"])),
    ).toBe(true);
    expect(
      getStorylineDisplayProgress(
        [{ id: "chapter", name: "Chapter", steps: [pairedStep] }],
        new Set(["find", "give"]),
      ),
    ).toEqual({ total: 1, completed: 1 });
  });

  it("does not merge matching objectives from different upstream tasks", () => {
    const collectStep = step([
      objective({
        id: "find",
        type: "findItem",
        items: [{ id: "cash", name: "Roubles" }],
      }),
    ]);
    const handoverStep = {
      ...step([
        objective({
          id: "give",
          type: "giveItem",
          items: [{ id: "cash", name: "Roubles" }],
        }),
      ]),
      id: "other-step",
    };

    expect(
      getStorylineDisplayProgress(
        [
          {
            id: "chapter",
            name: "Chapter",
            steps: [collectStep, handoverStep],
          },
        ],
        new Set(),
      ),
    ).toEqual({ total: 2, completed: 0 });
  });
});
