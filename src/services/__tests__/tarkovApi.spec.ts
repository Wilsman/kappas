import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { fetchCombinedData } from '../tarkovApi';

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    // Ensure correct fetch call
    const fetchSpy = globalThis.fetch as unknown as Mock;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0] as [input: unknown, init?: unknown];
    expect(call[0]).toContain('https://api.tarkov.dev/graphql');
    const init = (call[1] ?? {}) as { body?: string };
    const body = JSON.parse(init.body ?? '{}') as { query?: string };
    expect(body.query).toContain('tasks');
    expect(body.query).toContain('achievements');
    expect(body.query).toContain('hideoutStations');
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
});
