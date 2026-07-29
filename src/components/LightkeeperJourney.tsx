import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import {
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  ExternalLink,
  ListChecks,
  LockKeyhole,
  Map as MapIcon,
  RadioTower,
  Route,
  TowerControl,
} from "lucide-react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  calculateLightkeeperProgress,
  LIGHTKEEPER_STAGE_TWO_TASKS,
  NETWORK_PROVIDER_PART_ONE_ID,
  normalizeLightkeeperPath,
  type LightkeeperPath,
  type LightkeeperRouteProgress,
  type LightkeeperStep,
} from "@/utils/lightkeeperProgress";

interface LightkeeperJourneyProps {
  tasks: Task[];
  scavKarma: number | null;
  completedTasks: Set<string>;
  completedStorylineObjectives: Set<string>;
  completedStorylineMapNodes: Set<string>;
  onScavKarmaChange: (value: number | null) => void;
  onToggleTask: (taskId: string) => void;
  onToggleStorylineObjective: (objectiveId: string) => void;
  onToggleStorylineMapNode: (nodeId: string) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
  onOpenBatya: () => void;
  onOpenTicket: () => void;
}

const PATH_ICONS = {
  batya: BookOpen,
  ticket: MapIcon,
  quests: ListChecks,
} as const;

function getTaskName(tasksById: Map<string, Task>, taskId: string) {
  return tasksById.get(taskId)?.name ?? "Quest";
}

function getStepCompleteActionLabel(path: LightkeeperPath) {
  if (path === "batya") return "Mark objective complete";
  if (path === "ticket") return "Mark map step complete";
  return "Mark quest complete";
}

export function LightkeeperJourney({
  tasks,
  scavKarma,
  completedTasks,
  completedStorylineObjectives,
  completedStorylineMapNodes,
  onScavKarmaChange,
  onToggleTask,
  onToggleStorylineObjective,
  onToggleStorylineMapNode,
  onOpenTask,
  onOpenBatya,
  onOpenTicket,
}: LightkeeperJourneyProps) {
  const [pathParam, setPathParam] = useQueryState("path", {
    defaultValue: "batya",
  });
  const selectedPath = normalizeLightkeeperPath(pathParam);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFullRoute, setShowFullRoute] = useState(false);
  const routeTabsRef = useRef<HTMLDivElement>(null);
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const progress = useMemo(
    () =>
      calculateLightkeeperProgress({
        scavKarma,
        completedTasks,
        completedStorylineObjectives,
        completedStorylineMapNodes,
      }),
    [
      scavKarma,
      completedTasks,
      completedStorylineObjectives,
      completedStorylineMapNodes,
    ],
  );
  const selectedRoute = progress.routes[selectedPath];
  const networkProviderComplete =
    progress.stageOneReached ||
    completedTasks.has(NETWORK_PROVIDER_PART_ONE_ID);
  const currentStageTwoId = progress.stageOneReady
    ? progress.nextStageTwoTask?.id
    : undefined;
  const stageLabel = progress.lightkeeperUnlocked
    ? "Lightkeeper Unlocked"
    : progress.stageOneReady
      ? `Stage 2 · ${progress.stageTwoCompleted} / ${progress.stageTwoTotal}`
      : "Stage 1 in progress";

  const setSelectedPath = (path: LightkeeperPath) => {
    setShowCompleted(false);
    setShowFullRoute(false);
    void setPathParam(path, { history: "push" });
    requestAnimationFrame(() => {
      routeTabsRef.current
        ?.querySelector<HTMLElement>(`[data-path="${path}"]`)
        ?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
    });
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      routeTabsRef.current
        ?.querySelector<HTMLElement>(`[data-path="${selectedPath}"]`)
        ?.scrollIntoView({
          behavior: "auto",
          inline: "center",
          block: "nearest",
        });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [selectedPath]);

  const toggleStep = (step: LightkeeperStep) => {
    if (step.objectiveId) {
      onToggleStorylineObjective(step.objectiveId);
    } else if (step.mapNodeId) {
      onToggleStorylineMapNode(step.mapNodeId);
    } else if (step.taskIds?.length === 1) {
      onToggleTask(step.taskIds[0]);
    }
  };

  const openStepSource = (step: LightkeeperStep) => {
    if (selectedPath === "batya") {
      onOpenBatya();
      return;
    }
    if (selectedPath === "ticket") {
      onOpenTicket();
      return;
    }
    const taskId = step.taskIds?.[0];
    if (taskId) onOpenTask(taskId, getTaskName(tasksById, taskId));
  };

  const completedRouteSteps = selectedRoute.steps.filter(
    (step) => step.isComplete,
  );

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6 lg:px-10">
        <header className="border border-border/80 bg-card/40 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-amber-500">
                Mechanic access dossier
              </p>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
                Lightkeeper Access
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Track both stages required to reach Lightkeeper
              </p>
            </div>
            <div
              className={cn(
                "w-fit border px-3 py-2 text-xs font-bold uppercase tracking-wider",
                progress.lightkeeperUnlocked
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/35 bg-amber-500/10 text-amber-400",
              )}
            >
              {stageLabel}
            </div>
          </div>

          <div className="mt-6 hidden grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 md:grid">
            {[
              ["01", "Requirements"],
              ["02", "Network Provider"],
              ["03", "Mechanic Taskline"],
              ["04", "Lightkeeper"],
            ].map(([number, label], index) => {
              const complete =
                index === 0
                  ? progress.stageOneReady
                  : index === 1
                    ? networkProviderComplete
                    : index === 2
                      ? progress.lightkeeperUnlocked
                      : progress.lightkeeperUnlocked;
              const active =
                !progress.lightkeeperUnlocked &&
                ((index === 0 && !progress.stageOneReady) ||
                  (index === 1 &&
                    progress.stageOneReady &&
                    !networkProviderComplete) ||
                  (index === 2 && networkProviderComplete));
              return (
                <div key={label} className="contents">
                  <div
                    className={cn(
                      "min-w-0 border-t-2 pt-2",
                      complete
                        ? "border-emerald-500 text-emerald-400"
                        : active
                          ? "border-amber-500 text-amber-400"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    <span className="mr-2 font-mono text-[10px]">{number}</span>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className="h-px w-5 bg-border" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 border border-border md:hidden">
            <div
              className={cn(
                "min-h-11 border-r border-border px-3 py-2",
                !progress.stageOneReady
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-emerald-400",
              )}
            >
              <p className="text-[10px] uppercase tracking-widest">Stage 1</p>
              <p className="text-xs font-bold">Requirements</p>
            </div>
            <div
              className={cn(
                "min-h-11 px-3 py-2",
                progress.stageOneReady
                  ? progress.lightkeeperUnlocked
                    ? "text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              <p className="text-[10px] uppercase tracking-widest">Stage 2</p>
              <p className="text-xs font-bold">Mechanic Taskline</p>
            </div>
          </div>
        </header>

        <div className="relative mt-7 pl-8 sm:pl-12">
          <div
            className="absolute bottom-5 left-[11px] top-3 w-px bg-amber-500/55 sm:left-[19px]"
            aria-hidden="true"
          />

          <JourneyMarker type="stage" />
          <section className="pb-10">
            <SectionEyebrow>Stage 1</SectionEyebrow>
            <h2 className="mt-1 text-xl font-bold uppercase tracking-wide text-foreground">
              Unlock Network Provider - Part 1
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Reach +1 Scav karma, then complete any one of the three routes.
              Progress in every route is retained.
            </p>

            <div className="mt-6 border border-border bg-card/35">
              {progress.stageOneReached &&
                !(progress.karmaComplete && progress.routeComplete) && (
                  <div className="border-b border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-400 sm:px-5">
                    Previous access inferred from recorded Stage 2 task
                    progress. Missing Stage 1 details can still be added for
                    reference.
                  </div>
                )}
              <div className="border-b border-border px-4 py-4 sm:px-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Mandatory requirement
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Scav karma
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      aria-label="Scav karma"
                      className="h-11 w-28 font-mono text-base"
                      inputMode="decimal"
                      min="-10"
                      max="10"
                      step="0.01"
                      type="number"
                      value={scavKarma ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        onScavKarmaChange(
                          value === "" ? null : Number.parseFloat(value),
                        );
                      }}
                    />
                    <RequirementState complete={progress.karmaComplete} />
                  </div>
                </div>
                {!progress.karmaComplete && (
                  <p className="mt-2 text-xs text-muted-foreground sm:text-right">
                    Requires +1.00 or higher
                  </p>
                )}
              </div>

              <div className="px-4 py-5 sm:px-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Complete any one route
                </p>
                <div
                  ref={routeTabsRef}
                  className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2"
                  role="tablist"
                  aria-label="Lightkeeper access routes"
                >
                  {(
                    Object.values(progress.routes) as LightkeeperRouteProgress[]
                  ).map((route) => {
                    const Icon = PATH_ICONS[route.id];
                    const selected = route.id === selectedPath;
                    return (
                      <button
                        key={route.id}
                        data-path={route.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setSelectedPath(route.id)}
                        className={cn(
                          "min-h-16 min-w-[150px] flex-1 snap-center border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selected
                            ? "border-amber-500/70 bg-amber-500/10 text-amber-400"
                            : route.isComplete
                              ? "border-emerald-500/35 bg-emerald-500/5 text-emerald-400"
                              : "border-border bg-background/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="size-4 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wide">
                            {route.label}
                          </span>
                        </span>
                        <span className="mt-2 block font-mono text-xs">
                          {route.completed} / {route.total}
                          {route.isComplete && " · Complete"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Viewing route
                    </p>
                    <p className="font-bold text-foreground">
                      {selectedRoute.label}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-amber-400">
                    {selectedRoute.completed} / {selectedRoute.total}
                  </p>
                </div>
                <Progress
                  className="mt-2 h-1.5 rounded-none bg-muted/70"
                  indicatorClassName={cn(
                    "rounded-none",
                    selectedRoute.isComplete
                      ? "bg-emerald-500"
                      : "bg-amber-500",
                  )}
                  value={
                    selectedRoute.total > 0
                      ? (selectedRoute.completed / selectedRoute.total) * 100
                      : 0
                  }
                />

                <div className="mt-5">
                  {selectedRoute.nextStep ? (
                    <NextRouteStep
                      path={selectedPath}
                      step={selectedRoute.nextStep}
                      tasksById={tasksById}
                      onComplete={() => toggleStep(selectedRoute.nextStep!)}
                      onOpen={() => openStepSource(selectedRoute.nextStep!)}
                      onToggleTask={onToggleTask}
                      onOpenTask={onOpenTask}
                    />
                  ) : (
                    <div className="border border-emerald-500/35 bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Check className="size-5" />
                        <p className="text-sm font-bold uppercase tracking-wide">
                          Route complete
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-between border border-border px-3"
                    disabled={completedRouteSteps.length === 0}
                    onClick={() => setShowCompleted((current) => !current)}
                  >
                    <span>{completedRouteSteps.length} completed steps</span>
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform motion-reduce:transition-none",
                        showCompleted && "rotate-180",
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-between border border-border px-3"
                    onClick={() => setShowFullRoute((current) => !current)}
                  >
                    <span>
                      {showFullRoute ? "Hide full route" : "View full route"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform motion-reduce:transition-none",
                        showFullRoute && "rotate-180",
                      )}
                    />
                  </Button>
                </div>

                {showCompleted && !showFullRoute && (
                  <RouteChecklist
                    steps={completedRouteSteps}
                    tasksById={tasksById}
                    onToggleStep={toggleStep}
                    onOpenTask={onOpenTask}
                  />
                )}
                {showFullRoute && (
                  <RouteChecklist
                    steps={selectedRoute.steps}
                    tasksById={tasksById}
                    onToggleStep={toggleStep}
                    onOpenTask={onOpenTask}
                  />
                )}
              </div>
            </div>
          </section>

          <JourneyMarker type="milestone" />
          <section className="pb-10">
            <div
              className={cn(
                "border-l-2 px-4 py-4",
                networkProviderComplete
                  ? "border-emerald-500 bg-emerald-500/8"
                  : progress.stageOneReady
                    ? "border-amber-500 bg-amber-500/8"
                    : "border-border bg-card/25",
              )}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Mechanic milestone
                  </p>
                  <h2 className="mt-1 text-lg font-bold uppercase tracking-wide">
                    Network Provider - Part 1
                  </h2>
                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold",
                      networkProviderComplete
                        ? "text-emerald-400"
                        : progress.stageOneReady
                          ? "text-amber-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {networkProviderComplete
                      ? "Completed — Stage 2 underway"
                      : progress.stageOneReady
                        ? "Ready at Mechanic"
                        : "Locked — finish Scav karma and one route"}
                  </p>
                </div>
                {progress.stageOneReady && (
                  <Button
                    variant="outline"
                    className="min-h-11 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    onClick={() =>
                      onOpenTask(
                        NETWORK_PROVIDER_PART_ONE_ID,
                        "Network Provider - Part 1",
                      )
                    }
                  >
                    View task
                    <ExternalLink className="ml-2 size-4" />
                  </Button>
                )}
              </div>
            </div>
          </section>

          <JourneyMarker type="stage" muted={!progress.stageOneReady} />
          <section className="pb-10">
            <SectionEyebrow muted={!progress.stageOneReady}>
              Stage 2
            </SectionEyebrow>
            <h2
              className={cn(
                "mt-1 text-xl font-bold uppercase tracking-wide",
                progress.stageOneReady
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Gain access to Lightkeeper
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete Mechanic&apos;s taskline. Knock-Knock leads to Getting
              Acquainted; the final task completes the unlock.
            </p>

            <div className="mt-5 border border-border bg-card/25">
              {LIGHTKEEPER_STAGE_TWO_TASKS.map((task, index) => {
                const complete = completedTasks.has(task.id);
                const current =
                  progress.stageOneReady && task.id === currentStageTwoId;
                const interactive =
                  progress.stageOneReady && (current || complete);
                const status = complete
                  ? "Complete"
                  : current
                    ? "Current"
                    : "Locked";

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "relative flex min-h-16 flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
                      complete && "bg-emerald-500/[0.04]",
                      current && "bg-amber-500/[0.08]",
                      !interactive && !complete && "opacity-55",
                    )}
                  >
                    {index < LIGHTKEEPER_STAGE_TWO_TASKS.length - 1 && (
                      <div
                        className="absolute bottom-[-17px] left-[25px] top-[39px] w-px bg-border"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        aria-label={
                          complete
                            ? `Mark ${task.name} incomplete`
                            : `Mark ${task.name} complete`
                        }
                        disabled={!interactive}
                        onClick={() => onToggleTask(task.id)}
                        className={cn(
                          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                          complete
                            ? "border-emerald-500 bg-emerald-500 text-black"
                            : current
                              ? "border-amber-500 text-amber-400"
                              : "border-border text-muted-foreground",
                        )}
                      >
                        {complete ? (
                          <Check className="size-4" />
                        ) : current ? (
                          <Circle className="size-3 fill-current" />
                        ) : (
                          <LockKeyhole className="size-3" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            complete
                              ? "text-emerald-400"
                              : current
                                ? "text-amber-300"
                                : "text-muted-foreground",
                          )}
                        >
                          {task.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {status}
                        </p>
                      </div>
                    </div>
                    {interactive && (
                      <div className="flex gap-2 pl-10 sm:pl-0">
                        {current && (
                          <Button
                            size="sm"
                            className="min-h-11 bg-amber-500 text-black hover:bg-amber-400"
                            onClick={() => onToggleTask(task.id)}
                          >
                            Mark complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-11"
                          onClick={() => onOpenTask(task.id, task.name)}
                        >
                          View task
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <JourneyMarker
            type="milestone"
            muted={!progress.lightkeeperUnlocked}
          />
          <section
            className={cn(
              "border px-5 py-5",
              progress.lightkeeperUnlocked
                ? "border-emerald-500/45 bg-emerald-500/10"
                : "border-border bg-card/25",
            )}
          >
            <div className="flex items-start gap-4">
              <TowerControl
                className={cn(
                  "mt-0.5 size-7 shrink-0",
                  progress.lightkeeperUnlocked
                    ? "text-emerald-400"
                    : "text-muted-foreground",
                )}
              />
              <div>
                <h2
                  className={cn(
                    "text-lg font-bold uppercase tracking-wide",
                    progress.lightkeeperUnlocked
                      ? "text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {progress.lightkeeperUnlocked
                    ? "Lightkeeper Unlocked"
                    : "Lightkeeper Locked"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete Getting Acquainted to reach the Lighthouse.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
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
        "text-[11px] font-bold uppercase tracking-[0.24em]",
        muted ? "text-muted-foreground" : "text-amber-500",
      )}
    >
      {children}
    </p>
  );
}

function JourneyMarker({
  type,
  muted = false,
}: {
  type: "stage" | "milestone";
  muted?: boolean;
}) {
  if (type === "milestone") {
    return (
      <div
        className={cn(
          "absolute left-[5px] z-10 size-3 rotate-45 border bg-background sm:left-[13px]",
          muted ? "border-border" : "border-amber-500 bg-amber-500",
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute left-[3px] z-10 flex size-4 items-center justify-center rounded-full border bg-background sm:left-[11px]",
        muted ? "border-border" : "border-amber-500",
      )}
      aria-hidden="true"
    >
      <RadioTower
        className={cn(
          "size-2.5",
          muted ? "text-muted-foreground" : "text-amber-500",
        )}
      />
    </div>
  );
}

function RequirementState({ complete }: { complete: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border",
        complete
          ? "border-emerald-500 bg-emerald-500 text-black"
          : "border-border text-muted-foreground",
      )}
      aria-label={complete ? "Requirement complete" : "Requirement incomplete"}
    >
      {complete ? (
        <Check className="size-4" />
      ) : (
        <Circle className="size-3" />
      )}
    </span>
  );
}

function NextRouteStep({
  path,
  step,
  tasksById,
  onComplete,
  onOpen,
  onToggleTask,
  onOpenTask,
}: {
  path: LightkeeperPath;
  step: LightkeeperStep;
  tasksById: Map<string, Task>;
  onComplete: () => void;
  onOpen: () => void;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  const isChoice = (step.taskIds?.length ?? 0) > 1;

  return (
    <div className="border-l-2 border-amber-500 bg-amber-500/[0.07] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-500">
        Next step
      </p>
      <div className="mt-2 flex items-start gap-3">
        <Route className="mt-0.5 size-5 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{step.label}</p>
          {isChoice && (
            <p className="mt-1 text-xs text-muted-foreground">
              Complete any one of these outcomes.
            </p>
          )}
        </div>
      </div>

      {isChoice ? (
        <div className="mt-4 grid gap-2">
          {step.taskIds?.map((taskId) => {
            const taskName = getTaskName(tasksById, taskId);
            return (
              <div
                key={taskId}
                className="flex flex-col justify-between gap-2 border border-border bg-background/50 p-2 sm:flex-row sm:items-center"
              >
                <span className="px-1 text-xs font-semibold">{taskName}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="min-h-11 flex-1 bg-amber-500 text-black hover:bg-amber-400 sm:flex-none"
                    onClick={() => onToggleTask(taskId)}
                  >
                    Mark complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11 flex-1 sm:flex-none"
                    onClick={() => onOpenTask(taskId, taskName)}
                  >
                    View task
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            className="min-h-11 bg-amber-500 text-black hover:bg-amber-400"
            onClick={onComplete}
          >
            {getStepCompleteActionLabel(path)}
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={onOpen}
          >
            {path === "batya"
              ? "Open Batya"
              : path === "ticket"
                ? "Open in Storyline"
                : "View task"}
            <ExternalLink className="ml-2 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RouteChecklist({
  steps,
  tasksById,
  onToggleStep,
  onOpenTask,
}: {
  steps: LightkeeperRouteProgress["steps"];
  tasksById: Map<string, Task>;
  onToggleStep: (step: LightkeeperStep) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  return (
    <div className="mt-3 border border-border">
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex min-h-12 items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
        >
          <button
            type="button"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              step.isComplete
                ? "border-emerald-500 bg-emerald-500 text-black"
                : "border-border text-muted-foreground",
            )}
            onClick={() => onToggleStep(step)}
            disabled={(step.taskIds?.length ?? 0) > 1}
            aria-label={`${step.isComplete ? "Mark incomplete" : "Mark complete"}: ${step.label}`}
          >
            {step.isComplete ? (
              <Check className="size-4" />
            ) : (
              <Circle className="size-3" />
            )}
          </button>
          <p
            className={cn(
              "min-w-0 flex-1 text-xs",
              step.isComplete
                ? "text-muted-foreground line-through"
                : "text-foreground",
            )}
          >
            {step.label}
          </p>
          {step.taskIds?.length === 1 && (
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 shrink-0"
              onClick={() => {
                const taskId = step.taskIds![0];
                onOpenTask(taskId, getTaskName(tasksById, taskId));
              }}
            >
              View
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
