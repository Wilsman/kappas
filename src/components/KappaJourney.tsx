import { useMemo } from "react";
import {
  Award,
  Check,
  CheckCircle2 as CircleCheckBig,
  ChevronDown,
  Circle,
  ExternalLink,
  LockKeyhole,
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

const KAPPA_CASE_IMAGE =
  "https://assets.tarkov.dev/5c093ca986f7740a1867ab12-8x.webp";

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
  const dawnAchievement = useMemo(
    () =>
      achievements.find(
        (achievement) =>
          achievement.name.trim().toLowerCase() === "dawn of a new era",
      ) ??
      achievements.find((achievement) =>
        achievement.name.toLowerCase().includes("dawn of a new era"),
      ),
    [achievements],
  );
  const journeyStatus = progress.collectorUnlocked
    ? "Collector Unlocked"
    : !progress.accountRequirementsComplete
      ? "Complete Account Requirements"
      : `Quest Chains · ${progress.questRoutesCompleted} / ${progress.questRoutesTotal}`;
  const completedAccountRequirements = [
    progress.levelComplete,
    progress.fenceReputationComplete,
    progress.ll4Complete,
  ].filter(Boolean).length;
  const completedMilestones =
    completedAccountRequirements + progress.questRoutesCompleted;
  const totalMilestones = 3 + progress.questRoutesTotal;
  const overallProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-[0.08em] text-foreground sm:text-3xl">
              Kappa Progress
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track the requirements and quest chains needed to unlock Collector.
            </p>
          </div>
          <div
            className={cn(
              "w-fit border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
              progress.collectorUnlocked
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-card/40 text-muted-foreground",
            )}
          >
            {journeyStatus}
          </div>
        </header>

        <section
          aria-label="Overall Kappa progress"
          className="overflow-hidden border border-border bg-card/45 shadow-[0_18px_45px_rgba(0,0,0,0.16)]"
        >
          <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
            <div className="border-b border-border px-5 py-5 lg:border-b-0 lg:border-r sm:px-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Overall progress
              </p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
                  {overallProgress}%
                </span>
                <span className="pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {completedMilestones} / {totalMilestones} complete
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3">
              <ProgressStage
                index={1}
                label="Account requirements"
                value={`${completedAccountRequirements} / 3`}
                complete={progress.accountRequirementsComplete}
              />
              <ProgressStage
                index={2}
                label="Quest chains"
                value={`${progress.questRoutesCompleted} / ${progress.questRoutesTotal}`}
                complete={progress.questRequirementsComplete}
              />
              <ProgressStage
                index={3}
                label="Collector"
                value={progress.collectorUnlocked ? "Ready" : "Locked"}
                complete={progress.collectorUnlocked}
              />
            </div>
          </div>
        </section>

        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(330px,0.78fr)_minmax(0,1.55fr)]">
          <section
            id="kappa-account-requirements"
            aria-labelledby="kappa-account-heading"
            className="border border-border bg-card/35"
          >
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="kappa-account-heading"
                    className="text-lg font-bold uppercase tracking-wide text-foreground"
                  >
                    Prepare for Collector
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Meet the account gates introduced with the task-system rework.
                    These values are saved separately for each profile.
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold text-muted-foreground">
                  {completedAccountRequirements} / 3
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3">
              <AccountRequirement
                label="Character level"
                description={`Reach level ${KAPPA_LEVEL_REQUIREMENT}`}
                complete={progress.levelComplete}
              >
                <Input
                  aria-label="Character level"
                  className="h-10 w-20 border-border bg-background font-mono text-sm tabular-nums"
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
                  className="h-10 w-20 border-border bg-background font-mono text-sm tabular-nums"
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

              <Collapsible>
                <div className="border border-border bg-background/65">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="group flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center border",
                            progress.ll4Complete
                              ? "border-emerald-500 bg-emerald-500 text-black"
                              : "border-border bg-background text-muted-foreground",
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
                          <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {progress.ll4Completed} / {progress.ll4Total} complete
                          </span>
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {KAPPA_LL4_TRADERS.map((trader) => {
                        const complete = ll4Traders.has(trader);
                        return (
                          <button
                            key={trader}
                            type="button"
                            aria-pressed={complete}
                            onClick={() => onToggleLl4Trader(trader)}
                            className={cn(
                              "flex min-h-12 items-center gap-3 bg-background px-4 py-2.5 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
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
                            <span className="text-sm font-semibold">{trader}</span>
                            <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              LL4
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </section>

          <section
            id="kappa-quest-chains"
            aria-labelledby="kappa-quest-heading"
            className="border border-border bg-card/35"
          >
            <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div>
                <h2
                  id="kappa-quest-heading"
                  className="text-lg font-bold uppercase tracking-wide text-foreground"
                >
                  Complete {progress.questRoutesTotal} quest{" "}
                  {progress.questRoutesTotal === 1 ? "chain" : "chains"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Expand a destination to follow every task that leads to it. Task
                  details stay collapsed until you need objectives, items, or
                  rewards.
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="font-mono text-xl font-bold text-foreground">
                  {progress.questRoutesCompleted} / {progress.questRoutesTotal}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  Chains complete
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3">
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
        </div>

        <section
          id="kappa-collector-unlock"
          aria-labelledby="kappa-collector-heading"
          className={cn(
            "mt-4 overflow-hidden border bg-card/35",
            progress.collectorUnlocked
              ? "border-emerald-500/50"
              : "border-border",
          )}
        >
          <div className="grid min-h-[220px] md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center border",
                    progress.collectorUnlocked
                      ? "border-emerald-500 bg-emerald-500 text-black"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {progress.collectorUnlocked ? (
                    <Check className="size-5" />
                  ) : (
                    <LockKeyhole className="size-5" />
                  )}
                </span>
                <span
                  className={cn(
                    "border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em]",
                    progress.collectorUnlocked
                      ? "border-emerald-500/50 text-emerald-400"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {progress.collectorUnlocked ? "Ready" : "Locked"}
                </span>
              </div>
              <h2
                id="kappa-collector-heading"
                className={cn(
                  "mt-4 text-2xl font-bold uppercase tracking-wide",
                  progress.collectorUnlocked
                    ? "text-emerald-400"
                    : "text-foreground",
                )}
              >
                Collector
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {progress.collectorUnlocked
                  ? "All announced unlock requirements are complete. Collector is ready to begin."
                  : `Finish the account requirements and ${progress.questRoutesTotal === 1 ? "the destination quest" : `all ${progress.questRoutesTotal} destination quests`} to unlock Collector.`}
              </p>
              <div className="mt-5 flex max-w-2xl items-start gap-3 border-t border-border/70 pt-5">
                {dawnAchievement?.imageLink ? (
                  <img
                    src={dawnAchievement.imageLink}
                    alt={dawnAchievement.name}
                    loading="lazy"
                    className="mt-0.5 size-10 shrink-0 rounded-md border border-border bg-background object-contain"
                  />
                ) : (
                  <Award className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Dawn of a New Era
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Complete Collector to earn the new achievement. The Kappa Path
                    is now a legacy achievement and is no longer obtainable.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-52 border-t border-border bg-card/20 md:min-h-full md:border-l md:border-t-0">
              <img
                src={KAPPA_CASE_IMAGE}
                alt="Rugged Kappa secure case"
                loading="lazy"
                className={cn(
                  "absolute inset-0 size-full object-contain p-6 transition-all duration-500 motion-reduce:transition-none",
                  progress.collectorUnlocked
                    ? "opacity-100 grayscale-0"
                    : "opacity-80 grayscale",
                )}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProgressStage({
  index,
  label,
  value,
  complete,
}: {
  index: number;
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-24 items-center gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0",
        complete && "bg-emerald-500/[0.035]",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold",
          complete
            ? "border-emerald-500 bg-emerald-500 text-black"
            : "border-border text-muted-foreground",
        )}
      >
        {complete ? <Check className="size-4" /> : index}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block text-xs font-bold uppercase tracking-[0.08em]",
            complete ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {value}
        </span>
      </span>
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5",
          complete ? "bg-emerald-500" : "bg-transparent",
        )}
        aria-hidden="true"
      />
    </div>
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
        "flex min-h-[76px] items-center justify-between gap-3 border border-border bg-background/65 px-4 py-3",
        complete && "bg-emerald-500/[0.04]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center border",
            complete
              ? "border-emerald-500 bg-emerald-500 text-black"
              : "border-border bg-background text-muted-foreground",
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
  const percentage =
    route.total > 0 ? Math.round((route.completed / route.total) * 100) : 0;

  return (
    <Collapsible className="group/route border border-border bg-background/65">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full px-4 py-4 text-left transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:px-5",
            route.isComplete && "bg-emerald-500/[0.04]",
          )}
        >
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center transition-colors",
                route.isComplete ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              {route.isComplete ? (
                <CircleCheckBig className="size-5" />
              ) : (
                <Circle className="size-5 opacity-55" />
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
            <span className="hidden shrink-0 font-mono text-xs tabular-nums text-muted-foreground sm:block">
              {percentage}%
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/route:rotate-180 motion-reduce:transition-none" />
          </span>
          <Progress
            className="ml-12 mt-3 h-1 w-auto rounded-none bg-muted/70"
            indicatorClassName={cn(
              "rounded-none",
              route.isComplete ? "bg-emerald-500" : "bg-muted-foreground",
            )}
            value={percentage}
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
            aria-pressed={journeyTask.isComplete}
            aria-label={`${journeyTask.isComplete ? "Mark incomplete" : "Mark complete"}: ${journeyTask.name}`}
            onClick={() => onToggleTask(journeyTask.id)}
            className={cn(
              "relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              journeyTask.isComplete
                ? "text-emerald-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {journeyTask.isComplete ? (
              <CircleCheckBig className="size-5" />
            ) : (
              <Circle className="size-5 opacity-55" />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "text-sm font-semibold",
                  journeyTask.isComplete ? "text-emerald-400" : "text-foreground",
                )}
              >
                {journeyTask.name}
              </p>
              {journeyTask.isTarget && (
                <span className="border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
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
