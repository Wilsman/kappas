import { useMemo, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryState } from 'nuqs';
import { ChevronDown, EyeOff, X } from 'lucide-react';
import { Achievement } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DecryptReveal from '@/components/canvasui/DecryptReveal';
import { GAME_MODE_LABELS, type GameMode } from '@/utils/gameMode';
import { cn } from '@/lib/utils';
import {
  ACHIEVEMENT_SORTS,
  ACHIEVEMENT_STATUS_FILTERS,
  filterAndSortAchievements,
  groupAchievementsByRarity,
  normalizeAchievementSort,
  normalizeAchievementStatusFilter,
  type AchievementSort,
  type AchievementStatusFilter,
} from '@/utils/achievementFilters';

interface AchievementsViewProps {
  achievements: Achievement[];
  activeGameMode: GameMode;
  completed: Set<string>;
  onToggle: (id: string) => void;
}

interface AchievementCardProps {
  achievement: Achievement;
  isDone: boolean;
  onToggle: (id: string) => void;
}

const STATUS_LABELS: Record<AchievementStatusFilter, string> = {
  all: 'All',
  incomplete: 'Incomplete',
  completed: 'Completed',
};

const SORT_LABELS: Record<AchievementSort, string> = {
  default: 'Default order',
  'players-desc': 'Most players first',
  'players-asc': 'Fewest players first',
  name: 'Name (A-Z)',
};

const cardClassName = (isDone: boolean) =>
  cn(
    'flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/30',
    isDone && 'border-emerald-500/40 bg-emerald-500/5 opacity-60 hover:opacity-100 focus-within:opacity-100',
  );

function AchievementMeta({ achievement }: { achievement: Achievement }): JSX.Element {
  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      <span>Side: {achievement.side}</span>
      <span>Players: {achievement.playersCompletedPercent}%</span>
    </div>
  );
}

function AchievementName({
  achievement,
  isDone,
  expanded,
}: {
  achievement: Achievement;
  isDone: boolean;
  expanded: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <p
        className={cn('font-medium', expanded ? 'break-words' : 'truncate', isDone && 'line-through')}
        title={achievement.name}
      >
        {achievement.name}
      </p>
      {achievement.hidden ? (
        <span className="shrink-0 text-xs text-muted-foreground">(Hidden)</span>
      ) : null}
    </div>
  );
}

function AchievementDescription({
  achievement,
  expanded,
}: {
  achievement: Achievement;
  expanded: boolean;
}): JSX.Element {
  return (
    <p
      className={cn('text-sm text-muted-foreground', !expanded && 'line-clamp-2')}
      title={expanded ? undefined : achievement.description}
    >
      {achievement.description}
    </p>
  );
}

function CardCheckbox({ achievement, isDone, onToggle }: AchievementCardProps): JSX.Element {
  return (
    <Checkbox
      checked={isDone}
      onCheckedChange={() => onToggle(achievement.id)}
      aria-label={`Completed: ${achievement.name}`}
      className="mt-1"
    />
  );
}

/** Card body; clicking it expands the card to show the full name and description. */
function ExpandButton({
  expanded,
  onToggleExpanded,
  label,
  children,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  label: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      className="flex min-w-0 flex-1 items-start gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-expanded={expanded}
      aria-label={label}
      onClick={onToggleExpanded}
    >
      {children}
      <ChevronDown
        className={cn(
          'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
          expanded && 'rotate-180',
        )}
        aria-hidden
      />
    </button>
  );
}

function AchievementCard(props: AchievementCardProps): JSX.Element {
  const { achievement, isDone } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <li className={cn('min-h-[88px]', cardClassName(isDone))}>
      <ExpandButton
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
        label={`${achievement.name}. ${expanded ? 'Collapse' : 'Expand'} details`}
      >
        <img
          src={achievement.imageLink}
          alt=""
          className="w-12 h-12 shrink-0 rounded-md object-contain bg-muted/30"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <AchievementName achievement={achievement} isDone={isDone} expanded={expanded} />
          <AchievementDescription achievement={achievement} expanded={expanded} />
          <AchievementMeta achievement={achievement} />
        </div>
      </ExpandButton>
      <CardCheckbox {...props} />
    </li>
  );
}

function HiddenAchievementCard(props: AchievementCardProps): JSX.Element {
  const { achievement, isDone } = props;
  const [isRevealing, setIsRevealing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      className={cn('min-h-[108px] overflow-hidden', cardClassName(isDone))}
      onPointerEnter={() => setIsRevealing(true)}
      onPointerLeave={() => setIsRevealing(false)}
      onFocus={() => setIsRevealing(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsRevealing(false);
      }}
    >
      <ExpandButton
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
        label={`Hidden achievement ${achievement.name}. ${expanded ? 'Hide' : 'Show'} details`}
      >
        <img
          src={achievement.imageLink}
          alt=""
          className="w-12 h-12 shrink-0 rounded-md object-contain bg-muted/30"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <AchievementName achievement={achievement} isDone={isDone} expanded={expanded} />
          </div>
          {expanded ? (
            <>
              <AchievementDescription achievement={achievement} expanded />
              <AchievementMeta achievement={achievement} />
            </>
          ) : isRevealing ? (
            <DecryptReveal
              className="h-[60px] overflow-hidden rounded-sm"
              radius={320}
              softness={0.72}
              cell={8}
              colored={0.8}
              color="#f59e0b"
              background="#111418"
            >
              <AchievementDescription achievement={achievement} expanded={false} />
              <AchievementMeta achievement={achievement} />
            </DecryptReveal>
          ) : (
            <div className="relative h-[60px] overflow-hidden font-mono text-xs text-amber-500/80" aria-hidden>
              <div className="absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,black,transparent)]">
                <p>7F3A · A91C · E4D2 · CLASSIFIED</p>
                <p className="mt-2 text-muted-foreground">Hover to decrypt, click to reveal</p>
              </div>
            </div>
          )}
        </div>
      </ExpandButton>
      <CardCheckbox {...props} />
    </li>
  );
}

export function AchievementsView({
  achievements,
  activeGameMode,
  completed,
  onToggle,
}: AchievementsViewProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useQueryState('achSearch', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('achStatus');
  const [sortParam, setSortParam] = useQueryState('achSort');
  const [hiddenParam, setHiddenParam] = useQueryState('achHidden');
  const hiddenOnly = hiddenParam === '1';
  const status = normalizeAchievementStatusFilter(statusParam);
  const sort = normalizeAchievementSort(sortParam);

  const total = achievements.length;
  const done = achievements.filter((achievement) => completed.has(achievement.id)).length;
  const percent = total > 0 ? (done / total) * 100 : 0;

  const filtered = useMemo(
    () => filterAndSortAchievements(achievements, { searchTerm, status, sort, completed, hiddenOnly }),
    [achievements, searchTerm, status, sort, completed, hiddenOnly],
  );

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

  // "/" focuses the search box, unless the user is already typing somewhere.
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const groupedByRarity = useMemo(() => groupAchievementsByRarity(filtered), [filtered]);

  const renderAchievementCard = (achievement: Achievement) => {
    const isDone = completed.has(achievement.id);
    const CardComponent = achievement.hidden ? HiddenAchievementCard : AchievementCard;
    return (
      <CardComponent
        key={achievement.id}
        achievement={achievement}
        isDone={isDone}
        onToggle={onToggle}
      />
    );
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Achievements</h2>
              {/* tarkov.dev serves the same achievements for every mode, so this just mirrors the profile's mode.
                  "mode" suffix keeps it distinct from the Seasonal rarity group below. */}
              <Badge variant="outline" title="Achievement list is the same in every game mode">
                {GAME_MODE_LABELS[activeGameMode]} mode
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {done}/{total} completed
            </p>
          </div>
          <div className="min-w-14 text-right text-2xl font-bold tabular-nums">
            {percent.toFixed(0)}%
          </div>
        </div>
        <div className="mt-3">
          <Progress value={percent} className="h-3" />
        </div>
      </div>

      {/* Search, status filter and sort below header card */}
      <div className="-mt-2 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Input
            ref={searchInputRef}
            placeholder="Search achievements... ( / )"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchTerm) {
                e.preventDefault();
                void setSearchTerm(null);
              }
            }}
            className={cn('w-full', searchTerm && 'pr-9')}
            aria-label="Search achievements"
            aria-keyshortcuts="/"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                void setSearchTerm(null);
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <ToggleGroup
          type="single"
          value={status}
          onValueChange={(value) => {
            if (!value) return;
            const next = normalizeAchievementStatusFilter(value);
            void setStatusParam(next === 'all' ? null : next);
          }}
          variant="outline"
          size="sm"
          aria-label="Filter by completion"
        >
          {ACHIEVEMENT_STATUS_FILTERS.map((option) => (
            <ToggleGroupItem key={option} value={option} className="px-3 text-xs sm:text-sm">
              {STATUS_LABELS[option]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Toggle
          variant="outline"
          size="sm"
          pressed={hiddenOnly}
          onPressedChange={(pressed) => void setHiddenParam(pressed ? '1' : null)}
          className="gap-1.5 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:text-sm"
          aria-label="Show only hidden achievements"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
          Hidden only
        </Toggle>
        <Select
          value={sort}
          onValueChange={(value) => {
            const next = normalizeAchievementSort(value);
            void setSortParam(next === 'default' ? null : next);
          }}
        >
          <SelectTrigger className="h-9 w-[190px]" aria-label="Sort achievements">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_SORTS.map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupedByRarity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No achievements match these filters.</p>
      ) : null}

      {groupedByRarity.map(({ key, label, items }) => (
        <section key={key} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{label}</h3>
            <Badge variant="outline">{items.length}</Badge>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(renderAchievementCard)}
          </ul>
        </section>
      ))}
    </div>
  );
}
