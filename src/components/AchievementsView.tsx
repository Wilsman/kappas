import { useMemo, useEffect } from 'react';
import { useQueryState } from 'nuqs';
import { Achievement } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AchievementsViewProps {
  achievements: Achievement[];
  completed: Set<string>;
  onToggle: (id: string) => void;
}

export function AchievementsView({ achievements, completed, onToggle }: AchievementsViewProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useQueryState('achSearch', { defaultValue: '' });

  const total = achievements.length;
  const done = completed.size;
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

  return (
    <div className="h-full min-h-0 overflow-y-auto p-4 space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="text-sm text-muted-foreground">{done}/{total} completed</p>
          </div>
          <div className="text-2xl font-bold tabular-nums">{percent.toFixed(0)}%</div>
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
            {list.map((a) => {
              const isDone = completed.has(a.id);
              return (
                <li key={a.id} className="rounded-md border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <img src={a.imageLink} alt={a.name} className="w-12 h-12 rounded-md object-contain bg-muted/30" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{a.name}</p>
                        {a.hidden ? (
                          <span className="text-xs text-muted-foreground">(Hidden)</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Side: {a.side}</span>
                        <span>Players: {a.playersCompletedPercent}%</span>
                      </div>
                    </div>
                    <Checkbox checked={isDone} onCheckedChange={() => onToggle(a.id)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
