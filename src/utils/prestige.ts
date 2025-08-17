import { taskStorage } from '@/utils/indexedDB';

export const PRESTIGE_UPDATED_EVENT = 'prestige:updated';

export interface PrestigeConfig {
  id: string;
  levelTarget: number;
  strengthTarget: number;
  enduranceTarget: number;
  charismaTarget: number;
  roublesTarget: number;
  extras?: {
    scavsTarget?: number;
    pmcTarget?: number;
    raidersTarget?: number;
    requireLabsExtract?: boolean;
    requireLabsTransitToStreets?: boolean;
    requireStreetsExtract?: boolean;
    requireAnyLabyrinthFigurine?: boolean;
    figurines?: string[];
  };
}

export interface PrestigeSaved {
  level?: number;
  strength?: number;
  endurance?: number;
  charisma?: number;
  hideout?: { intelligence?: number; security?: number; restSpace?: number; roubles?: number };
  quests?: { collector?: boolean; newBeginning?: boolean };
  extras?: {
    scavs?: number;
    pmc?: number;
    raiders?: number;
    labsExtracted?: boolean;
    labsTransitToStreets?: boolean;
    streetsExtracted?: boolean;
    anyLabyrinthFigurine?: boolean;
    figurines?: Record<string, boolean>;
  };
}

export const PRESTIGE_CONFIGS: PrestigeConfig[] = [
  {
    id: 'prestige-1',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    roublesTarget: 20_000_000,
    extras: {
      scavsTarget: 50,
      requireLabsExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-2',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    roublesTarget: 20_000_000,
    extras: {
      pmcTarget: 15,
      requireLabsExtract: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-3',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 20,
    roublesTarget: 20_000_000,
    extras: {
      pmcTarget: 25,
      raidersTarget: 50,
      requireLabsTransitToStreets: true,
      requireStreetsExtract: true,
      requireAnyLabyrinthFigurine: true,
      figurines: [
        'bear','mutkevich','killa','reshala','ryzhy','scav','tagilla','usec','cultist','den',
      ],
    },
  },
  {
    id: 'prestige-4',
    levelTarget: 55,
    strengthTarget: 20,
    enduranceTarget: 20,
    charismaTarget: 15,
    roublesTarget: 20_000_000,
  },
];

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
  met.push(str >= cfg.strengthTarget);
  met.push(endu >= cfg.enduranceTarget);
  met.push(cha >= cfg.charismaTarget);
  met.push(Number(hideout.intelligence || 0) >= 2);
  met.push(Number(hideout.security || 0) >= 3);
  met.push(Number(hideout.restSpace || 0) >= 3);
  met.push(Number(hideout.roubles || 0) >= cfg.roublesTarget);
  met.push(Boolean(quests.collector));
  met.push(Boolean(quests.newBeginning));

  if (cfg.extras?.scavsTarget)
    met.push(Number(extras.scavs || 0) >= cfg.extras.scavsTarget);
  if (cfg.extras?.pmcTarget)
    met.push(Number(extras.pmc || 0) >= cfg.extras.pmcTarget);
  if (cfg.extras?.raidersTarget)
    met.push(Number(extras.raiders || 0) >= cfg.extras.raidersTarget);
  if (cfg.extras?.requireLabsExtract)
    met.push(Boolean(extras.labsExtracted));
  if (cfg.extras?.requireLabsTransitToStreets)
    met.push(Boolean(extras.labsTransitToStreets));
  if (cfg.extras?.requireStreetsExtract)
    met.push(Boolean(extras.streetsExtracted));
  if (cfg.extras?.requireAnyLabyrinthFigurine)
    met.push(Boolean(extras.anyLabyrinthFigurine));
  if (cfg.extras?.figurines?.length) {
    const figs: Record<string, boolean> = (extras.figurines || {}) as Record<string, boolean>;
    met.push(cfg.extras.figurines.every((id) => Boolean(figs[id])));
  }

  const total = met.length;
  const done = met.filter(Boolean).length;
  const percent = (done / Math.max(1, total)) * 100;
  return { done, total, percent };
}

export async function loadCurrentPrestigeSummary() {
  // Find first incomplete prestige; else last one
  let current: { completed: number; total: number } | null = null;
  for (const cfg of PRESTIGE_CONFIGS) {
    const saved = await taskStorage.loadPrestigeProgress<PrestigeSaved>(cfg.id);
    const { done, total } = computePrestigeRequirements(saved, cfg);
    if (done < total) {
      current = { completed: done, total };
      break;
    }
    current = { completed: done, total };
  }
  return current;
}
