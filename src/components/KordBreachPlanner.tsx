import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  Copy,
  CornerDownLeft,
  Dices,
  ExternalLink,
  Grid2X2,
  LayoutList,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  KORD_BREACH_GLOBAL_MODIFIERS,
  KORD_BREACH_NEGATIVE_MODIFIERS,
  KORD_BREACH_PERSONAL_MODIFIERS,
  KORD_BREACH_POSITIVE_MODIFIERS,
  type KordBreachModifier,
} from "@/data/kordBreachModifiers";
import { cn } from "@/lib/utils";
import {
  KORD_BREACH_LAYOUT_STORAGE_KEY,
  KORD_BREACH_RANDOM_BLACKLIST_STORAGE_KEY,
  KORD_BREACH_STORAGE_KEY,
  calculateKordBreachBalance,
  createRandomKordBreachBuild,
  findExactKordBreachSuggestions,
  formatKordBreachBuildSummary,
  getKordBreachSelectedModifiers,
  getKordBreachStatus,
  parseStoredKordBreachLayout,
  parseStoredKordBreachRandomBlacklist,
  parseStoredKordBreachSelection,
  serializeKordBreachRandomBlacklist,
  serializeKordBreachSelection,
  tokenizeKordBreachEffect,
  type KordBreachLayout,
} from "@/utils/kordBreach";

// const GAMES_GG_GUIDE_URL =
//   "https://games.gg/escape-from-tarkov/guides/escape-from-tarkov-kord-breach-all-season-one-modifiers-explained/";
const OFFICIAL_MODIFIER_POST_URL =
  "https://x.com/nikgeneburn/status/2075177627598323906/photo/1";
const KORD_BREACH_ICON_SOURCE_URL = "https://tarkov-seasonal.vercel.app/";

const KORD_BREACH_ICON_SLUG_OVERRIDES: Readonly<Record<string, string>> = {
  "no-fir-for-hideout": "no-fir-hideout",
  "the-tarkov-shooter": "tarkov-shooter",
  "chronic-fatigue-syndrome": "chronic-fatigue",
};

const KORD_BREACH_LAYOUT_OPTIONS = [
  {
    value: "detailed",
    label: "Detailed",
    description: "Full-size modifier cards",
    icon: LayoutList,
  },
  {
    value: "compact",
    label: "Compact",
    description: "Multi-column modifier grid",
    icon: Grid2X2,
  },
] as const satisfies readonly {
  value: KordBreachLayout;
  label: string;
  description: string;
  icon: typeof LayoutList;
}[];

function formatPoints(points: number) {
  return `${points > 0 ? "+" : ""}${points}`;
}

function getModifierIconSrc(modifier: KordBreachModifier) {
  const slug = KORD_BREACH_ICON_SLUG_OVERRIDES[modifier.id] ?? modifier.id;
  return `/kord-breach/icons/${slug}.png`;
}

function getModifierSearchScore(
  modifier: KordBreachModifier,
  normalizedQuery: string,
) {
  const normalizedName = modifier.name.toLocaleLowerCase();
  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.every((token) => normalizedName.includes(token))) {
    return 10 + queryTokens.reduce((score, token) => {
      return score + normalizedName.indexOf(token);
    }, 0);
  }

  const normalizedEffects = modifier.effects.join(" ").toLocaleLowerCase();
  const effectIndex = normalizedEffects.indexOf(normalizedQuery);
  return effectIndex === -1 ? null : 100 + effectIndex;
}

function EffectText({ effect }: { effect: string }) {
  return tokenizeKordBreachEffect(effect).map((segment, index) =>
    segment.emphasized ? (
      <strong
        key={`${segment.text}-${index}`}
        className="font-bold text-foreground"
      >
        {segment.text}
      </strong>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    ),
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function ModifierCard({
  modifier,
  selected,
  onToggle,
  layout,
}: {
  modifier: KordBreachModifier;
  selected: boolean;
  onToggle: () => void;
  layout: KordBreachLayout;
}) {
  const isPositive = modifier.category === "positive";
  const isCompact = layout === "compact";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "group relative h-full w-full overflow-hidden border text-left transition-[border-color,background-color,transform,box-shadow] duration-200",
        isCompact ? "px-3 py-2.5" : "px-4 py-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isPositive
          ? "focus-visible:ring-emerald-500/70"
          : "focus-visible:ring-red-500/70",
        selected
          ? isPositive
            ? "border-lime-400/60 bg-[linear-gradient(100deg,rgb(67_95_36_/_0.34)_0%,rgb(25_43_22_/_0.2)_26%,hsl(var(--card))_62%)] shadow-[inset_3px_0_0_rgb(163_230_53_/_0.8),0_0_24px_rgb(132_204_22_/_0.05)]"
            : "border-red-400/60 bg-[linear-gradient(100deg,rgb(107_38_38_/_0.36)_0%,rgb(53_25_27_/_0.22)_26%,hsl(var(--card))_62%)] shadow-[inset_3px_0_0_rgb(248_113_113_/_0.75),0_0_24px_rgb(239_68_68_/_0.05)]"
          : isPositive
            ? "border-lime-900/50 bg-[linear-gradient(100deg,rgb(52_76_31_/_0.22)_0%,hsl(var(--card))_42%)] hover:-translate-y-0.5 hover:border-lime-700/60"
            : "border-red-950/70 bg-[linear-gradient(100deg,rgb(79_34_36_/_0.22)_0%,hsl(var(--card))_42%)] hover:-translate-y-0.5 hover:border-red-800/60",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-px transition-colors",
          isPositive
            ? selected
              ? "bg-lime-300"
              : "bg-lime-500/25"
            : selected
              ? "bg-red-400"
              : "bg-red-500/25",
        )}
      />
      <span className={cn("flex items-start", isCompact ? "gap-2.5" : "gap-3")}>
        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center self-stretch border-r transition-colors",
            isCompact ? "min-h-10 w-11 pr-2.5" : "min-h-14 w-16 pr-3",
            isPositive ? "border-lime-700/25" : "border-red-800/30",
          )}
          aria-hidden="true"
        >
          <img
            src={getModifierIconSrc(modifier)}
            alt=""
            loading="lazy"
            className={cn(
              "object-contain opacity-70 grayscale transition-[opacity,filter,transform] duration-200 group-hover:scale-105 group-hover:opacity-90 group-hover:grayscale-0",
              isCompact ? "h-9 w-9" : "h-12 w-12",
              selected && "opacity-100 grayscale-0",
            )}
          />
        </span>
        <span
          className={cn(
            "absolute right-3 top-3 flex shrink-0 items-center justify-center border text-transparent transition-all",
            isCompact ? "h-4 w-4" : "h-5 w-5",
            selected
              ? isPositive
                ? "border-lime-300 bg-lime-300 text-lime-950"
                : "border-red-400 bg-red-400 text-red-950"
              : "border-border bg-background/50 group-hover:border-muted-foreground/50",
          )}
          aria-hidden="true"
        >
          <Check
            className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5")}
            strokeWidth={3}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "flex items-start justify-between pr-7",
              isCompact ? "gap-2" : "gap-3",
            )}
          >
            <span
              className={cn(
                "font-bold uppercase text-foreground",
                isCompact
                  ? "text-[11px] tracking-[0.06em]"
                  : "text-[13px] tracking-[0.08em]",
              )}
            >
              {modifier.name}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono font-bold tabular-nums",
                isCompact ? "text-xs" : "text-sm",
                isPositive ? "text-lime-300" : "text-red-300",
              )}
            >
              {formatPoints(modifier.points)}
            </span>
          </span>
          <span
            className={cn(
              "block",
              isCompact ? "mt-1 space-y-px" : "mt-1.5 space-y-0.5",
            )}
          >
            {modifier.effects.map((effect) => (
              <span
                key={effect}
                className={cn(
                  "block text-muted-foreground",
                  isCompact
                    ? "text-[10px] leading-[1.45]"
                    : "text-xs leading-relaxed",
                )}
              >
                <EffectText effect={effect} />
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}

function ModifierColumn({
  title,
  eyebrow,
  modifiers,
  selectedIds,
  onToggle,
  layout,
}: {
  title: string;
  eyebrow: string;
  modifiers: readonly KordBreachModifier[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  layout: KordBreachLayout;
}) {
  const isPositive = modifiers[0]?.category === "positive";
  const isCompact = layout === "compact";
  const selectedCount = modifiers.filter((modifier) =>
    selectedIds.has(modifier.id),
  ).length;

  return (
    <section aria-labelledby={`${modifiers[0]?.category}-modifiers-title`}>
      <div
        className={cn(
          "relative flex items-center justify-center gap-4 border-y px-4 text-center",
          isPositive
            ? "border-lime-900/45 bg-[linear-gradient(90deg,transparent_0%,rgb(41_63_27_/_0.45)_18%,rgb(41_63_27_/_0.45)_82%,transparent_100%)]"
            : "border-red-950/60 bg-[linear-gradient(90deg,transparent_0%,rgb(69_29_31_/_0.48)_18%,rgb(69_29_31_/_0.48)_82%,transparent_100%)]",
          isCompact ? "mb-2 py-2.5" : "mb-3 py-3",
        )}
      >
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.28em]",
              isPositive ? "text-lime-400" : "text-red-400",
            )}
          >
            {eyebrow}
          </p>
          <h2
            id={`${modifiers[0]?.category}-modifiers-title`}
            className={cn(
              "mt-1 font-black uppercase tracking-[0.12em] text-foreground",
              isCompact ? "text-lg" : "text-xl",
            )}
          >
            {title}
          </h2>
        </div>
        <span
          className={cn(
            "absolute right-3 hidden uppercase tracking-[0.14em] text-muted-foreground sm:inline",
            isCompact ? "text-[10px]" : "text-xs",
          )}
        >
          {selectedCount}/{modifiers.length} selected
        </span>
      </div>
      <div
        className={cn(
          "grid",
          isCompact ? "gap-1.5" : "gap-2",
          isCompact && "2xl:grid-cols-2",
        )}
      >
        {modifiers.map((modifier) => (
          <ModifierCard
            key={modifier.id}
            modifier={modifier}
            selected={selectedIds.has(modifier.id)}
            onToggle={() => onToggle(modifier.id)}
            layout={layout}
          />
        ))}
      </div>
    </section>
  );
}

function ModifierQuickAdd({
  selectedIds,
  onSelect,
  onReplace,
}: {
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onReplace: (ids: readonly string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [blacklistedIds, setBlacklistedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return new Set(
      parseStoredKordBreachRandomBlacklist(
        window.localStorage.getItem(
          KORD_BREACH_RANDOM_BLACKLIST_STORAGE_KEY,
        ),
      ),
    );
  });
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => {
    if (!normalizedQuery) return [];

    return [
      ...KORD_BREACH_POSITIVE_MODIFIERS,
      ...KORD_BREACH_NEGATIVE_MODIFIERS,
    ]
      .filter((modifier) => !selectedIds.has(modifier.id))
      .map((modifier) => ({
        modifier,
        score: getModifierSearchScore(modifier, normalizedQuery),
      }))
      .filter(
        (
          match,
        ): match is { modifier: KordBreachModifier; score: number } =>
          match.score !== null,
      )
      .sort((left, right) => {
        return (
          left.score - right.score ||
          left.modifier.name.localeCompare(right.modifier.name)
        );
      })
      .slice(0, 5)
      .map((match) => match.modifier);
  }, [normalizedQuery, selectedIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        KORD_BREACH_RANDOM_BLACKLIST_STORAGE_KEY,
        serializeKordBreachRandomBlacklist(blacklistedIds),
      );
    } catch {
      // Randomizer exclusions remain usable when browser storage is unavailable.
    }
  }, [blacklistedIds]);

  const addModifier = (modifier: KordBreachModifier | undefined) => {
    if (!modifier) return;
    onSelect(modifier.id);
    setQuery("");
    setActiveIndex(0);
  };

  const isOpen = normalizedQuery.length > 0;
  const activeModifier = matches[Math.min(activeIndex, matches.length - 1)];

  const toggleBlacklist = (id: string) => {
    setBlacklistedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRandomize = () => {
    const randomBuild = createRandomKordBreachBuild(blacklistedIds);
    if (randomBuild.length === 0) {
      toast.error("No balanced build is possible with these exclusions");
      return;
    }

    onReplace(randomBuild.map((modifier) => modifier.id));
    setQuery("");
    setActiveIndex(0);
    setIsExclusionsOpen(false);
    toast.success(
      `Random 0-point build selected · ${randomBuild.length} modifiers`,
    );
  };

  return (
    <section
      aria-labelledby="kord-breach-quick-add-title"
      className="kord-breach-enter kord-breach-enter-delay-3 relative z-10 mt-5 w-full"
    >
      <div className="mb-2 flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            id="kord-breach-quick-add-title"
            className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-400"
          >
            Quick add
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Find any unselected personal modifier.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <span className="mr-1 hidden text-[9px] uppercase tracking-[0.14em] text-muted-foreground lg:inline">
            Type · Enter · Repeat
          </span>
          <button
            type="button"
            aria-expanded={isExclusionsOpen}
            aria-controls="kord-breach-random-exclusions"
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              setIsExclusionsOpen((current) => !current);
            }}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 border px-2.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70",
              isExclusionsOpen
                ? "border-amber-500/45 bg-amber-500/10 text-amber-300"
                : "border-border bg-card/70 text-muted-foreground hover:border-amber-500/35 hover:text-foreground",
            )}
          >
            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
            Exclusions
            {blacklistedIds.size > 0 && (
              <span className="font-mono text-amber-300">
                {blacklistedIds.size}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            title="Replace the current choices with a random balanced build"
            className="inline-flex h-8 items-center gap-1.5 border border-lime-500/45 bg-lime-500/10 px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-lime-300 transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-lime-400/70 hover:bg-lime-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500/70"
          >
            <Dices className="h-3.5 w-3.5" aria-hidden="true" />
            Random build
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="group flex h-12 items-center border border-border bg-card/90 shadow-[0_12px_32px_rgb(0_0_0_/_0.16)] transition-[border-color,box-shadow] focus-within:border-lime-500/55 focus-within:shadow-[0_0_0_1px_rgb(132_204_22_/_0.12),0_14px_36px_rgb(0_0_0_/_0.24)]">
          <span className="flex h-full w-12 shrink-0 items-center justify-center border-r border-border text-muted-foreground transition-colors group-focus-within:text-lime-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <input
            id="kord-breach-modifier-search"
            type="search"
            role="combobox"
            aria-label="Quick add a Kord Breach modifier"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="kord-breach-modifier-results"
            aria-activedescendant={
              activeModifier
                ? `kord-breach-search-result-${activeModifier.id}`
                : undefined
            }
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setIsExclusionsOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && matches.length > 0) {
                event.preventDefault();
                setActiveIndex((current) => (current + 1) % matches.length);
              } else if (event.key === "ArrowUp" && matches.length > 0) {
                event.preventDefault();
                setActiveIndex((current) =>
                  (current - 1 + matches.length) % matches.length,
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                addModifier(activeModifier);
              } else if (event.key === "Escape") {
                setQuery("");
                setActiveIndex(0);
              }
            }}
            placeholder="Search perks — e.g. Kappa Protocol"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIndex(0);
              }}
              aria-label="Clear modifier search"
              className="mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500/70"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <span className="mr-3 hidden shrink-0 items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:inline-flex">
              Enter to add
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
        </div>

        {isOpen && (
          <div
            id="kord-breach-modifier-results"
            role="listbox"
            aria-label="Matching personal modifiers"
            className="absolute inset-x-0 top-full z-40 mt-1 border border-border bg-[#181b20] p-1 shadow-[0_24px_60px_rgb(0_0_0_/_0.55)]"
          >
            {matches.length > 0 ? (
              matches.map((modifier, index) => {
                const isPositive = modifier.category === "positive";
                const isActive = index === activeIndex;

                return (
                  <button
                    key={modifier.id}
                    id={`kord-breach-search-result-${modifier.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => addModifier(modifier)}
                    style={{
                      backgroundColor: isActive
                        ? isPositive
                          ? "#192119"
                          : "#231719"
                        : "#181b20",
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 border border-transparent px-2.5 py-2 text-left transition-colors focus-visible:outline-none",
                      isActive &&
                        (isPositive
                          ? "border-lime-800/55"
                          : "border-red-900/60"),
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center border-r pr-2",
                        isPositive
                          ? "border-lime-800/35"
                          : "border-red-900/40",
                      )}
                    >
                      <img
                        src={getModifierIconSrc(modifier)}
                        alt=""
                        className="h-8 w-8 object-contain opacity-80 grayscale"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                        {modifier.name}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[9px] font-bold uppercase tracking-[0.14em]",
                          isPositive ? "text-lime-400" : "text-red-400",
                        )}
                      >
                        {isPositive ? "Positive" : "Negative"} modifier
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs font-bold tabular-nums",
                        isPositive ? "text-lime-300" : "text-red-300",
                      )}
                    >
                      {formatPoints(modifier.points)}
                    </span>
                    <Plus
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isPositive ? "text-lime-400" : "text-red-400",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                No unselected modifier matches “{query.trim()}”.
              </p>
            )}
          </div>
        )}

        {isExclusionsOpen && (
          <div
            id="kord-breach-random-exclusions"
            className="absolute inset-x-0 top-full z-40 mt-1 border border-border bg-[#181b20] p-2 shadow-[0_24px_60px_rgb(0_0_0_/_0.55)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-1 pb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
                  Ignore in random builds
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Excluded perks remain available for manual selection.
                </p>
              </div>
              {blacklistedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setBlacklistedIds(new Set())}
                  className="shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="mt-2 grid max-h-72 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {KORD_BREACH_PERSONAL_MODIFIERS.map((modifier) => {
                const isBlacklisted = blacklistedIds.has(modifier.id);
                const isPositive = modifier.category === "positive";

                return (
                  <button
                    key={modifier.id}
                    type="button"
                    aria-pressed={isBlacklisted}
                    onClick={() => toggleBlacklist(modifier.id)}
                    className={cn(
                      "flex min-w-0 items-center gap-2 border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70",
                      isBlacklisted
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-transparent bg-[#14171b] hover:border-border",
                    )}
                  >
                    <img
                      src={getModifierIconSrc(modifier)}
                      alt=""
                      className={cn(
                        "h-7 w-7 shrink-0 object-contain grayscale transition-opacity",
                        isBlacklisted ? "opacity-35" : "opacity-70",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[10px] font-bold uppercase tracking-[0.06em]",
                          isBlacklisted
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {modifier.name}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[9px] font-bold",
                          isPositive ? "text-lime-400" : "text-red-400",
                        )}
                      >
                        {formatPoints(modifier.points)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center border",
                        isBlacklisted
                          ? "border-amber-400 bg-amber-400 text-amber-950"
                          : "border-border text-transparent",
                      )}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function KordBreachPlanner() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return new Set(
      parseStoredKordBreachSelection(
        window.localStorage.getItem(KORD_BREACH_STORAGE_KEY),
      ),
    );
  });
  const [layout, setLayout] = useState<KordBreachLayout>(() => {
    if (typeof window === "undefined") return "detailed";
    return parseStoredKordBreachLayout(
      window.localStorage.getItem(KORD_BREACH_LAYOUT_STORAGE_KEY),
    );
  });

  const selectedModifiers = useMemo(
    () => getKordBreachSelectedModifiers(selectedIds),
    [selectedIds],
  );
  const balance = useMemo(
    () => calculateKordBreachBalance(selectedModifiers),
    [selectedModifiers],
  );
  const status = useMemo(() => getKordBreachStatus(balance), [balance]);
  const suggestions = useMemo(
    () => findExactKordBreachSuggestions(selectedIds),
    [selectedIds],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        KORD_BREACH_STORAGE_KEY,
        serializeKordBreachSelection(selectedIds),
      );
    } catch {
      // The planner remains usable when browser storage is unavailable.
    }
  }, [selectedIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KORD_BREACH_LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Layout switching remains usable when browser storage is unavailable.
    }
  }, [layout]);

  const toggleModifier = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applySuggestion = (suggestion: readonly KordBreachModifier[]) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      suggestion.forEach((modifier) => next.add(modifier.id));
      return next;
    });
  };

  const handleCopy = async () => {
    const plannerUrl =
      typeof window === "undefined"
        ? "/Kord-Breach"
        : `${window.location.origin}/Kord-Breach`;
    const copied = await copyText(
      formatKordBreachBuildSummary(selectedModifiers, plannerUrl),
    );
    if (copied) toast.success("Kord Breach build copied");
    else toast.error("Could not copy this build");
  };

  const statusTone = {
    empty: "border-border text-foreground",
    balanced:
      "border-emerald-500/50 text-emerald-400 shadow-[0_0_28px_rgb(16_185_129_/_0.08)]",
    surplus: "border-amber-500/50 text-amber-400",
    deficit: "border-red-500/50 text-red-400",
  }[status.kind];

  return (
    <div className="kord-breach-shell min-h-full bg-background text-foreground">
      <div
        data-kord-layout={layout}
        className={cn(
          "relative mx-auto w-full px-4 py-6 transition-[max-width] duration-200 sm:px-6 sm:py-8 xl:px-10",
          layout === "compact"
            ? "max-w-[1840px]"
            : "max-w-[1500px]",
        )}
      >
        <header className="kord-breach-enter relative border-b border-border/70 pb-6 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-64 -translate-x-1/2 bg-gradient-to-r from-transparent via-lime-400/50 to-transparent" />
          <div className="flex flex-col gap-6">
            <div className="mx-auto max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.48em] text-lime-400 sm:text-xs">
                Tarkov Season 01
              </p>
              <h1 className="mt-3 inline-flex items-center text-3xl font-black uppercase tracking-[0.09em] text-foreground sm:text-4xl lg:text-5xl">
                <span className="rounded-[2px] bg-foreground px-2.5 py-1 text-background shadow-[0_0_28px_rgb(255_255_255_/_0.12)] sm:px-3">
                  Kord
                </span>
                <span className="kord-breach-word relative ml-2 sm:ml-3">
                  Breach
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Build your seasonal character. Positive modifiers spend points;
                negative modifiers earn them back. Finish on{" "}
                <strong className="font-bold text-foreground">exactly 0</strong>{" "}
                for a clean, balanced loadout.
              </p>
            </div>
            <div className="flex flex-wrap items-end justify-center gap-4">
              <div>
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Modifier layout
                </p>
                <ToggleGroup
                  type="single"
                  value={layout}
                  onValueChange={(value) => {
                    if (value === "detailed" || value === "compact") {
                      setLayout(value);
                    }
                  }}
                  aria-label="Modifier layout"
                  className="gap-0 border border-border bg-card"
                >
                  {KORD_BREACH_LAYOUT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        aria-label={`${option.label} layout`}
                        title={option.description}
                        className="h-8 min-w-0 gap-1.5 rounded-none border-r border-border px-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground last:border-r-0 hover:bg-muted/40 hover:text-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground sm:text-[10px]"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {option.label}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </div>
              <a
                href={OFFICIAL_MODIFIER_POST_URL}
                target="_blank"
                rel="noreferrer"
                className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Official values <ExternalLink className="h-3 w-3" />
              </a>
              {/*<a
                href={GAMES_GG_GUIDE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                Read the guide <ExternalLink className="h-3 w-3" />
              </a>*/}
            </div>
          </div>
        </header>

        <details
          open
          className="group kord-breach-enter kord-breach-enter-delay mt-5 border border-slate-700/50 bg-slate-950/35"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left marker:hidden">
            <span className="flex min-w-0 items-center gap-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-slate-300" />
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                  Global modifiers — always active
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  6 fixed season rules · not part of your point balance
                </span>
              </span>
            </span>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="group-open:hidden">View rules</span>
              <span className="hidden group-open:inline">Hide rules</span>
            </span>
          </summary>
          <div className="grid gap-2 border-t border-slate-700/40 bg-black/10 p-2 sm:grid-cols-2 xl:grid-cols-3">
            {KORD_BREACH_GLOBAL_MODIFIERS.map((modifier) => (
              <article
                key={modifier.id}
                className="flex min-h-20 items-center gap-3 border border-slate-700/45 bg-slate-900/45 px-3 py-2.5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-slate-700/40 pr-3">
                  <img
                    src={getModifierIconSrc(modifier)}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 object-contain opacity-75 grayscale"
                  />
                </span>
                <span className="min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                    {modifier.name}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {modifier.effects.map((effect, index) => (
                      <span key={effect}>
                        {index > 0 && " "}
                        <EffectText effect={effect} />
                      </span>
                    ))}
                  </p>
                </span>
              </article>
            ))}
          </div>
        </details>

        <div className="kord-breach-enter kord-breach-enter-delay-2 z-20 -mx-4 mt-5 border-y border-border bg-card/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:mx-0 sm:border sm:px-5 lg:sticky lg:top-0">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className={cn(
                    "flex h-16 w-16 shrink-0 items-center justify-center border bg-background/60",
                    statusTone,
                  )}
                >
                  <span className="font-mono text-2xl font-black tabular-nums">
                    {balance.balance > 0 ? "+" : ""}
                    {balance.balance}
                  </span>
                </div>
                <div className="min-w-0" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">
                      {status.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {status.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>
                      Positives{" "}
                      <strong className="text-emerald-400">
                        {balance.positiveCount} / -{balance.pointsSpent}
                      </strong>
                    </span>
                    <span>
                      Negatives{" "}
                      <strong className="text-red-400">
                        {balance.negativeCount} / +{balance.pointsGained}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-9 items-center gap-2 border border-border bg-background/50 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy build
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={selectedIds.size === 0}
                  className="inline-flex h-9 items-center gap-2 border border-border px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-muted-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {balance.balance !== 0 && (
              <details className="group min-w-0 border-t border-border pt-3">
                <summary className="flex cursor-pointer list-none flex-col gap-2 border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5 transition-colors hover:border-amber-500/35 hover:bg-amber-500/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 sm:flex-row sm:items-center sm:justify-between sm:gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
                        Exact-zero options
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      {balance.balance < 0
                        ? `Apply one combination to gain +${Math.abs(balance.balance)} and finish at 0.`
                        : `Apply one combination to spend ${balance.balance} and finish at 0.`}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2 self-end text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400 sm:self-auto">
                    <span className="group-open:hidden">Show suggestions</span>
                    <span className="hidden group-open:inline">Hide suggestions</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="pt-2.5">
                  {suggestions.length > 0 ? (
                    <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                      {suggestions.map((suggestion, suggestionIndex) => (
                        <div
                          key={suggestion
                            .map((modifier) => modifier.id)
                            .join("-")}
                          className="relative min-w-0 border border-border bg-background/40 px-3 py-2.5 text-left transition-colors hover:border-amber-500/30"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-2">
                            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Option {suggestionIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => applySuggestion(suggestion)}
                              className="-my-1 -mr-1 inline-flex min-h-7 items-center px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-400 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
                            >
                              Apply combination
                            </button>
                          </div>
                          <div className="mt-1 divide-y divide-border/60">
                            {suggestion.map((modifier) => (
                              <div
                                key={modifier.id}
                                className="flex items-start gap-2.5 py-2"
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-border/70 pr-2">
                                  <img
                                    src={getModifierIconSrc(modifier)}
                                    alt=""
                                    loading="lazy"
                                    className="h-8 w-8 object-contain opacity-85 grayscale"
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="min-w-0 break-words text-[11px] font-semibold leading-relaxed text-foreground">
                                      {modifier.name}
                                    </span>
                                    <span
                                      className={cn(
                                        "shrink-0 font-mono text-[11px] font-bold tabular-nums",
                                        modifier.category === "positive"
                                          ? "text-emerald-400"
                                          : "text-red-400",
                                      )}
                                    >
                                      {formatPoints(modifier.points)}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 space-y-0.5">
                                    {modifier.effects.map((effect) => (
                                      <p
                                        key={effect}
                                        className="text-[10px] leading-relaxed text-muted-foreground"
                                      >
                                        <EffectText effect={effect} />
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No add-only match remains. Remove a current choice to open
                      a route back to 0.
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>

        <ModifierQuickAdd
          selectedIds={selectedIds}
          onSelect={toggleModifier}
          onReplace={(ids) => setSelectedIds(new Set(ids))}
        />

        <main
          className={cn(
            "kord-breach-enter kord-breach-enter-delay-3 grid lg:grid-cols-2",
            layout === "detailed"
              ? "mt-5 gap-8 lg:gap-5 xl:gap-8"
              : "mt-4 gap-6 lg:gap-4 xl:gap-5",
          )}
        >
          <ModifierColumn
            eyebrow="Spend points"
            title="Personal positive"
            modifiers={KORD_BREACH_POSITIVE_MODIFIERS}
            selectedIds={selectedIds}
            onToggle={toggleModifier}
            layout={layout}
          />
          <ModifierColumn
            eyebrow="Recover points"
            title="Personal negative"
            modifiers={KORD_BREACH_NEGATIVE_MODIFIERS}
            selectedIds={selectedIds}
            onToggle={toggleModifier}
            layout={layout}
          />
        </main>

        <footer className="mt-8 flex flex-col gap-2 border-t border-border py-5 text-[11px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Modifier values were announced before Season 1 and may change for
            balancing reasons. This planner stores selections only in this
            browser.
          </p>
          <p className="shrink-0">
            Icons from{" "}
            <a
              href={KORD_BREACH_ICON_SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Tarkov Seasonal
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>{" "}
            · inspired by{" "}
            <a
              href="https://mrsouer.com/eft/modifiers"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Mr. Souer&apos;s modifier planner
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
