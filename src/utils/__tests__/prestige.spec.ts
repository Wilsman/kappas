import { describe, expect, it } from 'vitest';
import {
  computePrestigeRequirements,
  migratePrestigeProgress,
  PRESTIGE_CONFIGS,
  type PrestigeSaved,
} from '@/utils/prestige';

const LEGACY_FIGURINES = [
  'bear',
  'mutkevich',
  'killa',
  'reshala',
  'ryzhy',
  'scav',
  'tagilla',
  'usec',
  'cultist',
  'den',
];

function legacyComplete(overrides: Partial<PrestigeSaved> = {}): PrestigeSaved {
  return {
    level: 55,
    strength: 20,
    endurance: 20,
    charisma: 20,
    hideout: {
      intelligence: 2,
      security: 3,
      restSpace: 3,
      roubles: 20_000_000,
    },
    quests: {
      collector: true,
      newBeginning: true,
    },
    extras: {
      scavs: 50,
      pmc: 25,
      raiders: 50,
      labsExtracted: true,
      labsTransitToStreets: true,
      streetsExtracted: true,
      figurines: Object.fromEntries(LEGACY_FIGURINES.map((id) => [id, true])),
    },
    ...overrides,
  };
}

describe('prestige requirements', () => {
  it('does not count zero skill targets as completed requirements', () => {
    const cfg = PRESTIGE_CONFIGS[0];

    expect(computePrestigeRequirements({}, cfg)).toEqual({
      done: 0,
      total: 9,
      percent: 0,
    });
  });

  it('migrates a legacy-complete prestige to the current complete shape', () => {
    const cfg = PRESTIGE_CONFIGS.find((prestige) => prestige.id === 'prestige-4');
    expect(cfg).toBeDefined();

    const migrated = migratePrestigeProgress(legacyComplete({ charisma: 15 }), cfg!);
    const progress = computePrestigeRequirements(migrated, cfg!);

    expect(migrated?.schemaVersion).toBe(2);
    expect(progress.done).toBe(progress.total);
  });

  it('keeps partial legacy progress partial after migration', () => {
    const cfg = PRESTIGE_CONFIGS[0];
    const migrated = migratePrestigeProgress(legacyComplete({ level: 20 }), cfg);
    const progress = computePrestigeRequirements(migrated, cfg);

    expect(migrated?.schemaVersion).toBe(2);
    expect(progress.done).toBeLessThan(progress.total);
  });
});
