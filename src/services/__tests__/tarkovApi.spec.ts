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
  removeDeprecatedCollectorItems,
  normalizeCollectorItems,
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
              items: [{ id: "i1", name: "Kept item", iconLink: "icon" }],
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

  it("removes Collector items that were removed from the live game before the API updates", () => {
    const result = removeDeprecatedCollectorItems({
      id: "5c51aac186f77432ea65c552",
      objectives: [
        {
          items: [
            { id: "5bc9bc53d4351e00367fbcee", name: "Golden rooster figurine" },
            { id: "5bc9b156d4351e00367fbce9", name: "Jar of DevilDog mayo" },
            { id: "5bd073c986f7747f627e796c", name: "Kotton beanie" },
            { id: "5bc9c377d4351e3bac12251b", name: "Old firesteel" },
            { id: "5bc9c29cd4351e003562b8a3", name: "Can of sprats" },
            { id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" },
          ],
        },
      ],
    });

    expect(result.objectives.flatMap((objective) => objective.items)).toEqual([
      { id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" },
    ]);
  });

  it("normalizes Collector items to the current live-game total while the API lags", () => {
    const apiCollectorItems = [
      { id: "5bc9c377d4351e3bac12251b", name: "Old firesteel" },
      { id: "5bc9bc53d4351e00367fbcee", name: "Golden rooster figurine" },
      { id: "5bc9b156d4351e00367fbce9", name: "Jar of DevilDog mayo" },
      { id: "5bc9c29cd4351e003562b8a3", name: "Can of sprats" },
      { id: "5bd073c986f7747f627e796c", name: "Kotton beanie" },
      { id: "5bc9a18fd4351e003562b68e", name: "Antique axe" },
      { id: "5bc9c049d4351e44f824d360", name: "Battered antique book" },
      { id: "5bc9b720d4351e450201234b", name: "#FireKlean gun lube" },
      { id: "5bc9b355d4351e6d1509862a", name: "Silver Badge" },
      { id: "5bc9b9ecd4351e3bac122519", name: "Deadlyslob's beard oil" },
      { id: "5bc9bdb8d4351e003562b8a1", name: "Golden 1GPhone smartphone" },
      { id: "5bc9c1e2d4351e00367fbcf0", name: "Fake mustache" },
      { id: "5bc9c049d4351e44f824d360-raven", name: "Raven figurine" },
      { id: "5bc9c049d4351e44f824d360-plague", name: "Pestily plague mask" },
      { id: "5bc9c049d4351e44f824d360-shroud", name: "Shroud half-mask" },
      { id: "5bc9c049d4351e44f824d360-lupo", name: "Can of Dr. Lupo's coffee beans" },
      { id: "5bc9c049d4351e44f824d360-tea", name: "42 Signature Blend English Tea" },
      { id: "5bc9c049d4351e44f824d360-veritas", name: "Veritas guitar pick" },
      { id: "5bc9c049d4351e44f824d360-evasion", name: "Armband (Evasion)" },
      { id: "5bc9c049d4351e44f824d360-ratcola", name: "Can of RatCola soda" },
      { id: "5bc9c049d4351e44f824d360-lootlord", name: "Loot Lord plushie" },
      { id: "5bc9c049d4351e44f824d360-smoke", name: "Smoke balaclava" },
      { id: "5bc9c049d4351e44f824d360-wallet", name: "WZ Wallet" },
      { id: "5bc9c049d4351e44f824d360-ratpoison", name: "LVNDMARK's rat poison" },
      { id: "5bc9c049d4351e44f824d360-missam", name: "Missam forklift key" },
      { id: "5bc9c049d4351e44f824d360-cyborg", name: "Video cassette with the Cyborg Killer movie" },
      { id: "5bc9c049d4351e44f824d360-bakeezy", name: "BakeEzy cook book" },
      { id: "5bc9c049d4351e44f824d360-johnb", name: "JohnB Liquid DNB glasses" },
      { id: "5bc9c049d4351e44f824d360-baddie", name: "Baddie's red beard" },
      { id: "5bc9c049d4351e44f824d360-drd", name: "DRD body armor" },
      { id: "5bc9c049d4351e44f824d360-gingy", name: "Gingy keychain" },
      { id: "5bc9c049d4351e44f824d360-egg", name: "Golden egg" },
      { id: "5bc9c049d4351e44f824d360-noice", name: "Press pass (issued for NoiceGuy)" },
      { id: "5bc9c049d4351e44f824d360-axel", name: "Axel parrot figurine" },
      { id: "5bc9c049d4351e44f824d360-buddy", name: "BEAR Buddy plush toy" },
      { id: "5bc9c049d4351e44f824d360-glorious", name: "Glorious E lightweight armored mask" },
      { id: "5bc9c049d4351e44f824d360-inseq", name: "Inseq gas pipe wrench" },
      { id: "5bc9c049d4351e44f824d360-viibiin", name: "Viibiin sneaker" },
      { id: "5bc9c049d4351e44f824d360-kunai", name: "Tamatthi kunai knife replica" },
      { id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" },
      { id: "5bc9c049d4351e44f824d360-mazoni", name: "Mazoni golden dumbbell" },
      { id: "5bc9c049d4351e44f824d360-tigz", name: "Tigzresq splint" },
      { id: "5bc9c049d4351e44f824d360-domontovich", name: "Domontovich ushanka hat" },
    ];

    const result = normalizeCollectorItems({
      id: "5c51aac186f77432ea65c552",
      objectives: apiCollectorItems.map((item) => ({ items: [item] })),
    });
    const itemNames = result.objectives.flatMap((objective) =>
      objective.items.map((item) => item.name),
    );

    expect(itemNames).toHaveLength(41);
    expect(itemNames).toEqual(
      expect.arrayContaining([
        "DesmondPilak CD",
        "Dunduk floppy disk",
        "SheefGG piggy bank",
      ]),
    );
    expect(itemNames).not.toEqual(
      expect.arrayContaining([
        "Golden rooster figurine",
        "Jar of DevilDog mayo",
        "Kotton beanie",
        "Old firesteel",
        "Can of sprats",
      ]),
    );
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

  it("requests localized tasks and collector data when language is selected", async () => {
    mockFetchOnce({
      data: {
        tasks: [],
        task: { objectives: [] },
        achievements: [],
        hideoutStations: [],
      },
    });

    await fetchCombinedData("regular", "de");

    const fetchSpy = globalThis.fetch as unknown as Mock;
    const calls = fetchSpy.mock.calls as [input: unknown, init?: unknown][];
    const graphCall = calls.find((call) =>
      String(call[0]).includes("https://api.tarkov.dev/graphql"),
    );
    const init = (graphCall?.[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? "{}") as { query?: string };
    expect(body.query).toContain("tasks(lang: de, gameMode: regular)");
    expect(body.query).toContain(
      'task(id: "5c51aac186f77432ea65c552", lang: de)',
    );
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

  it("should isolate task cache by language", async () => {
    const englishPayload = {
      tasks: { data: { tasks: [{ id: "english-task" }] } },
      collectorItems: { data: { task: { id: "collector-en", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const germanPayload = {
      tasks: { data: { tasks: [{ id: "german-task" }] } },
      collectorItems: { data: { task: { id: "collector-de", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    await saveCombinedCache(
      englishPayload as unknown as Parameters<typeof saveCombinedCache>[0],
      "regular",
      "en",
    );
    await saveCombinedCache(
      germanPayload as unknown as Parameters<typeof saveCombinedCache>[0],
      "regular",
      "de",
    );

    expect(buildCombinedCacheKey("regular", "en")).toBe(
      "taskTracker_api_cache_v4::regular::en",
    );
    expect(buildCombinedCacheKey("regular", "de")).toBe(
      "taskTracker_api_cache_v4::regular::de",
    );
    expect(loadCombinedCache("regular", "en")?.tasks.data.tasks[0].id).toBe(
      "english-task",
    );
    expect(loadCombinedCache("regular", "de")?.tasks.data.tasks[0].id).toBe(
      "german-task",
    );
    expect(loadCombinedCache("regular", "en")?.collectorItems.data.task.id).toBe(
      "collector-en",
    );
    expect(loadCombinedCache("regular", "de")?.collectorItems.data.task.id).toBe(
      "collector-de",
    );
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
    expect(loadCombinedCache("regular", "de")).toBeNull();
    expect(isCombinedCacheFresh("regular", "de")).toBe(false);
    expect(loadCombinedCache("pve")).toBeNull();
    expect(isCombinedCacheFresh("pve")).toBe(false);
  });

  it("should use legacy split cache as English fallback only", () => {
    const sharedCache = {
      updatedAt: Date.now(),
      collectorItems: { data: { task: { id: "collector-en", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const taskCache = {
      updatedAt: Date.now(),
      payload: { tasks: { data: { tasks: [{ id: "legacy-split-task" }] } } },
    };

    localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(sharedCache));
    localStorage.setItem(
      "taskTracker_api_cache_v3::regular",
      JSON.stringify(taskCache),
    );

    expect(loadCombinedCache("regular", "en")?.tasks.data.tasks[0].id).toBe(
      "legacy-split-task",
    );
    expect(loadCombinedCache("regular", "en")?.collectorItems.data.task.id).toBe(
      "collector-en",
    );
    expect(isCombinedCacheFresh("regular", "en")).toBe(true);
    expect(loadCombinedCache("regular", "de")).toBeNull();
    expect(isCombinedCacheFresh("regular", "de")).toBe(false);
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

    localStorage.setItem(`${SHARED_CACHE_KEY}::en`, JSON.stringify(sharedCache));
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
    const realLocalStorage = localStorage;
    const store = new Map<string, string>();
    let pveWriteAttempts = 0;
    const mockLocalStorage = {
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      setItem: (key: string, value: string) => {
        if (key === buildCombinedCacheKey("pve")) {
          pveWriteAttempts++;
        }
        if (key === buildCombinedCacheKey("pve") && pveWriteAttempts === 1) {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        store.set(key, value);
      },
    } as Storage;

    vi.stubGlobal("localStorage", mockLocalStorage);

    localStorage.setItem(API_CACHE_KEY, "legacy");
    localStorage.setItem(buildCombinedCacheKey("regular"), "old-regular");

    try {
      await saveCombinedCache(
        payload as unknown as Parameters<typeof saveCombinedCache>[0],
        "pve",
      );

      expect(localStorage.getItem(API_CACHE_KEY)).toBeNull();
      expect(localStorage.getItem(buildCombinedCacheKey("regular"))).toBeNull();
      expect(loadCombinedCache("pve")?.tasks.data.tasks[0].id).toBe(
        "fresh-pve-task",
      );
    } finally {
      vi.stubGlobal("localStorage", realLocalStorage);
    }
  });
});
