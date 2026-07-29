import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Grid2X2,
  Info,
  LayoutList,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  KORD_BREACH_GLOBAL_MODIFIERS,
  KORD_BREACH_NEGATIVE_MODIFIERS,
  KORD_BREACH_POSITIVE_MODIFIERS,
  type KordBreachModifier,
} from "@/data/kordBreachModifiers";
import { cn } from "@/lib/utils";
import {
  KORD_BREACH_LAYOUT_STORAGE_KEY,
  KORD_BREACH_STORAGE_KEY,
  calculateKordBreachBalance,
  findExactKordBreachSuggestions,
  formatKordBreachBuildSummary,
  getKordBreachSelectedModifiers,
  getKordBreachStatus,
  parseStoredKordBreachLayout,
  parseStoredKordBreachSelection,
  serializeKordBreachSelection,
  tokenizeKordBreachEffect,
  type KordBreachLayout,
} from "@/utils/kordBreach";

// const GAMES_GG_GUIDE_URL =
//   "https://games.gg/escape-from-tarkov/guides/escape-from-tarkov-kord-breach-all-season-one-modifiers-explained/";
const OFFICIAL_MODIFIER_POST_URL =
  "https://x.com/nikgeneburn/status/2075177627598323906/photo/1";

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

function ModifierInfoTooltip({
  modifier,
}: {
  modifier: KordBreachModifier;
}) {
  return (
    <div className="group inline-flex shrink-0">
      <span
        aria-label={`View ${modifier.name} description`}
        className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center border border-border text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400"
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </span>
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-3 z-50 mb-2 w-[calc(100%-1.5rem)] max-w-72 rounded-none border border-border bg-popover p-3 text-popover-foreground opacity-0 shadow-xl transition-opacity duration-75 group-hover:visible group-hover:opacity-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {modifier.name}
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Suggested modifier
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 font-mono text-sm font-bold tabular-nums",
              modifier.category === "positive"
                ? "text-emerald-400"
                : "text-red-400",
            )}
          >
            {formatPoints(modifier.points)}
          </span>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
          {modifier.effects.map((effect) => (
            <p
              key={effect}
              className="text-[11px] leading-relaxed text-muted-foreground"
            >
              <EffectText effect={effect} />
            </p>
          ))}
        </div>
      </div>
    </div>
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
            ? "border-emerald-500/45 bg-emerald-500/[0.07] shadow-[inset_3px_0_0_rgb(16_185_129_/_0.75)]"
            : "border-red-500/45 bg-red-500/[0.07] shadow-[inset_3px_0_0_rgb(239_68_68_/_0.7)]"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:bg-muted/30",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-px transition-colors",
          isPositive
            ? selected
              ? "bg-emerald-400"
              : "bg-emerald-500/25"
            : selected
              ? "bg-red-400"
              : "bg-red-500/25",
        )}
      />
      <span className={cn("flex items-start", isCompact ? "gap-2.5" : "gap-3")}>
        <span
          className={cn(
            "mt-0.5 flex shrink-0 items-center justify-center border text-transparent transition-all",
            isCompact ? "h-4 w-4" : "h-5 w-5",
            selected
              ? isPositive
                ? "border-emerald-400 bg-emerald-400 text-emerald-950"
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
              "flex items-start justify-between",
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
                isPositive ? "text-emerald-400" : "text-red-400",
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
          "flex items-end justify-between gap-4 border-b border-border",
          isCompact ? "mb-2 pb-2.5" : "mb-3 pb-3",
        )}
      >
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.28em]",
              isPositive ? "text-emerald-400" : "text-red-400",
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
            "uppercase tracking-[0.14em] text-muted-foreground",
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
        <header className="kord-breach-enter relative border-b border-border pb-6">
          <div className="pointer-events-none absolute -left-5 top-0 h-16 w-px bg-gradient-to-b from-emerald-500 to-transparent" />
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-emerald-400">
                Season 01 / Loadout protocol
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.09em] text-foreground sm:text-4xl lg:text-5xl">
                Kord <span className="text-muted-foreground">Breach</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Build your seasonal character. Positive modifiers spend points;
                negative modifiers earn them back. Finish on{" "}
                <strong className="font-bold text-foreground">exactly 0</strong>{" "}
                for a clean, balanced loadout.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4 lg:justify-end">
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
          className="group kord-breach-enter kord-breach-enter-delay mt-4 border border-border bg-card"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left marker:hidden">
            <span className="flex min-w-0 items-center gap-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-400" />
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
          <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
            {KORD_BREACH_GLOBAL_MODIFIERS.map((modifier) => (
              <article key={modifier.id} className="bg-card px-4 py-3">
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
              <div className="min-w-0 border-t border-border pt-3">
                <div className="mb-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
                      Exact-zero options
                    </p>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {balance.balance < 0
                      ? `Apply one combination to gain +${Math.abs(balance.balance)} and finish at 0.`
                      : `Apply one combination to spend ${balance.balance} and finish at 0.`}
                  </p>
                </div>
                {suggestions.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                    {suggestions.map((suggestion, suggestionIndex) => (
                      <div
                        key={suggestion.map((modifier) => modifier.id).join("-")}
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
                        <div className="mt-2 space-y-1.5">
                          {suggestion.map((modifier) => (
                            <div
                              key={modifier.id}
                              className="flex items-start justify-between gap-3"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="min-w-0 break-words text-[11px] font-semibold leading-relaxed text-foreground">
                                  {modifier.name}
                                </span>
                                <ModifierInfoTooltip modifier={modifier} />
                              </div>
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
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No add-only match remains. Remove a current choice to open a
                    route back to 0.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <main
          className={cn(
            "kord-breach-enter kord-breach-enter-delay-3 grid lg:grid-cols-2",
            layout === "detailed"
              ? "mt-7 gap-8 lg:gap-5 xl:gap-8"
              : "mt-5 gap-6 lg:gap-4 xl:gap-5",
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
            Inspired by{" "}
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
