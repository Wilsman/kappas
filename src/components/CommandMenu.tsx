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
import type { Task, Achievement, HideoutStation } from "@/types";
import { cn } from "@/lib/utils";

type HideoutMatchEntry = {
  name: string;
  count: number;
  icon?: string;
  station: string;
  level: number;
  value: string;
};

type PreviewItem =
  | {
      kind: "task";
      task: Task;
      context: string;
      contextType: "generic" | "objective" | "reward" | "unlock";
      icon?: string;
    }
  | { kind: "hideout"; match: HideoutMatchEntry }
  | { kind: "achievement"; achievement: Achievement }
  | { kind: "item"; name: string; img?: string };

interface CommandMenuProps {
  viewMode:
    | "tree"
    | "grouped"
    | "collector"
    | "flow"
    | "prestiges"
    | "achievements"
    | "storyline"
    | "storyline-map"
    | "hideout-requirements"
    | "current";
  groupBy: "trader" | "map";
  collectorGroupBy: "collector" | "hideout-stations";
  traders: string[];
  hiddenTraders: Set<string>;
  maps: string[];
  selectedMap: string | null;
  tasks: Task[];
  achievements: Achievement[];
  collectorItems: { name: string; img?: string }[];
  hideoutStations: HideoutStation[];
  completedTasks: Set<string>;
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
    hideoutStations,
    completedTasks,
    onSetViewMode,
    onSetGroupBy,
    onSetCollectorGroupBy,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedValue, setSelectedValue] = React.useState("");
  const trimmedQuery = query.trim();
  const queryLower = trimmedQuery.toLowerCase();
  const hasQuery = trimmedQuery.length > 0;

  const renderHighlighted = React.useCallback(
    (text: string) => {
      if (!hasQuery) return text;
      const source = text ?? "";
      const lower = source.toLowerCase();
      const q = queryLower;
      if (!q) return source;
      const parts: React.ReactNode[] = [];
      let idx = 0;
      let matchIndex = lower.indexOf(q, idx);
      while (matchIndex !== -1) {
        if (matchIndex > idx) {
          parts.push(source.slice(idx, matchIndex));
        }
        parts.push(
          <span
            key={`${matchIndex}-${idx}`}
            className="font-semibold text-emerald-300"
          >
            {source.slice(matchIndex, matchIndex + q.length)}
          </span>,
        );
        idx = matchIndex + q.length;
        matchIndex = lower.indexOf(q, idx);
      }
      if (idx < source.length) parts.push(source.slice(idx));
      return parts;
    },
    [hasQuery, queryLower],
  );

  function ContextChip({
    label,
    tone = "neutral",
    className,
  }: {
    label: string;
    tone?: "neutral" | "success" | "warning" | "info" | "primary";
    className?: string;
  }) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
          tone === "success" &&
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
          tone === "warning" &&
            "border-amber-500/20 bg-amber-500/10 text-amber-400",
          tone === "info" && "border-sky-500/20 bg-sky-500/10 text-sky-400",
          tone === "primary" &&
            "border-primary/20 bg-primary/10 text-primary-foreground",
          tone === "neutral" &&
            "border-muted-foreground/20 bg-muted/20 text-muted-foreground",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  // Hideout station item requirement matches
  const hideoutMatches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q)
      return [] as {
        name: string;
        count: number;
        icon?: string;
        station: string;
        level: number;
      }[];
    const out: {
      name: string;
      count: number;
      icon?: string;
      station: string;
      level: number;
    }[] = [];
    for (const st of hideoutStations ?? []) {
      for (const lvl of st.levels ?? []) {
        for (const req of lvl.itemRequirements ?? []) {
          const itemName = req.item?.name ?? "";
          if (!itemName || !itemName.toLowerCase().includes(q)) continue;
          out.push({
            name: itemName,
            count: req.count ?? 1,
            icon: req.item?.iconLink,
            station: st.name,
            level: lvl.level,
          });
        }
      }
    }
    // Deduplicate identical entries by name+station+level to avoid spam
    const seen = new Set<string>();
    const unique = out.filter((e) => {
      const k = `${e.name}|${e.station}|${e.level}|${e.count}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return unique.slice(0, 10);
  }, [query, hideoutStations]);

  // Build enriched task matches including objectives and rewards
  const taskMatches = React.useMemo<
    {
      task: Task;
      context: string;
      score: number;
      icon?: string;
      contextType: "generic" | "objective" | "reward" | "unlock";
    }[]
  >(() => {
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
    if (!qRaw)
      return [] as {
        task: Task;
        context: string;
        score: number;
        icon?: string;
        contextType: "generic" | "objective" | "reward" | "unlock";
      }[];
    const q = norm(qRaw);
    const qTight = q.replace(/[^a-z0-9]/g, "");

    // Simple fuzzy similarity using bigram Dice coefficient and subsequence
    function diceCoeff(a: string, b: string): number {
      const s1 = norm(a);
      const s2 = norm(b);
      if (s1 === s2) return 1;
      if (s1.length < 2 || s2.length < 2) return 0;
      const bigrams = (s: string) =>
        Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2));
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

    function findBestMatch(t: Task): {
      context: string;
      score: number;
      icon?: string;
      contextType: "generic" | "objective" | "reward" | "unlock";
    } | null {
      let best: {
        context: string;
        score: number;
        icon?: string;
        contextType: "generic" | "objective" | "reward" | "unlock";
      } | null = null;

      function consider(
        context: string,
        baseScore: number,
        icon?: string,
        contextType: "generic" | "objective" | "reward" | "unlock" = "generic",
      ) {
        if (baseScore <= 0) return;
        if (!best || baseScore > best.score)
          best = { context, score: baseScore, icon, contextType };
      }

      // Name match (lower weight)
      consider("Name match", scoreValue(t.name, 1.2));

      // Objectives: item names and description
      for (const obj of t.objectives ?? []) {
        // Ignore generic sell-any-objectives (e.g., "Sell any items to Peacekeeper")
        if (
          typeof obj.description === "string" &&
          /\bsell any item/i.test(obj.description)
        ) {
          continue;
        }
        if (obj.description)
          consider(
            `Objective: ${obj.description}`,
            scoreValue(obj.description, 0.8),
          );
        for (const it of obj.items ?? []) {
          // Skip overly-generic matches like "Any item(s)"
          const nameNorm = norm(it.name);
          if (nameNorm.startsWith("any item")) continue;

          // Only consider sufficiently relevant matches
          const base = scoreValue(it.name, 1.0);
          if (base < 0.5) continue;

          const qty =
            typeof obj.count === "number" && obj.count > 1
              ? ` ×${obj.count}`
              : "";
          consider(
            `Objective Item: ${it.name}${qty}`,
            base,
            it.iconLink,
            "objective",
          );
        }
      }

      // Rewards: start and finish items (include quantities)
      for (const r of t.startRewards?.items ?? []) {
        const base = scoreValue(r.item.name, 0.9);
        if (base < 0.5) continue;
        const qty =
          typeof r.count === "number" && r.count > 1 ? ` ×${r.count}` : "";
        consider(
          `Reward: ${r.item.name}${qty}`,
          base,
          r.item.iconLink,
          "reward",
        );
      }
      for (const r of t.finishRewards?.items ?? []) {
        const base = scoreValue(r.item.name, 0.9);
        if (base < 0.5) continue;
        const qty =
          typeof r.count === "number" && r.count > 1 ? ` ×${r.count}` : "";
        consider(
          `Reward: ${r.item.name}${qty}`,
          base,
          r.item.iconLink,
          "reward",
        );
      }

      // Offer unlocks: item names and trader names (higher priority than rewards)
      for (const u of t.finishRewards?.offerUnlock ?? []) {
        const itemBase = scoreValue(u.item.name, 1.0);
        if (itemBase >= 0.5) {
          consider(
            `Unlock: ${u.item.name} @ ${u.trader.name} LL${u.level}`,
            itemBase,
            u.item.iconLink,
            "unlock",
          );
        }
        const traderBase = scoreValue(u.trader.name, 0.95);
        if (traderBase >= 0.5) {
          consider(
            `Unlock: ${u.item.name} @ ${u.trader.name} LL${u.level}`,
            traderBase,
            u.item.iconLink,
            "unlock",
          );
        }
      }

      // Map or trader names as a fallback context
      if (t.map?.name)
        consider(`Map: ${t.map.name}`, scoreValue(t.map.name, 0.4));
      if (t.trader?.name)
        consider(`Trader: ${t.trader.name}`, scoreValue(t.trader.name, 0.4));

      return best;
    }

    const out: {
      task: Task;
      context: string;
      score: number;
      icon?: string;
      contextType: "generic" | "objective" | "reward" | "unlock";
    }[] = [];
    for (const t of tasks) {
      const m = findBestMatch(t);
      if (m)
        out.push({
          task: t,
          context: m.context,
          score: m.score,
          icon: m.icon,
          contextType: m.contextType,
        });
    }
    out.sort(
      (a, b) => b.score - a.score || a.task.name.localeCompare(b.task.name),
    );
    return out.slice(0, 15);
  }, [query, tasks]);

  const taskEntries = React.useMemo(
    () =>
      taskMatches.map((match) => ({
        ...match,
        value: `task:${match.task.id} ${match.task.name} ${match.context}`,
      })),
    [taskMatches],
  );

  const itemFlags = React.useMemo(() => {
    const flags = new Map<string, { kappa: boolean; lightkeeper: boolean }>();
    for (const item of collectorItems ?? []) {
      const key = item.name.toLowerCase();
      if (!key) continue;
      flags.set(key, { kappa: true, lightkeeper: false });
    }
    for (const task of tasks ?? []) {
      if (!task.lightkeeperRequired) continue;
      const mark = (name?: string | null) => {
        if (!name) return;
        const key = name.toLowerCase();
        const current = flags.get(key) ?? {
          kappa: false,
          lightkeeper: false,
        };
        flags.set(key, { ...current, lightkeeper: true });
      };
      for (const obj of task.objectives ?? []) {
        for (const item of obj.items ?? []) mark(item.name);
      }
      for (const reward of task.startRewards?.items ?? [])
        mark(reward.item.name);
      for (const reward of task.finishRewards?.items ?? [])
        mark(reward.item.name);
    }
    return flags;
  }, [collectorItems, tasks]);

  const achievementMatches = React.useMemo(() => {
    if (!hasQuery) return [] as Achievement[];
    return achievements
      .filter((a) =>
        [a.name, a.description ?? "", a.rarity ?? "", a.side ?? ""].some((v) =>
          v.toLowerCase().includes(queryLower),
        ),
      )
      .slice(0, 10);
  }, [achievements, hasQuery, queryLower]);

  const achievementEntries = React.useMemo(
    () =>
      achievementMatches.map((a) => ({
        achievement: a,
        value: `achievement:${a.id} ${a.name} ${a.rarity ?? ""} ${
          a.side ?? ""
        }`,
      })),
    [achievementMatches],
  );

  const itemMatches = React.useMemo(() => {
    if (!hasQuery) return [] as { name: string; img?: string }[];
    return collectorItems
      .filter((i) => i.name.toLowerCase().includes(queryLower))
      .slice(0, 10);
  }, [collectorItems, hasQuery, queryLower]);

  const itemEntries = React.useMemo(
    () =>
      itemMatches.map((i) => ({
        name: i.name,
        img: i.img,
        flags: itemFlags.get(i.name.toLowerCase()),
        value: `item:${i.name} ${i.name}`,
      })),
    [itemMatches, itemFlags],
  );

  const hideoutEntries = React.useMemo<HideoutMatchEntry[]>(
    () =>
      hideoutMatches.map((m) => ({
        ...m,
        value: `hideout:${m.station}:${m.level}:${m.name} ${m.name}`,
      })),
    [hideoutMatches],
  );

  const previewIndex = React.useMemo(() => {
    const map = new Map<string, PreviewItem>();
    for (const match of taskEntries) {
      map.set(match.value, {
        kind: "task",
        task: match.task,
        context: match.context,
        contextType: match.contextType,
        icon: match.icon,
      });
    }
    for (const entry of achievementEntries) {
      map.set(entry.value, {
        kind: "achievement",
        achievement: entry.achievement,
      });
    }
    for (const entry of itemEntries) {
      map.set(entry.value, {
        kind: "item",
        name: entry.name,
        img: entry.img,
      });
    }
    for (const entry of hideoutEntries) {
      map.set(entry.value, { kind: "hideout", match: entry });
    }
    return map;
  }, [achievementEntries, hideoutEntries, itemEntries, taskEntries]);

  React.useEffect(() => {
    if (!open || !hasQuery) {
      setSelectedValue("");
      return;
    }
    const first =
      taskEntries[0]?.value ||
      achievementEntries[0]?.value ||
      itemEntries[0]?.value ||
      hideoutEntries[0]?.value ||
      "";
    setSelectedValue(first);
  }, [
    achievementEntries,
    hasQuery,
    hideoutEntries,
    itemEntries,
    open,
    taskEntries,
  ]);

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
      window.removeEventListener(
        "open-command-menu",
        openHandler as EventListener,
      );
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
    navigateStoryline() {
      onSetViewMode("storyline");
      setOpen(false);
    },
    navigateStorylineMap() {
      onSetViewMode("storyline-map");
      setOpen(false);
    },
  } as const;

  const selectedPreview = previewIndex.get(selectedValue);
  const renderPreview = () => {
    if (!hasQuery) {
      return (
        <div className="text-xs text-muted-foreground">
          Start typing to preview matching results.
        </div>
      );
    }
    if (!selectedPreview) {
      return (
        <div className="text-xs text-muted-foreground">
          {previewIndex.size === 0
            ? "No matching results to preview."
            : "Select a result to preview related details."}
        </div>
      );
    }
    if (selectedPreview.kind === "task") {
      const task = selectedPreview.task;
      const mapName = task.map?.name ?? task.maps?.[0]?.name;
      const traderName = task.trader?.name;
      const statusLabel = completedTasks.has(task.id) ? "Done" : "Open";
      const kappaLabel = task.kappaRequired ? "Kappa" : null;
      const lightkeeperLabel = task.lightkeeperRequired ? "Lightkeeper" : null;
      const objectiveGroups = (task.objectives ?? []).map((obj) => {
        const description = obj.description ?? "";
        const firRequired = /found in raid|in-raid|\bfi?r\b/i.test(description);
        const action = /hand over|turn in|give/i.test(description)
          ? "Hand over"
          : "Find";
        return {
          description,
          firRequired,
          action,
          items: (obj.items ?? []).map((item) => ({
            label: `${item.name}${
              obj.count && obj.count > 1 ? ` x${obj.count}` : ""
            }`,
            icon: item.iconLink,
            firRequired,
            action,
          })),
        };
      });
      const combinedObjectiveGroups = objectiveGroups.reduce<
        Array<{
          action: string;
          firRequired: boolean;
          items: Array<{ label: string; icon?: string }>;
          descriptions: string[];
        }>
      >((acc, group) => {
        const entry = acc.find(
          (item) =>
            item.action === group.action &&
            item.firRequired === group.firRequired,
        );
        const items = group.items.map((item) => ({
          label: item.label,
          icon: item.icon,
        }));
        if (entry) {
          entry.items.push(...items);
          if (items.length === 0 && group.description) {
            entry.descriptions.push(group.description);
          }
        } else {
          acc.push({
            action: group.action,
            firRequired: group.firRequired,
            items,
            descriptions:
              items.length === 0 && group.description
                ? [group.description]
                : [],
          });
        }
        return acc;
      }, []);
      const rewardLines = [
        ...(task.startRewards?.items ?? []),
        ...(task.finishRewards?.items ?? []),
      ].map((r) => ({
        label: `${r.item.name}${r.count > 1 ? ` x${r.count}` : ""}`,
        icon: r.item.iconLink,
      }));
      const renderObjectiveItem = (
        item: { label: string; icon?: string },
        key: React.Key,
      ) => (
        <div
          key={key}
          className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 border border-border/30 hover:bg-secondary/40 transition-colors group/item"
        >
          <div className="h-8 w-8 rounded-md bg-black/20 flex items-center justify-center p-1 border border-border/20 group-hover/item:border-border/40">
            {item.icon ? (
              <img
                src={item.icon}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            )}
          </div>
          <span className="text-xs font-medium text-foreground/80 line-clamp-1">
            {item.label}
          </span>
        </div>
      );

      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                {task.trader?.imageLink ? (
                  <img
                    src={task.trader.imageLink}
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <span className="text-emerald-500 font-bold">T</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  {task.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {traderName} • {mapName ?? "Any Map"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Status
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      statusLabel === "Done"
                        ? "bg-emerald-500"
                        : "bg-amber-500",
                    )}
                  />
                  <p className="text-xs font-bold">{statusLabel}</p>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Requirement
                </p>
                <p className="text-xs font-bold mt-0.5">
                  Level {task.minPlayerLevel}
                </p>
              </div>
              {(kappaLabel || lightkeeperLabel) && (
                <div className="col-span-2 flex gap-2">
                  {kappaLabel && (
                    <ContextChip
                      label="Kappa"
                      tone="warning"
                      className="flex-1 justify-center py-1.5"
                    />
                  )}
                  {lightkeeperLabel && (
                    <ContextChip
                      label="Lightkeeper"
                      tone="info"
                      className="flex-1 justify-center py-1.5"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {objectiveGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-border/50" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500/80">
                    Objectives
                  </span>
                  <div className="h-[1px] flex-1 bg-border/50" />
                </div>

                <div className="space-y-4">
                  {task.isEvent
                    ? objectiveGroups
                        .filter(
                          (group) =>
                            (group.description &&
                              group.description.length > 0) ||
                            group.items.length > 0,
                        )
                        .map((group, gIdx) => (
                          <div key={gIdx} className="space-y-2">
                            {group.description && (
                              <div className="flex items-center gap-2 px-1 text-xs text-foreground/90">
                                <span className="font-semibold">
                                  {group.description}
                                </span>
                                {group.firRequired && (
                                  <ContextChip
                                    label="FiR"
                                    tone="info"
                                    className="text-[8px] px-1 py-0 h-4"
                                  />
                                )}
                              </div>
                            )}
                            <div className="grid gap-2">
                              {group.items.length > 0
                                ? group.items.map((item, iIdx) =>
                                    renderObjectiveItem(item, iIdx),
                                  )
                                : group.description && (
                                    <div className="p-3 rounded-lg bg-secondary/10 border border-border/20 flex items-start gap-3">
                                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                                      <span className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                                        {group.description}
                                      </span>
                                    </div>
                                  )}
                            </div>
                          </div>
                        ))
                    : combinedObjectiveGroups
                        .filter(
                          (group) =>
                            group.items.length > 0 ||
                            group.descriptions.length > 0,
                        )
                        .map((group, gIdx) => (
                          <div key={gIdx} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-xs font-bold text-foreground/90">
                                {group.action}
                              </span>
                              {group.firRequired && (
                                <ContextChip
                                  label="FiR"
                                  tone="info"
                                  className="text-[8px] px-1 py-0 h-4"
                                />
                              )}
                            </div>
                            <div className="grid gap-2">
                              {group.items.length > 0
                                ? group.items.map((item, iIdx) =>
                                    renderObjectiveItem(item, iIdx),
                                  )
                                : group.descriptions.map((desc, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="p-3 rounded-lg bg-secondary/10 border border-border/20 flex items-start gap-3"
                                    >
                                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                                      <span className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                                        {desc}
                                      </span>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        ))}
                </div>
              </div>
            )}

            {rewardLines.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-border/50" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-sky-500/80">
                    Rewards
                  </span>
                  <div className="h-[1px] flex-1 bg-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {rewardLines.map((line, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10"
                    >
                      <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                        {line.icon ? (
                          <img
                            src={line.icon}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-1 w-1 rounded-full bg-sky-500/40" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-sky-400/90 truncate">
                        {line.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.finishRewards?.offerUnlock &&
              task.finishRewards.offerUnlock.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-border/50" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">
                      Unlocks
                    </span>
                    <div className="h-[1px] flex-1 bg-border/50" />
                  </div>
                  <div className="grid gap-2">
                    {task.finishRewards.offerUnlock.map((unlock, uIdx) => (
                      <div
                        key={`unlock-${uIdx}`}
                        className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                      >
                        {/* Item Icon */}
                        <div className="h-10 w-10 shrink-0 rounded-md bg-black/20 flex items-center justify-center p-1 border border-amber-500/20">
                          {unlock.item.iconLink ? (
                            <img
                              src={unlock.item.iconLink}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                          )}
                        </div>
                        {/* Trader Icon (smaller, overlaid) */}
                        <div className="h-6 w-6 shrink-0 rounded-full bg-black/40 flex items-center justify-center overflow-hidden -ml-5 ring-2 ring-amber-500/10 z-10">
                          {unlock.trader.imageLink ? (
                            <img
                              src={unlock.trader.imageLink}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground/90 truncate">
                            {unlock.item.name}
                          </div>
                          <div className="text-[10px] text-amber-500/80 font-medium">
                            {unlock.trader.name} LL{unlock.level}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      );
    }
    if (selectedPreview.kind === "hideout") {
      const { match } = selectedPreview;
      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-16 w-16 shrink-0 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center p-2 shadow-sm shadow-sky-500/5">
                {match.icon ? (
                  <img
                    src={match.icon}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-sky-500/40" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground truncate">
                  {match.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Required for {match.station}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/50 shadow-sm shadow-black/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Station
                </p>
                <p className="text-sm font-bold mt-0.5 truncate">
                  {match.station}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/50 shadow-sm shadow-black/5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Level
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-sky-400">
                  <span className="text-sm font-bold">Lvl {match.level}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-lg bg-sky-500/5 p-2.5 border border-sky-500/20 shadow-sm shadow-sky-500/5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Amount Needed
                </span>
                <span className="text-sm font-black text-sky-400">
                  ×{match.count}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-secondary/20 border border-dashed border-border/50">
            <p className="text-xs text-muted-foreground text-center italic">
              "Gather these items to upgrade your hideout and unlock new
              capabilities."
            </p>
          </div>
        </div>
      );
    }
    if (selectedPreview.kind === "achievement") {
      const achievement = selectedPreview.achievement;
      const isLegendary = achievement.rarity?.toLowerCase() === "legendary";

      return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div
                className={cn(
                  "h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center border-2 rotate-3 shadow-lg transition-transform hover:rotate-0 duration-500",
                  isLegendary
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-amber-500/10"
                    : "bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-sky-500/10",
                )}
              >
                <span className="text-2xl font-black italic">A</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground">
                  {achievement.name}
                </h3>
                <div className="flex gap-2 mt-1">
                  {achievement.rarity && (
                    <ContextChip
                      label={achievement.rarity}
                      tone={isLegendary ? "warning" : "info"}
                    />
                  )}
                  {achievement.side && (
                    <ContextChip label={achievement.side} tone="neutral" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-px flex-1 bg-border/50" />
                Description
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 leading-relaxed text-sm text-foreground/90 font-medium italic">
                {achievement.description ||
                  "No description available for this achievement."}
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-black/20 border border-border/20 flex flex-col items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full bg-border border-2 border-background"
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              Earned by 2.4% of players
            </p>
          </div>
        </div>
      );
    }
    const itemFlag = itemFlags.get(selectedPreview.name.toLowerCase());
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-3 shadow-2xl relative group/img">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />
              {selectedPreview.img ? (
                <img
                  src={selectedPreview.img}
                  alt=""
                  className="h-full w-full object-contain relative z-10 drop-shadow-lg"
                />
              ) : (
                <span className="text-2xl font-black text-muted-foreground/20 relative z-10">
                  ?
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold leading-tight tracking-tight text-foreground truncate drop-shadow-md">
                {selectedPreview.name}
              </h3>
              <div className="flex gap-2 mt-2">
                <ContextChip label="Collector" tone="primary" />
                {itemFlag?.kappa && (
                  <ContextChip label="Kappa" tone="warning" />
                )}
                {itemFlag?.lightkeeper && (
                  <ContextChip label="Lightkeeper" tone="info" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/10 border border-white/5 shadow-xl">
              <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                This item is required for the Collector questline. Ensure you
                save it in your stash when found!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                  Source
                </span>
                <div className="h-10 rounded-xl bg-black/20 border border-white/5 flex items-center px-3 text-xs font-bold text-foreground/80">
                  Any In-Game
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                  Rarity
                </span>
                <div className="h-10 rounded-xl bg-black/20 border border-white/5 flex items-center px-3 text-xs font-bold text-amber-400">
                  Rare
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
            Tracked in your list
          </p>
        </div>
      </div>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      commandProps={{ value: selectedValue, onValueChange: setSelectedValue }}
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <div className="flex h-[70vh] items-stretch overflow-hidden relative">
        <div className="flex-[1.4] flex flex-col min-w-0 border-r border-white/5 bg-black/10">
          <CommandList className="flex-1 max-h-none overflow-y-auto custom-scrollbar">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Navigate">
              <CommandItem value="quests" onSelect={handle.navigateGrouped}>
                Quests{" "}
                {viewMode === "grouped" ||
                viewMode === "tree" ||
                viewMode === "flow"
                  ? "(current)"
                  : ""}
              </CommandItem>
              <CommandItem
                value="checklist-view"
                onSelect={handle.navigateGrouped}
              >
                Checklist View {viewMode === "grouped" ? "(current)" : ""}
              </CommandItem>
              <CommandItem
                value="by-trader"
                onSelect={handle.navigateGroupedByTrader}
              >
                By Trader{" "}
                {viewMode === "grouped" && groupBy === "trader"
                  ? "(current)"
                  : ""}
              </CommandItem>
              <CommandItem
                value="by-map"
                onSelect={handle.navigateGroupedByMap}
              >
                By Map{" "}
                {viewMode === "grouped" && groupBy === "map" ? "(current)" : ""}
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Items">
              <CommandItem value="items" onSelect={handle.navigateCollector}>
                Items {viewMode === "collector" ? "(current)" : ""}
              </CommandItem>
              <CommandItem
                value="collector-items"
                onSelect={handle.navigateCollectorItems}
              >
                Collector Items{" "}
                {viewMode === "collector" && collectorGroupBy === "collector"
                  ? "(current)"
                  : ""}
              </CommandItem>
              <CommandItem
                value="hideout-stations"
                onSelect={handle.navigateHideoutStations}
              >
                Hideout Stations{" "}
                {viewMode === "collector" &&
                collectorGroupBy === "hideout-stations"
                  ? "(current)"
                  : ""}
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="More">
              <CommandItem
                value="prestiges"
                onSelect={handle.navigatePrestiges}
              >
                Prestiges {viewMode === "prestiges" ? "(current)" : ""}
              </CommandItem>
              <CommandItem
                value="achievements"
                onSelect={handle.navigateAchievements}
              >
                Achievements {viewMode === "achievements" ? "(current)" : ""}
              </CommandItem>
            </CommandGroup>

            {hasQuery && (
              <>
                <CommandGroup heading="Search • Quests">
                  {taskEntries.map(
                    ({ task: t, context, contextType, value }) => {
                      const statusLabel = completedTasks.has(t.id)
                        ? "Done"
                        : "Open";
                      const kappaLabel = t.kappaRequired ? "Kappa" : null;
                      const lightkeeperLabel = t.lightkeeperRequired
                        ? "Lightkeeper"
                        : null;
                      return (
                        <CommandItem
                          key={`task-${t.id}`}
                          value={value}
                          onSelect={() => {
                            onSetViewMode("grouped");
                            setTimeout(() => {
                              window.dispatchEvent(
                                new CustomEvent("taskTracker:globalSearch", {
                                  detail: {
                                    term: t.name,
                                    scope: "tasks",
                                    taskId: t.id,
                                  },
                                }),
                              );
                            }, 0);
                            setOpen(false);
                          }}
                          className={cn(
                            "py-3",
                            t.isEvent &&
                              "bg-amber-500/10 hover:bg-amber-500/15",
                          )}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-sm truncate">
                                {renderHighlighted(t.name)}
                              </span>
                              {t.isEvent && (
                                <ContextChip label="Event" tone="warning" />
                              )}
                              <div className="flex gap-1 ml-auto shrink-0">
                                {kappaLabel && (
                                  <div
                                    className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                    title="Kappa Required"
                                  />
                                )}
                                {lightkeeperLabel && (
                                  <div
                                    className="h-1.5 w-1.5 rounded-full bg-sky-500"
                                    title="Lightkeeper Required"
                                  />
                                )}
                                <div
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    statusLabel === "Done"
                                      ? "bg-emerald-500/80"
                                      : "bg-muted-foreground/30",
                                  )}
                                />
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2 min-w-0 font-medium uppercase tracking-tight">
                              <span className="shrink-0">
                                {t.trader?.name ?? "Unknown"}
                              </span>
                              <span className="shrink-0">•</span>
                              <span
                                className={cn(
                                  "truncate",
                                  contextType === "objective" &&
                                    "text-sky-400/80",
                                  contextType === "reward" &&
                                    "text-emerald-400/80",
                                  contextType === "unlock" &&
                                    "text-amber-400/80",
                                )}
                              >
                                {renderHighlighted(context)}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    },
                  )}
                </CommandGroup>

                <CommandGroup heading="Search • Prestiges">
                  {["Prestige 1", "Prestige 2", "Prestige 3", "Prestige 4"]
                    .filter((p) => p.toLowerCase().includes(queryLower))
                    .map((title) => (
                      <CommandItem
                        key={`prestige-${title}`}
                        value={`prestige-${title}`}
                        onSelect={() => {
                          onSetViewMode("prestiges");
                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent("taskTracker:globalSearch", {
                                detail: { term: title, scope: "prestiges" },
                              }),
                            );
                          }, 0);
                          setOpen(false);
                        }}
                      >
                        {renderHighlighted(title)}
                      </CommandItem>
                    ))}
                </CommandGroup>

                {(() => {
                  // Group by station, then by level; render one group per station with non-focusable level headers
                  const byStation: Record<
                    string,
                    Record<number, HideoutMatchEntry[]>
                  > = {};
                  for (const m of hideoutEntries) {
                    byStation[m.station] ||= {} as Record<
                      number,
                      HideoutMatchEntry[]
                    >;
                    (byStation[m.station][m.level] ||= []).push(m);
                  }

                  return Object.keys(byStation)
                    .sort((a, b) => a.localeCompare(b))
                    .flatMap((station, idx, arr) => {
                      const levelEntries = Object.entries(byStation[station])
                        .map(([level, items]) => ({
                          level: Number(level),
                          items,
                        }))
                        .sort((a, b) => a.level - b.level);
                      const nodes: React.ReactNode[] = [];
                      for (const { level, items } of levelEntries) {
                        nodes.push(
                          <CommandGroup
                            key={`hideout-group-${station}-lvl-${level}`}
                            heading={`Search • Hideout • ${station} • Level ${level}`}
                          >
                            {items
                              .slice()
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((m) => (
                                <CommandItem
                                  key={`hideout-${m.station}-${m.level}-${m.name}`}
                                  value={m.value}
                                  onSelect={() => {
                                    onSetCollectorGroupBy("hideout-stations");
                                    onSetViewMode("collector");
                                    setTimeout(() => {
                                      window.dispatchEvent(
                                        new CustomEvent(
                                          "taskTracker:globalSearch",
                                          {
                                            detail: {
                                              term: m.name,
                                              scope: "hideout",
                                            },
                                          },
                                        ),
                                      );
                                    }, 0);
                                    setOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">
                                      {renderHighlighted(
                                        `${m.name} ×${m.count}`,
                                      )}
                                    </span>
                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                      <ContextChip
                                        label={`L${m.level}`}
                                        tone="info"
                                      />
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>,
                        );
                      }
                      if (idx < arr.length - 1)
                        nodes.push(
                          <CommandSeparator key={`hideout-sep-${station}`} />,
                        );
                      return nodes;
                    });
                })()}

                <CommandGroup heading="Search • Achievements">
                  {achievementEntries.map(({ achievement: a, value }) => (
                    <CommandItem
                      key={`ach-${a.id}`}
                      value={value}
                      onSelect={() => {
                        onSetViewMode("achievements");
                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent("taskTracker:globalSearch", {
                              detail: { term: a.name, scope: "achievements" },
                            }),
                          );
                        }, 0);
                        setOpen(false);
                      }}
                      className="py-3"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-bold text-sm truncate">
                            {renderHighlighted(a.name)}
                          </span>
                          <div className="ml-auto flex gap-1 shrink-0">
                            {a.rarity && (
                              <div
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  a.rarity.toLowerCase() === "legendary"
                                    ? "bg-amber-400"
                                    : "bg-sky-400",
                                )}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {a.rarity ?? "Common"} Achievement • {a.side ?? "Any"}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandGroup heading="Search • Items">
                  {itemEntries.map((i) => (
                    <CommandItem
                      key={`item-${i.name}`}
                      value={i.value}
                      onSelect={() => {
                        onSetCollectorGroupBy("collector");
                        onSetViewMode("collector");
                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent("taskTracker:globalSearch", {
                              detail: { term: i.name, scope: "items" },
                            }),
                          );
                        }, 0);
                        setOpen(false);
                      }}
                      className="py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full">
                        <div className="h-8 w-8 shrink-0 rounded bg-black/20 border border-border/50 flex items-center justify-center p-1">
                          {i.img ? (
                            <img
                              src={i.img}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">
                              {renderHighlighted(i.name)}
                            </span>
                            <div className="ml-auto flex gap-1 shrink-0">
                              {i.flags?.kappa && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                  title="Kappa Item"
                                />
                              )}
                              {i.flags?.lightkeeper && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full bg-sky-500"
                                  title="Lightkeeper Item"
                                />
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            Collector Item
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {queryLower.includes("prestige") && (
                  <CommandGroup heading="Search • Navigate">
                    <CommandItem
                      value="go-prestiges"
                      onSelect={handle.navigatePrestiges}
                    >
                      Go to Prestiges
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}

            <CommandSeparator />

            <CommandGroup heading="Links">
              <CommandItem
                value="storyline-quests"
                onSelect={handle.navigateStoryline}
              >
                1.0 Storyline Quests{" "}
                {viewMode === "storyline" ? "(current)" : ""}
              </CommandItem>
              <CommandItem
                value="storyline-map"
                onSelect={handle.navigateStorylineMap}
              >
                Storyline Decision Map{" "}
                {viewMode === "storyline-map" ? "(current)" : ""}
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <div className="flex gap-4 bg-white/[0.02] border-t border-white/5 py-2.5 px-4 shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">
                Kappa
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">
                Lightkeeper
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">
                Completed
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 h-full flex-col gap-3 bg-black/20 p-6 overflow-y-auto self-stretch custom-scrollbar backdrop-blur-md">
          {renderPreview()}
        </div>
      </div>
    </CommandDialog>
  );
}
