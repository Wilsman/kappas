import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  CheckCircle2 as CircleCheckBig,
  ChevronDown,
  Circle,
  ExternalLink,
  Gift,
  Home,
  Info,
  LockKeyhole,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import type { Achievement, Prestige, Task } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { ResetOptions } from "@/components/SelectiveResetDialog";
import { PrestigeCelebration } from "@/components/PrestigeCelebration";
import { PrestigeUpDialog } from "@/components/PrestigeUpDialog";
import { TaskDetailsContent } from "@/components/TaskDetailsContent";
import { cn } from "@/lib/utils";
import { GAME_MODE_LABELS, type GameMode } from "@/utils/gameMode";
import {
  evaluatePrestige,
  formatRoubles,
  getPrestigeModeNotes,
  MAX_PRESTIGE_LEVEL,
  type PrestigeProgress,
  type PrestigeRequirementStatus,
  type PrestigeState,
  type PrestigeTrackerState,
} from "@/utils/prestige";

interface PrestigesViewProps {
  gameMode: GameMode;
  prestiges: Prestige[];
  prestigeState: PrestigeState;
  trackerState: PrestigeTrackerState;
  profileName: string;
  achievements: Achievement[];
  taskObjectiveItemProgress: Record<string, number>;
  onPlayerLevelChange: (level: number) => void;
  onUpdatePrestigeState: (update: Partial<PrestigeState>) => void;
  onStartNewPrestige: (level: number, options: ResetOptions) => void;
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
  onOpenHideout: () => void;
}

export function PrestigesView({
  gameMode,
  prestiges,
  prestigeState,
  trackerState,
  profileName,
  achievements,
  taskObjectiveItemProgress,
  onPlayerLevelChange,
  onUpdatePrestigeState,
  onStartNewPrestige,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
  onOpenHideout,
}: PrestigesViewProps) {
  const currentLevel = prestigeState.currentLevel;
  const maxLevel = prestiges.length
    ? Math.max(...prestiges.map((prestige) => prestige.prestigeLevel))
    : MAX_PRESTIGE_LEVEL;
  const nextLevel = Math.min(currentLevel + 1, maxLevel);
  const [selectedLevel, setSelectedLevel] = useState(nextLevel);
  const [prestigeDialogOpen, setPrestigeDialogOpen] = useState(false);
  const [celebrating, setCelebrating] = useState<Prestige | null>(null);
  const endCelebration = useCallback(() => setCelebrating(null), []);

  const handleConfirmPrestige = (level: number, options: ResetOptions) => {
    onStartNewPrestige(level, options);
    if (level > currentLevel) {
      setCelebrating(
        prestiges.find((prestige) => prestige.prestigeLevel === level) ?? null,
      );
    }
  };

  // Follow the next prestige when the reached prestige changes.
  useEffect(() => {
    setSelectedLevel(nextLevel);
  }, [nextLevel]);

  // Command menu search ("Prestige 3") jumps to that prestige.
  useEffect(() => {
    type GlobalSearchDetail = { term?: string; scope?: string };
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<GlobalSearchDetail>).detail;
      if (detail?.scope !== "prestiges" || typeof detail.term !== "string") {
        return;
      }
      const level = Number.parseInt(detail.term.replace(/\D+/g, ""), 10);
      if (Number.isFinite(level)) setSelectedLevel(level);
    };
    window.addEventListener("taskTracker:globalSearch", handler);
    return () => window.removeEventListener("taskTracker:globalSearch", handler);
  }, []);

  const progressByLevel = useMemo(
    () =>
      new Map(
        prestiges.map((prestige) => [
          prestige.prestigeLevel,
          evaluatePrestige(prestige, trackerState),
        ]),
      ),
    [prestiges, trackerState],
  );
  const selected = progressByLevel.get(selectedLevel) ?? null;
  const allReached = prestiges.length > 0 && currentLevel >= maxLevel;
  const nextProgress = progressByLevel.get(currentLevel + 1);
  const modeLabel = GAME_MODE_LABELS[gameMode];

  const statusLabel = allReached
    ? "All prestiges reached"
    : nextProgress?.ready
      ? `Ready for ${nextProgress.prestige.name}`
      : nextProgress
        ? `${nextProgress.prestige.name} · ${nextProgress.completed} / ${nextProgress.total}`
        : "No prestige data";

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold uppercase tracking-[0.08em] text-foreground sm:text-3xl">
                Prestige
              </h1>
              <ModeBadge gameMode={gameMode} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {modeLabel} requirements from live game data. Level, tasks and
              hideout are tracked automatically; enter roubles and skills
              yourself.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "w-fit border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                allReached || nextProgress?.ready
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-card/40 text-muted-foreground",
              )}
            >
              {statusLabel}
            </div>
          </div>
        </header>

        {prestiges.length === 0 ? (
          <EmptyState gameMode={gameMode} />
        ) : (
          <>
            <PrestigeStepper
              prestiges={prestiges}
              progressByLevel={progressByLevel}
              currentLevel={currentLevel}
              selectedLevel={selectedLevel}
              onSelect={setSelectedLevel}
            />

            {selected && (
              <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
                <PrestigeHero
                  progress={selected}
                  gameMode={gameMode}
                  currentLevel={currentLevel}
                  trackerState={trackerState}
                  achievements={achievements}
                  taskObjectiveItemProgress={taskObjectiveItemProgress}
                  onPlayerLevelChange={onPlayerLevelChange}
                  onUpdatePrestigeState={onUpdatePrestigeState}
                  onToggleTask={onToggleTask}
                  onToggleTaskObjective={onToggleTaskObjective}
                  onUpdateTaskObjectiveItemProgress={
                    onUpdateTaskObjectiveItemProgress
                  }
                  onOpenTask={onOpenTask}
                  onOpenHideout={onOpenHideout}
                  onPrestige={() => setPrestigeDialogOpen(true)}
                />
                <PrestigeRewards prestige={selected.prestige} />
              </div>
            )}
          </>
        )}
      </div>

      <PrestigeUpDialog
        open={prestigeDialogOpen}
        onOpenChange={setPrestigeDialogOpen}
        prestiges={prestiges}
        currentLevel={currentLevel}
        profileName={profileName}
        modeLabel={modeLabel}
        onConfirm={handleConfirmPrestige}
      />
      <PrestigeCelebration prestige={celebrating} onDone={endCelebration} />
    </main>
  );
}

function ModeBadge({ gameMode }: { gameMode: GameMode }) {
  return (
    <span
      className={cn(
        "border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
        gameMode === "pve"
          ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
          : gameMode === "pvp-season"
            ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
            : "border-rose-500/50 bg-rose-500/10 text-rose-400",
      )}
    >
      {GAME_MODE_LABELS[gameMode]}
    </span>
  );
}

function EmptyState({ gameMode }: { gameMode: GameMode }) {
  return (
    <section className="flex flex-col items-center gap-3 border border-border bg-card/35 px-6 py-16 text-center">
      <Info className="size-6 text-muted-foreground" />
      <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
        {gameMode === "pvp-season"
          ? "No prestige in Seasonal"
          : "Prestige data unavailable"}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {gameMode === "pvp-season"
          ? "The game data lists no prestiges for Seasonal mode. Switch the profile to PvP or PvE to track prestige."
          : "No prestiges came back from the game data for this mode. Try refreshing the data."}
      </p>
    </section>
  );
}

function PrestigeStepper({
  prestiges,
  progressByLevel,
  currentLevel,
  selectedLevel,
  onSelect,
}: {
  prestiges: Prestige[];
  progressByLevel: Map<number, PrestigeProgress>;
  currentLevel: number;
  selectedLevel: number;
  onSelect: (level: number) => void;
}) {
  const sorted = [...prestiges].sort((a, b) => a.prestigeLevel - b.prestigeLevel);
  const maxLevel = sorted[sorted.length - 1]?.prestigeLevel ?? MAX_PRESTIGE_LEVEL;
  const next = progressByLevel.get(currentLevel + 1);
  // Partial credit toward the next milestone, averaged over its requirements.
  const nextFraction =
    next && next.requirements.length > 0
      ? next.requirements.reduce((sum, req) => sum + req.progress, 0) /
        next.requirements.length
      : 0;
  const fill = Math.min(1, (Math.min(currentLevel, maxLevel) + nextFraction) / maxLevel);
  const position = (level: number) => `${(level / maxLevel) * 100}%`;

  return (
    <nav
      aria-label="Prestige levels"
      className="border border-border bg-card/45 px-8 pb-5 pt-6 sm:px-12"
    >
      <div className="relative h-[4.75rem]">
        {/* Track */}
        <div className="absolute inset-x-0 top-[22px] h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.55)] transition-[width] duration-700 ease-out"
            style={{ width: `${fill * 100}%` }}
          />
        </div>

        {/* Start marker */}
        <div
          className="absolute top-[22px] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: 0 }}
          aria-hidden="true"
        >
          <span className="size-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
        </div>

        {sorted.map((prestige) => {
          const level = prestige.prestigeLevel;
          const progress = progressByLevel.get(level);
          const reached = level <= currentLevel;
          const isNext = level === currentLevel + 1;
          const isSelected = level === selectedLevel;
          const state = reached
            ? "Reached"
            : isNext
              ? progress?.ready
                ? "Ready"
                : `${progress?.completed ?? 0}/${progress?.total ?? 0}`
              : "Locked";
          return (
            <button
              key={prestige.id}
              type="button"
              aria-current={isSelected ? "step" : undefined}
              aria-label={`${prestige.name} – ${state}`}
              onClick={() => onSelect(level)}
              className="group absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1.5 focus-visible:outline-none"
              style={{ left: position(level) }}
            >
              <span
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full border-2 bg-background transition-all duration-300 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-emerald-500 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                  reached
                    ? "border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.5)]"
                    : isNext
                      ? "border-foreground/70"
                      : "border-border",
                  isSelected && "scale-110",
                )}
              >
                {isNext && !reached && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full border border-emerald-400/50 [animation-duration:2.4s]"
                    aria-hidden="true"
                  />
                )}
                {prestige.iconLink ? (
                  <img
                    src={prestige.iconLink}
                    alt=""
                    className={cn(
                      "size-8 object-contain transition-[filter,opacity] duration-300",
                      !reached && !isNext && "opacity-35 grayscale",
                    )}
                    loading="lazy"
                  />
                ) : (
                  <span className="font-mono text-xs font-bold">{level}</span>
                )}
              </span>
              <span
                className={cn(
                  "font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                  isSelected
                    ? "text-foreground"
                    : reached
                      ? "text-emerald-400"
                      : "text-muted-foreground",
                )}
              >
                P{level}
              </span>
              <span
                className={cn(
                  "-mt-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-widest",
                  reached || progress?.ready
                    ? "text-emerald-400/80"
                    : "text-muted-foreground/70",
                )}
              >
                {state}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** The main call to action: glows, shimmers, and pulses once requirements are met. */
function PrestigeButton({
  ready,
  onClick,
}: {
  ready: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={cn(
        "group relative inline-flex shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap border border-amber-300/80 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_16px_rgba(245,158,11,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ready && "animate-prestige-glow",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-prestige-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:hidden"
      />
      <Sparkles className="relative size-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      <span className="relative">I prestiged</span>
    </motion.button>
  );
}

function PrestigeHero({
  progress,
  gameMode,
  currentLevel,
  trackerState,
  achievements,
  taskObjectiveItemProgress,
  onPlayerLevelChange,
  onUpdatePrestigeState,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
  onOpenHideout,
  onPrestige,
}: {
  progress: PrestigeProgress;
  gameMode: GameMode;
  currentLevel: number;
  trackerState: PrestigeTrackerState;
  achievements: Achievement[];
  taskObjectiveItemProgress: Record<string, number>;
  onPlayerLevelChange: PrestigesViewProps["onPlayerLevelChange"];
  onUpdatePrestigeState: PrestigesViewProps["onUpdatePrestigeState"];
  onToggleTask: PrestigesViewProps["onToggleTask"];
  onToggleTaskObjective: PrestigesViewProps["onToggleTaskObjective"];
  onUpdateTaskObjectiveItemProgress: PrestigesViewProps["onUpdateTaskObjectiveItemProgress"];
  onOpenTask: PrestigesViewProps["onOpenTask"];
  onOpenHideout: PrestigesViewProps["onOpenHideout"];
  onPrestige: () => void;
}) {
  const { prestige } = progress;
  const reached = prestige.prestigeLevel <= currentLevel;
  const isNext = prestige.prestigeLevel === currentLevel + 1;
  const percentage =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  const notes = getPrestigeModeNotes(prestige, gameMode);
  const remaining = progress.requirements.filter((r) => !r.done);

  return (
    <section
      aria-labelledby="prestige-hero-heading"
      className="overflow-hidden border border-border bg-card/45 shadow-[0_18px_45px_rgba(0,0,0,0.16)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div className="flex min-w-[220px] flex-1 items-center gap-4">
          {prestige.iconLink && (
            <img
              src={prestige.iconLink}
              alt=""
              className="size-14 shrink-0 object-contain"
            />
          )}
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {reached ? "Reached" : isNext ? "Next prestige" : "Upcoming"}
            </p>
            <h2
              id="prestige-hero-heading"
              className="text-xl font-bold uppercase tracking-wide text-foreground"
            >
              {prestige.name}
            </h2>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {percentage}%
              </span>
              <span className="pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {progress.completed} / {progress.total} requirements
              </span>
            </div>
          </div>
        </div>
        {isNext ? (
          <div className="flex shrink-0 flex-col items-start gap-1.5">
            <PrestigeButton ready={progress.ready} onClick={onPrestige} />
            <span className="max-w-[240px] text-[11px] text-muted-foreground">
              {progress.ready
                ? "Everything's ready. Prestige in game, then confirm here."
                : `${remaining.length} requirement${remaining.length === 1 ? "" : "s"} left. Already prestiged in game? Set it here.`}
            </span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrestige}
            className="shrink-0 rounded-none font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-amber-400"
          >
            <Sparkles className="size-3.5" />
            Change prestige
          </Button>
        )}

      </div>

      <Progress
        className="h-1 rounded-none bg-muted/70"
        indicatorClassName={cn(
          "rounded-none",
          progress.ready ? "bg-emerald-500" : "bg-muted-foreground",
        )}
        value={percentage}
      />

      {(notes.length > 0 || reached) && (
        <div className="flex flex-col gap-1 border-b border-border bg-background/40 px-5 py-3 sm:px-6">
          {reached && (
            <p className="flex items-center gap-2 text-xs text-emerald-400">
              <Check className="size-3.5" />
              You've already reached this prestige. Requirements shown for
              reference.
            </p>
          )}
          {notes.map((note) => (
            <p
              key={note}
              className="flex items-center gap-2 text-xs text-sky-400"
            >
              <Info className="size-3.5" />
              {note}
            </p>
          ))}
        </div>
      )}

      <ul className="divide-y divide-border">
        {progress.requirements.map((requirement) => (
          <RequirementRow
            key={requirement.condition.id || requirement.label}
            requirement={requirement}
            trackerState={trackerState}
            achievements={achievements}
            taskObjectiveItemProgress={taskObjectiveItemProgress}
            onPlayerLevelChange={onPlayerLevelChange}
            onUpdatePrestigeState={onUpdatePrestigeState}
            onToggleTask={onToggleTask}
            onToggleTaskObjective={onToggleTaskObjective}
            onUpdateTaskObjectiveItemProgress={
              onUpdateTaskObjectiveItemProgress
            }
            onOpenTask={onOpenTask}
            onOpenHideout={onOpenHideout}
          />
        ))}
      </ul>
    </section>
  );
}

function RequirementRow({
  requirement,
  trackerState,
  achievements,
  taskObjectiveItemProgress,
  onPlayerLevelChange,
  onUpdatePrestigeState,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  onOpenTask,
  onOpenHideout,
}: {
  requirement: PrestigeRequirementStatus;
  trackerState: PrestigeTrackerState;
  achievements: Achievement[];
  taskObjectiveItemProgress: Record<string, number>;
  onPlayerLevelChange: PrestigesViewProps["onPlayerLevelChange"];
  onUpdatePrestigeState: PrestigesViewProps["onUpdatePrestigeState"];
  onToggleTask: PrestigesViewProps["onToggleTask"];
  onToggleTaskObjective: PrestigesViewProps["onToggleTaskObjective"];
  onUpdateTaskObjectiveItemProgress: PrestigesViewProps["onUpdateTaskObjectiveItemProgress"];
  onOpenTask: PrestigesViewProps["onOpenTask"];
  onOpenHideout: PrestigesViewProps["onOpenHideout"];
}) {
  const { condition, done } = requirement;
  const task: Task | undefined =
    condition.type === "taskStatus"
      ? trackerState.tasksById.get(condition.taskId)
      : undefined;
  const percentage = Math.round(requirement.progress * 100);

  const statusIcon = done ? (
    <CircleCheckBig className="size-5" />
  ) : requirement.link?.type === "task" &&
    task &&
    task.taskRequirements.some(
      (r) => !trackerState.completedTasks.has(r.task.id),
    ) ? (
    <LockKeyhole className="size-4" />
  ) : (
    <Circle className="size-5 opacity-55" />
  );

  return (
    <li className={cn(done && "bg-emerald-500/[0.035]")}>
      <Collapsible>
        <div className="flex min-h-[76px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {condition.type === "taskStatus" ? (
              <button
                type="button"
                aria-pressed={done}
                aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${requirement.label}`}
                onClick={() => onToggleTask(condition.taskId)}
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  done
                    ? "text-emerald-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {statusIcon}
              </button>
            ) : (
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center",
                  done ? "text-emerald-400" : "text-muted-foreground",
                )}
              >
                {statusIcon}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    done ? "text-emerald-400" : "text-foreground",
                  )}
                >
                  {requirement.label}
                </p>
                <span className="border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {requirement.source === "auto" ? "Tracked" : "Manual"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {requirement.help}
              </p>
              {!done && requirement.target > 1 && (
                <Progress
                  className="mt-2 h-1 w-40 rounded-none bg-muted/70"
                  indicatorClassName="rounded-none bg-muted-foreground"
                  value={percentage}
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 pl-11 sm:pl-0">
            <RequirementControl
              requirement={requirement}
              trackerState={trackerState}
              onPlayerLevelChange={onPlayerLevelChange}
              onUpdatePrestigeState={onUpdatePrestigeState}
            />
            {condition.type === "taskStatus" && task && (
              <>
                {(task.objectives?.length ?? 0) > 0 && (
                  <CollapsibleTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="group/details min-h-11"
                    >
                      Objectives
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                        ({task.objectives?.length})
                      </span>
                      <ChevronDown className="ml-1.5 size-3.5 transition-transform group-data-[state=open]/details:rotate-180 motion-reduce:transition-none" />
                    </Button>
                  </CollapsibleTrigger>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => onOpenTask(task.id, task.name)}
                >
                  View task
                  <ExternalLink className="ml-2 size-3.5" />
                </Button>
              </>
            )}
            {condition.type === "hideoutStation" && !done && (
              <Button
                size="sm"
                variant="ghost"
                className="min-h-11"
                onClick={onOpenHideout}
              >
                <Home className="mr-2 size-3.5" />
                Open hideout
              </Button>
            )}
          </div>
        </div>

        {task && (
          <CollapsibleContent>
            <TaskDetailsContent
              task={task}
              achievements={achievements}
              completedTaskObjectives={trackerState.completedTaskObjectives}
              taskObjectiveItemProgress={taskObjectiveItemProgress}
              onToggleTaskObjective={(taskId, objectiveKey, legacyKey) =>
                onToggleTaskObjective(taskId, objectiveKey, legacyKey, true)
              }
              onUpdateTaskObjectiveItemProgress={
                onUpdateTaskObjectiveItemProgress
              }
            />
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
}

function RequirementControl({
  requirement,
  trackerState,
  onPlayerLevelChange,
  onUpdatePrestigeState,
}: {
  requirement: PrestigeRequirementStatus;
  trackerState: PrestigeTrackerState;
  onPlayerLevelChange: PrestigesViewProps["onPlayerLevelChange"];
  onUpdatePrestigeState: PrestigesViewProps["onUpdatePrestigeState"];
}) {
  const { condition } = requirement;
  const inputClass =
    "h-10 border-border bg-background font-mono text-sm tabular-nums";

  if (condition.type === "playerLevel") {
    return (
      <LabeledValue suffix={`/ ${condition.level}`}>
        <Input
          aria-label="PMC level"
          className={cn(inputClass, "w-20")}
          inputMode="numeric"
          min="1"
          type="number"
          value={trackerState.playerLevel}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            onPlayerLevelChange(Number.isFinite(parsed) ? parsed : 1);
          }}
        />
      </LabeledValue>
    );
  }

  if (condition.type === "skill") {
    return (
      <LabeledValue suffix={`/ ${condition.level}`}>
        <Input
          aria-label={`${condition.skillName} level`}
          className={cn(inputClass, "w-20")}
          inputMode="numeric"
          min="0"
          max="51"
          type="number"
          value={requirement.current || ""}
          placeholder="0"
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            onUpdatePrestigeState({
              skills: {
                ...trackerState.manual.skills,
                [condition.skillId]: Number.isFinite(parsed)
                  ? Math.max(0, parsed)
                  : 0,
              },
            });
          }}
        />
      </LabeledValue>
    );
  }

  if (condition.type === "haveItem" && requirement.source === "manual") {
    return (
      <LabeledValue suffix={`/ ${formatRoubles(condition.count)}`}>
        <Input
          aria-label="Roubles in stash"
          className={cn(inputClass, "w-36")}
          inputMode="numeric"
          min="0"
          step="100000"
          type="number"
          value={requirement.current || ""}
          placeholder="0"
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            onUpdatePrestigeState({
              roubles: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
            });
          }}
        />
      </LabeledValue>
    );
  }

  if (condition.type === "hideoutStation") {
    return (
      <span className="px-2 font-mono text-xs tabular-nums text-muted-foreground">
        Lv {requirement.current} / {condition.level}
      </span>
    );
  }

  return null;
}

function LabeledValue({
  suffix,
  children,
}: {
  suffix: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      {children}
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {suffix}
      </span>
    </span>
  );
}

function PrestigeRewards({ prestige }: { prestige: Prestige }) {
  const rewards = prestige.rewards ?? {};
  const items = rewards.items ?? [];
  const customization = rewards.customization ?? [];
  const achievements = rewards.achievement ?? [];
  const skills = rewards.skillLevelReward ?? [];
  const transfer = prestige.transfer;
  const hasRewards =
    items.length + customization.length + achievements.length + skills.length >
    0;

  return (
    <div className="space-y-4">
      <section className="border border-border bg-card/35">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Gift className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Rewards
          </h3>
        </div>
        {hasRewards ? (
          <ul className="divide-y divide-border">
            {customization.map((reward) => (
              <RewardRow
                key={reward.id ?? reward.name}
                imageLink={reward.imageLink}
                name={reward.name}
                detail={reward.customizationTypeName ?? reward.customizationType}
              />
            ))}
            {achievements.map((reward) => (
              <RewardRow
                key={reward.id ?? reward.name}
                imageLink={reward.imageLink}
                name={reward.name}
                detail="Achievement"
              />
            ))}
            {items.map((reward) => (
              <RewardRow
                key={reward.item.id ?? reward.item.name}
                imageLink={reward.item.iconLink}
                name={reward.item.name}
                detail={reward.count > 1 ? `x${reward.count.toLocaleString("en-US")}` : undefined}
              />
            ))}
            {skills.map((reward, index) => (
              <RewardRow
                key={`${reward.skill?.name ?? reward.name}-${index}`}
                name={`${reward.skill?.name ?? reward.name ?? "Skill"} +${reward.level ?? 0}`}
                detail="Skill level"
              />
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-xs text-muted-foreground">
            No rewards listed in the game data.
          </p>
        )}
      </section>

      {transfer && (
        <section className="border border-border bg-card/35">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <PackageOpen className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
              What carries over
            </h3>
          </div>
          <dl className="divide-y divide-border text-sm">
            {transfer.stashGrid && (
              <TransferRow
                label="Transfer stash"
                value={`${transfer.stashGrid.width}×${transfer.stashGrid.height} grid`}
              />
            )}
            {typeof transfer.skillsRate === "number" && (
              <TransferRow
                label="Skill progress"
                value={`${Math.round(transfer.skillsRate * 100)}% kept`}
              />
            )}
            {typeof transfer.masteringRate === "number" && (
              <TransferRow
                label="Weapon mastering"
                value={`${Math.round(transfer.masteringRate * 100)}% kept`}
              />
            )}
          </dl>
        </section>
      )}
    </div>
  );
}

function RewardRow({
  imageLink,
  name,
  detail,
}: {
  imageLink?: string;
  name: string;
  detail?: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {imageLink ? (
        <img
          src={imageLink}
          alt=""
          className="size-9 shrink-0 object-contain"
          loading="lazy"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center border border-border text-muted-foreground">
          <Sparkles className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">
          {name}
        </span>
        {detail && (
          <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
    </li>
  );
}

function TransferRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
