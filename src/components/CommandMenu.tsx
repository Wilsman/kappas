import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import type { Task, Achievement } from "@/types";

interface CommandMenuProps {
  viewMode: "tree" | "grouped" | "collector" | "flow" | "prestiges" | "achievements";
  groupBy: "trader" | "map";
  collectorGroupBy: "collector" | "hideout-stations";
  traders: string[];
  hiddenTraders: Set<string>;
  maps: string[];
  selectedMap: string | null;
  tasks: Task[];
  achievements: Achievement[];
  collectorItems: { name: string }[];
  onSetViewMode: (mode: CommandMenuProps["viewMode"]) => void;
  onSetGroupBy: (mode: "trader" | "map") => void;
  onSetCollectorGroupBy: (mode: "collector" | "hideout-stations") => void;
  onClearTraderFilter: () => void;
  onToggleTraderVisibility: (trader: string) => void;
  onSelectMap: (map: string | null) => void;
}

export function CommandMenu(props: CommandMenuProps) {
  const {
    viewMode,
    groupBy,
    collectorGroupBy,
    tasks,
    achievements,
    collectorItems,
    onSetViewMode,
    onSetGroupBy,
    onSetCollectorGroupBy,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Build enriched task matches including objectives and rewards
  const taskMatches = React.useMemo<{ task: Task; context: string; score: number; icon?: string }[]>(() => {
    // Normalize helper: lowercase, strip diacritics, normalize whitespace, normalize dash variants
    function norm(s: string): string {
      return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[\u00a0\s]+/g, " ") // collapse spaces incl. non-breaking space
        .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-") // all dash-like to '-'
        .trim();
    }

    const qRaw = query.trim();
    if (!qRaw) return [] as { task: Task; context: string; score: number; icon?: string }[];
    const q = norm(qRaw);
    const qTight = q.replace(/[^a-z0-9]/g, "");


    // Simple fuzzy similarity using bigram Dice coefficient and subsequence
    function diceCoeff(a: string, b: string): number {
      const s1 = norm(a);
      const s2 = norm(b);
      if (s1 === s2) return 1;
      if (s1.length < 2 || s2.length < 2) return 0;
      const bigrams = (s: string) => Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2));
      const aGrams = bigrams(s1);
      const bGrams = bigrams(s2);
      const counts = new Map<string, number>();
      for (const g of aGrams) counts.set(g, (counts.get(g) ?? 0) + 1);
      let overlap = 0;
      for (const g of bGrams) {
        const c = counts.get(g) ?? 0;
        if (c > 0) {
          overlap++;
          counts.set(g, c - 1);
        }
      }
      return (2 * overlap) / (aGrams.length + bGrams.length);
    }

    function isSubsequence(q: string, s: string): boolean {
      const nq = norm(q);
      const ns = norm(s);
      let i = 0;
      for (let j = 0; j < ns.length && i < nq.length; j++) {
        if (ns[j] === nq[i]) i++;
      }
      return i === nq.length;
    }

    function scoreValue(value: string, weight: number): number {
      const n = norm(value);
      if (!n) return 0;
      let score = 0;
      if (n.includes(q)) score = Math.max(score, 1.0);
      if (n.startsWith(q)) score = Math.max(score, 0.95);
      const tight = n.replace(/[^a-z0-9]/g, "");
      if (tight.includes(qTight)) score = Math.max(score, 0.9);
      if (isSubsequence(q, n)) score = Math.max(score, 0.75);
      const sim = diceCoeff(q, n);
      score = Math.max(score, sim * 0.9); // cap fuzzy influence
      return score * weight;
    }

    function findBestMatch(t: Task): { context: string; score: number; icon?: string } | null {
      let best: { context: string; score: number; icon?: string } | null = null;

      function consider(context: string, baseScore: number, icon?: string) {
        if (baseScore <= 0) return;
        if (!best || baseScore > best.score) best = { context, score: baseScore, icon };
      }

      // Name match (lower weight)
      consider("Name match", scoreValue(t.name, 1.2));

      // Objectives: item names and description
      for (const obj of t.objectives ?? []) {
        if (obj.description) consider(`Objective: ${obj.description}`, scoreValue(obj.description, 0.8));
        for (const it of obj.items ?? []) {
          consider(`Objective Item: ${it.name}`, scoreValue(it.name, 1.0), it.iconLink);
        }
      }

      // Rewards: start and finish items
      const rewardNames: string[] = [
        ...(t.startRewards?.items ?? []).map(r => r.item.name),
        ...(t.finishRewards?.items ?? []).map(r => r.item.name),
      ];
      const rewardIcons: (string | undefined)[] = [
        ...(t.startRewards?.items ?? []).map(r => r.item.iconLink),
        ...(t.finishRewards?.items ?? []).map(r => r.item.iconLink),
      ];
      for (let i = 0; i < rewardNames.length; i++) {
        const rn = rewardNames[i];
        consider(`Reward: ${rn}`, scoreValue(rn, 0.9), rewardIcons[i]);
      }

      // Map or trader names as a fallback context
      if (t.map?.name) consider(`Map: ${t.map.name}`, scoreValue(t.map.name, 0.4));
      if (t.trader?.name) consider(`Trader: ${t.trader.name}`, scoreValue(t.trader.name, 0.4));

      return best;
    }

    const out: { task: Task; context: string; score: number; icon?: string }[] = [];
    for (const t of tasks) {
      const m = findBestMatch(t);
      if (m) out.push({ task: t, context: m.context, score: m.score, icon: m.icon });
    }
    out.sort((a, b) => b.score - a.score || a.task.name.localeCompare(b.task.name));
    return out.slice(0, 15);
  }, [query, tasks]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    const openHandler = () => setOpen(true);
    window.addEventListener("open-command-menu", openHandler as EventListener);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-menu", openHandler as EventListener);
    };
  }, []);

  const handle = {
    navigateGrouped() {
      onSetViewMode("grouped");
      setOpen(false);
    },
    navigateGroupedByTrader() {
      onSetGroupBy("trader");
      onSetViewMode("grouped");
      setOpen(false);
    },
    navigateGroupedByMap() {
      onSetGroupBy("map");
      onSetViewMode("grouped");
      setOpen(false);
    },
    navigateCollector() {
      onSetViewMode("collector");
      setOpen(false);
    },
    navigateCollectorItems() {
      onSetCollectorGroupBy("collector");
      onSetViewMode("collector");
      setOpen(false);
    },
    navigateHideoutStations() {
      onSetCollectorGroupBy("hideout-stations");
      onSetViewMode("collector");
      setOpen(false);
    },
    navigatePrestiges() {
      onSetViewMode("prestiges");
      setOpen(false);
    },
    navigateAchievements() {
      onSetViewMode("achievements");
      setOpen(false);
    },
    openStoryline() {
      window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
      setOpen(false);
    },
  } as const;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem value="quests" onSelect={handle.navigateGrouped}>
            Quests {viewMode === "grouped" || viewMode === "tree" || viewMode === "flow" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="checklist-view" onSelect={handle.navigateGrouped}>
            Checklist View {viewMode === "grouped" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="by-trader" onSelect={handle.navigateGroupedByTrader}>
            By Trader {viewMode === "grouped" && groupBy === "trader" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="by-map" onSelect={handle.navigateGroupedByMap}>
            By Map {viewMode === "grouped" && groupBy === "map" ? "(current)" : ""}
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Items">
          <CommandItem value="items" onSelect={handle.navigateCollector}>
            Items {viewMode === "collector" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="collector-items" onSelect={handle.navigateCollectorItems}>
            Collector Items {viewMode === "collector" && collectorGroupBy === "collector" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="hideout-stations" onSelect={handle.navigateHideoutStations}>
            Hideout Stations {viewMode === "collector" && collectorGroupBy === "hideout-stations" ? "(current)" : ""}
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="More">
          <CommandItem value="prestiges" onSelect={handle.navigatePrestiges}>
            Prestiges {viewMode === "prestiges" ? "(current)" : ""}
          </CommandItem>
          <CommandItem value="achievements" onSelect={handle.navigateAchievements}>
            Achievements {viewMode === "achievements" ? "(current)" : ""}
          </CommandItem>
        </CommandGroup>

        {query.trim() && (
          <>
            <CommandGroup heading="Search • Quests">
              {taskMatches.map(({ task: t, context, icon }) => (
                <CommandItem
                  key={`task-${t.id}`}
                  value={`${t.name} ${context}`}
                  onSelect={() => {
                    onSetViewMode("grouped");
                    // Defer broadcast so destination view mounts and registers listener
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent("taskTracker:globalSearch", {
                          detail: { term: t.name, scope: "tasks" },
                        })
                      );
                    }, 0);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {icon ? (
                        <img
                          src={icon}
                          alt=""
                          className="h-3.5 w-3.5 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      {context}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Search • Prestiges">
              {['Prestige 1', 'Prestige 2', 'Prestige 3', 'Prestige 4']
                .filter(p => p.toLowerCase().includes(query.toLowerCase()))
                .map(title => (
                  <CommandItem
                    key={`prestige-${title}`}
                    value={`prestige-${title}`}
                    onSelect={() => {
                      onSetViewMode("prestiges");
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("taskTracker:globalSearch", {
                            detail: { term: title, scope: "prestiges" },
                          })
                        );
                      }, 0);
                      setOpen(false);
                    }}
                  >
                    {title}
                  </CommandItem>
                ))}
            </CommandGroup>

            <CommandGroup heading="Search • Achievements">
              {achievements
                .filter(a =>
                  [a.name, a.description ?? "", a.rarity ?? "", a.side ?? ""].some(v => v.toLowerCase().includes(query.toLowerCase()))
                )
                .slice(0, 10)
                .map(a => (
                  <CommandItem
                    key={`ach-${a.id}`}
                    value={`achievement-${a.name}`}
                    onSelect={() => {
                      onSetViewMode("achievements");
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("taskTracker:globalSearch", {
                            detail: { term: a.name, scope: "achievements" },
                          })
                        );
                      }, 0);
                      setOpen(false);
                    }}
                  >
                    {a.name}
                  </CommandItem>
                ))}
            </CommandGroup>

            <CommandGroup heading="Search • Items">
              {collectorItems
                .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10)
                .map(i => (
                  <CommandItem
                    key={`item-${i.name}`}
                    value={`item-${i.name}`}
                    onSelect={() => {
                      onSetCollectorGroupBy("collector");
                      onSetViewMode("collector");
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("taskTracker:globalSearch", {
                            detail: { term: i.name, scope: "items" },
                          })
                        );
                      }, 0);
                      setOpen(false);
                    }}
                  >
                    {i.name}
                  </CommandItem>
                ))}
            </CommandGroup>

            {query.toLowerCase().includes("prestige") && (
              <CommandGroup heading="Search • Navigate">
                <CommandItem value="go-prestiges" onSelect={handle.navigatePrestiges}>
                  Go to Prestiges
                </CommandItem>
              </CommandGroup>
            )}
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Links">
          <CommandItem value="storyline-quests" onSelect={handle.openStoryline}>
            1.0 Storyline Quests
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
