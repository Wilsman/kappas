import { useEffect, useMemo, useRef } from "react";
import { useQueryState } from "nuqs";
import {
  BookOpen,
  Check,
  Circle,
  Diamond,
  ExternalLink,
  GitBranch,
  ListChecks,
  LockKeyhole,
  Map as MapIcon,
  RadioTower,
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
import {
  buildLightkeeperSidequestJourney,
  filterLightkeeperSidequestJourney,
  normalizeLightkeeperSidequestTarget,
  type LightkeeperSidequestJourney,
  type LightkeeperSidequestJourneyRow,
  type LightkeeperSidequestJourneyTarget,
} from "@/utils/lightkeeperSidequestJourney";

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
  const [targetParam, setTargetParam] = useQueryState("target", {
    defaultValue: "all",
  });
  const selectedPath = normalizeLightkeeperPath(pathParam);
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
  const sidequestJourney = useMemo(
    () => buildLightkeeperSidequestJourney(tasks, completedTasks),
    [tasks, completedTasks],
  );
  const selectedTargetId = normalizeLightkeeperSidequestTarget(
    targetParam,
    sidequestJourney.targets,
  );
  const filteredSidequestJourney = useMemo(
    () =>
      filterLightkeeperSidequestJourney(
        sidequestJourney,
        selectedTargetId,
      ),
    [selectedTargetId, sidequestJourney],
  );
  const networkProviderComplete =
    progress.stageOneReached ||
    completedTasks.has(NETWORK_PROVIDER_PART_ONE_ID);
  const currentStageTwoId = progress.stageOneReady
    ? progress.nextStageTwoTask?.id
    : undefined;
  const journeyStatus = progress.lightkeeperUnlocked
    ? "Lightkeeper Unlocked"
    : progress.stageOneReady
      ? `Mechanic taskline · ${progress.stageTwoCompleted} / ${progress.stageTwoTotal}`
      : "Requirements in progress";

  const setSelectedPath = (path: LightkeeperPath) => {
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
                Track the requirements and Mechanic taskline needed to reach
                Lightkeeper
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
              {journeyStatus}
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
              <p className="text-xs font-bold">Access route</p>
              <p className="text-[10px] uppercase tracking-widest">
                {progress.stageOneReady ? "Ready" : "In progress"}
              </p>
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
              <p className="text-xs font-bold">Mechanic Taskline</p>
              <p className="text-[10px] uppercase tracking-widest">
                {progress.stageOneReady
                  ? `${progress.stageTwoCompleted} / ${progress.stageTwoTotal}`
                  : "Locked"}
              </p>
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
            <SectionEyebrow>Access requirements</SectionEyebrow>
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
                    Recorded Mechanic taskline progress already confirms access
                    to Network Provider. Missing route details can still be
                    added for reference.
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
                      Route progress
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

                {selectedPath === "quests" ? (
                  <SidequestJourneyChecklist
                    journey={sidequestJourney}
                    prerequisites={filteredSidequestJourney.prerequisites}
                    targets={filteredSidequestJourney.targets}
                    selectedTargetId={selectedTargetId}
                    completedTasks={completedTasks}
                    tasksById={tasksById}
                    onSelectTarget={(targetId) =>
                      void setTargetParam(targetId, { history: "push" })
                    }
                    onToggleTask={onToggleTask}
                    onOpenTask={onOpenTask}
                  />
                ) : (
                  <RouteChecklist
                    path={selectedPath}
                    steps={selectedRoute.steps}
                    tasksById={tasksById}
                    completedTasks={completedTasks}
                    onToggleStep={toggleStep}
                    onToggleTask={onToggleTask}
                    onOpenStep={openStepSource}
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
                      ? "Completed — Mechanic taskline underway"
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
              Mechanic taskline
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

function SidequestJourneyChecklist({
  journey,
  prerequisites,
  targets,
  selectedTargetId,
  completedTasks,
  tasksById,
  onSelectTarget,
  onToggleTask,
  onOpenTask,
}: {
  journey: LightkeeperSidequestJourney;
  prerequisites: LightkeeperSidequestJourneyRow[];
  targets: LightkeeperSidequestJourneyTarget[];
  selectedTargetId: string;
  completedTasks: Set<string>;
  tasksById: Map<string, Task>;
  onSelectTarget: (targetId: string) => void;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  const journeyComplete = journey.completed === journey.total;
  const targetFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      targetFiltersRef.current
        ?.querySelector<HTMLElement>(
          `[data-sidequest-target="${selectedTargetId}"]`,
        )
        ?.scrollIntoView({
          behavior: "auto",
          inline: "center",
          block: "nearest",
        });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [selectedTargetId]);

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Full quest journey</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            Unique prerequisite quests and required destinations
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 font-mono text-sm",
            journeyComplete ? "text-emerald-400" : "text-amber-400",
          )}
        >
          {journey.completed} / {journey.total}
        </p>
      </div>
      <Progress
        className="mt-2 h-1.5 rounded-none bg-muted/70"
        indicatorClassName={cn(
          "rounded-none",
          journeyComplete ? "bg-emerald-500" : "bg-amber-500",
        )}
        value={
          journey.total > 0 ? (journey.completed / journey.total) * 100 : 0
        }
      />

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-amber-400" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Follow a destination
          </p>
        </div>
        <div
          ref={targetFiltersRef}
          className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2"
          aria-label="Filter the Sidequests journey by destination"
        >
          <SidequestTargetFilter
            targetId="all"
            active={selectedTargetId === "all"}
            label="All quests"
            completed={journey.completed}
            total={journey.total}
            onClick={() => onSelectTarget("all")}
          />
          {journey.targets.map((target) => (
            <SidequestTargetFilter
              key={target.id}
              targetId={target.id}
              active={selectedTargetId === target.id}
              label={target.label}
              completed={target.completed}
              total={target.total}
              onClick={() => onSelectTarget(target.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 border border-border bg-background/20">
        <div className="border-b border-border bg-card/30 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Prerequisite quests · {prerequisites.length}
          </p>
        </div>
        {prerequisites.length > 0 ? (
          prerequisites.map((task, index) => (
            <SidequestPrerequisiteRow
              key={task.id}
              task={task}
              isLast={index === prerequisites.length - 1}
              onToggle={() => onToggleTask(task.id)}
              onOpen={() => onOpenTask(task.id, task.name)}
            />
          ))
        ) : (
          <p className="border-b border-border px-4 py-5 text-sm text-muted-foreground">
            No prerequisite quests are recorded for this destination.
          </p>
        )}

        <div className="border-b border-border bg-amber-500/[0.06] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
            Required destination quests · {targets.length}
          </p>
        </div>
        {targets.map((target) => (
          <SidequestDestinationRow
            key={target.id}
            target={target}
            completedTasks={completedTasks}
            tasksById={tasksById}
            onToggleTask={onToggleTask}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </div>
  );
}

function SidequestTargetFilter({
  targetId,
  active,
  label,
  completed,
  total,
  onClick,
}: {
  targetId: string;
  active: boolean;
  label: string;
  completed: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-sidequest-target={targetId}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-14 min-w-40 snap-start border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        active
          ? "border-amber-500/70 bg-amber-500/10 text-amber-300"
          : completed === total
            ? "border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-400"
            : "border-border bg-background/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      <span className="block text-[11px] font-bold uppercase tracking-wide">
        {label}
      </span>
      <span className="mt-1 block font-mono text-[10px]">
        {completed} / {total}
      </span>
    </button>
  );
}

function SidequestPrerequisiteRow({
  task,
  isLast,
  onToggle,
  onOpen,
}: {
  task: LightkeeperSidequestJourneyRow;
  isLast: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const status = task.isComplete
    ? "Complete"
    : task.isAvailable
      ? "Available"
      : "Locked";

  return (
    <div
      className={cn(
        "relative flex min-h-16 flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4",
        task.isComplete && "bg-emerald-500/[0.04]",
      )}
    >
      {!isLast && (
        <div
          className="absolute bottom-[-17px] left-[26px] top-[39px] w-px bg-border sm:left-[30px]"
          aria-hidden="true"
        />
      )}
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          aria-label={`${task.isComplete ? "Mark incomplete" : "Mark complete"}: ${task.name}`}
          onClick={onToggle}
          className={cn(
            "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            task.isComplete
              ? "border-emerald-500 bg-emerald-500 text-black"
              : task.isAvailable
                ? "border-amber-500 text-amber-400"
                : "border-border text-muted-foreground",
          )}
        >
          {task.isComplete ? (
            <Check className="size-4" />
          ) : task.isAvailable ? (
            <Circle className="size-3 fill-current" />
          ) : (
            <LockKeyhole className="size-3" />
          )}
        </button>
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              task.isComplete
                ? "text-emerald-400"
                : task.isAvailable
                  ? "text-amber-200"
                  : "text-foreground",
            )}
          >
            {task.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {status}
            {task.traderName && ` · ${task.traderName}`}
            {(task.minPlayerLevel ?? 0) > 1 &&
              ` · Level ${task.minPlayerLevel}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Leads to
            </span>
            {task.targetLabels.slice(0, 2).map((label) => (
              <span
                key={label}
                className="border border-border bg-card/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {label}
              </span>
            ))}
            {task.targetLabels.length > 2 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                +{task.targetLabels.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="min-h-11 self-start pl-10 sm:self-auto sm:pl-3"
        onClick={onOpen}
      >
        View task
        <ExternalLink className="ml-2 size-3.5" />
      </Button>
    </div>
  );
}

function SidequestDestinationRow({
  target,
  completedTasks,
  tasksById,
  onToggleTask,
  onOpenTask,
}: {
  target: LightkeeperSidequestJourneyTarget;
  completedTasks: Set<string>;
  tasksById: Map<string, Task>;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  const isChoice = target.taskIds.length > 1;
  const status = target.isComplete
    ? "Complete"
    : target.isAvailable
      ? "Available"
      : "Locked";
  const taskId = target.taskIds[0];

  return (
    <div
      className={cn(
        "border-b border-border px-3 py-3 last:border-b-0 sm:px-4",
        target.isComplete && "bg-emerald-500/[0.04]",
        !target.isComplete && target.isAvailable && "bg-amber-500/[0.04]",
      )}
    >
      <div className="flex min-h-11 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            disabled={isChoice}
            aria-label={`${target.isComplete ? "Mark incomplete" : "Mark complete"}: ${target.label}`}
            onClick={() => taskId && onToggleTask(taskId)}
            className={cn(
              "relative mt-1 flex size-7 shrink-0 rotate-45 items-center justify-center border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              target.isComplete
                ? "border-emerald-500 bg-emerald-500 text-black"
                : target.isAvailable
                  ? "border-amber-500 text-amber-400"
                  : "border-border text-muted-foreground",
            )}
          >
            {target.isComplete ? (
              <Check className="size-4 -rotate-45" />
            ) : (
              <Diamond className="size-3 -rotate-45" />
            )}
          </button>
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-semibold",
                target.isComplete
                  ? "text-emerald-400"
                  : target.isAvailable
                    ? "text-amber-200"
                    : "text-foreground",
              )}
            >
              {target.label}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Required destination · {status} · Chain {target.completed} /{" "}
              {target.total}
            </p>
          </div>
        </div>
        {!isChoice && taskId && (
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11 self-start pl-10 sm:self-auto sm:pl-3"
            onClick={() => onOpenTask(taskId, target.label)}
          >
            View task
            <ExternalLink className="ml-2 size-3.5" />
          </Button>
        )}
      </div>

      {isChoice && (
        <div className="ml-10 mt-3 grid gap-2">
          {target.taskIds.map((choiceTaskId) => {
            const choiceTask = tasksById.get(choiceTaskId);
            const choiceName = choiceTask?.name ?? "Quest outcome";
            const complete = completedTasks.has(choiceTaskId);
            const available =
              !!choiceTask &&
              choiceTask.taskRequirements.every((requirement) =>
                completedTasks.has(requirement.task.id),
              );
            return (
              <div
                key={choiceTaskId}
                className={cn(
                  "flex flex-col gap-2 border border-border bg-card/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                  complete && "border-emerald-500/30",
                )}
              >
                <button
                  type="button"
                  className="flex min-h-11 min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={`${complete ? "Mark incomplete" : "Mark complete"}: ${choiceName}`}
                  onClick={() => onToggleTask(choiceTaskId)}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      complete
                        ? "border-emerald-500 bg-emerald-500 text-black"
                        : available
                          ? "border-amber-500 text-amber-400"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {complete ? (
                      <Check className="size-3.5" />
                    ) : available ? (
                      <Circle className="size-2.5 fill-current" />
                    ) : (
                      <LockKeyhole className="size-2.5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-xs font-semibold",
                        complete ? "text-emerald-400" : "text-foreground",
                      )}
                    >
                      {choiceName}
                    </span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {complete ? "Complete" : available ? "Available" : "Locked"}
                    </span>
                  </span>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-11 self-start pl-9 sm:self-auto sm:pl-3"
                  onClick={() => onOpenTask(choiceTaskId, choiceName)}
                >
                  View task
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RouteChecklist({
  path,
  steps,
  tasksById,
  completedTasks,
  onToggleStep,
  onToggleTask,
  onOpenStep,
  onOpenTask,
}: {
  path: LightkeeperPath;
  steps: LightkeeperRouteProgress["steps"];
  tasksById: Map<string, Task>;
  completedTasks: Set<string>;
  onToggleStep: (step: LightkeeperStep) => void;
  onToggleTask: (taskId: string) => void;
  onOpenStep: (step: LightkeeperStep) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  return (
    <div className="mt-5 border border-border bg-background/20">
      {steps.map((step, index) => {
        const isChoice = (step.taskIds?.length ?? 0) > 1;
        return (
          <div
            key={step.id}
            className={cn(
              "relative border-b border-border px-3 py-3 last:border-b-0 sm:px-4",
              step.isComplete && "bg-emerald-500/[0.04]",
            )}
          >
            {index < steps.length - 1 && (
              <div
                className="absolute bottom-[-17px] left-[26px] top-[39px] w-px bg-border sm:left-[30px]"
                aria-hidden="true"
              />
            )}
            <div className="flex min-h-11 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                    step.isComplete
                      ? "border-emerald-500 bg-emerald-500 text-black"
                      : "border-border text-muted-foreground hover:border-amber-500 hover:text-amber-400",
                  )}
                  onClick={() => onToggleStep(step)}
                  disabled={isChoice}
                  aria-label={`${step.isComplete ? "Mark incomplete" : "Mark complete"}: ${step.label}`}
                >
                  {step.isComplete ? (
                    <Check className="size-4" />
                  ) : (
                    <Circle className="size-3" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      step.isComplete
                        ? "text-emerald-400"
                        : "text-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {step.isComplete
                      ? "Complete"
                      : isChoice
                        ? "Complete any one"
                        : "Incomplete"}
                  </p>
                </div>
              </div>
              {!isChoice && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-11 self-start pl-10 sm:self-auto sm:pl-3"
                  onClick={() => onOpenStep(step)}
                >
                  {path === "batya"
                    ? "Open Batya"
                    : path === "ticket"
                      ? "Open Storyline"
                      : "View task"}
                  <ExternalLink className="ml-2 size-3.5" />
                </Button>
              )}
            </div>

            {isChoice && (
              <div className="ml-10 mt-3 grid gap-2">
                {step.taskIds?.map((taskId) => {
                  const taskName = getTaskName(tasksById, taskId);
                  const complete = completedTasks.has(taskId);
                  return (
                    <div
                      key={taskId}
                      className={cn(
                        "flex flex-col gap-2 border border-border bg-card/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                        complete && "border-emerald-500/30",
                      )}
                    >
                      <button
                        type="button"
                        className="flex min-h-11 min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label={`${complete ? "Mark incomplete" : "Mark complete"}: ${taskName}`}
                        onClick={() => onToggleTask(taskId)}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            complete
                              ? "border-emerald-500 bg-emerald-500 text-black"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {complete ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Circle className="size-2.5" />
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            complete
                              ? "text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {taskName}
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-11 self-start pl-9 sm:self-auto sm:pl-3"
                        onClick={() => onOpenTask(taskId, taskName)}
                      >
                        View task
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
