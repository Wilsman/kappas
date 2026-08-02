import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import {
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  Diamond,
  ExternalLink,
  GitBranch,
  ListChecks,
  LockKeyhole,
  Map as MapIcon,
  Minus,
  Package,
  Plus,
  RadioTower,
  TowerControl,
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
  calculateLightkeeperProgress,
  LIGHTKEEPER_STAGE_TWO_TASKS,
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
  achievements: Achievement[];
  scavKarma: number | null;
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  completedStorylineObjectives: Set<string>;
  completedStorylineMapNodes: Set<string>;
  onScavKarmaChange: (value: number | null) => void;
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
  onToggleStorylineObjective: (objectiveId: string) => void;
  onToggleStorylineMapNode: (nodeId: string) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
  onOpenTicket: () => void;
}

const PATH_ICONS = {
  batya: BookOpen,
  ticket: MapIcon,
  quests: ListChecks,
} as const;

const JOURNEY_SECTIONS = [
  {
    id: "lightkeeper-requirements",
    label: "Unlock Network Provider",
    compactLabel: "Unlock Provider",
  },
  {
    id: "lightkeeper-mechanic-taskline",
    label: "Gain Access to Lightkeeper",
    compactLabel: "Gain Access",
  },
  {
    id: "lightkeeper-getting-acquainted",
    label: "Getting Acquainted",
    compactLabel: "Acquainted",
  },
] as const;

const KNOCK_KNOCK_ID = LIGHTKEEPER_STAGE_TWO_TASKS.at(-2)?.id ?? "";
const GETTING_ACQUAINTED_ID = LIGHTKEEPER_STAGE_TWO_TASKS.at(-1)?.id ?? "";

function getTaskName(tasksById: Map<string, Task>, taskId: string) {
  return tasksById.get(taskId)?.name ?? "Quest";
}

export function LightkeeperJourney({
  tasks,
  achievements,
  scavKarma,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  completedStorylineObjectives,
  completedStorylineMapNodes,
  onScavKarmaChange,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onToggleStorylineObjective,
  onToggleStorylineMapNode,
  onOpenTask,
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
  const knockKnockComplete =
    completedTasks.has(KNOCK_KNOCK_ID) || progress.lightkeeperUnlocked;
  const currentStageTwoId = progress.stageOneReady
    ? progress.nextStageTwoTask?.id
    : undefined;
  const journeyStatus = progress.lightkeeperUnlocked
    ? "Lightkeeper Unlocked"
    : !progress.stageOneReady
      ? "Unlock Network Provider"
      : knockKnockComplete
        ? "Getting Acquainted"
        : `Gain access · ${Math.min(progress.stageTwoCompleted, 7)} / 7`;

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
    if (selectedPath === "ticket") {
      onOpenTicket();
      return;
    }
    const taskId = step.taskIds?.[0];
    if (taskId) onOpenTask(taskId, getTaskName(tasksById, taskId));
  };

  const scrollToJourneySection = (sectionId: string) => {
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
              Access status
            </span>
            <span className="hidden text-border sm:inline" aria-hidden="true">
              /
            </span>
            <span
              className={cn(
                "truncate text-[10px] font-bold uppercase tracking-[0.14em]",
                progress.lightkeeperUnlocked
                  ? "text-emerald-400"
                  : "text-amber-400",
              )}
            >
              {journeyStatus}
            </span>
          </div>

          <nav
            aria-label="Lightkeeper access progress"
            className="grid grid-cols-3"
          >
            {JOURNEY_SECTIONS.map((section, index) => {
              const complete =
                index === 0
                  ? progress.stageOneReady
                  : index === 1
                    ? knockKnockComplete
                    : progress.lightkeeperUnlocked;
              const active =
                !progress.lightkeeperUnlocked &&
                ((index === 0 && !progress.stageOneReady) ||
                  (index === 1 &&
                    progress.stageOneReady &&
                    !knockKnockComplete) ||
                  (index === 2 && knockKnockComplete));
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={active ? "step" : undefined}
                  aria-label={`Jump to ${section.label}`}
                  onClick={() => scrollToJourneySection(section.id)}
                  className={cn(
                    "relative flex min-h-11 min-w-0 items-center justify-center border-b-2 border-r border-r-border/70 px-1.5 text-center text-[8px] font-bold uppercase leading-tight tracking-normal transition-colors last:border-r-0 hover:bg-card/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 motion-reduce:transition-none sm:justify-start sm:px-3 sm:text-[10px] sm:tracking-[0.08em]",
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

          <JourneyMarker type="stage" />
          <section
            id="lightkeeper-requirements"
            className="scroll-mt-20 pb-10"
          >
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
                    achievements={achievements}
                    completedTasks={completedTasks}
                    completedTaskObjectives={completedTaskObjectives}
                    taskObjectiveItemProgress={taskObjectiveItemProgress}
                    tasksById={tasksById}
                    onSelectTarget={(targetId) =>
                      void setTargetParam(targetId, { history: "push" })
                    }
                    onToggleTask={onToggleTask}
                    onToggleTaskObjective={onToggleTaskObjective}
                    onUpdateTaskObjectiveItemProgress={
                      onUpdateTaskObjectiveItemProgress
                    }
                    onOpenTask={onOpenTask}
                  />
                ) : (
                  <RouteChecklist
                    path={selectedPath}
                    steps={selectedRoute.steps}
                    tasksById={tasksById}
                    completedTasks={completedTasks}
                    completedStorylineObjectives={
                      completedStorylineObjectives
                    }
                    taskObjectiveItemProgress={taskObjectiveItemProgress}
                    onToggleStep={toggleStep}
                    onToggleTask={onToggleTask}
                    onToggleStorylineObjective={
                      onToggleStorylineObjective
                    }
                    onUpdateTaskObjectiveItemProgress={
                      onUpdateTaskObjectiveItemProgress
                    }
                    onOpenStep={openStepSource}
                    onOpenTask={onOpenTask}
                  />
                )}
              </div>
            </div>
          </section>

          <JourneyMarker type="stage" muted={!progress.stageOneReady} />
          <section
            id="lightkeeper-mechanic-taskline"
            className="scroll-mt-20 pb-10"
          >
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

            <div className="mt-5 space-y-4">
              {LIGHTKEEPER_STAGE_TWO_TASKS.map((taskStep) => {
                const task = tasksById.get(taskStep.id);
                const complete = completedTasks.has(taskStep.id);
                const current =
                  progress.stageOneReady && taskStep.id === currentStageTwoId;
                const interactive =
                  progress.stageOneReady && (current || complete);
                const status = complete
                  ? "Complete"
                  : current
                    ? "Current"
                    : "Locked";

                return (
                  <article
                    key={taskStep.id}
                    id={
                      taskStep.id === GETTING_ACQUAINTED_ID
                        ? "lightkeeper-getting-acquainted"
                        : undefined
                    }
                    className={cn(
                      "scroll-mt-20 overflow-hidden border border-border bg-card/25",
                      complete && "bg-emerald-500/[0.04]",
                      current && "bg-amber-500/[0.08]",
                      !interactive && !complete && "border-border/70",
                    )}
                  >
                    <div className="flex min-h-16 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        aria-label={
                          complete
                            ? `Mark ${taskStep.name} incomplete`
                            : `Mark ${taskStep.name} complete`
                        }
                        disabled={!interactive}
                        onClick={() => onToggleTask(taskStep.id)}
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
                          {taskStep.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {status}
                        </p>
                      </div>
                      </div>
                      <div className="flex gap-2 pl-10 sm:pl-0">
                        {current && (
                          <Button
                            size="sm"
                            className="min-h-11 bg-amber-500 text-black hover:bg-amber-400"
                            onClick={() => onToggleTask(taskStep.id)}
                          >
                            Mark complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-11"
                          onClick={() =>
                            onOpenTask(taskStep.id, taskStep.name)
                          }
                        >
                          View task
                        </Button>
                      </div>
                    </div>
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
                            interactive,
                          )
                        }
                        onUpdateTaskObjectiveItemProgress={
                          onUpdateTaskObjectiveItemProgress
                        }
                      />
                    ) : (
                      <p className="border-t border-border/70 px-4 py-4 text-xs text-muted-foreground">
                        Task details are unavailable in the current data set.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <JourneyMarker
            type="milestone"
            muted={!progress.lightkeeperUnlocked}
          />
          <section
            id="lightkeeper-unlock"
            className={cn(
              "scroll-mt-20 border px-5 py-5",
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
  achievements,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  tasksById,
  onSelectTarget,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
}: {
  journey: LightkeeperSidequestJourney;
  prerequisites: LightkeeperSidequestJourneyRow[];
  targets: LightkeeperSidequestJourneyTarget[];
  selectedTargetId: string;
  achievements: Achievement[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  tasksById: Map<string, Task>;
  onSelectTarget: (targetId: string) => void;
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
              taskData={tasksById.get(task.id)}
              achievements={achievements}
              completedTaskObjectives={completedTaskObjectives}
              taskObjectiveItemProgress={taskObjectiveItemProgress}
              onToggle={() => onToggleTask(task.id)}
              onToggleTaskObjective={onToggleTaskObjective}
              onUpdateTaskObjectiveItemProgress={
                onUpdateTaskObjectiveItemProgress
              }
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
            achievements={achievements}
            completedTasks={completedTasks}
            completedTaskObjectives={completedTaskObjectives}
            taskObjectiveItemProgress={taskObjectiveItemProgress}
            tasksById={tasksById}
            onToggleTask={onToggleTask}
            onToggleTaskObjective={onToggleTaskObjective}
            onUpdateTaskObjectiveItemProgress={
              onUpdateTaskObjectiveItemProgress
            }
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
  taskData,
  isLast,
  achievements,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggle,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpen,
}: {
  task: LightkeeperSidequestJourneyRow;
  taskData?: Task;
  isLast: boolean;
  achievements: Achievement[];
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggle: () => void;
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
  onOpen: () => void;
}) {
  const status = task.isComplete
    ? "Complete"
    : task.isAvailable
      ? "Available"
      : "Locked";

  return (
    <Collapsible
      className={cn(
        "relative border-b border-border",
        task.isComplete && "bg-emerald-500/[0.04]",
      )}
    >
      {!isLast && (
        <div
          className="absolute left-[26px] top-[39px] h-[42px] w-px bg-border sm:left-[30px]"
          aria-hidden="true"
        />
      )}
      <div className="flex min-h-16 flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
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
        <div className="flex flex-wrap gap-1 pl-10 sm:pl-0">
          <TaskDetailsTrigger task={taskData} />
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11"
            onClick={onOpen}
          >
            View task
            <ExternalLink className="ml-2 size-3.5" />
          </Button>
        </div>
      </div>
      <SidequestTaskDetails
        task={taskData}
        achievements={achievements}
        completedTaskObjectives={completedTaskObjectives}
        taskObjectiveItemProgress={taskObjectiveItemProgress}
        allowTaskCompletionSync={task.isAvailable || task.isComplete}
        onToggleTaskObjective={onToggleTaskObjective}
        onUpdateTaskObjectiveItemProgress={
          onUpdateTaskObjectiveItemProgress
        }
      />
    </Collapsible>
  );
}

function SidequestDestinationRow({
  target,
  achievements,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  tasksById,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
}: {
  target: LightkeeperSidequestJourneyTarget;
  achievements: Achievement[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  tasksById: Map<string, Task>;
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
}) {
  const isChoice = target.taskIds.length > 1;
  const status = target.isComplete
    ? "Complete"
    : target.isAvailable
      ? "Available"
      : "Locked";
  const taskId = target.taskIds[0];
  const task = taskId ? tasksById.get(taskId) : undefined;

  return (
    <Collapsible
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
          <div className="flex flex-wrap gap-1 pl-10 sm:pl-0">
            <TaskDetailsTrigger task={task} />
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11"
              onClick={() => onOpenTask(taskId, target.label)}
            >
              View task
              <ExternalLink className="ml-2 size-3.5" />
            </Button>
          </div>
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
              <Collapsible
                key={choiceTaskId}
                className={cn(
                  "border border-border bg-card/35",
                  complete && "border-emerald-500/30",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
                        {complete
                          ? "Complete"
                          : available
                            ? "Available"
                            : "Locked"}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-1 pl-9 sm:pl-0">
                    <TaskDetailsTrigger task={choiceTask} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => onOpenTask(choiceTaskId, choiceName)}
                    >
                      View task
                    </Button>
                  </div>
                </div>
                <SidequestTaskDetails
                  task={choiceTask}
                  achievements={achievements}
                  completedTaskObjectives={completedTaskObjectives}
                  taskObjectiveItemProgress={taskObjectiveItemProgress}
                  allowTaskCompletionSync={available || complete}
                  onToggleTaskObjective={onToggleTaskObjective}
                  onUpdateTaskObjectiveItemProgress={
                    onUpdateTaskObjectiveItemProgress
                  }
                />
              </Collapsible>
            );
          })}
        </div>
      )}
      {!isChoice && (
        <SidequestTaskDetails
          task={task}
          achievements={achievements}
          completedTaskObjectives={completedTaskObjectives}
          taskObjectiveItemProgress={taskObjectiveItemProgress}
          allowTaskCompletionSync={
            target.isAvailable || target.isComplete
          }
          onToggleTaskObjective={onToggleTaskObjective}
          onUpdateTaskObjectiveItemProgress={
            onUpdateTaskObjectiveItemProgress
          }
        />
      )}
    </Collapsible>
  );
}

function TaskDetailsTrigger({ task }: { task?: Task }) {
  return (
    <CollapsibleTrigger asChild>
      <Button
        size="sm"
        variant="ghost"
        className="group min-h-11"
        aria-label={`Toggle details for ${task?.name ?? "task"}`}
      >
        Details
        {(task?.objectives?.length ?? 0) > 0 && (
          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
            ({task?.objectives?.length})
          </span>
        )}
        <ChevronDown className="ml-1.5 size-3.5 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </Button>
    </CollapsibleTrigger>
  );
}

function SidequestTaskDetails({
  task,
  achievements,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  allowTaskCompletionSync,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
}: {
  task?: Task;
  achievements: Achievement[];
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  allowTaskCompletionSync: boolean;
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
}) {
  return (
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
              allowTaskCompletionSync,
            )
          }
          onUpdateTaskObjectiveItemProgress={
            onUpdateTaskObjectiveItemProgress
          }
        />
      ) : (
        <p className="border-t border-border/70 px-4 py-4 text-xs text-muted-foreground">
          Task details are unavailable in the current data set.
        </p>
      )}
    </CollapsibleContent>
  );
}

function RouteChecklist({
  path,
  steps,
  tasksById,
  completedTasks,
  completedStorylineObjectives,
  taskObjectiveItemProgress,
  onToggleStep,
  onToggleTask,
  onToggleStorylineObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenStep,
  onOpenTask,
}: {
  path: LightkeeperPath;
  steps: LightkeeperRouteProgress["steps"];
  tasksById: Map<string, Task>;
  completedTasks: Set<string>;
  completedStorylineObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleStep: (step: LightkeeperStep) => void;
  onToggleTask: (taskId: string) => void;
  onToggleStorylineObjective: (objectiveId: string) => void;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
  onOpenStep: (step: LightkeeperStep) => void;
  onOpenTask: (taskId: string, taskName: string) => void;
}) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    () => new Set(),
  );
  const chapterStats = new Map<string, { completed: number; total: number }>();
  let statsChapter: string | undefined;

  steps.forEach((step) => {
    if (step.chapter) statsChapter = step.chapter;
    if (!statsChapter || step.isOptional) return;

    const stats = chapterStats.get(statsChapter) ?? { completed: 0, total: 0 };
    stats.total += 1;
    if (step.isComplete) stats.completed += 1;
    chapterStats.set(statsChapter, stats);
  });

  let activeChapter: string | undefined;

  return (
    <div className="mt-5 border border-border bg-background/20">
      {steps.map((step, index) => {
        if (step.chapter) activeChapter = step.chapter;
        const stepChapter = activeChapter;
        const isChapterExpanded =
          path !== "ticket" ||
          !stepChapter ||
          expandedChapters.has(stepChapter);
        const stepChapterStats = step.chapter
          ? chapterStats.get(step.chapter)
          : undefined;
        const isTaskChoice = (step.taskIds?.length ?? 0) > 1;
        const isObjectiveChoice = (step.choices?.length ?? 0) > 0;
        const isChoice = isTaskChoice || isObjectiveChoice;
        const itemRequirement = step.itemRequirement;
        const objectiveItemKey = itemRequirement
          ? `storyline-objective::${step.objectiveId ?? step.id}::${
              itemRequirement.itemId || itemRequirement.itemName || "item"
            }`
          : "";
        const itemCount = itemRequirement
          ? Math.max(
              0,
              Math.min(
                itemRequirement.requiredCount,
                taskObjectiveItemProgress[objectiveItemKey] ?? 0,
              ),
            )
          : 0;
        const itemIncrement = itemRequirement?.increment ?? 1;
        return (
          <Fragment key={step.id}>
          {step.chapter && (
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between gap-4 border-b border-border bg-card/50 px-4 py-3 text-left transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:px-5"
              aria-expanded={isChapterExpanded}
              onClick={() =>
                setExpandedChapters((current) => {
                  const next = new Set(current);
                  if (next.has(step.chapter!)) {
                    next.delete(step.chapter!);
                  } else {
                    next.add(step.chapter!);
                  }
                  return next;
                })
              }
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  {step.chapter}
                </span>
                {step.chapterDescription && (
                  <span className="mt-1 block max-w-3xl text-xs leading-relaxed text-muted-foreground">
                    {step.chapterDescription}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {stepChapterStats && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {stepChapterStats.completed} / {stepChapterStats.total}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isChapterExpanded && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </span>
            </button>
          )}
          {isChapterExpanded && (
          <div
            className={cn(
              "relative border-b border-border px-3 py-3 last:border-b-0 sm:px-4",
              step.isComplete && "bg-emerald-500/[0.04]",
              step.isOptional && !step.isComplete && "bg-slate-500/[0.03]",
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
                    {step.isOptional
                      ? step.isComplete
                        ? "Optional · Complete"
                        : "Optional"
                      : step.isComplete
                        ? "Complete"
                        : step.completionChoiceIds?.length
                          ? "Hand over required for shortcut"
                          : isChoice
                            ? "Complete any one"
                            : "Incomplete"}
                  </p>
                </div>
              </div>
              {step.wikiUrl ? (
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="min-h-11 self-start pl-10 sm:self-auto sm:pl-3"
                >
                  <a
                    href={step.wikiUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Wiki guide
                    <ExternalLink className="ml-2 size-3.5" />
                  </a>
                </Button>
              ) : !isChoice ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-11 self-start pl-10 sm:self-auto sm:pl-3"
                  onClick={() => onOpenStep(step)}
                >
                  {path === "ticket" ? "Open Storyline" : "View task"}
                  <ExternalLink className="ml-2 size-3.5" />
                </Button>
              ) : null}
            </div>

            {itemRequirement && (
              <div className="ml-0 mt-3 border border-border bg-card/35 p-3 sm:ml-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-background/70">
                      {itemRequirement.iconLink ? (
                        <img
                          src={itemRequirement.iconLink}
                          alt=""
                          className="size-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {itemRequirement.itemName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {Math.max(0, itemRequirement.requiredCount - itemCount).toLocaleString()} remaining
                        {itemRequirement.foundInRaid && (
                          <span className="ml-2 rounded-sm bg-amber-500/15 px-1.5 py-0.5 font-bold uppercase text-amber-400">
                            FIR
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-11"
                      disabled={itemCount <= 0}
                      aria-label={`Decrease ${itemRequirement.itemName}`}
                      onClick={() =>
                        onUpdateTaskObjectiveItemProgress(
                          objectiveItemKey,
                          Math.max(0, itemCount - itemIncrement),
                        )
                      }
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="min-w-20 text-center font-mono text-xs text-foreground">
                      {itemCount.toLocaleString()} / {itemRequirement.requiredCount.toLocaleString()}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-11"
                      disabled={itemCount >= itemRequirement.requiredCount}
                      aria-label={`Increase ${itemRequirement.itemName}`}
                      onClick={() =>
                        onUpdateTaskObjectiveItemProgress(
                          objectiveItemKey,
                          Math.min(
                            itemRequirement.requiredCount,
                            itemCount + itemIncrement,
                          ),
                        )
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isObjectiveChoice && (
              <div className="mt-3 grid gap-2 sm:ml-10">
                {step.choices?.map((choice) => {
                  const complete = completedStorylineObjectives.has(choice.id);
                  return (
                    <div
                      key={choice.id}
                      className={cn(
                        "flex flex-col gap-2 border border-border bg-card/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                        complete && "border-emerald-500/30 bg-emerald-500/[0.04]",
                      )}
                    >
                      <button
                        type="button"
                        className="flex min-h-11 min-w-0 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:items-center"
                        aria-label={`${complete ? "Mark incomplete" : "Mark complete"}: ${choice.label}`}
                        onClick={() => onToggleStorylineObjective(choice.id)}
                      >
                        <span
                          className={cn(
                            "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border sm:mt-0",
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
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-xs font-semibold leading-relaxed",
                              complete
                                ? "text-emerald-400"
                                : "text-foreground",
                            )}
                          >
                            {choice.label}
                          </span>
                          {choice.note && (
                            <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                              {choice.note}
                            </span>
                          )}
                        </span>
                      </button>
                      {choice.wikiUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="min-h-11 self-start pl-9 sm:self-auto sm:pl-3"
                        >
                          <a
                            href={choice.wikiUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {path === "batya" ? "Map wiki" : "Wiki guide"}
                            <ExternalLink className="ml-2 size-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isTaskChoice && (
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
          )}
          </Fragment>
        );
      })}
    </div>
  );
}
