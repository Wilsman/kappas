import { useMemo } from "react";
import {
  Award,
  Check,
  ChevronDown,
  Circle,
  Diamond,
  ExternalLink,
  LockKeyhole,
  Package,
  Users,
} from "lucide-react";
import type { Achievement, Task } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TaskDetailsContent } from "@/components/TaskDetailsContent";
import { cn } from "@/lib/utils";
import {
  calculateKappaProgress,
  KAPPA_FENCE_REPUTATION_REQUIREMENT,
  KAPPA_LEVEL_REQUIREMENT,
  KAPPA_LL4_TRADERS,
  type KappaJourneyTask,
  type KappaLl4Trader,
  type KappaQuestRoute,
} from "@/utils/kappaProgress";

const DAWN_OF_A_NEW_ERA_IMAGE =
  "https://shared.fastly.steamstatic.com/community_assets/images/apps/3932890/2aea08313b894812ccb8baa231056ea70685cbf0.jpg";

const JOURNEY_SECTIONS = [
  {
    id: "kappa-account-requirements",
    label: "Account Requirements",
    compactLabel: "Account",
  },
  {
    id: "kappa-quest-chains",
    label: "Required Quest Chains",
    compactLabel: "Quest Chains",
  },
  {
    id: "kappa-collector-unlock",
    label: "Collector Unlocked",
    compactLabel: "Collector",
  },
] as const;

interface KappaJourneyProps {
  tasks: Task[];
  achievements: Achievement[];
  playerLevel: number;
  fenceReputation: number | null;
  ll4Traders: ReadonlySet<KappaLl4Trader>;
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onPlayerLevelChange: (level: number) => void;
  onFenceReputationChange: (value: number | null) => void;
  onToggleLl4Trader: (trader: KappaLl4Trader) => void;
  onToggleTask: (taskId: string) => void;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string | string[],
    syncTaskCompletion?: boolean,
  ) => void;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}

export function KappaJourney({
  tasks,
  achievements,
  playerLevel,
  fenceReputation,
  ll4Traders,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onPlayerLevelChange,
  onFenceReputationChange,
  onToggleLl4Trader,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
}: KappaJourneyProps) {
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const progress = useMemo(
    () =>
      calculateKappaProgress({
        tasks,
        completedTasks,
        playerLevel,
        fenceReputation,
        ll4Traders,
      }),
    [completedTasks, fenceReputation, ll4Traders, playerLevel, tasks],
  );
  const journeyStatus = progress.collectorUnlocked
    ? "Collector Unlocked"
    : !progress.accountRequirementsComplete
      ? "Complete Account Requirements"
      : `Quest Chains · ${progress.questRoutesCompleted} / ${progress.questRoutesTotal}`;

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    section.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-10">
        <header className="sticky top-0 z-20 -mx-4 border-y border-border/80 bg-background/95 px-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:mx-0 sm:border-x sm:px-4">
          <div className="flex h-7 min-w-0 items-center gap-2 border-b border-border/70 px-1">
            <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              Kappa status
            </span>
            <span className="hidden text-border sm:inline" aria-hidden="true">
              /
            </span>
            <span
              className={cn(
                "truncate text-[10px] font-bold uppercase tracking-[0.14em]",
                progress.collectorUnlocked
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {journeyStatus}
            </span>
          </div>

          <nav aria-label="Kappa unlock progress" className="grid grid-cols-3">
            {JOURNEY_SECTIONS.map((section, index) => {
              const complete =
                index === 0
                  ? progress.accountRequirementsComplete
                  : index === 1
                    ? progress.questRequirementsComplete
                    : progress.collectorUnlocked;
              const active =
                !progress.collectorUnlocked &&
                ((index === 0 && !progress.accountRequirementsComplete) ||
                  (index === 1 &&
                    progress.accountRequirementsComplete &&
                    !progress.questRequirementsComplete));

              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={active ? "step" : undefined}
                  aria-label={`Jump to ${section.label}`}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "relative flex min-h-11 min-w-0 items-center justify-center border-b-2 border-r border-r-border/70 px-1.5 text-center text-[8px] font-bold uppercase leading-tight transition-colors last:border-r-0 hover:bg-card/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:justify-start sm:px-3 sm:text-[10px] sm:tracking-[0.08em]",
                    complete
                      ? "border-b-emerald-500 text-emerald-400"
                      : active
                        ? "border-b-amber-500 bg-amber-500/[0.06] text-amber-400"
                        : "border-b-border text-muted-foreground",
                  )}
                >
                  <span className="hidden md:inline">{section.label}</span>
                  <span className="md:hidden">{section.compactLabel}</span>
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 size-1 rounded-full sm:right-2",
                      complete
                        ? "bg-emerald-400"
                        : active
                          ? "bg-amber-400"
                          : "bg-muted-foreground/35",
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </header>

        <div className="relative mt-6 pl-8 sm:pl-12">
          <div
            className="absolute bottom-5 left-[11px] top-3 w-px bg-amber-500/55 sm:left-[19px]"
            aria-hidden="true"
          />

          <JourneyMarker />
          <section
            id="kappa-account-requirements"
            className="scroll-mt-20 pb-10"
          >
            <SectionEyebrow>Unlock requirements</SectionEyebrow>
            <h1 className="mt-1 text-xl font-bold uppercase tracking-wide text-foreground">
              Prepare for Collector
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Meet the account gates introduced with the task-system rework.
              These values are saved separately for each profile.
            </p>

            <div className="mt-6 border border-border bg-card/35">
              <div className="grid gap-px bg-border sm:grid-cols-2">
                <AccountRequirement
                  label="Character level"
                  description={`Reach level ${KAPPA_LEVEL_REQUIREMENT}`}
                  complete={progress.levelComplete}
                >
                  <Input
                    aria-label="Character level"
                    className="h-11 w-24 bg-background font-mono text-base"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    type="number"
                    value={Number.isFinite(playerLevel) ? playerLevel : ""}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      onPlayerLevelChange(Number.isFinite(parsed) ? parsed : 1);
                    }}
                  />
                </AccountRequirement>

                <AccountRequirement
                  label="Fence reputation"
                  description={`Reach ${KAPPA_FENCE_REPUTATION_REQUIREMENT.toFixed(2)} reputation`}
                  complete={progress.fenceReputationComplete}
                >
                  <Input
                    aria-label="Fence reputation"
                    className="h-11 w-24 bg-background font-mono text-base"
                    inputMode="decimal"
                    min="-10"
                    max="10"
                    step="0.01"
                    type="number"
                    value={fenceReputation ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      onFenceReputationChange(
                        value === "" ? null : Number.parseFloat(value),
                      );
                    }}
                  />
                </AccountRequirement>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="group flex min-h-16 w-full items-center justify-between gap-4 border-t border-border px-4 py-3 text-left transition-colors hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center border",
                          progress.ll4Complete
                            ? "border-emerald-500 bg-emerald-500 text-black"
                            : "border-amber-500/60 text-amber-400",
                        )}
                      >
                        {progress.ll4Complete ? (
                          <Check className="size-4" />
                        ) : (
                          <Users className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          Loyalty Level 4 traders
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {progress.ll4Completed} / {progress.ll4Total} complete
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Manage
                      <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                    {KAPPA_LL4_TRADERS.map((trader) => {
                      const complete = ll4Traders.has(trader);
                      return (
                        <button
                          key={trader}
                          type="button"
                          aria-pressed={complete}
                          onClick={() => onToggleLl4Trader(trader)}
                          className={cn(
                            "flex min-h-14 items-center gap-3 bg-background px-4 py-3 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500",
                            complete
                              ? "bg-emerald-500/[0.06] text-emerald-400"
                              : "text-foreground hover:bg-card/70",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center border",
                              complete
                                ? "border-emerald-500 bg-emerald-500 text-black"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {complete && <Check className="size-3.5" />}
                          </span>
                          <span className="text-sm font-semibold">
                            {trader}
                          </span>
                          <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            LL4
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </section>

          <JourneyMarker muted={!progress.accountRequirementsComplete} />
          <section id="kappa-quest-chains" className="scroll-mt-20 pb-10">
            <SectionEyebrow muted={!progress.accountRequirementsComplete}>
              Required milestones
            </SectionEyebrow>
            <h2
              className={cn(
                "mt-1 text-xl font-bold uppercase tracking-wide",
                progress.accountRequirementsComplete
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Complete four quest chains
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Expand a destination to follow every task that leads to it. Task
              details stay collapsed until you need objectives, items, or
              rewards.
            </p>

            <div className="mt-6 border border-border bg-card/35">
              {progress.routes.map((route) => (
                <KappaRouteCard
                  key={route.id}
                  route={route}
                  tasksById={tasksById}
                  achievements={achievements}
                  completedTaskObjectives={completedTaskObjectives}
                  taskObjectiveItemProgress={taskObjectiveItemProgress}
                  onToggleTask={onToggleTask}
                  onToggleTaskObjective={onToggleTaskObjective}
                  onUpdateTaskObjectiveItemProgress={
                    onUpdateTaskObjectiveItemProgress
                  }
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          </section>

          <JourneyMarker muted={!progress.collectorUnlocked} />
          <section id="kappa-collector-unlock" className="scroll-mt-20 pb-10">
            <SectionEyebrow muted={!progress.collectorUnlocked}>
              Final milestone
            </SectionEyebrow>
            <div
              className={cn(
                "mt-2 overflow-hidden border bg-card/35",
                progress.collectorUnlocked
                  ? "border-emerald-500/50"
                  : "border-border",
              )}
            >
              <div className="grid md:grid-cols-[1fr_280px]">
                <div className="flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center border",
                      progress.collectorUnlocked
                        ? "border-emerald-500 bg-emerald-500 text-black"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {progress.collectorUnlocked ? (
                      <Check className="size-5" />
                    ) : (
                      <LockKeyhole className="size-5" />
                    )}
                  </span>
                  <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    {progress.collectorUnlocked ? "Ready" : "Locked"}
                  </p>
                  <h2
                    className={cn(
                      "mt-1 text-2xl font-bold uppercase tracking-wide",
                      progress.collectorUnlocked
                        ? "text-emerald-400"
                        : "text-foreground",
                    )}
                  >
                    Collector
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {progress.collectorUnlocked
                      ? "All announced unlock requirements are complete. Collector is ready to begin."
                      : "Finish the account requirements and all four destination quests to unlock Collector."}
                  </p>
                  <div className="mt-6 flex items-start gap-3 border-t border-border/70 pt-5">
                    <Award className="mt-0.5 size-5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Dawn of a New Era
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Complete Collector to earn the new achievement. The
                        Kappa Path is now a legacy achievement and is no longer
                        obtainable.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative min-h-48 border-t border-border bg-black md:min-h-full md:border-l md:border-t-0">
                  <img
                    src={DAWN_OF_A_NEW_ERA_IMAGE}
                    alt="Dawn of a New Era achievement artwork"
                    loading="lazy"
                    className={cn(
                      "absolute inset-0 size-full object-cover transition-all duration-500 motion-reduce:transition-none",
                      progress.collectorUnlocked
                        ? "opacity-100 grayscale-0"
                        : "opacity-45 grayscale",
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent md:from-black/65" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AccountRequirement({
  label,
  description,
  complete,
  children,
}: {
  label: string;
  description: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-24 items-center justify-between gap-4 bg-background px-4 py-4 sm:px-5",
        complete && "bg-emerald-500/[0.04]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center border",
            complete
              ? "border-emerald-500 bg-emerald-500 text-black"
              : "border-border text-muted-foreground",
          )}
        >
          {complete ? <Check className="size-4" /> : <Circle className="size-3" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function KappaRouteCard({
  route,
  tasksById,
  achievements,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
}: {
  route: KappaQuestRoute;
  tasksById: Map<string, Task>;
  achievements: Achievement[];
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleTask: (taskId: string) => void;
  onToggleTaskObjective: KappaJourneyProps["onToggleTaskObjective"];
  onUpdateTaskObjectiveItemProgress: KappaJourneyProps["onUpdateTaskObjectiveItemProgress"];
  onOpenTask: KappaJourneyProps["onOpenTask"];
}) {
  return (
    <Collapsible className="group/route border-b border-border last:border-b-0">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full px-4 py-4 text-left transition-colors hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:px-5",
            route.isComplete && "bg-emerald-500/[0.04]",
          )}
        >
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-8 shrink-0 rotate-45 items-center justify-center border",
                route.isComplete
                  ? "border-emerald-500 bg-emerald-500 text-black"
                  : "border-amber-500/60 text-amber-400",
              )}
            >
              {route.isComplete ? (
                <Check className="size-4 -rotate-45" />
              ) : (
                <Diamond className="size-3 -rotate-45" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm font-semibold",
                  route.isComplete ? "text-emerald-400" : "text-foreground",
                )}
              >
                {route.label}
              </span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {route.completed} / {route.total} tasks complete
                {route.hasMissingTasks && " · Awaiting task data"}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/route:rotate-180 motion-reduce:transition-none" />
          </span>
          <Progress
            className="ml-11 mt-3 h-1 rounded-none bg-muted/70"
            indicatorClassName={cn(
              "rounded-none",
              route.isComplete ? "bg-emerald-500" : "bg-amber-500",
            )}
            value={route.total > 0 ? (route.completed / route.total) * 100 : 0}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border bg-background/40">
          {route.tasks.map((journeyTask, index) => (
            <KappaTaskRow
              key={journeyTask.id}
              journeyTask={journeyTask}
              task={tasksById.get(journeyTask.id)}
              isLast={index === route.tasks.length - 1}
              achievements={achievements}
              completedTaskObjectives={completedTaskObjectives}
              taskObjectiveItemProgress={taskObjectiveItemProgress}
              onToggleTask={onToggleTask}
              onToggleTaskObjective={onToggleTaskObjective}
              onUpdateTaskObjectiveItemProgress={
                onUpdateTaskObjectiveItemProgress
              }
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function KappaTaskRow({
  journeyTask,
  task,
  isLast,
  achievements,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
}: {
  journeyTask: KappaJourneyTask;
  task?: Task;
  isLast: boolean;
  achievements: Achievement[];
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleTask: (taskId: string) => void;
  onToggleTaskObjective: KappaJourneyProps["onToggleTaskObjective"];
  onUpdateTaskObjectiveItemProgress: KappaJourneyProps["onUpdateTaskObjectiveItemProgress"];
  onOpenTask: KappaJourneyProps["onOpenTask"];
}) {
  const status = journeyTask.isComplete
    ? "Complete"
    : journeyTask.isMissing
      ? "Data unavailable"
      : journeyTask.isAvailable
        ? "Available"
        : "Locked";

  return (
    <Collapsible
      className={cn(
        "relative border-b border-border last:border-b-0",
        journeyTask.isTarget && "bg-amber-500/[0.035]",
        journeyTask.isComplete && "bg-emerald-500/[0.035]",
      )}
    >
      {!isLast && (
        <span
          className="absolute left-[29px] top-[43px] h-[43px] w-px bg-border sm:left-[33px]"
          aria-hidden="true"
        />
      )}
      <div className="flex min-h-16 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            aria-label={`${journeyTask.isComplete ? "Mark incomplete" : "Mark complete"}: ${journeyTask.name}`}
            onClick={() => onToggleTask(journeyTask.id)}
            className={cn(
              "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              journeyTask.isComplete
                ? "border-emerald-500 bg-emerald-500 text-black"
                : journeyTask.isAvailable
                  ? "border-amber-500 text-amber-400"
                  : "border-border text-muted-foreground",
            )}
          >
            {journeyTask.isComplete ? (
              <Check className="size-4" />
            ) : journeyTask.isAvailable ? (
              <Circle className="size-3 fill-current" />
            ) : (
              <LockKeyhole className="size-3" />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-sm font-semibold",
                  journeyTask.isComplete
                    ? "text-emerald-400"
                    : journeyTask.isAvailable
                      ? "text-amber-200"
                      : "text-foreground",
                )}
              >
                {journeyTask.name}
              </p>
              {journeyTask.isTarget && (
                <span className="border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-400">
                  Required
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {status}
              {journeyTask.traderName && ` · ${journeyTask.traderName}`}
              {(journeyTask.minPlayerLevel ?? 0) > 1 &&
                ` · Level ${journeyTask.minPlayerLevel}`}
            </p>
          </div>
        </div>

        {task && (
          <div className="flex flex-wrap gap-1 pl-10 sm:pl-0">
            <CollapsibleTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="group/details min-h-11"
              >
                Details
                {(task.objectives?.length ?? 0) > 0 && (
                  <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                    ({task.objectives?.length})
                  </span>
                )}
                <ChevronDown className="ml-1.5 size-3.5 transition-transform group-data-[state=open]/details:rotate-180 motion-reduce:transition-none" />
              </Button>
            </CollapsibleTrigger>
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11"
              onClick={() => onOpenTask(journeyTask.id, journeyTask.name)}
            >
              View task
              <ExternalLink className="ml-2 size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent>
        {task ? (
          <TaskDetailsContent
            task={task}
            achievements={achievements}
            completedTaskObjectives={completedTaskObjectives}
            taskObjectiveItemProgress={taskObjectiveItemProgress}
            onToggleTaskObjective={(
              taskId,
              objectiveKey,
              legacyObjectiveKey,
            ) =>
              onToggleTaskObjective(
                taskId,
                objectiveKey,
                legacyObjectiveKey,
                journeyTask.isAvailable || journeyTask.isComplete,
              )
            }
            onUpdateTaskObjectiveItemProgress={
              onUpdateTaskObjectiveItemProgress
            }
          />
        ) : (
          <p className="border-t border-border/70 px-5 py-4 text-xs text-muted-foreground">
            Task details are unavailable in the current data set. The
            requirement remains visible and can still be marked complete.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SectionEyebrow({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] font-bold uppercase tracking-[0.22em]",
        muted ? "text-muted-foreground" : "text-amber-400",
      )}
    >
      {children}
    </p>
  );
}

function JourneyMarker({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={cn(
        "absolute left-0 flex size-6 items-center justify-center border bg-background sm:left-2 sm:size-7",
        muted
          ? "border-border text-muted-foreground"
          : "border-amber-500 text-amber-400",
      )}
      aria-hidden="true"
    >
      <Package className="size-3.5" />
    </span>
  );
}
