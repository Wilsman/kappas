import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";
import {
  fetchCombinedData,
  loadCombinedCache,
  saveCombinedCache,
  isCombinedCacheFresh,
  buildCombinedCacheKey,
  API_CACHE_KEY,
  API_CACHE_TTL_MS,
  SHARED_CACHE_KEY,
  sanitizeTaskRewardData,
} from "../tarkovApi";

interface MockResponse<T> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
}

function mockFetchOnce<T>(data: T, ok = true, status = 200) {
  const mockResponse: MockResponse<T> = {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
  // Assign a mocked fetch returning our typed response
  (globalThis as unknown as { fetch: unknown }).fetch = vi
    .fn()
    .mockResolvedValue(mockResponse);
}

describe("fetchCombinedData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns tasks, collectorItems, achievements, and hideoutStations on success", async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: "t1",
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: "Customs" },
            taskRequirements: [],
            trader: { name: "Prapor", imageLink: "img" },
            wikiLink: "link",
            name: "Task 1",
            startRewards: { items: [] },
            finishRewards: { items: [] },
            objectives: [],
          },
        ],
        task: {
          objectives: [
            {
              items: [{ id: "i1", name: "Old firesteel", iconLink: "icon" }],
            },
          ],
        },
        achievements: [
          {
            id: "a1",
            imageLink: "img",
            name: "Ach 1",
            description: "desc",
            hidden: false,
            playersCompletedPercent: 1,
            adjustedPlayersCompletedPercent: 1,
            side: "All",
            rarity: "Common",
          },
        ],
        hideoutStations: [
          {
            name: "Workbench",
            imageLink: "img",
            levels: [
              {
                level: 1,
                skillRequirements: [],
                stationLevelRequirements: [],
                itemRequirements: [
                  { count: 1, item: { name: "Screwdriver", iconLink: "icon" } },
                ],
              },
            ],
          },
        ],
      },
    };

    mockFetchOnce(apiResponse);
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks.length).toBe(1);
    expect(result.collectorItems.data.task.objectives[0].items[0].id).toBe(
      "i1",
    );
    expect(result.achievements.data.achievements[0].id).toBe("a1");
    expect(result.hideoutStations.data.hideoutStations[0].name).toBe(
      "Workbench",
    );

    // Ensure correct fetch calls
    const fetchSpy = globalThis.fetch as unknown as Mock;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const calls = fetchSpy.mock.calls as [input: unknown, init?: unknown][];
    const graphCall = calls.find((call) =>
      String(call[0]).includes("https://api.tarkov.dev/graphql"),
    );
    const overlayCall = calls.find((call) =>
      String(call[0]).includes("tarkov-data-overlay"),
    );
    expect(graphCall).toBeDefined();
    expect(overlayCall).toBeDefined();
    const init = (graphCall?.[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? "{}") as { query?: string };
    expect(body.query).toContain("tasks");
    expect(body.query).toContain("gameMode: regular");
    expect(body.query).toContain("achievements");
    expect(body.query).toContain("hideoutStations");
    expect(body.query).toContain("experience");
    expect(body.query).toContain("traderStanding");
    expect(body.query).toContain("skillLevelReward");
    expect(body.query).toContain("traderUnlock");
    expect(body.query).toContain("craftUnlock");
    expect(body.query).toContain("customization");
    expect(body.query).toContain("achievement");
  });

  it("throws on HTTP error", async () => {
    (globalThis as unknown as { fetch: Mock }).fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchCombinedData()).rejects.toThrow("HTTP error");
  });

  it("throws on GraphQL errors array", async () => {
    const apiResponse: { data: object; errors: { message: string }[] } = {
      data: {},
      errors: [{ message: "boom" }],
    };
    mockFetchOnce(apiResponse);
    await expect(fetchCombinedData()).rejects.toThrow(/GraphQL error: boom/);
  });

  it("requests PvE tasks when pve mode is selected", async () => {
    mockFetchOnce({
      data: {
        tasks: [],
        task: { objectives: [] },
        achievements: [],
        hideoutStations: [],
      },
    });

    await fetchCombinedData("pve");

    const fetchSpy = globalThis.fetch as unknown as Mock;
    const calls = fetchSpy.mock.calls as [input: unknown, init?: unknown][];
    const graphCall = calls.find((call) =>
      String(call[0]).includes("https://api.tarkov.dev/graphql"),
    );
    const init = (graphCall?.[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? "{}") as { query?: string };
    expect(body.query).toContain("gameMode: pve");
  });

  it("uses partial task data when GraphQL returns recoverable field errors", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const apiResponse = {
      data: {
        tasks: [
          {
            id: "t-partial",
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: null,
            taskRequirements: [],
            trader: { name: "Prapor", imageLink: "img" },
            wikiLink: "link",
            name: "Partial Task",
            startRewards: { items: [] },
            finishRewards: {
              customization: [{ id: "c1", name: null, imageLink: "img" }],
              items: [],
            },
            objectives: [],
          },
        ],
        achievements: [],
        hideoutStations: [],
      },
      errors: [
        {
          message: "Missing translation for key 707265736574000000000254 Name",
        },
      ],
    };

    mockFetchOnce(apiResponse);
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].id).toBe("t-partial");
    expect(result.collectorItems.data.task.objectives).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[Tarkov API] GraphQL returned partial data; continuing with available task payload.",
      apiResponse.errors,
    );
  });

  it("handles missing optional fields with defaults", async () => {
    const partialResponse = {
      data: {
        tasks: [
          {
            id: "t2",
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: "Woods" },
            taskRequirements: [],
            trader: { name: "Prapor", imageLink: "img" },
            wikiLink: "link2",
            name: "Task 2",
            startRewards: { items: [] },
            finishRewards: { items: [] },
            objectives: [],
          },
        ],
        task: {
          objectives: [],
        },
        // achievements missing
        // hideoutStations missing
      },
    };

    mockFetchOnce(partialResponse);
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks.length).toBe(1);
    expect(result.collectorItems.data.task.objectives.length).toBe(0);
    // Defaults
    expect(result.achievements.data.achievements).toEqual([]);
    expect(result.hideoutStations.data.hideoutStations).toEqual([]);
  });

  it("aggregates maps from task objectives", async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: "t1",
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: "Customs" },
            taskRequirements: [],
            trader: { name: "Prapor", imageLink: "img" },
            wikiLink: "link",
            name: "Task 1",
            objectives: [
              {
                maps: [{ name: "Customs" }, { name: "Woods" }],
                description: "Test",
              },
              {
                maps: [{ name: "Woods" }, { name: "Factory" }],
                description: "Test2",
              },
            ],
          },
        ],
        task: { objectives: [] },
        achievements: [],
        hideoutStations: [],
      },
    };

    mockFetchOnce(apiResponse);
    const result = await fetchCombinedData();

    const task = result.tasks.data.tasks[0];
    expect(task.maps.length).toBe(3);
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Customs");
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Woods");
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Factory");
  });

  it("preserves count for shoot objectives from the GraphQL response", async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: "intimidator",
            minPlayerLevel: 45,
            kappaRequired: true,
            lightkeeperRequired: false,
            map: null,
            taskRequirements: [],
            trader: { name: "Prapor", imageLink: "img" },
            wikiLink: "link",
            name: "Intimidator",
            objectives: [
              {
                description: "Eliminate Scavs with headshots",
                count: 40,
              },
            ],
            startRewards: { items: [] },
            finishRewards: { items: [] },
          },
        ],
        task: { objectives: [] },
        achievements: [],
        hideoutStations: [],
      },
    };

    mockFetchOnce(apiResponse);
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].objectives?.[0]?.count).toBe(40);

    const fetchSpy = globalThis.fetch as unknown as Mock;
    const calls = fetchSpy.mock.calls as [input: unknown, init?: unknown][];
    const graphCall = calls.find((call) =>
      String(call[0]).includes("https://api.tarkov.dev/graphql"),
    );
    const init = (graphCall?.[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? "{}") as { query?: string };
    expect(body.query).toContain("... on TaskObjectiveShoot { count }");
  });

  it("applies task wiki link overrides from the fetched overlay", async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: "6663148ca9290f9e0806cca1",
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: null,
            taskRequirements: [],
            trader: { name: "Fence", imageLink: "img" },
            wikiLink: "https://escapefromtarkov.fandom.com/wiki/Immunity",
            name: "Immunity",
            objectives: [],
          },
        ],
        task: { objectives: [] },
        achievements: [],
        hideoutStations: [],
      },
    };

    const overlayResponse = {
      tasks: {
        "6663148ca9290f9e0806cca1": {
          wikiLink: "https://escapefromtarkov.fandom.com/wiki/Immunity_(quest)",
        },
      },
      $meta: {
        version: "1.19",
        generated: "2026-03-21T21:38:28.266Z",
      },
    };

    (globalThis as unknown as { fetch: Mock }).fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(apiResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(overlayResponse),
      });

    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].wikiLink).toBe(
      "https://escapefromtarkov.fandom.com/wiki/Immunity_(quest)",
    );
  });
});

describe("sanitizeTaskRewardData", () => {
  it("removes reward rows that are missing item data", () => {
    const task = {
      id: "task",
      minPlayerLevel: 1,
      taskRequirements: [],
      wikiLink: "",
      name: "Task",
      map: null,
      maps: [],
      trader: { name: "Prapor" },
      startRewards: {
        items: [
          { item: null, count: 1 },
          { item: { name: "Valid start reward" }, count: 2 },
        ],
      },
      finishRewards: {
        items: [
          { item: null, count: 1 },
          { item: { name: "Valid finish reward" }, count: 3 },
        ],
        offerUnlock: [
          { item: null, trader: { name: "Prapor" }, level: 1 },
          { item: { name: "Valid unlock" }, trader: null, level: 1 },
          {
            item: { name: "Valid offer" },
            trader: { name: "Prapor" },
            level: 2,
          },
        ],
      },
    };

    const sanitized = sanitizeTaskRewardData(task as never);

    expect(sanitized.startRewards?.items).toHaveLength(1);
    expect(sanitized.startRewards?.items[0].item.name).toBe(
      "Valid start reward",
    );
    expect(sanitized.finishRewards?.items).toHaveLength(1);
    expect(sanitized.finishRewards?.items?.[0].item.name).toBe(
      "Valid finish reward",
    );
    expect(sanitized.finishRewards?.offerUnlock).toHaveLength(1);
    expect(sanitized.finishRewards?.offerUnlock?.[0].item.name).toBe(
      "Valid offer",
    );
  });
});

describe("Cache functionality", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should save and load cache by game mode", async () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    await saveCombinedCache(
      payload as Parameters<typeof saveCombinedCache>[0],
      "regular",
    );
    const loaded = loadCombinedCache("regular");

    expect(loaded).toBeTruthy();
    expect(loaded?.tasks.data.tasks).toEqual([]);
    expect(localStorage.getItem(buildCombinedCacheKey("regular"))).toBeTruthy();
  });

  it("should isolate cache by game mode", async () => {
    const regularPayload = {
      tasks: { data: { tasks: [{ id: "regular-task" }] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const pvePayload = {
      tasks: { data: { tasks: [{ id: "pve-task" }] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    await saveCombinedCache(
      regularPayload as unknown as Parameters<typeof saveCombinedCache>[0],
      "regular",
    );
    await saveCombinedCache(
      pvePayload as unknown as Parameters<typeof saveCombinedCache>[0],
      "pve",
    );

    expect(loadCombinedCache("regular")?.tasks.data.tasks[0].id).toBe(
      "regular-task",
    );
    expect(loadCombinedCache("pve")?.tasks.data.tasks[0].id).toBe("pve-task");
  });

  it("should use old cache as regular-mode fallback only", () => {
    const legacyPayload = {
      tasks: { data: { tasks: [{ id: "legacy-regular-task" }] } },
      collectorItems: { data: { task: { objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    localStorage.setItem(
      API_CACHE_KEY,
      JSON.stringify({ updatedAt: Date.now(), payload: legacyPayload }),
    );

    expect(loadCombinedCache("regular")?.tasks.data.tasks[0].id).toBe(
      "legacy-regular-task",
    );
    expect(isCombinedCacheFresh("regular")).toBe(true);
    expect(loadCombinedCache("pve")).toBeNull();
    expect(isCombinedCacheFresh("pve")).toBe(false);
  });

  it("should detect fresh cache", async () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    await saveCombinedCache(
      payload as unknown as Parameters<typeof saveCombinedCache>[0],
    );
    expect(isCombinedCacheFresh()).toBe(true);
  });

  it("should detect stale cache", () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    // Manually set old timestamp
    const staleCache = {
      updatedAt: Date.now() - API_CACHE_TTL_MS - 1000,
      payload,
    };
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(staleCache));

    expect(isCombinedCacheFresh()).toBe(false);
  });

  it("should detect stale per-mode cache entries", () => {
    const sharedCache = {
      updatedAt: Date.now() - API_CACHE_TTL_MS - 1000,
      collectorItems: { data: { task: { objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const taskCache = {
      updatedAt: Date.now() - API_CACHE_TTL_MS - 1000,
      payload: { tasks: { data: { tasks: [] } } },
    };

    localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(sharedCache));
    localStorage.setItem(
      buildCombinedCacheKey("regular"),
      JSON.stringify(taskCache),
    );
    localStorage.setItem(buildCombinedCacheKey("pve"), JSON.stringify(taskCache));

    expect(isCombinedCacheFresh("regular")).toBe(false);
    expect(isCombinedCacheFresh("pve")).toBe(false);
    expect(loadCombinedCache("regular")).toBeTruthy();
    expect(loadCombinedCache("pve")).toBeTruthy();
  });

  it("should return null for missing cache", () => {
    const loaded = loadCombinedCache();
    expect(loaded).toBeNull();
  });

  it("should handle corrupted cache gracefully", () => {
    localStorage.setItem(API_CACHE_KEY, "invalid json{");
    localStorage.setItem(buildCombinedCacheKey("regular"), "invalid json{");
    localStorage.setItem(buildCombinedCacheKey("pve"), "invalid json{");
    expect(loadCombinedCache()).toBeNull();
    expect(isCombinedCacheFresh()).toBe(false);
    expect(loadCombinedCache("pve")).toBeNull();
    expect(isCombinedCacheFresh("pve")).toBe(false);
  });

  it("should not return task-only per-mode cache as a combined payload", () => {
    localStorage.setItem(
      buildCombinedCacheKey("regular"),
      JSON.stringify({
        updatedAt: Date.now(),
        payload: { tasks: { data: { tasks: [{ id: "task-only" }] } } },
      }),
    );

    expect(loadCombinedCache("regular")).toBeNull();
  });

  it("should prune old API cache entries and retry after localStorage quota errors", async () => {
    const payload = {
      tasks: { data: { tasks: [{ id: "fresh-pve-task" }] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const originalSetItem = Storage.prototype.setItem;
    let pveWriteAttempts = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
        this: Storage,
        key: string,
        value: string,
      ) {
        if (key === buildCombinedCacheKey("pve")) {
          pveWriteAttempts++;
        }
        if (key === buildCombinedCacheKey("pve") && pveWriteAttempts === 1) {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        return originalSetItem.call(this, key, value);
      });

    localStorage.setItem(API_CACHE_KEY, "legacy");
    localStorage.setItem(buildCombinedCacheKey("regular"), "old-regular");

    await saveCombinedCache(
      payload as unknown as Parameters<typeof saveCombinedCache>[0],
      "pve",
    );

    expect(localStorage.getItem(API_CACHE_KEY)).toBeNull();
    expect(localStorage.getItem(buildCombinedCacheKey("regular"))).toBeNull();
    expect(loadCombinedCache("pve")?.tasks.data.tasks[0].id).toBe(
      "fresh-pve-task",
    );
  });
});
