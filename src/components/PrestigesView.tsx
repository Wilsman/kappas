import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryState } from 'nuqs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { taskStorage } from '@/utils/indexedDB';
import { computePrestigeRequirements, PRESTIGE_UPDATED_EVENT } from '@/utils/prestige';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function PrestigesView(): JSX.Element {
  const [searchTerm, setSearchTerm] = useQueryState('prestigeSearch', { defaultValue: '' });

  // configs for all prestige cards
  const prestiges = useMemo(
    () => [
      {
        id: 'prestige-1',
        title: 'Prestige 1',
        color: 'emerald' as const,
        levelTarget: 55,
        strengthTarget: 20,
        enduranceTarget: 20,
        charismaTarget: 15,
        roublesTarget: 20000000,
        extra: {
          scavsTarget: 50,
          requireLabsExtract: true,
          figurines: [
            { id: 'bear', label: 'BEAR operative figurine' },
            { id: 'mutkevich', label: 'Politician Mutkevich figurine' },
            { id: 'killa', label: 'Killa figurine' },
            { id: 'reshala', label: 'Reshala figurine' },
            { id: 'ryzhy', label: 'Ryzhy figurine' },
            { id: 'scav', label: 'Scav figurine' },
            { id: 'tagilla', label: 'Tagilla figurine' },
            { id: 'usec', label: 'USEC operative figurine' },
            { id: 'cultist', label: 'Cultist figurine' },
            { id: 'den', label: 'Den figurine' },
          ],
        },
      },
      {
        id: 'prestige-2',
        title: 'Prestige 2',
        color: 'sky' as const,
        levelTarget: 55,
        strengthTarget: 20,
        enduranceTarget: 20,
        charismaTarget: 15,
        roublesTarget: 20000000,
        extra: {
          pmcTarget: 15,
          requireLabsExtract: true,
          figurines: [
            { id: 'bear', label: 'BEAR operative figurine (FIR)' },
            { id: 'mutkevich', label: 'Politician Mutkevich figurine (FIR)' },
            { id: 'killa', label: 'Killa figurine (FIR)' },
            { id: 'reshala', label: 'Reshala figurine (FIR)' },
            { id: 'ryzhy', label: 'Ryzhy figurine (FIR)' },
            { id: 'scav', label: 'Scav figurine (FIR)' },
            { id: 'tagilla', label: 'Tagilla figurine (FIR)' },
            { id: 'usec', label: 'USEC operative figurine (FIR)' },
            { id: 'cultist', label: 'Cultist figurine (FIR)' },
            { id: 'den', label: 'Den figurine (FIR)' },
          ],
        },
      },
      {
        id: 'prestige-3',
        title: 'Prestige 3',
        color: 'violet' as const,
        levelTarget: 55,
        strengthTarget: 20,
        enduranceTarget: 20,
        charismaTarget: 20,
        roublesTarget: 20000000,
        extra: {
          pmcTarget: 25,
          raidersTarget: 50,
          requireLabsTransitToStreets: true,
          requireStreetsExtract: true,
          figurines: [
            { id: 'bear', label: 'BEAR operative figurine (FIR)' },
            { id: 'mutkevich', label: 'Politician Mutkevich figurine (FIR)' },
            { id: 'killa', label: 'Killa figurine (FIR)' },
            { id: 'reshala', label: 'Reshala figurine (FIR)' },
            { id: 'ryzhy', label: 'Ryzhy figurine (FIR)' },
            { id: 'scav', label: 'Scav figurine (FIR)' },
            { id: 'tagilla', label: 'Tagilla figurine (FIR)' },
            { id: 'usec', label: 'USEC operative figurine (FIR)' },
            { id: 'cultist', label: 'Cultist figurine (FIR)' },
            { id: 'den', label: 'Den figurine (FIR)' },
          ],
          requireAnyLabyrinthFigurine: true,
        },
      },
      {
        id: 'prestige-4',
        title: 'Prestige 4',
        color: 'amber' as const,
        levelTarget: 55,
        strengthTarget: 20,
        enduranceTarget: 20,
        charismaTarget: 15,
        roublesTarget: 20000000,
      },
    ],
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
  quests: { collector: boolean; newBeginning: boolean };
  extras: {
    scavs: number;
    pmc: number;
    raiders: number;
    labsExtracted: boolean;
    labsTransitToStreets: boolean;
    streetsExtracted: boolean;
    anyLabyrinthFigurine: boolean;
    figurines: Record<string, boolean>;
  };
}

interface ExtraObjectives {
  scavsTarget?: number;
  pmcTarget?: number;
  raidersTarget?: number;
  requireLabsExtract?: boolean;
  requireLabsTransitToStreets?: boolean;
  requireStreetsExtract?: boolean;
  requireAnyLabyrinthFigurine?: boolean;
  figurines?: { id: string; label: string }[];
}

interface PrestigeCardProps {
  id: string;
  title: string;
  color?: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
  levelTarget: number;
  strengthTarget: number;
  enduranceTarget: number;
  charismaTarget: number;
  roublesTarget: number;
  extra?: ExtraObjectives;
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
    roublesTarget,
    extra,
  } = props;

  const colorMap = {
    emerald: {
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      gradient: 'from-emerald-500 to-emerald-400',
    },
    sky: {
      badge: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      gradient: 'from-sky-500 to-sky-400',
    },
    violet: {
      badge: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
      gradient: 'from-violet-500 to-violet-400',
    },
    amber: {
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      gradient: 'from-amber-500 to-amber-400',
    },
    rose: {
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      gradient: 'from-rose-500 to-rose-400',
    },
  } as const;
  const theme = colorMap[color] ?? colorMap.emerald;

  const defaultState: PrestigeProgress = useMemo(
    () => ({
      level: 0,
      strength: 0,
      endurance: 0,
      charisma: 0,
      hideout: { intelligence: 0, security: 0, restSpace: 0, roubles: 0 },
      quests: { collector: false, newBeginning: false },
      extras: {
        scavs: 0,
        pmc: 0,
        raiders: 0,
        labsExtracted: false,
        labsTransitToStreets: false,
        streetsExtracted: false,
        anyLabyrinthFigurine: false,
        figurines: Object.fromEntries((extra?.figurines ?? []).map((f) => [f.id, false])) as Record<string, boolean>,
      },
    }),
    [extra]
  );

  const [state, setState] = useState<PrestigeProgress>(defaultState);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await taskStorage.loadPrestigeProgress<Partial<PrestigeProgress>>(id);
      if (mounted && saved) {
        console.debug('[Prestige] load', { id, saved });
        const merged = {
          ...defaultState,
          ...saved,
          quests: { collector: false, newBeginning: false, ...(saved.quests ?? {}) },
          extras: {
            ...defaultState.extras,
            ...(saved.extras ?? {}),
            figurines: {
              ...defaultState.extras.figurines,
              ...((saved.extras && saved.extras.figurines) ? saved.extras.figurines : {}),
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
  }, [id, defaultState]);

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
    const cfg = {
      id,
      levelTarget,
      strengthTarget,
      enduranceTarget,
      charismaTarget,
      roublesTarget,
      extras: extra
        ? {
            scavsTarget: extra.scavsTarget,
            pmcTarget: extra.pmcTarget,
            raidersTarget: extra.raidersTarget,
            requireLabsExtract: extra.requireLabsExtract,
            requireLabsTransitToStreets: extra.requireLabsTransitToStreets,
            requireStreetsExtract: extra.requireStreetsExtract,
            requireAnyLabyrinthFigurine: extra.requireAnyLabyrinthFigurine,
            figurines: extra.figurines?.map((f) => f.id),
          }
        : undefined,
    } as const;
    const { done, total } = computePrestigeRequirements(state, cfg);
    return { done, total };
  }, [id, state, levelTarget, strengthTarget, enduranceTarget, charismaTarget, roublesTarget, extra]);

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
    // hideout pieces
    if (state.hideout.intelligence < 2) items.push(`IC ${state.hideout.intelligence}/2`);
    if (state.hideout.security < 3) items.push(`Security ${state.hideout.security}/3`);
    if (state.hideout.restSpace < 3) items.push(`Rest ${state.hideout.restSpace}/3`);
    if (state.hideout.roubles < roublesTarget) items.push(`₽ ${state.hideout.roubles.toLocaleString()}/${roublesTarget.toLocaleString()}`);
    // quests
    if (!state.quests.collector) items.push('Quest: Collector');
    if (!state.quests.newBeginning) items.push('Quest: New Beginning');
    // extras
    if (extra) {
      if (extra.scavsTarget && state.extras.scavs < extra.scavsTarget) items.push(`Scavs ${state.extras.scavs}/${extra.scavsTarget}`);
      if (extra.pmcTarget && state.extras.pmc < extra.pmcTarget) items.push(`PMC ${state.extras.pmc}/${extra.pmcTarget}`);
      if (extra.raidersTarget && state.extras.raiders < extra.raidersTarget) items.push(`Raiders ${state.extras.raiders}/${extra.raidersTarget}`);
      if (extra.requireLabsExtract && !state.extras.labsExtracted) items.push('Survive & extract Labs');
      if (extra.requireLabsTransitToStreets && !state.extras.labsTransitToStreets) items.push('Labs Transit → Streets');
      if (extra.requireStreetsExtract && !state.extras.streetsExtracted) items.push('Survive & extract Streets');
      if (extra.requireAnyLabyrinthFigurine && !state.extras.anyLabyrinthFigurine) items.push('Any Labyrinth figurine');
      if (extra.figurines && extra.figurines.length) {
        const total = extra.figurines.length;
        const done = extra.figurines.reduce((acc, f) => acc + (state.extras.figurines[f.id] ? 1 : 0), 0);
        if (done < total) items.push(`Figurines ${done}/${total}`);
      }
    }
    return items;
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

        {collapsed ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <StatNumber label="Strength" value={state.strength} target={strengthTarget} onChange={(n) => setState((s) => ({ ...s, strength: setNumber(n, 0, strengthTarget) }))} />
            <StatNumber label="Endurance" value={state.endurance} target={enduranceTarget} onChange={(n) => setState((s) => ({ ...s, endurance: setNumber(n, 0, enduranceTarget) }))} />
            <StatNumber label="Charisma" value={state.charisma} target={charismaTarget} onChange={(n) => setState((s) => ({ ...s, charisma: setNumber(n, 0, charismaTarget) }))} />
          </div>
        )}

        {collapsed ? null : <Separator />}

        {collapsed ? null : (
          <Section title="Hideout Requirements">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatNumber label="Intelligence Center" value={state.hideout.intelligence} target={2} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, intelligence: setNumber(n, 0, 2) } }))} />
              <StatNumber label="Security" value={state.hideout.security} target={3} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, security: setNumber(n, 0, 3) } }))} />
              <StatNumber label="Rest Space" value={state.hideout.restSpace} target={3} onChange={(n) => setState((s) => ({ ...s, hideout: { ...s.hideout, restSpace: setNumber(n, 0, 3) } }))} />
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
              <li className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                <Checkbox
                  id={`${id}-quest-collector`}
                  checked={state.quests.collector}
                  onCheckedChange={(c) => {
                    console.debug('[Prestige] toggle quest', { id, field: 'collector', value: c });
                    setState((s) => ({ ...s, quests: { ...s.quests, collector: c === true } }));
                  }}
                />
                <label htmlFor={`${id}-quest-collector`} className="cursor-pointer select-none text-muted-foreground">
                  Complete "Collector"
                </label>
              </li>
              <li className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                <Checkbox
                  id={`${id}-quest-new-beginning`}
                  checked={state.quests.newBeginning}
                  onCheckedChange={(c) => {
                    console.debug('[Prestige] toggle quest', { id, field: 'newBeginning', value: c });
                    setState((s) => ({ ...s, quests: { ...s.quests, newBeginning: c === true } }));
                  }}
                />
                <label htmlFor={`${id}-quest-new-beginning`} className="cursor-pointer select-none text-muted-foreground">
                  Complete "New Beginning"
                </label>
              </li>
            </ul>
          </Section>
        )}

        {extra ? (
          <>
            {collapsed ? null : <Separator />}
            {collapsed ? null : (
              <Section title="Additional Objectives">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {extra.scavsTarget ? (
                    <StatNumber label={`Scav Kills`} value={state.extras.scavs} target={extra.scavsTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, scavs: setNumber(n, 0, extra.scavsTarget!) } }))} />
                  ) : null}
                  {extra.pmcTarget ? (
                    <StatNumber label={`PMC Kills`} value={state.extras.pmc} target={extra.pmcTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, pmc: setNumber(n, 0, extra.pmcTarget!) } }))} />
                  ) : null}
                  {extra.raidersTarget ? (
                    <StatNumber label={`Raider Kills`} value={state.extras.raiders} target={extra.raidersTarget} onChange={(n) => setState((s) => ({ ...s, extras: { ...s.extras, raiders: setNumber(n, 0, extra.raidersTarget!) } }))} />
                  ) : null}
                </div>

                {(extra.requireLabsExtract || extra.requireLabsTransitToStreets || extra.requireStreetsExtract || extra.requireAnyLabyrinthFigurine) ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extra.requireLabsExtract ? (
                      <div className="rounded-md border p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <p className="text-sm font-medium">Survive and Extract from Labs</p>
                        <Checkbox checked={state.extras.labsExtracted} onCheckedChange={(c) => { console.debug('[Prestige] toggle extra', { id, field: 'labsExtracted', value: c }); setState((s) => ({ ...s, extras: { ...s.extras, labsExtracted: c === true } })); }} />
                      </div>
                    ) : null}
                    {extra.requireLabsTransitToStreets ? (
                      <div className="rounded-md border p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <p className="text-sm font-medium">Use Labs Transit to Streets</p>
                        <Checkbox checked={state.extras.labsTransitToStreets} onCheckedChange={(c) => { console.debug('[Prestige] toggle extra', { id, field: 'labsTransitToStreets', value: c }); setState((s) => ({ ...s, extras: { ...s.extras, labsTransitToStreets: c === true } })); }} />
                      </div>
                    ) : null}
                    {extra.requireStreetsExtract ? (
                      <div className="rounded-md border p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <p className="text-sm font-medium">Survive and Extract from Streets</p>
                        <Checkbox checked={state.extras.streetsExtracted} onCheckedChange={(c) => { console.debug('[Prestige] toggle extra', { id, field: 'streetsExtracted', value: c }); setState((s) => ({ ...s, extras: { ...s.extras, streetsExtracted: c === true } })); }} />
                      </div>
                    ) : null}
                    {extra.requireAnyLabyrinthFigurine ? (
                      <div className="rounded-md border p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <p className="text-sm font-medium">Hand over any Labyrinth figurine</p>
                        <Checkbox checked={state.extras.anyLabyrinthFigurine} onCheckedChange={(c) => { console.debug('[Prestige] toggle extra', { id, field: 'anyLabyrinthFigurine', value: c }); setState((s) => ({ ...s, extras: { ...s.extras, anyLabyrinthFigurine: c === true } })); }} />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {extra.figurines && extra.figurines.length ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Figurines</p>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      {extra.figurines.map((f) => (
                        <li key={f.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/30 transition-colors">
                          <Checkbox
                            id={`${id}-figurine-${f.id}`}
                            checked={state.extras.figurines[f.id]}
                            onCheckedChange={(c) => {
                              console.debug('[Prestige] toggle figurine', { id, figurine: f.id, value: c });
                              setState((s) => ({ ...s, extras: { ...s.extras, figurines: { ...s.extras.figurines, [f.id]: c === true } } }));
                            }}
                          />
                          <label htmlFor={`${id}-figurine-${f.id}`} className="cursor-pointer select-none text-muted-foreground">
                            {f.label}
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
