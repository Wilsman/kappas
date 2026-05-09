import { taskStorage } from '@/utils/indexedDB';

export const PRESTIGE_UPDATED_EVENT = 'prestige:updated';

export interface PrestigeConfig {
  id: string;
  levelTarget: number;
  strengthTarget: number;
  enduranceTarget: number;
  charismaTarget: number;
  hideoutTargets: {
    intelligence: number;
    security: number;
    restSpace: number;
  };
  roublesTarget: number;
  requiredQuestIds: PrestigeQuestId[];
  extras?: {
    scavsTarget?: number;
    pmcTarget?: number;
    raidersTarget?: number;
    bossesTarget?: number;
    hoodedMenTarget?: number;
    requireLabsExtract?: boolean;
    requireLabsTransitToStreets?: boolean;
    requireStreetsExtract?: boolean;
    requireStreetsTransitToInterchange?: boolean;
    requireInterchangeExtract?: boolean;
    requireInterchangeTransitToCustoms?: boolean;
    requireCustomsExtract?: boolean;
    requireCustomsTransitToReserve?: boolean;
    requireReserveExtract?: boolean;
    figurines?: string[];
    figurineGroups?: { id: string; label: string; target: number }[];
  };
}

export type PrestigeQuestId =
  | 'newBeginning'
  | 'collector'
  | 'tour'
  | 'fallingSkies'
  | 'ticketFromTarkov'
  | 'theyAreAlreadyHere'
  | 'theTicket';

export interface PrestigeSaved {
  schemaVersion?: number;
  level?: number;
  strength?: number;
  endurance?: number;
  charisma?: number;
  hideout?: {
    intelligence?: number;
    security?: number;
    restSpace?: number;
    roubles?: number;
  };
  quests?: Partial<Record<PrestigeQuestId, boolean>>;
  extras?: {
    scavs?: number;
    pmc?: number;
    raiders?: number;
    bosses?: number;
    hoodedMen?: number;
    labsExtracted?: boolean;
    labsTransitToStreets?: boolean;
    streetsExtracted?: boolean;
    streetsTransitToInterchange?: boolean;
    interchangeExtracted?: boolean;
    interchangeTransitToCustoms?: boolean;
    customsExtracted?: boolean;
    customsTransitToReserve?: boolean;
    reserveExtracted?: boolean;
    figurines?: Record<string, boolean>;
    figurineGroups?: Record<string, number>;
  };
}

export const PRESTIGE_CONFIGS: PrestigeConfig[] = [
  {
    id: 'prestige-1',
    levelTarget: 25,
    strengthTarget: 0,
    enduranceTarget: 0,
    charismaTarget: 0,
    hideoutTargets: { intelligence: 1, security: 2, restSpace: 2 },
    roublesTarget: 10_000_000,
    requiredQuestIds: ['newBeginning'],
    extras: {
      scavsTarget: 50,
      requireLabsExtract: true,
      figurineGroups: [
        { id: 'pmc', label: 'Any PMC figurine', target: 1 },
        { id: 'scav', label: 'Any SCAV figurine', target: 1 },
        { id: 'boss', label: 'Any Boss figurine', target: 1 },
        { id: 'trader', label: 'Any Trader figurine', target: 1 },
      ],
    },
  },
  {
    id: 'prestige-2',
    levelTarget: 30,
    strengthTarget: 10,
    enduranceTarget: 10,
    charismaTarget: 7,
    hideoutTargets: { intelligence: 1, security: 2, restSpace: 2 },
    roublesTarget: 15_000_000,
    requiredQuestIds: ['newBeginning', 'tour'],
    extras: {
      pmcTarget: 10,
      requireLabsExtract: true,
      figurineGroups: [
        { id: 'pmcFir', label: 'PMC figurines found in raid', target: 2 },
        { id: 'scavFir', label: 'SCAV figurines found in raid', target: 2 },
        { id: 'bossFir', label: 'Boss figurines found in raid', target: 2 },
        { id: 'traderFir', label: 'Trader figurines found in raid', target: 2 },
      ],
    },
  },
  {
    id: 'prestige-3',
    levelTarget: 35,
    strengthTarget: 10,
    enduranceTarget: 10,
    charismaTarget: 7,
    hideoutTargets: { intelligence: 1, security: 2, restSpace: 2 },
    roublesTarget: 15_000_000,
    requiredQuestIds: ['newBeginning', 'tour', 'fallingSkies'],
    extras: {
      pmcTarget: 25,
      raidersTarget: 50,
      requireLabsTransitToStreets: true,
      requireStreetsExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-4',
    levelTarget: 40,
    strengthTarget: 15,
    enduranceTarget: 15,
    charismaTarget: 12,
    hideoutTargets: { intelligence: 1, security: 2, restSpace: 2 },
    roublesTarget: 15_000_000,
    requiredQuestIds: ['newBeginning', 'tour', 'ticketFromTarkov'],
    extras: {
      pmcTarget: 40,
      raidersTarget: 100,
      requireLabsTransitToStreets: true,
      requireStreetsTransitToInterchange: true,
      requireInterchangeExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-5',
    levelTarget: 47,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['newBeginning', 'collector', 'tour', 'theyAreAlreadyHere', 'ticketFromTarkov'],
    extras: {
      pmcTarget: 45,
      raidersTarget: 100,
      bossesTarget: 1,
      requireLabsTransitToStreets: true,
      requireStreetsTransitToInterchange: true,
      requireInterchangeTransitToCustoms: true,
      requireCustomsExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-6',
    levelTarget: 47,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['newBeginning', 'collector', 'theTicket'],
    extras: {
      pmcTarget: 50,
      raidersTarget: 100,
      bossesTarget: 1,
      hoodedMenTarget: 5,
      requireLabsTransitToStreets: true,
      requireStreetsTransitToInterchange: true,
      requireInterchangeTransitToCustoms: true,
      requireCustomsTransitToReserve: true,
      requireReserveExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
];

const PRESTIGE_PROGRESS_SCHEMA_VERSION = 2;

const LEGACY_FIGURINES = [
  'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
];

const LEGACY_PRESTIGE_CONFIGS: PrestigeConfig[] = [
  {
    id: 'prestige-1',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
    extras: {
      scavsTarget: 50,
      requireLabsExtract: true,
      figurines: LEGACY_FIGURINES,
    },
  },
  {
    id: 'prestige-2',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
    extras: {
      pmcTarget: 15,
      requireLabsExtract: true,
      figurines: LEGACY_FIGURINES,
    },
  },
  {
    id: 'prestige-3',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
    extras: {
      pmcTarget: 25,
      raidersTarget: 50,
      requireLabsTransitToStreets: true,
      requireStreetsExtract: true,
      figurines: LEGACY_FIGURINES,
    },
  },
  {
    id: 'prestige-4',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
  },
  {
    id: 'prestige-5',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
  },
  {
    id: 'prestige-6',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    hideoutTargets: { intelligence: 2, security: 3, restSpace: 3 },
    roublesTarget: 20_000_000,
    requiredQuestIds: ['collector', 'newBeginning'],
  },
];

export function createCompletedPrestigeSaved(cfg: PrestigeConfig): PrestigeSaved {
  return {
    schemaVersion: PRESTIGE_PROGRESS_SCHEMA_VERSION,
    level: cfg.levelTarget,
    strength: cfg.strengthTarget,
    endurance: cfg.enduranceTarget,
    charisma: cfg.charismaTarget,
    hideout: {
      intelligence: cfg.hideoutTargets.intelligence,
      security: cfg.hideoutTargets.security,
      restSpace: cfg.hideoutTargets.restSpace,
      roubles: cfg.roublesTarget,
    },
    quests: Object.fromEntries(cfg.requiredQuestIds.map((questId) => [questId, true])),
    extras: {
      scavs: cfg.extras?.scavsTarget ?? 0,
      pmc: cfg.extras?.pmcTarget ?? 0,
      raiders: cfg.extras?.raidersTarget ?? 0,
      bosses: cfg.extras?.bossesTarget ?? 0,
      hoodedMen: cfg.extras?.hoodedMenTarget ?? 0,
      labsExtracted: cfg.extras?.requireLabsExtract ?? false,
      labsTransitToStreets: cfg.extras?.requireLabsTransitToStreets ?? false,
      streetsExtracted: cfg.extras?.requireStreetsExtract ?? false,
      streetsTransitToInterchange: cfg.extras?.requireStreetsTransitToInterchange ?? false,
      interchangeExtracted: cfg.extras?.requireInterchangeExtract ?? false,
      interchangeTransitToCustoms: cfg.extras?.requireInterchangeTransitToCustoms ?? false,
      customsExtracted: cfg.extras?.requireCustomsExtract ?? false,
      customsTransitToReserve: cfg.extras?.requireCustomsTransitToReserve ?? false,
      reserveExtracted: cfg.extras?.requireReserveExtract ?? false,
      figurines: Object.fromEntries(
        (cfg.extras?.figurines ?? []).map((figurineId) => [figurineId, true])
      ),
      figurineGroups: Object.fromEntries(
        (cfg.extras?.figurineGroups ?? []).map((group) => [group.id, group.target])
      ),
    },
  };
}

export function migratePrestigeProgress(saved: PrestigeSaved | null | undefined, cfg: PrestigeConfig): PrestigeSaved | null {
  if (!saved) return null;
  if ((saved.schemaVersion ?? 1) >= PRESTIGE_PROGRESS_SCHEMA_VERSION) return saved;

  const legacyCfg = LEGACY_PRESTIGE_CONFIGS.find((legacy) => legacy.id === cfg.id);
  if (!legacyCfg) return { ...saved, schemaVersion: PRESTIGE_PROGRESS_SCHEMA_VERSION };

  const legacyProgress = computePrestigeRequirements(saved, legacyCfg);
  if (legacyProgress.done === legacyProgress.total) {
    return createCompletedPrestigeSaved(cfg);
  }

  return { ...saved, schemaVersion: PRESTIGE_PROGRESS_SCHEMA_VERSION };
}

export function computePrestigeRequirements(saved: PrestigeSaved | null | undefined, cfg: PrestigeConfig) {
  const s = saved ?? {};
  const lvl = Number(s.level || 0);
  const str = Number(s.strength || 0);
  const endu = Number(s.endurance || 0);
  const cha = Number(s.charisma || 0);
  const hideout = s.hideout || {};
  const quests = s.quests || {};
  const extras = s.extras || {};

  const met: boolean[] = [];
  met.push(lvl >= cfg.levelTarget);
  if (cfg.strengthTarget > 0) met.push(str >= cfg.strengthTarget);
  if (cfg.enduranceTarget > 0) met.push(endu >= cfg.enduranceTarget);
  if (cfg.charismaTarget > 0) met.push(cha >= cfg.charismaTarget);
  met.push(Number(hideout.intelligence || 0) >= cfg.hideoutTargets.intelligence);
  met.push(Number(hideout.security || 0) >= cfg.hideoutTargets.security);
  met.push(Number(hideout.restSpace || 0) >= cfg.hideoutTargets.restSpace);
  met.push(Number(hideout.roubles || 0) >= cfg.roublesTarget);
  for (const questId of cfg.requiredQuestIds) {
    met.push(Boolean(quests[questId]));
  }

  if (cfg.extras?.scavsTarget)
    met.push(Number(extras.scavs || 0) >= cfg.extras.scavsTarget);
  if (cfg.extras?.pmcTarget)
    met.push(Number(extras.pmc || 0) >= cfg.extras.pmcTarget);
  if (cfg.extras?.raidersTarget)
    met.push(Number(extras.raiders || 0) >= cfg.extras.raidersTarget);
  if (cfg.extras?.bossesTarget)
    met.push(Number(extras.bosses || 0) >= cfg.extras.bossesTarget);
  if (cfg.extras?.hoodedMenTarget)
    met.push(Number(extras.hoodedMen || 0) >= cfg.extras.hoodedMenTarget);
  if (cfg.extras?.requireLabsExtract)
    met.push(Boolean(extras.labsExtracted));
  if (cfg.extras?.requireLabsTransitToStreets)
    met.push(Boolean(extras.labsTransitToStreets));
  if (cfg.extras?.requireStreetsExtract)
    met.push(Boolean(extras.streetsExtracted));
  if (cfg.extras?.requireStreetsTransitToInterchange)
    met.push(Boolean(extras.streetsTransitToInterchange));
  if (cfg.extras?.requireInterchangeExtract)
    met.push(Boolean(extras.interchangeExtracted));
  if (cfg.extras?.requireInterchangeTransitToCustoms)
    met.push(Boolean(extras.interchangeTransitToCustoms));
  if (cfg.extras?.requireCustomsExtract)
    met.push(Boolean(extras.customsExtracted));
  if (cfg.extras?.requireCustomsTransitToReserve)
    met.push(Boolean(extras.customsTransitToReserve));
  if (cfg.extras?.requireReserveExtract)
    met.push(Boolean(extras.reserveExtracted));
  if (cfg.extras?.figurines?.length) {
    const figs: Record<string, boolean> = (extras.figurines || {}) as Record<string, boolean>;
    met.push(cfg.extras.figurines.every((id) => Boolean(figs[id])));
  }
  if (cfg.extras?.figurineGroups?.length) {
    const groups = extras.figurineGroups || {};
    met.push(cfg.extras.figurineGroups.every((group) => Number(groups[group.id] || 0) >= group.target));
  }

  const total = met.length;
  const done = met.filter(Boolean).length;
  const percent = (done / Math.max(1, total)) * 100;
  return { done, total, percent };
}

export async function loadCurrentPrestigeSummary() {
  // Find first incomplete prestige; else last one
  let current: { id: string; completed: number; total: number } | null = null;
  for (const cfg of PRESTIGE_CONFIGS) {
    const saved = await taskStorage.loadPrestigeProgress<PrestigeSaved>(cfg.id);
    const migrated = migratePrestigeProgress(saved, cfg);
    const { done, total } = computePrestigeRequirements(migrated, cfg);
    if (done < total) {
      current = { id: cfg.id, completed: done, total };
      break;
    }
    current = { id: cfg.id, completed: done, total };
  }
  return current;
}
