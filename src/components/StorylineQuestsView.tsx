import {
  AlertTriangle,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gift,
  Map as MapIcon,
  MessageSquareText,
  Minus,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { STORYLINE_QUESTS } from "@/data/storylineQuests";
import type {
  StorylineChapter,
  StorylineRequirement,
  StorylineRewardGroup,
  StorylineStep,
} from "@/types/storyline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  getStorylineDisplayProgress,
  getStorylineStepTitle,
  groupStorylineObjectives,
  isStorylineObjectiveGroupCompleted,
  isStorylineObjectiveGroupOptional,
  isStorylineObjectiveGroupPartiallyCompleted,
  isStorylineObjectiveGroupWorkingOn,
  type StorylineObjectiveGroup,
} from "@/utils/storylinePresentation";

const CHAPTER_METADATA = new Map(
  STORYLINE_QUESTS.map((chapter) => [
    chapter.name,
    {
      description: chapter.description,
      icon: chapter.icon,
      notes: chapter.notes,
    },
  ]),
);

const TRACKABLE_ITEM_TYPES = new Set([
  "findItem",
  "giveItem",
  "haveItem",
  "plantItem",
  "studyItems",
  "findQuestItem",
  "giveQuestItem",
  "haveQuestItem",
  "plantQuestItem",
]);

const OBJECTIVE_TYPE_LABELS: Record<string, string> = {
  dialogue: "Talk to trader",
  extract: "Extract",
  findItem: "Find items",
  giveItem: "Hand over items",
  findQuestItem: "Find quest item",
  giveQuestItem: "Hand over quest item",
  haveQuestItem: "Have quest item",
  plantQuestItem: "Plant quest item",
  taskStatus: "Task status",
  visit: "Visit",
  shoot: "Combat",
  traderStanding: "Trader standing",
  traderLevel: "Trader level",
  skill: "Skill",
  hideoutStation: "Hideout",
  studyItems: "Inspect items",
  globalVariable: "Story condition",
  useItem: "Use item",
  experience: "Experience",
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${Math.max(1, minutes)}m`;
};

const getObjectiveProgressKey = (objectiveId: string): string =>
  `storyline-objective::${objectiveId}::items`;

interface StorylineQuestsViewProps {
  chapters: StorylineChapter[];
  isLoading: boolean;
  error: string | null;
  updatedAt: number | null;
  source: "network" | "cache" | null;
  isStale: boolean;
  onRetry: () => void;
  completedObjectives: Set<string>;
  onToggleObjective: (id: string, relatedObjectiveIds?: string[]) => void;
  onSetCompletedObjectives: (objectives: Set<string>) => void;
  onNavigateToMap?: () => void;
  workingOnStorylineObjectives?: Set<string>;
  onToggleWorkingOnStorylineObjective?: (
    objectiveId: string,
    relatedObjectiveIds?: string[],
  ) => void;
  taskObjectiveItemProgress?: Record<string, number>;
  onUpdateTaskObjectiveItemProgress?: (
    objectiveItemKey: string,
    count: number,
    relatedObjectiveItemKeys?: string[],
  ) => void;
}

export function StorylineQuestsView({
  chapters,
  isLoading,
  error,
  updatedAt,
  source,
  isStale,
  onRetry,
  completedObjectives,
  onToggleObjective,
  onSetCompletedObjectives,
  onNavigateToMap,
  workingOnStorylineObjectives = new Set(),
  onToggleWorkingOnStorylineObjective,
  taskObjectiveItemProgress = {},
  onUpdateTaskObjectiveItemProgress,
}: StorylineQuestsViewProps): JSX.Element {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [itemQueries, setItemQueries] = useState<Record<string, string>>({});
  const [dialogState, setDialogState] = useState<{
    chapterId: string;
    chapterName: string;
    action: "complete" | "reset";
  } | null>(null);

  useEffect(() => {
    const firstChapter = chapters[0];
    if (!firstChapter) return;
    setExpandedChapters((current) =>
      current.size > 0 ? current : new Set([firstChapter.id]),
    );
    const firstStep = firstChapter.steps[0];
    if (firstStep) {
      setExpandedSteps((current) =>
        current.size > 0 ? current : new Set([firstStep.id]),
      );
    }
  }, [chapters]);

  const displayProgress = useMemo(
    () => getStorylineDisplayProgress(chapters, completedObjectives),
    [chapters, completedObjectives],
  );
  const progressPercent = displayProgress.total
    ? Math.round((displayProgress.completed / displayProgress.total) * 100)
    : 0;

  const toggleSetValue = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyChapterAction = () => {
    if (!dialogState) return;
    const chapter = chapters.find(
      (candidate) => candidate.id === dialogState.chapterId,
    );
    if (!chapter) return;
    const next = new Set(completedObjectives);
    chapter.steps.forEach((step) =>
      step.objectives.forEach((objective) => {
        if (dialogState.action === "complete") next.add(objective.id);
        else next.delete(objective.id);
      }),
    );
    onSetCompletedObjectives(next);
    setDialogState(null);
  };

  if (isLoading && chapters.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-28 animate-pulse rounded-xl border bg-muted/30" />
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border bg-muted/20"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && chapters.length === 0) {
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-lg rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Storyline data unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The Tarkov.dev development feed could not be loaded and this profile
            does not have a cached copy yet.
          </p>
          <p className="mt-2 break-words text-xs text-muted-foreground/80">
            {error}
          </p>
          <Button onClick={onRetry} className="mt-5">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <header className="rounded-xl border bg-card/70 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 flex-none text-primary" />
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    1.0 Storyline Quests
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Live, mode-specific objectives from the Tarkov.dev development API
                  </p>
                </div>
              </div>
            </div>
            {onNavigateToMap && (
              <Button variant="outline" onClick={onNavigateToMap}>
                <MapIcon className="mr-2 h-4 w-4" />
                Decision Map
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Overall task progress</span>
                <span className="tabular-nums">
                  {displayProgress.completed}/{displayProgress.total} ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Package className="mr-1 h-3 w-3" />
                {chapters.length} chapters
              </Badge>
              <Badge
                variant="outline"
                className={
                  isStale
                    ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                }
              >
                {isLoading
                  ? "Refreshing…"
                  : isStale
                    ? "Cached · refresh failed"
                    : source === "cache"
                      ? "Cached"
                      : "Live"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {updatedAt
                ? `Updated ${new Date(updatedAt).toLocaleString()}`
                : "Waiting for Storyline data"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              disabled={isLoading}
              className="h-7 self-start px-2 sm:self-auto"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh data
            </Button>
          </div>
          {error && chapters.length > 0 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Fresh Storyline data could not be loaded. The last cached copy is
              still available.
            </p>
          )}
        </header>

        <div className="space-y-4">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              expanded={expandedChapters.has(chapter.id)}
              onToggle={() => toggleSetValue(setExpandedChapters, chapter.id)}
              expandedSteps={expandedSteps}
              onToggleStep={(stepId) =>
                toggleSetValue(setExpandedSteps, stepId)
              }
              expandedItems={expandedItems}
              onToggleItems={(objectiveId) =>
                toggleSetValue(setExpandedItems, objectiveId)
              }
              itemQueries={itemQueries}
              onItemQueryChange={(objectiveId, value) =>
                setItemQueries((current) => ({
                  ...current,
                  [objectiveId]: value,
                }))
              }
              completedObjectives={completedObjectives}
              onToggleObjective={onToggleObjective}
              workingOnObjectives={workingOnStorylineObjectives}
              onToggleWorkingOnObjective={
                onToggleWorkingOnStorylineObjective
              }
              itemProgress={taskObjectiveItemProgress}
              onUpdateItemProgress={onUpdateTaskObjectiveItemProgress}
              onRequestComplete={() =>
                setDialogState({
                  chapterId: chapter.id,
                  chapterName: chapter.name,
                  action: "complete",
                })
              }
              onRequestReset={() =>
                setDialogState({
                  chapterId: chapter.id,
                  chapterName: chapter.name,
                  action: "reset",
                })
              }
            />
          ))}
        </div>
      </div>

      <AlertDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState?.action === "complete"
                ? `Complete ${dialogState.chapterName}?`
                : `Reset ${dialogState?.chapterName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState?.action === "complete"
                ? "Every required and optional objective in this chapter will be marked complete."
                : "Every objective in this chapter will be marked incomplete. Decision Map progress is not affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyChapterAction}>
              {dialogState?.action === "complete" ? "Complete all" : "Reset all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ChapterCardProps {
  chapter: StorylineChapter;
  expanded: boolean;
  onToggle: () => void;
  expandedSteps: Set<string>;
  onToggleStep: (stepId: string) => void;
  expandedItems: Set<string>;
  onToggleItems: (objectiveId: string) => void;
  itemQueries: Record<string, string>;
  onItemQueryChange: (objectiveId: string, value: string) => void;
  completedObjectives: Set<string>;
  onToggleObjective: (id: string, relatedObjectiveIds?: string[]) => void;
  workingOnObjectives: Set<string>;
  onToggleWorkingOnObjective?: (
    id: string,
    relatedObjectiveIds?: string[],
  ) => void;
  itemProgress: Record<string, number>;
  onUpdateItemProgress?: (
    key: string,
    count: number,
    relatedKeys?: string[],
  ) => void;
  onRequestComplete: () => void;
  onRequestReset: () => void;
}

function ChapterCard({
  chapter,
  expanded,
  onToggle,
  expandedSteps,
  onToggleStep,
  expandedItems,
  onToggleItems,
  itemQueries,
  onItemQueryChange,
  completedObjectives,
  onToggleObjective,
  workingOnObjectives,
  onToggleWorkingOnObjective,
  itemProgress,
  onUpdateItemProgress,
  onRequestComplete,
  onRequestReset,
}: ChapterCardProps) {
  const metadata = CHAPTER_METADATA.get(chapter.name);
  const objectiveGroups = chapter.steps.flatMap((step) =>
    groupStorylineObjectives(step.objectives),
  );
  const completed = objectiveGroups.filter((group) =>
    isStorylineObjectiveGroupCompleted(group, completedObjectives),
  ).length;
  const percent = objectiveGroups.length
    ? Math.round((completed / objectiveGroups.length) * 100)
    : 0;

  return (
    <section
      id={`storyline-quest-${chapter.id}`}
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {metadata?.icon ? (
            <img
              src={metadata.icon}
              alt=""
              className="h-12 w-12 flex-none object-contain sm:h-16 sm:w-16"
              loading="lazy"
            />
          ) : (
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg border bg-muted/30 sm:h-16 sm:w-16">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onToggle}
              className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-expanded={expanded}
            >
              <div className="min-w-0">
                <h2 className="text-lg font-semibold sm:text-xl">
                  {chapter.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {chapter.steps.length} stages · {objectiveGroups.length} tasks
                </p>
              </div>
              {expanded ? (
                <ChevronDown className="mt-1 h-5 w-5 flex-none" />
              ) : (
                <ChevronRight className="mt-1 h-5 w-5 flex-none" />
              )}
            </button>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={percent} className="h-1.5 flex-1" />
              <span className="text-xs tabular-nums text-muted-foreground">
                {completed}/{objectiveGroups.length}
              </span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 space-y-4 border-t pt-4">
            {metadata?.description && (
              <p className="text-sm text-muted-foreground">
                {metadata.description}
              </p>
            )}
            {metadata?.notes && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                {metadata.notes}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRequestComplete}>
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Complete all
              </Button>
              <Button variant="outline" size="sm" onClick={onRequestReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset all
              </Button>
            </div>
            <div className="space-y-2">
              {chapter.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  expanded={expandedSteps.has(step.id)}
                  onToggle={() => onToggleStep(step.id)}
                  expandedItems={expandedItems}
                  onToggleItems={onToggleItems}
                  itemQueries={itemQueries}
                  onItemQueryChange={onItemQueryChange}
                  completedObjectives={completedObjectives}
                  onToggleObjective={onToggleObjective}
                  workingOnObjectives={workingOnObjectives}
                  onToggleWorkingOnObjective={onToggleWorkingOnObjective}
                  itemProgress={itemProgress}
                  onUpdateItemProgress={onUpdateItemProgress}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface StepCardProps {
  step: StorylineStep;
  expanded: boolean;
  onToggle: () => void;
  expandedItems: Set<string>;
  onToggleItems: (objectiveId: string) => void;
  itemQueries: Record<string, string>;
  onItemQueryChange: (objectiveId: string, value: string) => void;
  completedObjectives: Set<string>;
  onToggleObjective: (id: string, relatedObjectiveIds?: string[]) => void;
  workingOnObjectives: Set<string>;
  onToggleWorkingOnObjective?: (
    id: string,
    relatedObjectiveIds?: string[],
  ) => void;
  itemProgress: Record<string, number>;
  onUpdateItemProgress?: (
    key: string,
    count: number,
    relatedKeys?: string[],
  ) => void;
}

function StepCard({
  step,
  expanded,
  onToggle,
  expandedItems,
  onToggleItems,
  itemQueries,
  onItemQueryChange,
  completedObjectives,
  onToggleObjective,
  workingOnObjectives,
  onToggleWorkingOnObjective,
  itemProgress,
  onUpdateItemProgress,
}: StepCardProps) {
  const objectiveGroups = groupStorylineObjectives(step.objectives);
  const completed = objectiveGroups.filter((group) =>
    isStorylineObjectiveGroupCompleted(group, completedObjectives),
  ).length;
  const hasFailureOutcome = Boolean(step.failureOutcome?.entries.length);
  const title = getStorylineStepTitle(step, objectiveGroups);

  return (
    <article className="overflow-hidden rounded-lg border border-border/70 bg-background/35">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:py-3"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border bg-card text-[11px] font-semibold tabular-nums text-muted-foreground">
          {step.index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {step.trader && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] normal-case tracking-normal">
                {step.trader}
              </Badge>
            )}
            {step.map && <span>{step.map}</span>}
            {hasFailureOutcome && (
              <Badge
                variant="outline"
                className="h-5 border-destructive/30 px-1.5 text-[10px] normal-case tracking-normal text-destructive"
              >
                Branch outcome
              </Badge>
            )}
          </div>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {title}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              {completed}/{objectiveGroups.length} tasks
            </span>
            {step.requirements.length > 0 && (
              <span>{step.requirements.length} required</span>
            )}
            {step.delaySecondsMax > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {formatDuration(step.delaySecondsMax)} wait
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="mt-1 h-4 w-4 flex-none" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 flex-none" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t px-2.5 py-3 sm:px-3">
          {(step.minPlayerLevel > 0 || step.factionName) && (
            <div className="flex flex-wrap gap-1.5">
              {step.minPlayerLevel > 0 && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  Level {step.minPlayerLevel}
                </Badge>
              )}
              {step.factionName && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  {step.factionName}
                </Badge>
              )}
            </div>
          )}

          {step.requirements.length > 0 && (
            <RequirementSection requirements={step.requirements} />
          )}

          <div className="space-y-1.5">
            {objectiveGroups.map((group) => {
              const progressKeys = group.objectiveIds.map(
                getObjectiveProgressKey,
              );
              const canonicalProgressKey = getObjectiveProgressKey(
                group.canonicalObjectiveId,
              );
              const relatedProgressKeys = progressKeys.filter(
                (key) => key !== canonicalProgressKey,
              );
              const trackedCount = Math.max(
                0,
                ...progressKeys.map((key) => itemProgress[key] ?? 0),
              );
              return (
                <ObjectiveRow
                  key={group.id}
                  group={group}
                  completed={isStorylineObjectiveGroupCompleted(
                    group,
                    completedObjectives,
                  )}
                  partiallyCompleted={isStorylineObjectiveGroupPartiallyCompleted(
                    group,
                    completedObjectives,
                  )}
                  onToggle={() =>
                    onToggleObjective(
                      group.canonicalObjectiveId,
                      group.objectiveIds,
                    )
                  }
                  workingOn={isStorylineObjectiveGroupWorkingOn(
                    group,
                    workingOnObjectives,
                  )}
                  onToggleWorkingOn={
                    onToggleWorkingOnObjective
                      ? () =>
                          onToggleWorkingOnObjective(
                            group.canonicalObjectiveId,
                            group.objectiveIds,
                          )
                      : undefined
                  }
                  itemsExpanded={expandedItems.has(group.id)}
                  onToggleItems={() => onToggleItems(group.id)}
                  itemQuery={itemQueries[group.id] ?? ""}
                  onItemQueryChange={(value) =>
                    onItemQueryChange(group.id, value)
                  }
                  trackedCount={trackedCount}
                  onUpdateTrackedCount={
                    onUpdateItemProgress
                      ? (count) =>
                          onUpdateItemProgress(
                            canonicalProgressKey,
                            count,
                            relatedProgressKeys,
                          )
                      : undefined
                  }
                />
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {step.startRewards && (
              <RewardSection
                title="Start rewards"
                group={step.startRewards}
                icon={<Gift className="h-4 w-4" />}
              />
            )}
            {step.finishRewards && (
              <RewardSection
                title="Completion rewards"
                group={step.finishRewards}
                icon={<Trophy className="h-4 w-4" />}
              />
            )}
            {step.failureOutcome && (
              <RewardSection
                title="Failure outcome"
                group={step.failureOutcome}
                icon={<XCircle className="h-4 w-4" />}
                destructive
              />
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function RequirementSection({
  requirements,
}: {
  requirements: StorylineRequirement[];
}) {
  return (
    <div className="border-l-2 border-primary/25 py-0.5 pl-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Requires
      </p>
      <div className="mt-1 space-y-1">
        {requirements.map((requirement) => (
          <div key={requirement.id} className="flex items-start gap-1.5 text-xs">
            <ChevronRight className="mt-0.5 h-3 w-3 flex-none text-muted-foreground" />
            <div className="min-w-0">
              <span>{requirement.label}</span>
              {requirement.unresolved && requirement.targetId && (
                <span
                  className="ml-1 text-xs text-muted-foreground"
                  title={requirement.targetId}
                >
                  (API reference)
                </span>
              )}
              {requirement.items && requirement.items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {requirement.items.slice(0, 6).map((item) => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="h-5 px-1.5 text-[10px] font-normal"
                    >
                      {item.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ObjectiveRowProps {
  group: StorylineObjectiveGroup;
  completed: boolean;
  partiallyCompleted: boolean;
  onToggle: () => void;
  workingOn: boolean;
  onToggleWorkingOn?: () => void;
  itemsExpanded: boolean;
  onToggleItems: () => void;
  itemQuery: string;
  onItemQueryChange: (value: string) => void;
  trackedCount: number;
  onUpdateTrackedCount?: (count: number) => void;
}

function ObjectiveRow({
  group,
  completed,
  partiallyCompleted,
  onToggle,
  workingOn,
  onToggleWorkingOn,
  itemsExpanded,
  onToggleItems,
  itemQuery,
  onItemQueryChange,
  trackedCount,
  onUpdateTrackedCount,
}: ObjectiveRowProps) {
  const objective = group.primaryObjective;
  const targetCount = objective.count ?? 0;
  const canTrackCount =
    targetCount > 1 && TRACKABLE_ITEM_TYPES.has(objective.type);
  const clampedCount = Math.min(targetCount, Math.max(0, trackedCount));
  const allItems = objective.questItem
    ? [objective.questItem, ...objective.items]
    : objective.items;
  const query = itemQuery.trim().toLocaleLowerCase();
  const filteredItems = query
    ? allItems.filter((item) => item.name.toLocaleLowerCase().includes(query))
    : allItems;
  const showExpandableItems = allItems.length > 6;
  const optional = isStorylineObjectiveGroupOptional(group);
  const foundInRaid = group.objectives.some(
    (candidate) => candidate.foundInRaid,
  );
  const maps = Array.from(
    new Set(group.objectives.flatMap((candidate) => candidate.maps)),
  );
  const details = Array.from(
    new Set(group.objectives.flatMap((candidate) => candidate.details)),
  );
  const checkboxId = `storyline-objective-${group.id}`;

  return (
    <div
      className={`rounded-md border px-2.5 py-2.5 transition-colors ${
        completed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "bg-card/60"
      }`}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          id={checkboxId}
          checked={partiallyCompleted ? "indeterminate" : completed}
          onCheckedChange={onToggle}
          className="mt-0.5 h-4 w-4"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              variant="outline"
              className={`h-5 px-1.5 text-[10px] font-normal ${
                objective.type === "dialogue"
                  ? "border-sky-500/30 text-sky-600 dark:text-sky-400"
                  : ""
              }`}
            >
              {objective.type === "dialogue" && (
                <MessageSquareText className="mr-1 h-3 w-3" />
              )}
              {group.paired
                ? "Collect + hand over"
                : OBJECTIVE_TYPE_LABELS[objective.type] ?? objective.type}
            </Badge>
            {optional && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                Optional
              </Badge>
            )}
            {foundInRaid && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                Found in raid
              </Badge>
            )}
            {objective.count && objective.count > 1 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                ×{objective.count.toLocaleString()}
              </Badge>
            )}
          </div>
          <label
            htmlFor={checkboxId}
            className={`mt-1.5 block cursor-pointer text-sm font-medium leading-snug ${
              completed ? "text-muted-foreground line-through" : ""
            }`}
          >
            {objective.description}
          </label>

          {group.collectionObjective && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Collect first:</span>
              <span>{group.collectionObjective.description}</span>
              {group.collectionObjective.optional && (
                <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  Optional
                </span>
              )}
              {group.collectionObjective.foundInRaid && (
                <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                  FIR
                </span>
              )}
            </div>
          )}

          {(maps.length > 0 || details.length > 0) && (
            <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              {maps.map((mapName) => (
                <span key={mapName} className="rounded bg-muted px-1.5 py-0.5">
                  {mapName}
                </span>
              ))}
              {details.map((detail) => (
                <span key={detail} className="rounded bg-muted px-1.5 py-0.5">
                  {detail}
                </span>
              ))}
            </div>
          )}

          {canTrackCount && onUpdateTrackedCount && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
              <span className="text-[11px] text-muted-foreground">Progress</span>
              <div className="ml-auto flex items-center gap-1 tabular-nums">
                <button
                  type="button"
                  onClick={() => onUpdateTrackedCount(clampedCount - 1)}
                  disabled={clampedCount <= 0}
                  className="h-6 w-6 rounded border hover:bg-muted disabled:opacity-40"
                  aria-label={`Decrease progress for ${objective.description}`}
                >
                  <Minus className="mx-auto h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={targetCount}
                  value={clampedCount}
                  onChange={(event) =>
                    onUpdateTrackedCount(
                      Math.min(
                        targetCount,
                        Math.max(0, Number(event.target.value) || 0),
                      ),
                    )
                  }
                  className="h-6 w-20 rounded border bg-background px-1.5 text-center text-xs tabular-nums sm:w-24"
                  aria-label={`Progress for ${objective.description}`}
                />
                <span className="text-[11px] text-muted-foreground">
                  / {targetCount.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateTrackedCount(clampedCount + 1)}
                  disabled={clampedCount >= targetCount}
                  className="h-6 w-6 rounded border hover:bg-muted disabled:opacity-40"
                  aria-label={`Increase progress for ${objective.description}`}
                >
                  <Plus className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {allItems.length > 0 && (
            <div className="mt-2">
              {showExpandableItems && (
                <button
                  type="button"
                  onClick={onToggleItems}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
                  aria-expanded={itemsExpanded}
                >
                  {itemsExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {itemsExpanded ? "Hide" : "View"} {allItems.length} eligible items
                </button>
              )}
              {!showExpandableItems && (
                <div className="flex flex-wrap gap-1.5">
                  {allItems.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded border bg-background/40 px-1.5 py-1"
                    >
                      {item.iconLink ? (
                        <img
                          src={item.iconLink}
                          alt=""
                          className="h-6 w-6 flex-none object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-4 w-4 flex-none text-muted-foreground" />
                      )}
                      <span className="min-w-0 truncate text-[11px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showExpandableItems && itemsExpanded && (
                <div className="mt-2 rounded-lg border bg-background/50 p-2.5">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={itemQuery}
                      onChange={(event) => onItemQueryChange(event.target.value)}
                      placeholder={`Search ${allItems.length} items`}
                      className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs"
                    />
                  </div>
                  <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex min-w-0 items-center gap-2 rounded border bg-card/70 p-1.5"
                      >
                        {item.iconLink ? (
                          <img
                            src={item.iconLink}
                            alt=""
                            className="h-8 w-8 flex-none object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-6 w-6 flex-none text-muted-foreground" />
                        )}
                        <span className="min-w-0 truncate text-xs" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {filteredItems.length === 0 && (
                      <p className="col-span-full py-3 text-center text-xs text-muted-foreground">
                        No eligible items match “{itemQuery}”.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {onToggleWorkingOn && (
          <button
            type="button"
            onClick={onToggleWorkingOn}
            className={`rounded p-0.5 transition-colors ${
              workingOn
                ? "text-blue-500 hover:text-blue-600"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
            aria-label={workingOn ? "Stop tracking objective" : "Track objective"}
            title={workingOn ? "Stop tracking" : "Track in Current work"}
          >
            <Target className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function RewardSection({
  title,
  group,
  icon,
  destructive = false,
}: {
  title: string;
  group: StorylineRewardGroup;
  icon: React.ReactNode;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-md border ${
        destructive ? "border-destructive/25 bg-destructive/5" : "bg-muted/10"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center gap-1.5 px-2.5 text-left text-xs font-medium"
        aria-expanded={open}
      >
        {icon}
        <span className="flex-1">{title}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {group.entries.length}
        </Badge>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <div className="space-y-1 border-t p-2">
          {group.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 rounded border bg-background/50 px-2 py-1.5"
            >
              {entry.iconLink ? (
                <img
                  src={entry.iconLink}
                  alt=""
                  className="h-6 w-6 flex-none object-contain"
                  loading="lazy"
                />
              ) : entry.type === "experience" || entry.type === "standing" ? (
                <CircleDollarSign className="h-5 w-5 flex-none text-primary" />
              ) : (
                <Gift className="h-5 w-5 flex-none text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium">{entry.label}</p>
                {entry.description && (
                  <p className="text-[10px] text-muted-foreground">
                    {entry.description}
                  </p>
                )}
              </div>
              {entry.count !== undefined && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {entry.count > 0 ? "+" : ""}
                  {entry.count.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
