import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryState } from 'nuqs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { taskStorage } from '@/utils/indexedDB';
import {
  computePrestigeRequirements,
  createCompletedPrestigeSaved,
  migratePrestigeProgress,
  PRESTIGE_CONFIGS,
  PRESTIGE_UPDATED_EVENT,
  type PrestigeConfig,
  type PrestigeQuestId,
  type PrestigeSaved,
} from '@/utils/prestige';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCheck, RotateCcw } from 'lucide-react';

const FIGURINE_LABELS: Record<string, string> = {
  bear: "BEAR operative figurine (FIR)",
  mutkevich: "Politician Mutkevich figurine (FIR)",
  killa: "Killa figurine (FIR)",
  reshala: "Reshala figurine (FIR)",
  ryzhy: "Ryzhy figurine (FIR)",
  scav: "Scav figurine (FIR)",
  tagilla: "Tagilla figurine (FIR)",
  usec: "USEC operative figurine (FIR)",
  cultist: "Cultist figurine (FIR)",
  den: "Den figurine (FIR)",
};

const QUEST_LABELS: Record<PrestigeQuestId, string> = {
  newBeginning: 'New Beginning',
  collector: 'Collector',
  tour: 'Tour',
  fallingSkies: 'Falling Skies',
  ticketFromTarkov: 'Ticket from Tarkov',
  theyAreAlreadyHere: 'They Are Already Here',
  theTicket: 'The Ticket',
};

const PRESTIGE_COLORS: Record<string, NonNullable<PrestigeCardProps['color']>> = {
  'prestige-1': 'emerald',
  'prestige-2': 'sky',
  'prestige-3': 'violet',
  'prestige-4': 'amber',
  'prestige-5': 'rose',
  'prestige-6': 'cyan',
};

export function PrestigesView(): JSX.Element {
  const [searchTerm, setSearchTerm] = useQueryState('prestigeSearch', { defaultValue: '' });

  const prestiges = useMemo(
    () =>
      PRESTIGE_CONFIGS.map((cfg, index) => ({
        ...cfg,
        title: `Prestige ${index + 1}`,
        color: PRESTIGE_COLORS[cfg.id] ?? 'emerald',
      })),
    []
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return prestiges;
    return prestiges.filter((p) => p.title.toLowerCase().includes(term));
  }, [prestiges, searchTerm]);

  // Respond to global command search for prestiges
  useEffect(() => {
    type GlobalSearchDetail = { term?: string; scope?: 'tasks' | 'achievements' | 'items' | 'prestiges' };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (!detail || detail.scope !== 'prestiges' || typeof detail.term !== 'string') return;
      setSearchTerm(detail.term);
    };
    window.addEventListener('taskTracker:globalSearch', handler as EventListener);
    return () => window.removeEventListener('taskTracker:globalSearch', handler as EventListener);
  }, [setSearchTerm]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search prestiges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.map((p) => (
        <PrestigeCard key={p.id} {...p} />
      ))}
    </div>
  );
}

interface PrestigeProgress {
  level: number;
  strength: number;
  endurance: number;
  charisma: number;
  hideout: { intelligence: number; security: number; restSpace: number; roubles: number };
  quests: Partial<Record<PrestigeQuestId, boolean>>;
  extras: {
    scavs: number;
    pmc: number;
    raiders: number;
    bosses: number;
    hoodedMen: number;
    labsExtracted: boolean;
    labsTransitToStreets: boolean;
    streetsExtracted: boolean;
    streetsTransitToInterchange: boolean;
    interchangeExtracted: boolean;
    interchangeTransitToCustoms: boolean;
    customsExtracted: boolean;
    customsTransitToReserve: boolean;
    reserveExtracted: boolean;
    figurines: Record<string, boolean>;
    figurineGroups: Record<string, number>;
  };
}

interface PrestigeCardProps extends PrestigeConfig {
  title: string;
  color?: "emerald" | "sky" | "violet" | "amber" | "rose" | "cyan";
}

function PrestigeCard(props: PrestigeCardProps): JSX.Element {
  const {
    id,
    title,
    color = 'emerald',
    levelTarget,
    strengthTarget,
    enduranceTarget,
    charismaTarget,
    hideoutTargets,
    roublesTarget,
    requiredQuestIds,
    extras,
  } = props;

  const colorMap = {
    emerald: {
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      gradient: "from-emerald-500 to-emerald-400",
    },
    sky: {
      badge: "border-sky-500/30 bg-sky-500/10 text-sky-400",
      gradient: "from-sky-500 to-sky-400",
    },
    violet: {
      badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
      gradient: "from-violet-500 to-violet-400",
    },
    amber: {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      gradient: "from-amber-500 to-amber-400",
    },
    rose: {
      badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
      gradient: "from-rose-500 to-rose-400",
    },
    cyan: {
      badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
      gradient: "from-cyan-500 to-cyan-400",
    },
  } as const;
  const theme = colorMap[color] ?? colorMap.emerald;
  const prestigeConfig = useMemo<PrestigeConfig>(
    () => ({
      id,
      levelTarget,
      strengthTarget,
      enduranceTarget,
      charismaTarget,
      hideoutTargets,
      roublesTarget,
      requiredQuestIds,
      extras,
    }),
    [id, levelTarget, strengthTarget, enduranceTarget, charismaTarget, hideoutTargets, roublesTarget, requiredQuestIds, extras]
  );

  const defaultState: PrestigeProgress = useMemo(
    () => ({
      level: 0,
      strength: 0,
      endurance: 0,
      charisma: 0,
      hideout: { intelligence: 0, security: 0, restSpace: 0, roubles: 0 },
      quests: Object.fromEntries(requiredQuestIds.map((questId) => [questId, false])),
      extras: {
        scavs: 0,
        pmc: 0,
        raiders: 0,
        bosses: 0,
        hoodedMen: 0,
        labsExtracted: false,
        labsTransitToStreets: false,
        streetsExtracted: false,
        streetsTransitToInterchange: false,
        interchangeExtracted: false,
        interchangeTransitToCustoms: false,
        customsExtracted: false,
        customsTransitToReserve: false,
        reserveExtracted: false,
        figurines: Object.fromEntries((extras?.figurines ?? []).map((figurineId) => [figurineId, false])) as Record<string, boolean>,
        figurineGroups: Object.fromEntries((extras?.figurineGroups ?? []).map((group) => [group.id, 0])) as Record<string, number>,
      },
    }),
    [extras, requiredQuestIds]
  );

  const [state, setState] = useState<PrestigeProgress>(defaultState);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await taskStorage.loadPrestigeProgress<PrestigeSaved>(id);
      if (mounted && saved) {
        console.debug('[Prestige] load', { id, saved });
        const migrated = migratePrestigeProgress(saved, prestigeConfig);
        if (migrated && JSON.stringify(migrated) !== JSON.stringify(saved)) {
          await taskStorage.savePrestigeProgress(id, migrated);
        }
        const merged = {
          ...defaultState,
          ...migrated,
          quests: { ...defaultState.quests, ...(migrated?.quests ?? {}) },
          extras: {
            ...defaultState.extras,
            ...(migrated?.extras ?? {}),
            figurines: {
              ...defaultState.extras.figurines,
              ...((migrated?.extras && migrated.extras.figurines) ? migrated.extras.figurines : {}),
            },
            figurineGroups: {
              ...defaultState.extras.figurineGroups,
              ...((migrated?.extras && migrated.extras.figurineGroups) ? migrated.extras.figurineGroups : {}),
            },
          },
        } as PrestigeProgress;
        setState(merged);
        // record snapshot to avoid immediate re-save
        lastPersistedRef.current = JSON.stringify(merged);
      }
      // mark initial load complete whether saved existed or not
      hasLoadedRef.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, [id, defaultState, prestigeConfig]);

  useEffect(() => {
    if (!hasLoadedRef.current) return; // avoid overwriting saved data on first mount
    const currentSnapshot = JSON.stringify(state);
    if (lastPersistedRef.current === currentSnapshot) {
      // nothing changed since last persisted; skip scheduling save
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    console.debug('[Prestige] schedule save', { id, state });
    saveTimerRef.current = window.setTimeout(async () => {
      console.debug('[Prestige] saving', { id, state });
      await taskStorage.savePrestigeProgress(id, state);
      lastPersistedRef.current = currentSnapshot;
      window.dispatchEvent(new CustomEvent(PRESTIGE_UPDATED_EVENT, { detail: { id } }));
      console.debug('[Prestige] saved + event dispatched', { id });
    }, 200);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [id, state]);

  const requirements = useMemo(() => {
    const { done, total } = computePrestigeRequirements(state, prestigeConfig);
    return { done, total };
  }, [prestigeConfig, state]);

  function setNumber(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.min(max, Math.max(min, Math.floor(value)));
  }

  const percent = (requirements.done / Math.max(1, requirements.total)) * 100;
  const [displayPercent, setDisplayPercent] = useState(percent);
  const prevPercentRef = useRef(percent);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = prevPercentRef.current;
    const to = percent;
    const duration = 500;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPercent(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    prevPercentRef.current = percent;
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  function pendingSummaries(): string[] {
    const items: string[] = [];
    if (state.level < levelTarget) items.push(`Level ${state.level}/${levelTarget}`);
    if (state.strength < strengthTarget) items.push(`Strength ${state.strength}/${strengthTarget}`);
    if (state.endurance < enduranceTarget) items.push(`Endurance ${state.endurance}/${enduranceTarget}`);
    if (state.charisma < charismaTarget) items.push(`Charisma ${state.charisma}/${charismaTarget}`);
    if (state.hideout.intelligence < hideoutTargets.intelligence) items.push(`IC ${state.hideout.intelligence}/${hideoutTargets.intelligence}`);
    if (state.hideout.security < hideoutTargets.security) items.push(`Security ${state.hideout.security}/${hideoutTargets.security}`);
    if (state.hideout.restSpace < hideoutTargets.restSpace) items.push(`Rest ${state.hideout.restSpace}/${hideoutTargets.restSpace}`);
    if (state.hideout.roubles < roublesTarget) items.push(`₽ ${state.hideout.roubles.toLocaleString()}/${roublesTarget.toLocaleString()}`);
    for (const questId of requiredQuestIds) {
      if (!state.quests[questId]) items.push(`Quest: ${QUEST_LABELS[questId]}`);
    }
    if (extras) {
      if (extras.scavsTarget && state.extras.scavs < extras.scavsTarget) items.push(`Scavs ${state.extras.scavs}/${extras.scavsTarget}`);
      if (extras.pmcTarget && state.extras.pmc < extras.pmcTarget) items.push(`PMC ${state.extras.pmc}/${extras.pmcTarget}`);
      if (extras.raidersTarget && state.extras.raiders < extras.raidersTarget) items.push(`Raiders ${state.extras.raiders}/${extras.raidersTarget}`);
      if (extras.bossesTarget && state.extras.bosses < extras.bossesTarget) items.push(`Bosses ${state.extras.bosses}/${extras.bossesTarget}`);
      if (extras.hoodedMenTarget && state.extras.hoodedMen < extras.hoodedMenTarget) items.push(`Hooded men ${state.extras.hoodedMen}/${extras.hoodedMenTarget}`);
      if (extras.requireLabsExtract && !state.extras.labsExtracted) items.push('Survive & extract Labs');
      if (extras.requireLabsTransitToStreets && !state.extras.labsTransitToStreets) items.push('Labs Transit to Streets');
      if (extras.requireStreetsExtract && !state.extras.streetsExtracted) items.push('Survive & extract Streets');
      if (extras.requireStreetsTransitToInterchange && !state.extras.streetsTransitToInterchange) items.push('Streets Transit to Interchange');
      if (extras.requireInterchangeExtract && !state.extras.interchangeExtracted) items.push('Survive & extract Interchange');
      if (extras.requireInterchangeTransitToCustoms && !state.extras.interchangeTransitToCustoms) items.push('Interchange Transit to Customs');
      if (extras.requireCustomsExtract && !state.extras.customsExtracted) items.push('Survive & extract Customs');
      if (extras.requireCustomsTransitToReserve && !state.extras.customsTransitToReserve) items.push('Customs Transit to Reserve');
      if (extras.requireReserveExtract && !state.extras.reserveExtracted) items.push('Survive & extract Reserve');
      if (extras.figurines && extras.figurines.length) {
        const total = extras.figurines.length;
        const done = extras.figurines.reduce((acc, figurineId) => acc + (state.extras.figurines[figurineId] ? 1 : 0), 0);
        if (done < total) items.push(`Figurines ${done}/${total}`);
      }
      if (extras.figurineGroups && extras.figurineGroups.length) {
        const total = extras.figurineGroups.reduce((sum, group) => sum + group.target, 0);
        const done = extras.figurineGroups.reduce((sum, group) => sum + Math.min(state.extras.figurineGroups[group.id] || 0, group.target), 0);
        if (done < total) items.push(`Figurine groups ${done}/${total}`);
      }
    }
    return items;
  }

  function handleMarkAllComplete() {
    setState(createCompletedPrestigeSaved(prestigeConfig) as PrestigeProgress);
  }

  function handleResetProgress() {
    setState(defaultState);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <button
              type="button"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              onClick={() => setCollapsed((v) => !v)}
              className="flex items-center justify-center rounded border size-6 hover:bg-muted/50 transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`size-4 transition-transform ${!collapsed ? 'rotate-90' : ''}`}
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-xs md:text-sm ${theme.badge}`}
            >
              {title}
            </Badge>
          </span>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  title="Mark all requirements as complete"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Complete All</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark All Requirements Complete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set all requirements for {title} to their maximum values (Level {levelTarget}, all stats, hideout upgrades, quests, and objectives).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkAllComplete}>
                    Mark Complete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  title="Reset all progress"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset {title} Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all progress for {title} back to zero. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetProgress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset Progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prominent Overall Progress */}
        <div className="rounded-lg border bg-muted/10 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-semibold">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                {requirements.done} / {requirements.total} requirements met
              </p>
            </div>
            <div className="text-3xl md:text-4xl font-bold tabular-nums">
              {Math.round(displayPercent)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={displayPercent}
              className="h-4 md:h-5 overflow-hidden"
              indicatorClassName={`bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
            />
          </div>
          {collapsed ? (
            <div className="mt-4">
              <p className="text-sm font-medium">Pending</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {pendingSummaries().map((txt, i) => (
                  <li key={i} className="text-xs rounded border px-2 py-1 text-muted-foreground">
                    {txt}
                  </li>
                ))}
                {pendingSummaries().length === 0 ? (
                  <li className="text-xs text-emerald-600">All requirements complete</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        {collapsed ? null : <Separator />}

        {collapsed ? null : (
          <Section title="Level">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={state.level}
                onChange={(e) => setState((s) => ({ ...s, level: setNumber(Number(e.target.value), 0, levelTarget) }))}
                className="w-28"
                min={0}
                max={levelTarget}
              />
              <span className="text-sm text-muted-foreground">/ {levelTarget}</span>
            </div>
          </Section>
        )}

        {collapsed || (strengthTarget === 0 && enduranceTarget === 0 && charismaTarget === 0) ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {strengthTarget > 0 ? (
              <StatNumber label="Strength" value={state.strength} target={strengthTarget} onChange={(n) => setState((s) => ({ ...s, strength: setNumber(n, 0, strengthTarget) }))} />
            ) : null}
            {enduranceTarget > 0 ? (
              <StatNumber label="Endurance" value={state.endurance} target={enduranceTarget} onChange={(n) => setState((s) => ({ ...s, endurance: setNumber(n, 0, enduranceTarget) }))} />
            ) : null}
            {charismaTarget > 0 ? (
              <StatNumber label="Charisma" value={state.charisma} target={charismaTarget} onChange={(n) => setState((s) => ({ ...s, charisma: setNumber(n, 0, charismaTarget) }))} />
            ) : null}
          </div>
        )}

        {collapsed ? null : <Separator />}

        {collapsed ? null : (
          <Section title="Hideout Requirements">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatNumber label="Intelligence Center" value={state.hideout.intelligence} target={hideoutTargets.intelligence} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, intelligence: setNumber(n, 0, hideoutTargets.intelligence) } }))} />
              <StatNumber label="Security" value={state.hideout.security} target={hideoutTargets.security} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, security: setNumber(n, 0, hideoutTargets.security) } }))} />
              <StatNumber label="Rest Space" value={state.hideout.restSpace} target={hideoutTargets.restSpace} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, restSpace: setNumber(n, 0, hideoutTargets.restSpace) } }))} />
              <div className="rounded-md border p-3 hover:bg-muted/30 transition-colors">
                <p className="text-sm text-muted-foreground">Roubles</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={state.hideout.roubles}
                    onChange={(e) => setState((s) => ({ ...s, hideout: { ...s.hideout, roubles: setNumber(Number(e.target.value), 0, roublesTarget) } }))}
                    className="w-40"
                    min={0}
                    max={roublesTarget}
                  />
                  <span className="text-sm font-medium tabular-nums">/ {roublesTarget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Section>
        )}

        {collapsed ? null : <Separator />}

        {collapsed ? null : (
          <Section title="Quest Requirements">
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {requiredQuestIds.map((questId) => (
                <li key={questId} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                  <Checkbox
                    id={`${id}-quest-${questId}`}
                    checked={state.quests[questId] === true}
                    onCheckedChange={(c) => {
                      console.debug('[Prestige] toggle quest', { id, field: questId, value: c });
                      setState((s) => ({ ...s, quests: { ...s.quests, [questId]: c === true } }));
                    }}
                  />
                  <label htmlFor={`${id}-quest-${questId}`} className="cursor-pointer select-none text-muted-foreground">
                    Complete "{QUEST_LABELS[questId]}"
                  </label>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {extras ? (
          <>
            {collapsed ? null : <Separator />}
            {collapsed ? null : (
              <Section title="Additional Objectives">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {extras.scavsTarget ? (
                    <StatNumber label="Scav Kills" value={state.extras.scavs} target={extras.scavsTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, scavs: setNumber(n, 0, extras.scavsTarget!) } }))} />
                  ) : null}
                  {extras.pmcTarget ? (
                    <StatNumber label="PMC Kills" value={state.extras.pmc} target={extras.pmcTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, pmc: setNumber(n, 0, extras.pmcTarget!) } }))} />
                  ) : null}
                  {extras.raidersTarget ? (
                    <StatNumber label="Raider Kills" value={state.extras.raiders} target={extras.raidersTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, raiders: setNumber(n, 0, extras.raidersTarget!) } }))} />
                  ) : null}
                  {extras.bossesTarget ? (
                    <StatNumber label="Boss Kills" value={state.extras.bosses} target={extras.bossesTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, bosses: setNumber(n, 0, extras.bossesTarget!) } }))} />
                  ) : null}
                  {extras.hoodedMenTarget ? (
                    <StatNumber label="Hooded Men Kills" value={state.extras.hoodedMen} target={extras.hoodedMenTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, hoodedMen: setNumber(n, 0, extras.hoodedMenTarget!) } }))} />
                  ) : null}
                </div>

                {(extras.requireLabsExtract || extras.requireLabsTransitToStreets || extras.requireStreetsExtract || extras.requireStreetsTransitToInterchange || extras.requireInterchangeExtract || extras.requireInterchangeTransitToCustoms || extras.requireCustomsExtract || extras.requireCustomsTransitToReserve || extras.requireReserveExtract) ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extras.requireLabsExtract ? (
                      <ObjectiveCheckbox label="Survive and extract from The Lab" checked={state.extras.labsExtracted} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, labsExtracted: checked } }))} />
                    ) : null}
                    {extras.requireLabsTransitToStreets ? (
                      <ObjectiveCheckbox label="Use transit from The Lab to Streets of Tarkov" checked={state.extras.labsTransitToStreets} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, labsTransitToStreets: checked } }))} />
                    ) : null}
                    {extras.requireStreetsExtract ? (
                      <ObjectiveCheckbox label="Survive and extract from Streets of Tarkov" checked={state.extras.streetsExtracted} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, streetsExtracted: checked } }))} />
                    ) : null}
                    {extras.requireStreetsTransitToInterchange ? (
                      <ObjectiveCheckbox label="Use transit from Streets of Tarkov to Interchange" checked={state.extras.streetsTransitToInterchange} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, streetsTransitToInterchange: checked } }))} />
                    ) : null}
                    {extras.requireInterchangeExtract ? (
                      <ObjectiveCheckbox label="Survive and extract from Interchange" checked={state.extras.interchangeExtracted} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, interchangeExtracted: checked } }))} />
                    ) : null}
                    {extras.requireInterchangeTransitToCustoms ? (
                      <ObjectiveCheckbox label="Use transit from Interchange to Customs" checked={state.extras.interchangeTransitToCustoms} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, interchangeTransitToCustoms: checked } }))} />
                    ) : null}
                    {extras.requireCustomsExtract ? (
                      <ObjectiveCheckbox label="Survive and extract from Customs" checked={state.extras.customsExtracted} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, customsExtracted: checked } }))} />
                    ) : null}
                    {extras.requireCustomsTransitToReserve ? (
                      <ObjectiveCheckbox label="Use transit from Customs to Reserve" checked={state.extras.customsTransitToReserve} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, customsTransitToReserve: checked } }))} />
                    ) : null}
                    {extras.requireReserveExtract ? (
                      <ObjectiveCheckbox label="Survive and extract from Reserve" checked={state.extras.reserveExtracted} onChange={(checked) => setState((s) => ({ ...s, extras: { ...s.extras, reserveExtracted: checked } }))} />
                    ) : null}
                  </div>
                ) : null}

                {extras.figurineGroups && extras.figurineGroups.length ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Figurine Groups</p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {extras.figurineGroups.map((group) => (
                        <StatNumber
                          key={group.id}
                          label={group.label}
                          value={state.extras.figurineGroups[group.id] || 0}
                          target={group.target}
                          onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, figurineGroups: { ...s.extras.figurineGroups, [group.id]: setNumber(n, 0, group.target) } } }))}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {extras.figurines && extras.figurines.length ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Figurines</p>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      {extras.figurines.map((figurineId) => (
                        <li key={figurineId} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                          <Checkbox
                            id={`${id}-figurine-${figurineId}`}
                            checked={state.extras.figurines[figurineId] === true}
                            onCheckedChange={(c) => {
                              console.debug('[Prestige] toggle figurine', { id, figurine: figurineId, value: c });
                              setState((s) => ({ ...s, extras: { ...s.extras, figurines: { ...s.extras.figurines, [figurineId]: c === true } } }));
                            }}
                          />
                          <label htmlFor={`${id}-figurine-${figurineId}`} className="cursor-pointer select-none text-muted-foreground">
                            {FIGURINE_LABELS[figurineId] ?? figurineId}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Section>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps): JSX.Element {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}

interface ObjectiveCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ObjectiveCheckbox({ label, checked, onChange }: ObjectiveCheckboxProps): JSX.Element {
  return (
    <div className="rounded-md border p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
      <p className="text-sm font-medium">{label}</p>
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
    </div>
  );
}

interface StatNumberProps {
  label: string;
  value: number;
  target: number;
  onChange: (val: number) => void;
}

function StatNumber({ label, value, target, onChange }: StatNumberProps): JSX.Element {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-28" min={0} max={target} />
        <span className="text-base font-medium">/ {target}</span>
      </div>
    </div>
  );
}
