import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";
import {
  fetchCombinedData,
  getTarkovJsonRequestBaseUrl,
  getCombinedCacheDebugInfo,
  loadCombinedCache,
  saveCombinedCache,
  isCombinedCacheFresh,
  buildCombinedCacheKey,
  API_CACHE_KEY,
  API_CACHE_TTL_MS,
  SHARED_CACHE_KEY,
  sanitizeTaskRewardData,
  normalizeCollectorItems,
  buildEventTasksFromOverlay,
} from "../tarkovApi";

describe("getTarkovJsonRequestBaseUrl", () => {
  it("uses the same-origin proxy during local development", () => {
    expect(
      getTarkovJsonRequestBaseUrl({ DEV: true, MODE: "development" }),
    ).toBe("/api/tarkov-json");
  });

  it("uses the direct JSON API in tests", () => {
    expect(getTarkovJsonRequestBaseUrl({ DEV: true, MODE: "test" })).toBe(
      "https://json.tarkov.dev",
    );
  });

  it("uses the direct JSON API in production", () => {
    expect(
      getTarkovJsonRequestBaseUrl({ DEV: false, MODE: "production" }),
    ).toBe("https://json.tarkov.dev");
  });
});

interface MockResponse<T> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
  text?: () => Promise<string>;
}

function mockJsonResponse<T>(data: T, ok = true, status = 200): MockResponse<T> {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

function mockJsonFetchSequence(...responses: MockResponse<unknown>[]) {
  const fetchMock = vi.fn();
  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(response);
  });
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
}

function mockCombinedJsonApi({
  tasks,
  achievements = {},
  taskTranslations = {},
  hideout = {},
  hideoutTranslations = {},
  itemTranslations = {},
  traderTranslations = {},
  mapTranslations = {},
  overlay = {
    tasks: {},
    $meta: { version: "test", generated: "2026-08-12T00:00:00.000Z" },
  },
}: {
  tasks: Record<string, unknown>;
  achievements?: Record<string, unknown>;
  taskTranslations?: Record<string, string>;
  hideout?: Record<string, unknown>;
  hideoutTranslations?: Record<string, string>;
  itemTranslations?: Record<string, string>;
  traderTranslations?: Record<string, string>;
  mapTranslations?: Record<string, string>;
  overlay?: Record<string, unknown>;
}) {
  return mockJsonFetchSequence(
    mockJsonResponse({ data: { tasks, achievements } }),
    mockJsonResponse({ data: taskTranslations }),
    mockJsonResponse({ data: hideout }),
    mockJsonResponse({ data: hideoutTranslations }),
    mockJsonResponse({ data: itemTranslations }),
    mockJsonResponse({ data: traderTranslations }),
    mockJsonResponse({ data: mapTranslations }),
    mockJsonResponse(overlay),
  );
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

  it("uses JSON endpoints as the primary data source and normalizes app data", async () => {
    const tasksPayload = {
      data: {
        tasks: {
          req1: {
            id: "req1",
            name: "req1 name",
            trader: "trader1",
            minPlayerLevel: 1,
            taskRequirements: [],
            objectives: {},
          },
          t1: {
            id: "t1",
            name: "t1 name",
            trader: "trader1",
            wikiLink: "wiki",
            minPlayerLevel: 2,
            taskRequirements: [{ task: "req1" }],
            map: "map1",
            objectives: {
              obj1: {
                id: "obj1",
                description: "obj1 description",
                count: 2,
                maps: ["map1"],
                items: ["item1"],
                foundInRaid: true,
              },
            },
            startRewards: {
              items: [{ item: "item2", count: 1 }],
            },
            finishRewards: {
              items: [{ item: "item3", count: 3 }],
              traderStanding: [{ trader: "trader1", standing: 0.02 }],
            },
            experience: 1000,
            factionName: "Any",
            kappaRequired: true,
            lightkeeperRequired: false,
          },
          "5c51aac186f77432ea65c552": {
            id: "5c51aac186f77432ea65c552",
            name: "collector name",
            trader: "trader1",
            minPlayerLevel: 1,
            taskRequirements: [],
            objectives: {
              collector: {
                id: "collector",
                description: "collector description",
                items: ["collector1"],
              },
            },
          },
        },
        achievements: {
          a1: {
            id: "a1",
            name: "a1 name",
            description: "a1 description",
            imageLink: "achievement.png",
            hidden: false,
            playersCompletedPercent: 1,
            adjustedPlayersCompletedPercent: 2,
            side: "Pmc",
            rarity: "Achievements/Tab/CommonRarity",
          },
        },
      },
    };
    const taskTranslations = {
      "t1 name": "Task One",
      "req1 name": "Required Task",
      "obj1 description": "Find the thing",
      "collector description": "Hand over collector item",
      "a1 name": "Achievement One",
      "a1 description": "Achievement description",
      "Achievements/Tab/CommonRarity": "Common",
    };
    const hideoutPayload = {
      data: {
        station1: {
          id: "station1",
          name: "station1 Name",
          normalizedName: "workbench",
          imageLink: "station.png",
          levels: [
            {
              level: 1,
              skillRequirements: [
                { name: "hideout_Health", skill: "Health", level: 2 },
              ],
              stationLevelRequirements: [
                { station: "station2", level: 1 },
              ],
              itemRequirements: [
                {
                  item: "item4",
                  count: 4,
                  attributes: { foundInRaid: true },
                },
              ],
            },
          ],
        },
        station2: {
          id: "station2",
          name: "station2 Name",
          levels: [],
        },
      },
    };
    const hideoutTranslations = {
      "station1 Name": "Workbench",
      "station2 Name": "Generator",
      hideout_Health: "Health",
      Health: "Health",
    };
    const itemTranslations = {
      "item1 Name": "Quest item",
      "item2 Name": "Start reward",
      "item3 Name": "Finish reward",
      "item4 Name": "Hideout item",
      "collector1 Name": "Collector item",
    };
    const traderTranslations = {
      "trader1 Nickname": "Therapist",
    };
    const mapTranslations = {
      "map1 Name": "Customs",
    };
    const overlayResponse = {
      tasks: {},
      $meta: { version: "test", generated: "2026-07-06T00:00:00.000Z" },
    };

    const fetchMock = mockJsonFetchSequence(
      mockJsonResponse(tasksPayload),
      mockJsonResponse({ data: taskTranslations }),
      mockJsonResponse(hideoutPayload),
      mockJsonResponse({ data: hideoutTranslations }),
      mockJsonResponse({ data: itemTranslations }),
      mockJsonResponse({ data: traderTranslations }),
      mockJsonResponse({ data: mapTranslations }),
      mockJsonResponse(overlayResponse),
    );

    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks).toHaveLength(3);
    expect(result.tasks.data.tasks.find((task) => task.id === "t1")).toMatchObject({
      name: "Task One",
      minPlayerLevel: 2,
      wikiLink: "wiki",
      map: { name: "Customs" },
      maps: [{ name: "Customs" }],
      trader: { name: "Therapist" },
      taskRequirements: [{ task: { id: "req1", name: "Required Task" } }],
      objectives: [
        {
          id: "obj1",
          description: "Find the thing",
          count: 2,
          foundInRaid: true,
          maps: [{ name: "Customs" }],
          items: [
            {
              id: "item1",
              name: "Quest item",
              iconLink: "https://assets.tarkov.dev/item1-icon.webp",
            },
          ],
        },
      ],
      startRewards: {
        items: [
          {
            item: {
              id: "item2",
              name: "Start reward",
              iconLink: "https://assets.tarkov.dev/item2-icon.webp",
            },
            count: 1,
          },
        ],
      },
      finishRewards: {
        items: [
          {
            item: {
              id: "item3",
              name: "Finish reward",
              iconLink: "https://assets.tarkov.dev/item3-icon.webp",
            },
            count: 3,
          },
        ],
        traderStanding: [
          { standing: 0.02, trader: { id: "trader1", name: "Therapist" } },
        ],
      },
    });
    expect(result.collectorItems.data.task.objectives[0].items[0]).toMatchObject({
      id: "collector1",
      name: "Collector item",
      iconLink: "https://assets.tarkov.dev/collector1-icon.webp",
    });
    expect(result.achievements.data.achievements[0]).toMatchObject({
      id: "a1",
      name: "Achievement One",
      description: "Achievement description",
      playersCompletedPercent: 1,
      adjustedPlayersCompletedPercent: 2,
      rarity: "Common",
    });
    expect(result.hideoutStations.data.hideoutStations[0]).toMatchObject({
      id: "station1",
      normalizedName: "workbench",
      name: "Workbench",
      levels: [
        {
          level: 1,
          itemRequirements: [
            {
              count: 4,
              item: {
                id: "item4",
                name: "Hideout item",
                iconLink: "https://assets.tarkov.dev/item4-icon.webp",
              },
            },
          ],
        },
      ],
    });
    expect(
      result.hideoutStations.data.hideoutStations[0].levels[0]
        .stationLevelRequirements,
    ).toEqual([
      {
        station: { id: "station2", name: "Generator" },
        level: 1,
      },
    ]);
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      "https://json.tarkov.dev/regular/tasks",
      "https://json.tarkov.dev/regular/tasks_en",
      "https://json.tarkov.dev/regular/hideout",
      "https://json.tarkov.dev/regular/hideout_en",
      "https://json.tarkov.dev/regular/items_en",
      "https://json.tarkov.dev/regular/traders_en",
      "https://json.tarkov.dev/regular/maps_en",
      "https://cdn.jsdelivr.net/gh/tarkovtracker-org/tarkov-data-overlay@main/dist/overlay.json",
    ]);
  });

  it("requests PvE and localized JSON endpoint suffixes", async () => {
    const emptyTasksPayload = {
      data: {
        tasks: {},
        achievements: {},
      },
    };
    const overlayResponse = {
      tasks: {},
      $meta: { version: "test", generated: "2026-07-06T00:00:00.000Z" },
    };
    const fetchMock = mockJsonFetchSequence(
      mockJsonResponse(emptyTasksPayload),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse(overlayResponse),
    );

    await fetchCombinedData("pve", "de");

    expect(fetchMock.mock.calls.map((call) => String(call[0])).slice(0, 7)).toEqual([
      "https://json.tarkov.dev/pve/tasks",
      "https://json.tarkov.dev/pve/tasks_de",
      "https://json.tarkov.dev/pve/hideout",
      "https://json.tarkov.dev/pve/hideout_de",
      "https://json.tarkov.dev/pve/items_de",
      "https://json.tarkov.dev/pve/traders_de",
      "https://json.tarkov.dev/pve/maps_de",
    ]);
  });

  it("requests dedicated Seasonal JSON endpoints", async () => {
    const emptyTasksPayload = {
      data: {
        tasks: {},
        achievements: {},
      },
    };
    const overlayResponse = {
      tasks: {},
      $meta: { version: "test", generated: "2026-08-03T00:00:00.000Z" },
    };
    const fetchMock = mockJsonFetchSequence(
      mockJsonResponse(emptyTasksPayload),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse(overlayResponse),
    );

    await fetchCombinedData("pvp-season", "fr");

    expect(fetchMock.mock.calls.map((call) => String(call[0])).slice(0, 7)).toEqual([
      "https://json.tarkov.dev/pvp-season/tasks",
      "https://json.tarkov.dev/pvp-season/tasks_fr",
      "https://json.tarkov.dev/pvp-season/hideout",
      "https://json.tarkov.dev/pvp-season/hideout_fr",
      "https://json.tarkov.dev/pvp-season/items_fr",
      "https://json.tarkov.dev/pvp-season/traders_fr",
      "https://json.tarkov.dev/pvp-season/maps_fr",
    ]);
  });

  it("propagates Seasonal JSON data failures", async () => {
    const fetchMock = mockJsonFetchSequence(
      mockJsonResponse({ error: "Seasonal unavailable" }, false, 503),
    );

    await expect(fetchCombinedData("pvp-season")).rejects.toThrow(
      "status: 503",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://json.tarkov.dev/pvp-season/tasks",
    );
  });

  it("falls back to IDs and derived icons when JSON translations are missing", async () => {
    const tasksPayload = {
      data: {
        tasks: {
          t1: {
            id: "t1",
            name: "missing task key",
            trader: "missing-trader",
            minPlayerLevel: 1,
            taskRequirements: [],
            objectives: {
              obj1: {
                id: "obj1",
                description: "missing objective key",
                items: ["missing-item"],
              },
            },
          },
        },
        achievements: {},
      },
    };
    const overlayResponse = {
      tasks: {},
      $meta: { version: "test", generated: "2026-07-06T00:00:00.000Z" },
    };
    mockJsonFetchSequence(
      mockJsonResponse(tasksPayload),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse({ data: {} }),
      mockJsonResponse(overlayResponse),
    );

    const result = await fetchCombinedData();
    const task = result.tasks.data.tasks[0];

    expect(task.name).toBe("missing task key");
    expect(task.trader.name).toBe("missing-trader");
    expect(task.objectives?.[0]).toMatchObject({
      description: "missing objective key",
      items: [
        {
          id: "missing-item",
          name: "missing-item",
          iconLink: "https://assets.tarkov.dev/missing-item-icon.webp",
        },
      ],
    });
  });

  it("rewrites Building Foundations sell-any objectives without item lists", async () => {
    const manyItemIds = Array.from(
      { length: 100 },
      (_, index) => `item-${index}`,
    );
    mockCombinedJsonApi({
      tasks: {
        "673f629c5b555b53460cf827": {
          id: "673f629c5b555b53460cf827",
          name: "Building Foundations",
          trader: "btr-driver",
          minPlayerLevel: 1,
          objectives: {
            ragman: {
              id: "ragman",
              description: "Sell any items to Ragman",
              count: 50,
              items: manyItemIds,
            },
            prapor: {
              id: "prapor",
              description: "Sell any items to Prapor",
              count: 50,
              items: manyItemIds,
            },
            peacekeeper: {
              id: "peacekeeper",
              description: "Sell any items to Peacekeeper",
              count: 50,
              items: manyItemIds,
            },
          },
        },
      },
      traderTranslations: { "btr-driver Nickname": "BTR Driver" },
    });
    const result = await fetchCombinedData();
    const objectives = result.tasks.data.tasks[0].objectives ?? [];

    expect(objectives).toMatchObject([
      {
        id: "ragman",
        description: "Sell any 50 items to Ragman",
        count: 50,
      },
      {
        id: "prapor",
        description: "Sell any 50 items to Prapor",
        count: 50,
      },
      {
        id: "peacekeeper",
        description: "Sell any 50 items to Peacekeeper",
        count: 50,
      },
    ]);
  });

  it("preserves the latest API Collector items and appends configured additions", () => {
    const result = normalizeCollectorItems({
      id: "5c51aac186f77432ea65c552",
      objectives: [
        {
          items: [
            { id: "5bc9bc53d4351e00367fbcee", name: "Golden rooster figurine" },
            { id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" },
          ],
        },
      ],
    });

    const itemNames = result.objectives.flatMap((objective) =>
      objective.items.map((item) => item.name),
    );

    expect(itemNames).toEqual(
      expect.arrayContaining([
        "Golden rooster figurine",
        "Nut Sack balaclava",
        "Bottle of YXMC water",
        "Can of GigaBeef meat",
        "French bakery baguette",
        "LM KC-130 model aircraft",
      ]),
    );
  });

  it("uses the latest API Collector items and appends new items", () => {
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

    expect(itemNames).toHaveLength(47);
    expect(itemNames).toEqual(
      expect.arrayContaining([
        "Bottle of YXMC water",
        "Can of GigaBeef meat",
        "French bakery baguette",
        "LM KC-130 model aircraft",
      ]),
    );
    expect(itemNames).toEqual(
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

  it("includes HTTP error response body details", async () => {
    (globalThis as unknown as { fetch: Mock }).fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "JSON API unavailable" }), {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(fetchCombinedData()).rejects.toThrow(/JSON API unavailable/);
  });

  it("drops task requirement rows with missing task data before applying overrides", async () => {
    mockCombinedJsonApi({
      tasks: {
        "5c0bd94186f7747a727f09b2": {
          id: "5c0bd94186f7747a727f09b2",
          name: "Test Drive - Part 1",
          trader: "prapor",
          taskRequirements: [
            {},
            { task: "5c0d190cd09282029f5390d8" },
            { task: "kept-task" },
          ],
        },
        "5c0d190cd09282029f5390d8": {
          id: "5c0d190cd09282029f5390d8",
          name: "Grenadier",
          trader: "prapor",
        },
        "kept-task": {
          id: "kept-task",
          name: "Kept Task",
          trader: "prapor",
        },
      },
    });
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].taskRequirements).toEqual([
      { task: { id: "kept-task", name: "Kept Task" } },
    ]);
  });

  it("handles missing optional fields with defaults", async () => {
    mockCombinedJsonApi({
      tasks: {
        t2: {
          id: "t2",
          name: "Task 2",
          trader: "prapor",
          map: "woods",
          wikiLink: "link2",
        },
      },
      mapTranslations: { "woods Name": "Woods" },
    });
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks.length).toBe(1);
    expect(result.collectorItems.data.task.objectives.length).toBe(4);
    // Defaults
    expect(result.achievements.data.achievements).toEqual([]);
    expect(result.hideoutStations.data.hideoutStations).toEqual([]);
  });

  it("aggregates maps from task objectives", async () => {
    mockCombinedJsonApi({
      tasks: {
        t1: {
          id: "t1",
          name: "Task 1",
          trader: "prapor",
          map: "customs",
          objectives: {
            first: {
              maps: ["customs", "woods"],
              description: "Test",
            },
            second: {
              maps: ["woods", "factory"],
              description: "Test2",
            },
          },
        },
      },
      mapTranslations: {
        "customs Name": "Customs",
        "woods Name": "Woods",
        "factory Name": "Factory",
      },
    });
    const result = await fetchCombinedData();

    const task = result.tasks.data.tasks[0];
    expect(task.maps.length).toBe(3);
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Customs");
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Woods");
    expect(task.maps.map((m: { name: string }) => m.name)).toContain("Factory");
  });

  it("preserves count for shoot objectives from the JSON response", async () => {
    mockCombinedJsonApi({
      tasks: {
        intimidator: {
          id: "intimidator",
          name: "Intimidator",
          minPlayerLevel: 45,
          kappaRequired: true,
          trader: "prapor",
          objectives: {
            shoot: {
              description: "Eliminate Scavs with headshots",
              count: 40,
            },
          },
        },
      },
    });
    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].objectives?.[0]?.count).toBe(40);
  });

  it("applies task wiki link overrides from the fetched overlay", async () => {
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

    mockCombinedJsonApi({
      tasks: {
        "6663148ca9290f9e0806cca1": {
          id: "6663148ca9290f9e0806cca1",
          name: "Immunity",
          trader: "fence",
          wikiLink: "https://escapefromtarkov.fandom.com/wiki/Immunity",
        },
      },
      overlay: overlayResponse,
    });

    const result = await fetchCombinedData();

    expect(result.tasks.data.tasks[0].wikiLink).toBe(
      "https://escapefromtarkov.fandom.com/wiki/Immunity_(quest)",
    );
  });

  it("ignores null overlay maps when building overlay-added event tasks", () => {
    const tasks = buildEventTasksFromOverlay({
      tasksAdd: {
        new_beginning_prestige_6: {
          id: "new_beginning_prestige_6",
          name: "New Beginning",
          trader: { name: "Ragman" },
          map: null,
          maps: [null, { id: "5714dc692459777137212e12", name: "Streets of Tarkov" }],
          objectives: [
            {
              id: "new_beginning_prestige_6_obj01",
              description: "Use the transit from Streets of Tarkov to Interchange",
              maps: [
                { id: "5714dc692459777137212e12", name: "Streets of Tarkov" },
                null,
                { id: "5714dbc024597771384a510d", name: "Interchange" },
              ],
            },
          ],
        },
      },
      $meta: {
        version: "1.34",
        generated: "2026-06-08T01:20:45.715Z",
      },
    } as never);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].map).toBeNull();
    expect(tasks[0].maps.map((map) => map.name)).toEqual([
      "Streets of Tarkov",
      "Interchange",
    ]);
    expect(tasks[0].objectives?.[0].maps?.map((map) => map.name)).toEqual([
      "Streets of Tarkov",
      "Interchange",
    ]);
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
      achievements: {
        data: {
          achievements: [
            { id: "shared-achievement", playersCompletedPercent: 1 },
          ],
        },
      },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const pvePayload = {
      tasks: { data: { tasks: [{ id: "pve-task" }] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: {
        data: {
          achievements: [
            { id: "shared-achievement", playersCompletedPercent: 2 },
          ],
        },
      },
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const seasonalPayload = {
      tasks: { data: { tasks: [{ id: "seasonal-task" }] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: {
        data: {
          achievements: [
            { id: "shared-achievement", playersCompletedPercent: 3 },
          ],
        },
      },
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
    await saveCombinedCache(
      seasonalPayload as unknown as Parameters<typeof saveCombinedCache>[0],
      "pvp-season",
    );

    expect(loadCombinedCache("regular")?.tasks.data.tasks[0].id).toBe(
      "regular-task",
    );
    expect(loadCombinedCache("pve")?.tasks.data.tasks[0].id).toBe("pve-task");
    expect(loadCombinedCache("pvp-season")?.tasks.data.tasks[0].id).toBe(
      "seasonal-task",
    );
    expect(
      loadCombinedCache("regular")?.achievements.data.achievements[0]
        .playersCompletedPercent,
    ).toBe(1);
    expect(
      loadCombinedCache("pve")?.achievements.data.achievements[0]
        .playersCompletedPercent,
    ).toBe(2);
    expect(
      loadCombinedCache("pvp-season")?.achievements.data.achievements[0]
        .playersCompletedPercent,
    ).toBe(3);
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

  it("should reject legacy split cache without mode-specific achievements", () => {
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

    expect(loadCombinedCache("regular", "en")).toBeNull();
    expect(isCombinedCacheFresh("regular", "en")).toBe(false);
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

  it("should report cache metadata for support diagnostics", async () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { id: "test", objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    await saveCombinedCache(
      payload as unknown as Parameters<typeof saveCombinedCache>[0],
      "regular",
      "en",
    );

    const debugInfo = getCombinedCacheDebugInfo("regular", "en");

    expect(debugInfo).toMatchObject({
      available: true,
      fresh: true,
      format: "split",
      checkedGameMode: "regular",
      checkedLanguage: "en",
      ttlMs: API_CACHE_TTL_MS,
      keys: [
        `${SHARED_CACHE_KEY}::en`,
        "taskTracker_api_cache_v4::regular::en",
      ],
    });
    expect(debugInfo.newestUpdatedAt).toEqual(expect.any(String));
    expect(debugInfo.oldestAgeMs).toEqual(expect.any(Number));
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
      hideoutStations: { data: { hideoutStations: [] } },
    };
    const taskCache = {
      updatedAt: Date.now() - API_CACHE_TTL_MS - 1000,
      payload: {
        tasks: { data: { tasks: [] } },
        achievements: { data: { achievements: [] } },
      },
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
