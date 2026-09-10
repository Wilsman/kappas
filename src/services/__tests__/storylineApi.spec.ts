import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { taskStorage } from "@/utils/indexedDB";
import type { StorylineChapter } from "@/types/storyline";
import {
  STORYLINE_API_BASE_URL,
  loadStorylineData,
  normalizeStorylineData,
} from "../storylineApi";

const translations = {
  tasks: {
    "obj-dialogue": "Talk to Therapist",
    "obj-items": "Hand over any weapon",
    "obj-quest": "Find the sealed folder",
    "quest-1 Name": "Sealed folder",
    "normal-task Name": "Saving Private Roman",
  },
  items: {
    "item-1 Name": "AK-74",
    "item-2 Name": "M4A1",
    "reward-1 Name": "Roubles",
  },
  traders: {
    "trader-1 Nickname": "Therapist",
  },
  maps: {
    "map-1 Name": "Ground Zero",
  },
  hideout: {},
};

const payload = {
  data: {
    tasks: {
      "normal-task": { id: "normal-task", name: "normal-task Name" },
    },
    questItems: {
      "quest-1": {
        id: "quest-1",
        name: "quest-1 Name",
        iconLink: "quest.webp",
      },
    },
    story: [
      {
        id: "chapter-1",
        _name: "Tour",
        tasks: [
          {
            id: "step-1",
            name: "step-1 name",
            trader: "trader-1",
            minPlayerLevel: 5,
            taskRequirements: [
              { task: "normal-task", status: ["complete"] },
            ],
            otherRequirements: [
              { id: "route", type: "globalVariable", value: 1 },
            ],
            availableDelaySecondsMin: 3600,
            availableDelaySecondsMax: 3600,
            objectives: [
              {
                id: "dialogue-1",
                description: "obj-dialogue",
                type: "dialogue",
                count: 1,
                optional: false,
                maps: ["map-1"],
              },
              {
                id: "items-1",
                description: "obj-items",
                type: "giveItem",
                count: 2,
                optional: true,
                foundInRaid: true,
                items: ["item-1", "item-2"],
              },
              {
                id: "quest-objective",
                description: "obj-quest",
                type: "findQuestItem",
                optional: false,
                questItem: "quest-1",
              },
            ],
            finishRewards: {
              items: [{ item: "reward-1", count: 250000 }],
              traderDialogueUnlock: ["trader-1"],
              locationUnlock: ["map-1"],
            },
            failureOutcome: {
              traderStanding: [{ trader: "trader-1", standing: -0.2 }],
            },
            experience: 1200,
          },
        ],
      },
    ],
  },
};

const normalizedFixture = (): StorylineChapter[] =>
  normalizeStorylineData(payload, translations);

const response = (data: unknown) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(data),
});

describe("normalizeStorylineData", () => {
  it("preserves nested order and translates objectives, items, requirements, and rewards", () => {
    const chapters = normalizedFixture();
    const step = chapters[0].steps[0];

    expect(chapters).toHaveLength(1);
    expect(step.index).toBe(1);
    expect(step.name).toBeUndefined();
    expect(step.trader).toBe("Therapist");
    expect(step.delaySecondsMax).toBe(3600);
    expect(step.requirements.map((requirement) => requirement.label)).toEqual([
      "Saving Private Roman must be completed",
      "Story route condition",
    ]);
    expect(step.objectives[0]).toMatchObject({
      id: "dialogue-1",
      type: "dialogue",
      description: "Talk to Therapist",
      maps: ["Ground Zero"],
    });
    expect(step.objectives[1]).toMatchObject({
      optional: true,
      count: 2,
      foundInRaid: true,
    });
    expect(step.objectives[1].items.map((item) => item.name)).toEqual([
      "AK-74",
      "M4A1",
    ]);
    expect(step.objectives[2].questItem).toMatchObject({
      name: "Sealed folder",
      iconLink: "quest.webp",
    });
    expect(step.finishRewards?.entries.map((entry) => entry.type)).toEqual([
      "experience",
      "item",
      "dialogue",
      "location",
    ]);
    expect(step.failureOutcome?.entries[0]).toMatchObject({
      type: "standing",
      count: -0.2,
    });
    expect(step.startRewards).toBeUndefined();
  });

  it("keeps unknown objective types renderable", () => {
    const unknownPayload = structuredClone(payload);
    unknownPayload.data.story[0].tasks[0].objectives[0].type = "futureType";
    expect(
      normalizeStorylineData(unknownPayload, translations)[0].steps[0]
        .objectives[0].type,
    ).toBe("futureType");
  });
});

describe("loadStorylineData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(taskStorage, "getProfileId").mockReturnValue("profile-1");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a fresh mode/language cache without network requests", async () => {
    const chapters = normalizedFixture();
    vi.spyOn(taskStorage, "loadStorylineApiCache").mockResolvedValue({
      chapters,
      updatedAt: Date.now(),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadStorylineData("pvp-season", "en");

    expect(result).toMatchObject({ source: "cache", stale: false, chapters });
    expect(taskStorage.loadStorylineApiCache).toHaveBeenCalledWith(
      "pvp-season",
      "en",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches mode-matched dev endpoints and stores normalized data", async () => {
    vi.spyOn(taskStorage, "loadStorylineApiCache").mockResolvedValue(null);
    const saveSpy = vi
      .spyOn(taskStorage, "saveStorylineApiCache")
      .mockResolvedValue();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(payload))
      .mockResolvedValueOnce(response({ data: translations.tasks }))
      .mockResolvedValueOnce(response({ data: translations.items }))
      .mockResolvedValueOnce(response({ data: translations.traders }))
      .mockResolvedValueOnce(response({ data: translations.maps }))
      .mockResolvedValueOnce(response({ data: translations.hideout }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadStorylineData("pve", "de");

    expect(result.source).toBe("network");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${STORYLINE_API_BASE_URL}/pve/tasks`,
      `${STORYLINE_API_BASE_URL}/pve/tasks_de`,
      `${STORYLINE_API_BASE_URL}/pve/items_de`,
      `${STORYLINE_API_BASE_URL}/pve/traders_de`,
      `${STORYLINE_API_BASE_URL}/pve/maps_de`,
      `${STORYLINE_API_BASE_URL}/pve/hideout_de`,
    ]);
    expect(saveSpy).toHaveBeenCalledWith("pve", "de", result.chapters);
  });

  it("returns stale cached data when refresh fails", async () => {
    const chapters = normalizedFixture();
    vi.spyOn(taskStorage, "loadStorylineApiCache").mockResolvedValue({
      chapters,
      updatedAt: 1,
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(
      loadStorylineData("regular", "en", { forceRefresh: true }),
    ).resolves.toMatchObject({ source: "cache", stale: true, chapters });
  });

  it("throws when both network and cache are unavailable", async () => {
    vi.spyOn(taskStorage, "loadStorylineApiCache").mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(loadStorylineData("regular", "en")).rejects.toThrow(
      "Storyline API request failed",
    );
  });
});
