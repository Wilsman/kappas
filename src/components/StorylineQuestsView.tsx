import {
  BookOpen,
  Package,
  Scroll,
  ChevronDown,
  ChevronRight,
  Map,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

import { STORYLINE_QUESTS } from "@/data/storylineQuests";

interface StorylineQuestsViewProps {
  completedObjectives: Set<string>;
  onToggleObjective: (id: string) => void;
  onNavigateToMap?: () => void;
}

export function StorylineQuestsView({
  completedObjectives,
  onToggleObjective,
  onNavigateToMap,
}: StorylineQuestsViewProps): JSX.Element {
  const [expandedQuests, setExpandedQuests] = useState<
    Record<string, { main: boolean; optional: boolean }>
  >({});

  const toggleSection = (questId: string, section: "main" | "optional") => {
    setExpandedQuests((prev) => ({
      ...prev,
      [questId]: {
        ...prev[questId],
        [section]: !prev[questId]?.[section],
      },
    }));
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
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {quest.name}
                    </h3>

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
      </div>
    </div>
  );
}
