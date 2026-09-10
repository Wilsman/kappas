import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StorylineQuestsView } from "@/components/StorylineQuestsView";
import type { StorylineChapter } from "@/types/storyline";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const chapters: StorylineChapter[] = [
  {
    id: "boreas",
    name: "Boreas",
    steps: [
      {
        id: "boreas-step-1",
        index: 1,
        trader: "Prapor",
        minPlayerLevel: 1,
        delaySecondsMin: 0,
        delaySecondsMax: 0,
        requirements: [],
        objectives: [
          {
            id: "api-dialogue-objective",
            description: "Talk to Prapor about the operation",
            type: "dialogue",
            optional: false,
            maps: [],
            items: [],
            details: [],
          },
        ],
      },
    ],
  },
];

const pairedChapters: StorylineChapter[] = [
  {
    id: "tour",
    name: "Tour",
    steps: [
      {
        id: "tour-step-2",
        index: 2,
        trader: "Therapist",
        minPlayerLevel: 0,
        delaySecondsMin: 0,
        delaySecondsMax: 0,
        requirements: [
          {
            id: "previous-task",
            type: "task",
            label: "Tour · Escape Ground Zero must be completed",
          },
        ],
        objectives: [
          {
            id: "collect-roubles",
            description: "Collect the required amount in RUB",
            type: "findItem",
            optional: true,
            count: 250000,
            foundInRaid: true,
            maps: [],
            items: [{ id: "roubles", name: "Roubles" }],
            details: [],
          },
          {
            id: "handover-roubles",
            description: "Hand over the cash to Therapist",
            type: "giveItem",
            optional: false,
            count: 250000,
            maps: [],
            items: [{ id: "roubles", name: "Roubles" }],
            details: [],
          },
        ],
        finishRewards: {
          entries: [
            {
              id: "xp",
              type: "experience",
              label: "Experience",
              count: 5000,
            },
          ],
        },
      },
    ],
  },
];

const mountedRoots: Array<ReturnType<typeof createRoot>> = [];

afterEach(async () => {
  await act(async () => {
    mountedRoots.splice(0).forEach((root) => root.unmount());
  });
  document.body.replaceChildren();
});

describe("StorylineQuestsView", () => {
  it("loads the API-backed view without shadowing the native Map constructor", () => {
    const html = renderToStaticMarkup(
      <StorylineQuestsView
        chapters={chapters}
        isLoading={false}
        error={null}
        updatedAt={Date.UTC(2026, 7, 14)}
        source="network"
        isStale={false}
        onRetry={vi.fn()}
        completedObjectives={new Set()}
        onToggleObjective={vi.fn()}
        onSetCompletedObjectives={vi.fn()}
      />,
    );

    expect(html).toContain("1.0 Storyline Quests");
    expect(html).toContain("Boreas");
    expect(html).toContain("1 chapters");
    expect(html).toContain("0/1 (0%)");
  });

  it("renders the retry state when no cached Storyline data is available", () => {
    const html = renderToStaticMarkup(
      <StorylineQuestsView
        chapters={[]}
        isLoading={false}
        error="Network unavailable"
        updatedAt={null}
        source={null}
        isStale={false}
        onRetry={vi.fn()}
        completedObjectives={new Set()}
        onToggleObjective={vi.fn()}
        onSetCompletedObjectives={vi.fn()}
      />,
    );

    expect(html).toContain("Storyline data unavailable");
    expect(html).toContain("Network unavailable");
    expect(html).toContain("Retry");
  });

  it("renders and controls an exact collect and hand-over pair as one task", async () => {
    const onToggleObjective = vi.fn();
    const onUpdateItemProgress = vi.fn();
    const onSetCompletedObjectives = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push(root);

    await act(async () => {
      root.render(
        <StorylineQuestsView
          chapters={pairedChapters}
          isLoading={false}
          error={null}
          updatedAt={Date.UTC(2026, 7, 14)}
          source="network"
          isStale={false}
          onRetry={vi.fn()}
          completedObjectives={new Set(["collect-roubles"])}
          onToggleObjective={onToggleObjective}
          onSetCompletedObjectives={onSetCompletedObjectives}
          taskObjectiveItemProgress={{
            "storyline-objective::collect-roubles::items": 1200,
            "storyline-objective::handover-roubles::items": 1400,
          }}
          onUpdateTaskObjectiveItemProgress={onUpdateItemProgress}
        />,
      );
    });

    expect(container.textContent).toContain("Hand over the cash to Therapist");
    expect(container.textContent).not.toContain("Step 2");
    expect(container.textContent).toContain("0/1 tasks");
    expect(container.textContent).toContain("Collect + hand over");
    expect(container.textContent).toContain(
      "Collect first:Collect the required amount in RUBOptionalFIR",
    );
    expect(container.textContent).toContain("Requires");
    expect(container.textContent).toContain("Completion rewards");

    const checkbox = container.querySelector<HTMLButtonElement>(
      'button[role="checkbox"]',
    );
    expect(checkbox?.getAttribute("data-state")).toBe("indeterminate");
    await act(async () => checkbox?.click());
    expect(onToggleObjective).toHaveBeenCalledWith("handover-roubles", [
      "collect-roubles",
      "handover-roubles",
    ]);

    const progressInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Progress for Hand over the cash to Therapist"]',
    );
    expect(progressInput?.value).toBe("1400");
    const increaseButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Increase progress for Hand over the cash to Therapist"]',
    );
    await act(async () => increaseButton?.click());
    expect(onUpdateItemProgress).toHaveBeenCalledWith(
      "storyline-objective::handover-roubles::items",
      1401,
      ["storyline-objective::collect-roubles::items"],
    );

    const completeAllButton = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.trim() === "Complete all");
    await act(async () => completeAllButton?.click());
    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]');
    const confirmButton = Array.from(
      dialog?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    ).find((button) => button.textContent?.trim() === "Complete all");
    await act(async () => confirmButton?.click());
    const completedSet = onSetCompletedObjectives.mock.calls[0]?.[0] as Set<string>;
    expect(completedSet).toEqual(
      new Set(["collect-roubles", "handover-roubles"]),
    );
  });
});
