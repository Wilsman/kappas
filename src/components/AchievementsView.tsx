import { useMemo, useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { Achievement } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import DecryptReveal from '@/components/canvasui/DecryptReveal';
import { GAME_MODES, GAME_MODE_LABELS, type GameMode } from '@/utils/gameMode';

interface AchievementsViewProps {
  achievements: Achievement[];
  achievementsByMode: Partial<Record<GameMode, Achievement[]>>;
  activeGameMode: GameMode;
  completed: Set<string>;
  onToggle: (id: string) => void;
}

interface AchievementCardProps {
  achievement: Achievement;
  isDone: boolean;
  onToggle: (id: string) => void;
}

function AchievementTextContent({ achievement }: Pick<AchievementCardProps, 'achievement'>): JSX.Element {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium truncate">{achievement.name}</p>
        {achievement.hidden ? (
          <span className="text-xs text-muted-foreground">(Hidden)</span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{achievement.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>Side: {achievement.side}</span>
        <span>Players: {achievement.playersCompletedPercent}%</span>
      </div>
    </div>
  );
}

function AchievementDetailsContent({ achievement }: Pick<AchievementCardProps, 'achievement'>): JSX.Element {
  return (
    <>
      <p className="text-sm text-muted-foreground line-clamp-2">{achievement.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>Side: {achievement.side}</span>
        <span>Players: {achievement.playersCompletedPercent}%</span>
      </div>
    </>
  );
}

function AchievementCardContent({ achievement, isDone, onToggle }: AchievementCardProps): JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <img src={achievement.imageLink} alt={achievement.name} className="w-12 h-12 shrink-0 rounded-md object-contain bg-muted/30" loading="lazy" />
      <div className="min-w-0 flex-1">
        <AchievementTextContent achievement={achievement} />
      </div>
      <Checkbox checked={isDone} onCheckedChange={() => onToggle(achievement.id)} />
    </div>
  );
}

function HiddenAchievementCard(props: AchievementCardProps): JSX.Element {
  const [isRevealing, setIsRevealing] = useState(false);

  return (
    <li
      className="flex min-h-[108px] items-start gap-3 overflow-hidden rounded-md border p-3 transition-colors hover:bg-muted/30"
      onPointerEnter={() => setIsRevealing(true)}
      onPointerLeave={() => setIsRevealing(false)}
      onFocus={() => setIsRevealing(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsRevealing(false);
      }}
      tabIndex={0}
      aria-label="Hidden achievement. Hover or focus to decrypt."
    >
      <img src={props.achievement.imageLink} alt="Hidden achievement" className="w-12 h-12 shrink-0 rounded-md object-contain bg-muted/30" loading="lazy" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="truncate font-medium">{props.achievement.name}</p>
          <span className="text-xs text-muted-foreground">(Hidden)</span>
        </div>
        {isRevealing ? (
          <DecryptReveal
            className="h-[60px] overflow-hidden rounded-sm"
            radius={320}
            softness={0.72}
            cell={8}
            colored={0.8}
            color="#f59e0b"
            background="#111418"
          >
            <AchievementDetailsContent achievement={props.achievement} />
          </DecryptReveal>
        ) : (
          <div className="relative h-[60px] overflow-hidden font-mono text-xs text-amber-500/80" aria-hidden>
            <div className="absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,black,transparent)]">
              <p>7F3A · A91C · E4D2 · CLASSIFIED</p>
              <p className="mt-2 text-muted-foreground">Hover to decrypt achievement details</p>
            </div>
          </div>
        )}
      </div>
      <Checkbox checked={props.isDone} onCheckedChange={() => props.onToggle(props.achievement.id)} />
    </li>
  );
}

export function AchievementsView({
  achievements: activeAchievements,
  achievementsByMode,
  activeGameMode,
  completed,
  onToggle,
}: AchievementsViewProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useQueryState('achSearch', { defaultValue: '' });
  const [achievementMode, setAchievementMode] = useState<GameMode>(activeGameMode);
  const achievements = useMemo(
    () => achievementsByMode[achievementMode]
      ?? (achievementMode === activeGameMode ? activeAchievements : []),
    [achievementMode, achievementsByMode, activeAchievements, activeGameMode],
  );
  const isModeDataLoaded = achievementsByMode[achievementMode] !== undefined
    || achievementMode === activeGameMode;

  useEffect(() => {
    setAchievementMode(activeGameMode);
  }, [activeGameMode]);

  const total = achievements.length;
  const done = achievements.filter((achievement) => completed.has(achievement.id)).length;
  const percent = total > 0 ? (done / total) * 100 : 0;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return achievements;
    return achievements.filter(a => {
      const name = a.name?.toLowerCase() || '';
      const desc = a.description?.toLowerCase() || '';
      const side = a.side?.toLowerCase() || '';
      const rarity = a.rarity?.toLowerCase() || '';
      return (
        name.includes(term) ||
        desc.includes(term) ||
        side.includes(term) ||
        rarity.includes(term)
      );
    });
  }, [achievements, searchTerm]);

  // Respond to global command search for achievements
  useEffect(() => {
    type GlobalSearchDetail = { term?: string; scope?: 'tasks' | 'achievements' | 'items' };
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<GlobalSearchDetail>).detail;
      if (!detail || detail.scope !== 'achievements' || typeof detail.term !== 'string') return;
      setSearchTerm(detail.term);
    };
    window.addEventListener('taskTracker:globalSearch', handler as EventListener);
    return () => window.removeEventListener('taskTracker:globalSearch', handler as EventListener);
  }, [setSearchTerm]);

  const groupedByRarity = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of filtered) {
      const desc = (a.description || '').toLowerCase();
      const key = desc.includes('event') ? 'Event' : (a.rarity || 'Unknown');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    const weight = (r: string) => {
      switch (r.toLowerCase()) {
        case 'common':
          return 0;
        case 'rare':
          return 1;
        case 'legendary':
          return 2;
        default:
          return 99;
      }
    };
    return Array.from(map.entries()).sort((a, b) => {
      const wa = weight(a[0]);
      const wb = weight(b[0]);
      if (wa !== wb) return wa - wb;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  const renderAchievementCard = (achievement: Achievement) => {
    const isDone = completed.has(achievement.id);

    if (achievement.hidden) {
      return (
        <HiddenAchievementCard
          key={achievement.id}
          achievement={achievement}
          isDone={isDone}
          onToggle={onToggle}
        />
      );
    }

    return (
      <li key={achievement.id} className="min-h-[88px] rounded-md border p-3 hover:bg-muted/30 transition-colors">
        <AchievementCardContent achievement={achievement} isDone={isDone} onToggle={onToggle} />
      </li>
    );
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="text-sm text-muted-foreground">
              {isModeDataLoaded ? `${done}/${total} completed` : 'Loading achievements…'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <ToggleGroup
              type="single"
              value={achievementMode}
              onValueChange={(value) => {
                if (GAME_MODES.includes(value as GameMode)) {
                  setAchievementMode(value as GameMode);
                }
              }}
              variant="outline"
              size="sm"
              className="w-fit rounded-lg border bg-background/70 p-1 shadow-sm"
              aria-label="Achievement game mode"
            >
              {GAME_MODES.map((mode) => (
                <ToggleGroupItem
                  key={mode}
                  value={mode}
                  className="h-8 rounded-md px-3 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm sm:text-sm"
                  aria-label={`Show ${GAME_MODE_LABELS[mode]} achievements`}
                >
                  {GAME_MODE_LABELS[mode]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="min-w-14 text-right text-2xl font-bold tabular-nums">
              {percent.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={percent} className="h-3" />
        </div>
      </div>

      {/* Search row below header card */}
      <div className="-mt-2 px-0">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search achievements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {groupedByRarity.map(([rarity, list]) => (
        <section key={rarity} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{rarity}</h3>
            <Badge variant="outline">{list.length}</Badge>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map(renderAchievementCard)}
          </ul>
        </section>
      ))}
    </div>
  );
}
