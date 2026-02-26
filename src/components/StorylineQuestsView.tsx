import {
  BookOpen,
  Package,
  Scroll,
  ChevronDown,
  ChevronRight,
  Map,
  AlertTriangle,
  CheckCheck,
  RotateCcw,
  Target,
  Minus,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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

import { STORYLINE_QUESTS, type StorylineObjective } from "@/data/storylineQuests";

type StorylineItemRequirement = NonNullable<StorylineObjective["itemRequirement"]>;

const STORYLINE_TRACKER_ICONS = {
  dogtags: "https://assets.tarkov.dev/6662e9aca7e0b43baa3d5f74-icon.webp",
  dollars: "https://assets.tarkov.dev/5696686a4bdc2da3298b456a-icon.webp",
  roubles: "https://assets.tarkov.dev/5449016a4bdc2d6f028b456f-icon.webp",
} as const;

const parseRequiredCount = (value: string): number => {
  const parsed = Number.parseInt(value.replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const cleanObjectiveItemName = (value: string): string => {
  return value
    .replace(/\(optional\)/gi, "")
    .replace(/\s+to\s+[A-Za-z'.-]+.*$/i, "")
    .replace(/\s+found in raid\s+/gi, " ")
    .replace(/\s+in raid\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};

const resolveDefaultIconLink = (itemName: string): string | undefined => {
  if (/\bdogtags?\b/i.test(itemName)) {
    return STORYLINE_TRACKER_ICONS.dogtags;
  }
  if (/\bdollars?\b/i.test(itemName)) {
    return STORYLINE_TRACKER_ICONS.dollars;
  }
  if (/\broubles?\b/i.test(itemName)) {
    return STORYLINE_TRACKER_ICONS.roubles;
  }
  return undefined;
};

const getObjectiveItemRequirement = (
  objective: StorylineObjective,
): StorylineItemRequirement | null => {
  if (objective.itemRequirement) {
    return {
      ...objective.itemRequirement,
      iconLink:
        objective.itemRequirement.iconLink ||
        resolveDefaultIconLink(objective.itemRequirement.itemName),
    };
  }

  const description = objective.description.trim();
  const foundInRaid = /\bfound in raid\b|\bin raid\b/i.test(description);

  const handOverCashMatch = description.match(
    /^Hand over\s+cash.*?([\d,]+)\$/i,
  );
  if (handOverCashMatch) {
    const requiredCount = parseRequiredCount(handOverCashMatch[1]);
    if (requiredCount > 0) {
      return {
        itemName: "Dollars",
        requiredCount,
        foundInRaid: false,
        iconLink: resolveDefaultIconLink("Dollars"),
      };
    }
  }

  const objectivePatterns: RegExp[] = [
    /^Hand over\s+(?:any\s+)?([\d,]+)\s+(.+)$/i,
    /^Collect\s+(?:the required\s+)?([\d,]+)\s+(.+)$/i,
    /^Find\s+(?:any\s+)?([\d,]+)\s+(.+)$/i,
    /^Obtain\s+([\d,]+)\s+(.+)$/i,
  ];

  for (const pattern of objectivePatterns) {
    const match = description.match(pattern);
    if (!match) continue;

    const requiredCount = parseRequiredCount(match[1]);
    const itemName = cleanObjectiveItemName(match[2]);

    if (requiredCount > 0 && itemName.length > 0) {
      return {
        itemName,
        requiredCount,
        foundInRaid,
        iconLink: resolveDefaultIconLink(itemName),
      };
    }
  }

  return null;
};

interface StorylineQuestsViewProps {
  completedObjectives: Set<string>;
  onToggleObjective: (id: string) => void;
  onSetCompletedObjectives: (objectives: Set<string>) => void;
  onNavigateToMap?: () => void;
  workingOnStorylineObjectives?: Set<string>;
  onToggleWorkingOnStorylineObjective?: (objectiveId: string) => void;
  taskObjectiveItemProgress?: Record<string, number>;
  onUpdateTaskObjectiveItemProgress?: (
    objectiveItemKey: string,
    count: number,
  ) => void;
}

export function StorylineQuestsView({
  completedObjectives,
  onToggleObjective,
  onSetCompletedObjectives,
  onNavigateToMap,
  workingOnStorylineObjectives = new Set(),
  onToggleWorkingOnStorylineObjective,
  taskObjectiveItemProgress = {},
  onUpdateTaskObjectiveItemProgress,
}: StorylineQuestsViewProps): JSX.Element {
  const [expandedQuests, setExpandedQuests] = useState<
    Record<string, { main: boolean; optional: boolean }>
  >({});
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    questId: string;
    questName: string;
    action: "complete" | "reset";
  }>({ isOpen: false, questId: "", questName: "", action: "complete" });

  const toggleSection = (questId: string, section: "main" | "optional") => {
    setExpandedQuests((prev) => ({
      ...prev,
      [questId]: {
        ...prev[questId],
        [section]: !prev[questId]?.[section],
      },
    }));
  };

  const handleCompleteAll = (questId: string) => {
    const quest = STORYLINE_QUESTS.find((q) => q.id === questId);
    if (quest?.objectives) {
      const newCompleted = new Set(completedObjectives);
      quest.objectives.forEach((objective) => {
        newCompleted.add(objective.id);
      });
      onSetCompletedObjectives(newCompleted);
    }
  };

  const handleResetAll = (questId: string) => {
    const quest = STORYLINE_QUESTS.find((q) => q.id === questId);
    if (quest?.objectives) {
      const newCompleted = new Set(completedObjectives);
      quest.objectives.forEach((objective) => {
        newCompleted.delete(objective.id);
      });
      onSetCompletedObjectives(newCompleted);
    }
  };

  const openDialog = (
    questId: string,
    questName: string,
    action: "complete" | "reset"
  ) => {
    setDialogState({ isOpen: true, questId, questName, action });
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      questId: "",
      questName: "",
      action: "complete",
    });
  };

  const handleDialogConfirm = () => {
    if (dialogState.action === "complete") {
      handleCompleteAll(dialogState.questId);
    } else {
      handleResetAll(dialogState.questId);
    }
    closeDialog();
  };

  // Calculate total objectives
  const totalObjectives = STORYLINE_QUESTS.reduce((sum, quest) => {
    return sum + (quest.objectives?.length || 0);
  }, 0);

  const completedCount = completedObjectives.size;
  const progressPercent =
    totalObjectives > 0
      ? Math.round((completedCount / totalObjectives) * 100)
      : 0;

  const getStorylineObjectiveItemKey = (
    objective: StorylineObjective,
    requirement: StorylineItemRequirement,
  ) => {
    const itemKey = requirement.itemId || requirement.itemName;
    return `storyline-objective::${objective.id}::${itemKey || "item"}`;
  };

  const handleStorylineObjectiveItemDelta = (
    objective: StorylineObjective,
    delta: number,
  ) => {
    const requirement = getObjectiveItemRequirement(objective);
    if (!requirement || !onUpdateTaskObjectiveItemProgress) {
      return;
    }
    const itemKey = getStorylineObjectiveItemKey(objective, requirement);
    const currentCount = taskObjectiveItemProgress[itemKey] ?? 0;
    const nextCount = Math.max(
      0,
      Math.min(
        requirement.requiredCount,
        currentCount + delta,
      ),
    );
    onUpdateTaskObjectiveItemProgress(itemKey, nextCount);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* WIP Warning Banner */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                Work in Progress
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                This section is still being developed. Quest data and objectives
                may be incomplete or inaccurate as the 1.0 storyline is still
                being documented by the community.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">1.0 Storyline Quests</h1>
            </div>
            {onNavigateToMap && (
              <Button variant="outline" onClick={onNavigateToMap}>
                <Map className="h-4 w-4 mr-2" />
                Decision Map
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Track your progress through the 1.0 storyline quest objectives
          </p>
          <Badge variant="outline" className="mt-2">
            <Package className="h-3 w-3 mr-1" />
            {completedCount}/{totalObjectives} Objectives ({progressPercent}%)
          </Badge>
        </div>

        {/* Quest Cards */}
        <div className="grid gap-4">
          {STORYLINE_QUESTS.map((quest) => {
            const mainObjectives =
              quest.objectives?.filter((obj) => obj.type === "main") || [];
            const optionalObjectives =
              quest.objectives?.filter((obj) => obj.type === "optional") || [];
            const isMainExpanded = expandedQuests[quest.id]?.main ?? true;
            const isOptionalExpanded =
              expandedQuests[quest.id]?.optional ?? false;

            return (
              <div
                key={quest.id}
                className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <img
                    src={quest.icon}
                    alt={quest.name}
                    className="w-16 h-16 flex-shrink-0 object-contain"
                    loading="lazy"
                  />

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {quest.name}
                      </h3>
                      {/* Bulk Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openDialog(quest.id, quest.name, "complete")
                          }
                          className="h-8 px-3 text-xs"
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Complete All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openDialog(quest.id, quest.name, "reset")
                          }
                          className="h-8 px-3 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset All
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {quest.description}
                    </div>

                    {/* Notes/Warnings */}
                    {quest.notes && (
                      <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 whitespace-pre-line">
                          {quest.notes}
                        </div>
                      </div>
                    )}

                    {/* Main Objectives */}
                    {mainObjectives.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => toggleSection(quest.id, "main")}
                          className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
                        >
                          {isMainExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Main Objectives ({mainObjectives.length})
                        </button>
                        {isMainExpanded && (
                          <div className="space-y-2 pl-6 border-l-2 border-green-500/30">
                            {mainObjectives.map((objective) => {
                              const isCompleted = completedObjectives.has(
                                objective.id
                              );
                              const requirement =
                                getObjectiveItemRequirement(objective);
                              const itemKey = requirement
                                ? getStorylineObjectiveItemKey(
                                    objective,
                                    requirement,
                                  )
                                : "";
                              const trackedCount =
                                requirement && itemKey
                                  ? taskObjectiveItemProgress[itemKey] ?? 0
                                  : 0;
                              const clampedTrackedCount = requirement
                                ? Math.max(
                                    0,
                                    Math.min(
                                      requirement.requiredCount,
                                      trackedCount,
                                    ),
                                  )
                                : 0;
                              const remainingCount = requirement
                                ? Math.max(
                                    0,
                                    requirement.requiredCount - clampedTrackedCount,
                                  )
                                : 0;
                              const isRequirementComplete = requirement
                                ? clampedTrackedCount >= requirement.requiredCount
                                : false;
                              return (
                                <div key={objective.id} className="space-y-1">
                                  <div className="flex items-start gap-2 text-sm">
                                    <Checkbox
                                      id={objective.id}
                                      checked={isCompleted}
                                      onCheckedChange={() =>
                                        onToggleObjective(objective.id)
                                      }
                                      className="mt-0.5"
                                    />
                                    {onToggleWorkingOnStorylineObjective && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onToggleWorkingOnStorylineObjective(objective.id);
                                        }}
                                        className={`p-0.5 rounded-sm transition-colors ${workingOnStorylineObjectives.has(objective.id) ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                                        title={workingOnStorylineObjectives.has(objective.id) ? "Remove from working on" : "Mark as working on"}
                                      >
                                        <Target
                                          className="h-4 w-4"
                                          fill={workingOnStorylineObjectives.has(objective.id) ? "currentColor" : "none"}
                                        />
                                      </button>
                                    )}
                                    <label
                                      htmlFor={objective.id}
                                      className={`flex-1 cursor-pointer ${
                                        isCompleted
                                          ? "line-through opacity-60"
                                          : ""
                                      }`}
                                    >
                                      {objective.description}
                                    </label>
                                  </div>
                                  {requirement && (
                                    <div className="ml-4">
                                      <div
                                        className={`flex items-center gap-2 rounded-md border bg-background/40 p-2 ${isRequirementComplete ? "opacity-60" : ""}`}
                                      >
                                        {requirement.iconLink ? (
                                          <img
                                            src={requirement.iconLink}
                                            alt={requirement.itemName}
                                            className="h-8 w-8 object-contain"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded bg-muted" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-medium text-foreground/90 truncate">
                                            {requirement.itemName}
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">
                                            {remainingCount === 0
                                              ? "Complete"
                                              : `${remainingCount} remaining`}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleStorylineObjectiveItemDelta(
                                                objective,
                                                -1,
                                              );
                                            }}
                                            className="h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={clampedTrackedCount <= 0}
                                            aria-label={`Decrease ${requirement.itemName}`}
                                          >
                                            <Minus className="h-3 w-3 mx-auto" />
                                          </button>
                                          <span className="w-12 text-center text-xs tabular-nums">
                                            {clampedTrackedCount}/
                                            {requirement.requiredCount}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleStorylineObjectiveItemDelta(
                                                objective,
                                                1,
                                              );
                                            }}
                                            className="h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={
                                              clampedTrackedCount >=
                                              requirement.requiredCount
                                            }
                                            aria-label={`Increase ${requirement.itemName}`}
                                          >
                                            <Plus className="h-3 w-3 mx-auto" />
                                          </button>
                                        </div>
                                      </div>
                                      {requirement.foundInRaid && (
                                        <div className="text-[11px] text-muted-foreground mt-1">
                                          Found in raid required
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {objective.progress && (
                                    <div className="flex items-center gap-2 ml-4">
                                      <Progress
                                        value={
                                          (objective.progress.current /
                                            objective.progress.required) *
                                          100
                                        }
                                        className="h-2 flex-1"
                                      />
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {objective.progress.current.toLocaleString()}
                                        /
                                        {objective.progress.required.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {objective.notes && (
                                    <div className="ml-4 text-xs text-muted-foreground italic">
                                      {objective.notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional Objectives */}
                    {optionalObjectives.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => toggleSection(quest.id, "optional")}
                          className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {isOptionalExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Optional Objectives ({optionalObjectives.length})
                        </button>
                        {isOptionalExpanded && (
                          <div className="space-y-2 pl-6 border-l-2 border-blue-500/30">
                            {optionalObjectives.map((objective) => {
                              const isCompleted = completedObjectives.has(
                                objective.id
                              );
                              const requirement =
                                getObjectiveItemRequirement(objective);
                              const itemKey = requirement
                                ? getStorylineObjectiveItemKey(
                                    objective,
                                    requirement,
                                  )
                                : "";
                              const trackedCount =
                                requirement && itemKey
                                  ? taskObjectiveItemProgress[itemKey] ?? 0
                                  : 0;
                              const clampedTrackedCount = requirement
                                ? Math.max(
                                    0,
                                    Math.min(
                                      requirement.requiredCount,
                                      trackedCount,
                                    ),
                                  )
                                : 0;
                              const remainingCount = requirement
                                ? Math.max(
                                    0,
                                    requirement.requiredCount - clampedTrackedCount,
                                  )
                                : 0;
                              const isRequirementComplete = requirement
                                ? clampedTrackedCount >= requirement.requiredCount
                                : false;
                              return (
                                <div key={objective.id} className="space-y-1">
                                  <div className="flex items-start gap-2 text-sm">
                                    <Checkbox
                                      id={objective.id}
                                      checked={isCompleted}
                                      onCheckedChange={() =>
                                        onToggleObjective(objective.id)
                                      }
                                      className="mt-0.5"
                                    />
                                    <label
                                      htmlFor={objective.id}
                                      className={`flex-1 cursor-pointer ${
                                        isCompleted
                                          ? "line-through opacity-60"
                                          : ""
                                      }`}
                                    >
                                      {objective.description}
                                    </label>
                                  </div>
                                  {requirement && (
                                    <div className="ml-4">
                                      <div
                                        className={`flex items-center gap-2 rounded-md border bg-background/40 p-2 ${isRequirementComplete ? "opacity-60" : ""}`}
                                      >
                                        {requirement.iconLink ? (
                                          <img
                                            src={requirement.iconLink}
                                            alt={requirement.itemName}
                                            className="h-8 w-8 object-contain"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="h-8 w-8 rounded bg-muted" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-medium text-foreground/90 truncate">
                                            {requirement.itemName}
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">
                                            {remainingCount === 0
                                              ? "Complete"
                                              : `${remainingCount} remaining`}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleStorylineObjectiveItemDelta(
                                                objective,
                                                -1,
                                              );
                                            }}
                                            className="h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={clampedTrackedCount <= 0}
                                            aria-label={`Decrease ${requirement.itemName}`}
                                          >
                                            <Minus className="h-3 w-3 mx-auto" />
                                          </button>
                                          <span className="w-12 text-center text-xs tabular-nums">
                                            {clampedTrackedCount}/
                                            {requirement.requiredCount}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleStorylineObjectiveItemDelta(
                                                objective,
                                                1,
                                              );
                                            }}
                                            className="h-6 w-6 rounded-md border bg-background hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={
                                              clampedTrackedCount >=
                                              requirement.requiredCount
                                            }
                                            aria-label={`Increase ${requirement.itemName}`}
                                          >
                                            <Plus className="h-3 w-3 mx-auto" />
                                          </button>
                                        </div>
                                      </div>
                                      {requirement.foundInRaid && (
                                        <div className="text-[11px] text-muted-foreground mt-1">
                                          Found in raid required
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {objective.progress && (
                                    <div className="flex items-center gap-2 ml-4">
                                      <Progress
                                        value={
                                          (objective.progress.current /
                                            objective.progress.required) *
                                          100
                                        }
                                        className="h-2 flex-1"
                                      />
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {objective.progress.current.toLocaleString()}
                                        /
                                        {objective.progress.required.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {objective.notes && (
                                    <div className="ml-4 text-xs text-muted-foreground italic">
                                      {objective.notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rewards */}
                    {quest.rewards && (
                      <div className="mt-4 rounded-md border border-purple-500/30 bg-purple-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                            💎 Rewards:
                          </span>
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            {quest.rewards.description}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="rounded-lg border bg-muted/50 p-4 mt-8">
          <div className="flex items-start gap-3">
            <Scroll className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Note:</p>
              <p>
                This is an informational page showing how to trigger each
                storyline quest. Full quest tracking, completion status, and
                progress integration will be added in a future update.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={dialogState.isOpen} onOpenChange={closeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.action === "complete"
                  ? `Complete All Objectives - ${dialogState.questName}`
                  : `Reset All Objectives - ${dialogState.questName}`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.action === "complete"
                  ? "This will mark all objectives (both main and optional) for this quest as complete. This action cannot be undone automatically."
                  : "This will reset all objectives (both main and optional) for this quest to incomplete. This action cannot be undone automatically."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDialogConfirm}
                className={
                  dialogState.action === "complete"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {dialogState.action === "complete"
                  ? "Complete All"
                  : "Reset All"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
