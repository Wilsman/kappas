import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import {
  buildLegacyTaskObjectiveProgressKey,
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveProgressKey,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  formatTaskObjectiveLabel,
  getTaskObjectiveItemProgress,
  getTaskObjectiveProgress,
  isTaskObjectiveCompleted,
} from '@/utils/taskObjectives';

function makeTask(objectives: NonNullable<Task['objectives']>): Pick<Task, 'id' | 'objectives'> {
  return {
    id: 'task-1',
    objectives,
  };
}

describe('task objective key utilities', () => {
  it('builds stable keys regardless of map/item order', () => {
    const firstTask = makeTask([
      {
        description: 'Kill scavs',
        count: 5,
        maps: [{ name: 'Shoreline' }, { name: 'Woods' }],
        items: [
          { id: 'a', name: 'Item A' },
          { id: 'b', name: 'Item B' },
        ],
      },
    ]);
    const reorderedTask = makeTask([
      {
        description: 'Kill scavs',
        count: 5,
        maps: [{ name: 'Woods' }, { name: 'Shoreline' }],
        items: [
          { id: 'b', name: 'Item B' },
          { id: 'a', name: 'Item A' },
        ],
      },
    ]);

    expect(buildTaskObjectiveKeys(firstTask)).toEqual(
      buildTaskObjectiveKeys(reorderedTask),
    );
  });

  it('disambiguates duplicate objective signatures', () => {
    const keys = buildTaskObjectiveKeys(
      makeTask([
        { description: 'Extract from map' },
        { description: 'Extract from map' },
      ]),
    );

    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toEqual(keys[1]);
    expect(keys[0]?.endsWith('::1')).toBe(true);
    expect(keys[1]?.endsWith('::2')).toBe(true);
  });

  it('prefers objective ids for persistent keys when available', () => {
    const keys = buildTaskObjectiveKeys(
      makeTask([
        { id: 'objective-1', description: 'Old text' },
        { id: 'objective-2', description: 'Other text' },
      ]),
    );

    expect(keys[0]).toBe('task-1::objective-id::objective-1');
    expect(keys[1]).toBe('task-1::objective-id::objective-2');
  });

  it('keeps content-derived and index keys as fallbacks for existing progress', () => {
    const task = makeTask([{ id: 'objective-1', description: 'Fixed text' }]);
    const [objectiveKey] = buildTaskObjectiveKeys(task);
    const fallbackKeys = buildTaskObjectiveFallbackKeys(task, 0, objectiveKey);
    const oldContentKey = fallbackKeys.find((key) =>
      key.includes('::objective::'),
    );
    const oldIndexKey = buildLegacyTaskObjectiveKey('task-1', 0);

    expect(objectiveKey).toBe('task-1::objective-id::objective-1');
    expect(oldContentKey).toBeTruthy();
    expect(fallbackKeys).toContain(oldIndexKey);
    expect(
      isTaskObjectiveCompleted(
        new Set<string>([oldContentKey!]),
        objectiveKey!,
        fallbackKeys,
      ),
    ).toBe(true);
  });

  it('supports legacy objective completion keys', () => {
    const objectiveKey = buildTaskObjectiveKeys(
      makeTask([{ description: 'Complete objective' }]),
    )[0]!;
    const legacyObjectiveKey = buildLegacyTaskObjectiveKey('task-1', 0);
    const completed = new Set<string>([legacyObjectiveKey]);

    expect(
      isTaskObjectiveCompleted(completed, objectiveKey, legacyObjectiveKey),
    ).toBe(true);
  });

  it('reads stable item progress key first then falls back to legacy', () => {
    const objectiveKey = buildTaskObjectiveKeys(
      makeTask([{ description: 'Item objective' }]),
    )[0]!;
    const stableItemKey = buildTaskObjectiveItemProgressKey(objectiveKey, 'item');
    const legacyItemKey = buildLegacyTaskObjectiveItemProgressKey(
      'task-1',
      0,
      'item',
    );

    expect(
      getTaskObjectiveItemProgress({ [legacyItemKey]: 2 }, stableItemKey, legacyItemKey),
    ).toBe(2);
    expect(
      getTaskObjectiveItemProgress(
        { [legacyItemKey]: 2, [stableItemKey]: 4 },
        stableItemKey,
        legacyItemKey,
      ),
    ).toBe(4);
  });

  it('reads stable objective progress key first then falls back to legacy', () => {
    const objectiveKey = buildTaskObjectiveKeys(
      makeTask([{ description: 'Count objective', count: 40 }]),
    )[0]!;
    const stableProgressKey = buildTaskObjectiveProgressKey(objectiveKey);
    const legacyProgressKey = buildLegacyTaskObjectiveProgressKey('task-1', 0);

    expect(
      getTaskObjectiveProgress({ [legacyProgressKey]: 12 }, stableProgressKey, legacyProgressKey),
    ).toBe(12);
    expect(
      getTaskObjectiveProgress(
        { [legacyProgressKey]: 12, [stableProgressKey]: 18 },
        stableProgressKey,
        legacyProgressKey,
      ),
    ).toBe(18);
  });

  it('formats count-only objectives with their required amount', () => {
    expect(
      formatTaskObjectiveLabel({
        description: 'Eliminate Scavs with headshots',
        count: 40,
      }),
    ).toBe('Eliminate Scavs with headshots x40');
    expect(
      formatTaskObjectiveLabel({
        playerLevel: 15,
        count: 1,
      }),
    ).toBe('Reach level 15');
    expect(
      formatTaskObjectiveLabel({
        description: 'Hand over Salewas',
        count: 3,
        items: [{ id: 'salewa', name: 'Salewa' }],
      }),
    ).toBe('Hand over Salewas');
    expect(
      formatTaskObjectiveLabel({
        description: 'Sell any 50 items to Ragman',
        count: 50,
      }),
    ).toBe('Sell any 50 items to Ragman');
  });
});
