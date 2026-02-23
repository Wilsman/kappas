import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import {
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  getTaskObjectiveItemProgress,
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
});
