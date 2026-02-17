import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { 
  fetchCombinedData, 
  loadCombinedCache, 
  saveCombinedCache, 
  isCombinedCacheFresh,
  API_CACHE_KEY,
  API_CACHE_TTL_MS 
} from '../tarkovApi';

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

describe('fetchCombinedData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns tasks, collectorItems, achievements, and hideoutStations on success', async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: 't1',
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: 'Customs' },
            taskRequirements: [],
            trader: { name: 'Prapor', imageLink: 'img' },
            wikiLink: 'link',
            name: 'Task 1',
            startRewards: { items: [] },
            finishRewards: { items: [] },
            objectives: [],
          },
        ],
        task: {
          objectives: [
            {
              items: [
                { id: 'i1', name: 'Old firesteel', iconLink: 'icon' },
              ],
            },
          ],
        },
        achievements: [
          {
            id: 'a1',
            imageLink: 'img',
            name: 'Ach 1',
            description: 'desc',
            hidden: false,
            playersCompletedPercent: 1,
            adjustedPlayersCompletedPercent: 1,
            side: 'All',
            rarity: 'Common',
          },
        ],
        hideoutStations: [
          {
            name: 'Workbench',
            imageLink: 'img',
            levels: [
              {
                level: 1,
                skillRequirements: [],
                stationLevelRequirements: [],
                itemRequirements: [
                  { count: 1, item: { name: 'Screwdriver', iconLink: 'icon' } },
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
    expect(result.collectorItems.data.task.objectives[0].items[0].id).toBe('i1');
    expect(result.achievements.data.achievements[0].id).toBe('a1');
    expect(result.hideoutStations.data.hideoutStations[0].name).toBe('Workbench');

    // Ensure correct fetch calls
    const fetchSpy = globalThis.fetch as unknown as Mock;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const calls = fetchSpy.mock.calls as [input: unknown, init?: unknown][];
    const graphCall = calls.find((call) =>
      String(call[0]).includes('https://api.tarkov.dev/graphql')
    );
    const overlayCall = calls.find((call) =>
      String(call[0]).includes('tarkov-data-overlay')
    );
    expect(graphCall).toBeDefined();
    expect(overlayCall).toBeDefined();
    const init = (graphCall?.[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? '{}') as { query?: string };
    expect(body.query).toContain('tasks');
    expect(body.query).toContain('achievements');
    expect(body.query).toContain('hideoutStations');
    expect(body.query).toContain('experience');
    expect(body.query).toContain('traderStanding');
    expect(body.query).toContain('skillLevelReward');
    expect(body.query).toContain('traderUnlock');
    expect(body.query).toContain('craftUnlock');
    expect(body.query).toContain('customization');
    expect(body.query).toContain('achievement');
  });

  it('throws on HTTP error', async () => {
    (globalThis as unknown as { fetch: Mock }).fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchCombinedData()).rejects.toThrow('HTTP error');
  });

  it('throws on GraphQL errors array', async () => {
    const apiResponse: { data: object; errors: { message: string }[] } = { data: {}, errors: [{ message: 'boom' }] };
    mockFetchOnce(apiResponse);
    await expect(fetchCombinedData()).rejects.toThrow(/GraphQL error: boom/);
  });

  it('handles missing optional fields with defaults', async () => {
    const partialResponse = {
      data: {
        tasks: [
          {
            id: 't2',
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: 'Woods' },
            taskRequirements: [],
            trader: { name: 'Prapor', imageLink: 'img' },
            wikiLink: 'link2',
            name: 'Task 2',
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

  it('aggregates maps from task objectives', async () => {
    const apiResponse = {
      data: {
        tasks: [
          {
            id: 't1',
            minPlayerLevel: 1,
            kappaRequired: false,
            lightkeeperRequired: false,
            map: { name: 'Customs' },
            taskRequirements: [],
            trader: { name: 'Prapor', imageLink: 'img' },
            wikiLink: 'link',
            name: 'Task 1',
            objectives: [
              { maps: [{ name: 'Customs' }, { name: 'Woods' }], description: 'Test' },
              { maps: [{ name: 'Woods' }, { name: 'Factory' }], description: 'Test2' },
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
    expect(task.maps.map((m: { name: string }) => m.name)).toContain('Customs');
    expect(task.maps.map((m: { name: string }) => m.name)).toContain('Woods');
    expect(task.maps.map((m: { name: string }) => m.name)).toContain('Factory');
  });
});

describe('Cache functionality', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save and load cache', () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    saveCombinedCache(payload);
    const loaded = loadCombinedCache();

    expect(loaded).toBeTruthy();
    expect(loaded?.tasks.data.tasks).toEqual([]);
  });

  it('should detect fresh cache', () => {
    const payload = {
      tasks: { data: { tasks: [] } },
      collectorItems: { data: { task: { objectives: [] } } },
      achievements: { data: { achievements: [] } },
      hideoutStations: { data: { hideoutStations: [] } },
    };

    saveCombinedCache(payload);
    expect(isCombinedCacheFresh()).toBe(true);
  });

  it('should detect stale cache', () => {
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

  it('should return null for missing cache', () => {
    const loaded = loadCombinedCache();
    expect(loaded).toBeNull();
  });

  it('should handle corrupted cache gracefully', () => {
    localStorage.setItem(API_CACHE_KEY, 'invalid json{');
    expect(loadCombinedCache()).toBeNull();
    expect(isCombinedCacheFresh()).toBe(false);
  });
});
