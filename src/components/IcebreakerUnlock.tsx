import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  LockKeyhole,
  Map as MapIcon,
  Minus,
  Package,
  Plus,
  Ship,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import type { StorylineChapter, StorylineItem } from "@/types/storyline";
import { taskStorage } from "@/utils/indexedDB";
import { TaskDetailsContent } from "@/components/TaskDetailsContent";

const BOREAS_URL = "https://escapefromtarkov.fandom.com/wiki/Boreas";

interface IcebreakerItemRequirement {
  id: string;
  name: string;
  count: number;
  note?: string;
}

interface IcebreakerStep {
  id: string;
  title: string;
  description?: string;
  items?: IcebreakerItemRequirement[];
}

interface IcebreakerSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  steps: IcebreakerStep[];
  result?: string;
}

interface IcebreakerUnlockProps {
  activeProfileId: string;
  tasks: Task[];
  storylineChapters: StorylineChapter[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleTask: (taskId: string) => void;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string | string[],
  ) => void;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
  ) => void;
}

const ICEBREAKER_SECTIONS: IcebreakerSection[] = [
  {
    id: "boreas-investigation",
    eyebrow: "Boreas",
    title: "Investigate the distress signal",
    description: "Start Boreas and identify what Paradigm Shipping was moving.",
    steps: [
      {
        id: "boreas-start",
        title: "Start Boreas",
        description:
          "Obtain a Paradigm Shipping poster or check the distress signal at Intelligence Center level 3.",
        items: [
          {
            id: "699f0b877c23862b4b0ee19c",
            name: "Paradigm Shipping poster",
            count: 1,
            note: "Only needed when starting Boreas without the radio signal",
          },
        ],
      },
      {
        id: "mechanic-distress-signal",
        title: "Ask Mechanic about the distress signal",
      },
      {
        id: "locate-woods-equipment",
        title: "Locate the equipment under the cellular tower on Woods",
      },
      {
        id: "repair-woods-equipment",
        title: "Repair the equipment with a Toolset",
        items: [
          {
            id: "590c2e1186f77425357b6124",
            name: "Toolset",
            count: 1,
          },
        ],
      },
      {
        id: "report-to-mechanic",
        title: "Report back to Mechanic",
      },
      {
        id: "obtain-paradigm-directive",
        title: "Obtain the Paradigm Shipping directive",
        description:
          "Find it in the warehouse at the northern Lighthouse freight yard.",
        items: [
          {
            id: "69bb4499957ebbdeb600393f",
            name: "Paradigm Shipping directive",
            count: 1,
          },
        ],
      },
      {
        id: "tell-mechanic-boreas",
        title: "Tell Mechanic about Boreas",
      },
    ],
  },
  {
    id: "transport-arrangements",
    eyebrow: "Boreas",
    title: "Arrange alternative transport",
    description:
      "Complete only the Prapor and BTR Driver branches that apply to your storyline choices.",
    steps: [
      {
        id: "arrange-prapor-transport",
        title: "Ask Prapor to arrange transport",
      },
      {
        id: "complete-prapor-branch",
        title: "Complete your applicable Prapor branch",
        description:
          "Case given: hand over AMG-10 fluid. Case kept: also hand over 3 FIR Military power filters. Falling Skies incomplete: eliminate 30 Reserve targets and launch a yellow flare at the Woods transit before handing over the fluid.",
        items: [
          {
            id: "699f09767852da66a7003061",
            name: "AMG-10 hydraulic fluid",
            count: 1,
          },
          {
            id: "5d0378d486f77420421a5ff4",
            name: "Military power filter",
            count: 3,
            note: "Only needed if you kept Prapor's Armored case",
          },
        ],
      },
      {
        id: "find-alternative-transport",
        title: "Find alternative transport to Icebreaker",
      },
      {
        id: "talk-btr-driver",
        title: "Talk to the BTR Driver",
      },
      {
        id: "complete-btr-transport-branch",
        title: "Complete your applicable BTR Driver branch",
        description:
          "The Price of Independence: return to the Hideout and BTR Driver. Choose Your Friends Wisely: hand over 200 rounds, obtain and burn Skier's reports, then eliminate 15 targets at smuggler territories. Neither: eliminate 10 targets at smuggler territories.",
        items: [
          {
            id: "5e023d34e8a400319a28ed44",
            name: "7.62x54mm R BT gzh",
            count: 200,
            note: "Only needed for the Choose Your Friends Wisely branch",
          },
        ],
      },
      {
        id: "tell-mechanic-transport-found",
        title: "Tell Mechanic that transport was found",
      },
    ],
  },
  {
    id: "shoreline-transit",
    eyebrow: "First access",
    title: "Use the Shoreline transit",
    description: "The smuggler hovercraft provides the first playable access.",
    steps: [
      {
        id: "board-shoreline-hovercraft",
        title: "Board the smuggler hovercraft on Shoreline",
      },
      {
        id: "arrive-icebreaker-first",
        title: "Arrive at Icebreaker",
      },
    ],
    result: "Icebreaker playable · Shoreline transit required",
  },
  {
    id: "sz1-door",
    eyebrow: "Icebreaker progression",
    title: "Reach the chained SZ-1 door",
    description:
      "Progress through the ship until the superstructure route is open.",
    steps: [
      {
        id: "check-surviving-crew",
        title: "Check if any crew members survived",
      },
      {
        id: "access-engine-room",
        title: "Access the engine room",
      },
      {
        id: "find-superstructure-route",
        title: "Find a way into the superstructure",
      },
      {
        id: "ask-mechanic-explosives",
        title: "Ask Mechanic about explosives",
      },
      {
        id: "ask-prapor-explosives",
        title: "Ask Prapor about explosives",
      },
      {
        id: "reach-damaged-door",
        title: "Reach the damaged door on the engine room roof",
      },
      {
        id: "break-door-chain",
        title: "Break the chain with the SZ-1 charge",
        items: [
          {
            id: "69a0174087a75d2cbd0842e8",
            name: "SZ-1 explosive charge",
            count: 1,
          },
        ],
      },
      {
        id: "enter-superstructure",
        title: "Enter the superstructure from the engine room roof",
      },
    ],
    result: "BTR Driver progression unlocked",
  },
  {
    id: "direct-map-access",
    eyebrow: "Map selection unlock",
    title: "Unlock Icebreaker in map selection",
    description:
      "Complete these four BTR Driver quests in order. Hangover is the final quest and unlocks Icebreaker in the location selection.",
    steps: [],
    result: "Unlocks Icebreaker in the location selection · 700,000₽ entry fee remains",
  },
];

const ICEBREAKER_TASK_NAMES = [
  "Stick to It",
  "Saving Private Roman",
  "A Bitter Victory",
  "Hangover",
];

const MANUAL_STEP_IDS = ICEBREAKER_SECTIONS.filter(
  (section) => section.id !== "direct-map-access",
).flatMap((section) => section.steps.map((step) => step.id));

function normalizeTaskName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function findIcebreakerTasks(tasks: Task[]) {
  return ICEBREAKER_TASK_NAMES.map((name) =>
    tasks.find(
      (candidate) =>
        normalizeTaskName(candidate.name) === normalizeTaskName(name),
    ),
  );
}

const ALL_STEP_IDS = MANUAL_STEP_IDS;

function buildApiItemLookup(
  tasks: Task[],
  storylineChapters: StorylineChapter[],
) {
  const itemsById = new Map<string, StorylineItem>();

  tasks.forEach((task) => {
    (task.objectives ?? []).forEach((objective) => {
      objective.items?.forEach((item) => {
        if (!item.id) return;
        itemsById.set(item.id, {
          id: item.id,
          name: item.name,
          iconLink: item.iconLink,
        });
      });
    });
  });

  storylineChapters.forEach((chapter) => {
    chapter.steps.forEach((step) => {
      step.requirements.forEach((requirement) => {
        requirement.items?.forEach((item) => itemsById.set(item.id, item));
      });
      step.objectives.forEach((objective) => {
        objective.items.forEach((item) => itemsById.set(item.id, item));
        if (objective.questItem) {
          itemsById.set(objective.questItem.id, objective.questItem);
        }
      });
    });
  });

  return itemsById;
}

function getItemProgressKey(stepId: string, itemId: string) {
  return `icebreaker::${stepId}::${itemId}`;
}

export function IcebreakerUnlock({
  activeProfileId,
  tasks,
  storylineChapters,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
}: IcebreakerUnlockProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const icebreakerTasks = useMemo(() => findIcebreakerTasks(tasks), [tasks]);
  const apiItemsById = useMemo(
    () => buildApiItemLookup(tasks, storylineChapters),
    [storylineChapters, tasks],
  );

  const loadProgress = useCallback(async () => {
    if (!activeProfileId) {
      setCompletedSteps(new Set());
      return;
    }

    try {
      taskStorage.setProfile(activeProfileId);
      await taskStorage.init();
      const preferences = await taskStorage.loadUserPreferences();
      setCompletedSteps(new Set(preferences.icebreakerProgress ?? []));
    } catch (error) {
      console.error("Icebreaker progress load error", error);
    }
  }, [activeProfileId]);

  useEffect(() => {
    void loadProgress();
    window.addEventListener("taskTracker:profileChanged", loadProgress);
    window.addEventListener("taskTracker:reset", loadProgress);
    return () => {
      window.removeEventListener("taskTracker:profileChanged", loadProgress);
      window.removeEventListener("taskTracker:reset", loadProgress);
    };
  }, [loadProgress]);

  const completedCount = useMemo(
    () =>
      ALL_STEP_IDS.filter((stepId) => completedSteps.has(stepId)).length +
      icebreakerTasks.filter(
        (task): task is Task => Boolean(task) && completedTasks.has(task.id),
      ).length,
    [completedTasks, completedSteps, icebreakerTasks],
  );

  function handleToggleStep(stepId: string) {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);

      if (activeProfileId) {
        void (async () => {
          try {
            taskStorage.setProfile(activeProfileId);
            await taskStorage.init();
            await taskStorage.saveUserPreferences({
              icebreakerProgress: Array.from(next),
            });
          } catch (error) {
            console.error("Icebreaker progress save error", error);
          }
        })();
      }

      return next;
    });
  }

  return (
    <TooltipProvider delayDuration={100}>
      <main className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 lg:px-10">
        <header className="border-b border-border pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                Two-stage access route
              </p>
              <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
                Icebreaker Unlock
              </h1>
            </div>
            <p className="font-mono text-sm text-amber-400">
              {completedCount} / {ALL_STEP_IDS.length + ICEBREAKER_TASK_NAMES.length}
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track Boreas, the Shoreline transit, and the BTR Driver progression.
          </p>
          <div className="mt-4 flex w-fit flex-wrap items-center gap-x-3 gap-y-1 border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-400">
            <span>Entry: <strong>700,000₽</strong></span>
            <span>Helicopter extraction: <strong>2,500€</strong> <span className="text-amber-400/70">(547,500₽)</span></span>
            <span className="font-bold">Total: 1,247,500₽</span>
          </div>
          <div className="mt-4 border-l-2 border-amber-500 bg-amber-500/[0.05] px-3 py-3 text-xs leading-5 text-muted-foreground">
            <p className="font-bold uppercase tracking-[0.14em] text-amber-400">
              Map-selection access
            </p>
            <p className="mt-1">
              Reach Icebreaker through the Shoreline transit first. To unlock
              it in the location selection, complete the BTR Driver chain:
              Stick to It → Saving Private Roman → A Bitter Victory → Hangover.
            </p>
          </div>
        </header>

        <div className="mt-6 border border-border bg-card/25">
          {ICEBREAKER_SECTIONS.map((section) =>
            section.id === "direct-map-access" ? (
              <BtrQuestChain
                key={section.id}
                section={section}
                tasks={icebreakerTasks}
                completedTasks={completedTasks}
                completedTaskObjectives={completedTaskObjectives}
                taskObjectiveItemProgress={taskObjectiveItemProgress}
                onToggleTask={onToggleTask}
                onToggleTaskObjective={onToggleTaskObjective}
                onUpdateTaskObjectiveItemProgress={
                  onUpdateTaskObjectiveItemProgress
                }
              />
            ) : (
              <UnlockSection
                key={section.id}
                section={section}
                completedSteps={completedSteps}
                apiItemsById={apiItemsById}
                taskObjectiveItemProgress={taskObjectiveItemProgress}
                onToggleStep={handleToggleStep}
                onUpdateItemProgress={onUpdateTaskObjectiveItemProgress}
              />
            ),
          )}
        </div>

        <footer className="mt-8 border-t border-border pt-4">
          <a
            href={BOREAS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Boreas reference
            <ExternalLink className="size-3" />
          </a>
        </footer>
      </div>
      </main>
    </TooltipProvider>
  );
}

function BtrQuestChain({
  section,
  tasks,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggleTask,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
}: {
  section: IcebreakerSection;
  tasks: Task[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleTask: (taskId: string) => void;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string | string[],
  ) => void;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
}) {
  const completedCount = tasks.filter(
    (task): task is Task => Boolean(task) && completedTasks.has(task.id),
  ).length;

  return (
    <Collapsible className="group border-b border-border last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:px-5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center border",
            completedCount === ICEBREAKER_TASK_NAMES.length
              ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {completedCount === ICEBREAKER_TASK_NAMES.length ? (
            <Check className="size-4" />
          ) : (
            <MapIcon className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {section.eyebrow}
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-foreground">
            {section.title}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-xs",
            completedCount === ICEBREAKER_TASK_NAMES.length
              ? "text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {completedCount}/{ICEBREAKER_TASK_NAMES.length}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-border bg-background/30 px-4 py-4 sm:px-5">
        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {section.description}
        </p>
        <ol className="space-y-2">
          {ICEBREAKER_TASK_NAMES.map((taskName, index) => {
            const task = tasks[index];
            if (!task) {
              return (
                <li
                  key={taskName}
                  className="border border-dashed border-border px-3 py-3 text-xs text-muted-foreground"
                >
                  <span className="mr-2 font-mono text-amber-400/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {taskName} data is not available for this game mode.
                </li>
              );
            }

            const isComplete = completedTasks.has(task.id);
            return (
              <li key={task.id} className="border border-border bg-card/35">
                <div className="flex items-center gap-3 px-3 py-3">
                  <Checkbox
                    checked={isComplete}
                    onCheckedChange={() => onToggleTask(task.id)}
                    aria-label={`Mark ${task.name} ${isComplete ? "incomplete" : "complete"}`}
                    className="size-5 shrink-0 rounded-full border-blue-500 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  />
                  <Collapsible
                    defaultOpen
                    className="group min-w-0 flex-1"
                  >
                    <CollapsibleTrigger className="flex w-full items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                      <span className="font-mono text-[10px] text-amber-400/70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-semibold text-foreground",
                            isComplete && "text-muted-foreground",
                          )}
                        >
                          {task.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {task.trader.name}
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <TaskDetailsContent
                        task={task}
                        completedTaskObjectives={completedTaskObjectives}
                        taskObjectiveItemProgress={taskObjectiveItemProgress}
                        onToggleTaskObjective={onToggleTaskObjective}
                        onUpdateTaskObjectiveItemProgress={
                          onUpdateTaskObjectiveItemProgress
                        }
                      />
                    </CollapsibleContent>
                  </Collapsible>
                  {task.wikiLink && (
                    <a
                      href={task.wikiLink}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${task.name} wiki reference`}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div
          className={cn(
            "mt-4 border px-3 py-3 text-xs font-bold uppercase tracking-[0.12em]",
            completedCount === ICEBREAKER_TASK_NAMES.length
              ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400"
              : "border-border bg-card/30 text-muted-foreground",
          )}
        >
          {section.result}
        </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function UnlockSection({
  section,
  completedSteps,
  apiItemsById,
  taskObjectiveItemProgress,
  onToggleStep,
  onUpdateItemProgress,
}: {
  section: IcebreakerSection;
  completedSteps: Set<string>;
  apiItemsById: Map<string, StorylineItem>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleStep: (stepId: string) => void;
  onUpdateItemProgress: (itemKey: string, count: number) => void;
}) {
  const completedCount = section.steps.filter((step) =>
    completedSteps.has(step.id),
  ).length;
  const isComplete = completedCount === section.steps.length;
  const Icon = section.id === "shoreline-transit" ? Ship : section.result ? MapIcon : LockKeyhole;

  return (
    <Collapsible className="group border-b border-border last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:px-5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center border",
            isComplete
              ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {isComplete ? <Check className="size-4" /> : <Icon className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {section.eyebrow}
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
            {section.title}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-xs",
            isComplete ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {completedCount}/{section.steps.length}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-border bg-background/30 px-4 py-4 sm:px-5">
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            {section.description}
          </p>
          <div className="space-y-2">
            {section.steps.map((step) => {
              const isStepComplete = completedSteps.has(step.id);
              const checkboxId = `icebreaker-${step.id}`;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "border border-border bg-card/35 px-3 py-3 transition-colors",
                    isStepComplete && "border-emerald-500/20 bg-emerald-500/[0.04]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={checkboxId}
                      checked={isStepComplete}
                      onCheckedChange={() => onToggleStep(step.id)}
                      className="mt-0.5"
                    />
                    <label htmlFor={checkboxId} className="min-w-0 cursor-pointer">
                      <span
                        className={cn(
                          "block text-sm font-medium text-foreground",
                          isStepComplete && "text-muted-foreground line-through",
                        )}
                      >
                        {step.title}
                      </span>
                      {step.description && (
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </span>
                      )}
                    </label>
                  </div>

                  {step.items && step.items.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border/70 pt-3 sm:ml-7">
                      {step.items.map((requirement) => {
                        const itemKey = getItemProgressKey(step.id, requirement.id);
                        return (
                          <ItemProgressRow
                            key={requirement.id}
                            requirement={requirement}
                            apiItem={apiItemsById.get(requirement.id)}
                            current={taskObjectiveItemProgress[itemKey] ?? 0}
                            onChange={(count) =>
                              onUpdateItemProgress(itemKey, count)
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {section.result && (
            <div
              className={cn(
                "mt-4 border px-3 py-3 text-xs font-bold uppercase tracking-[0.12em]",
                isComplete
                  ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400"
                  : "border-border bg-card/30 text-muted-foreground",
              )}
            >
              {section.result}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ItemProgressRow({
  requirement,
  apiItem,
  current,
  onChange,
}: {
  requirement: IcebreakerItemRequirement;
  apiItem?: StorylineItem;
  current: number;
  onChange: (count: number) => void;
}) {
  const count = Math.min(Math.max(0, current), requirement.count);
  const isComplete = count >= requirement.count;
  const iconLink =
    apiItem?.iconLink ||
    (requirement.id
      ? `https://assets.tarkov.dev/${requirement.id}-icon.webp`
      : undefined);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 border border-border/80 bg-background/35 p-2.5 sm:flex-row sm:items-center",
        isComplete && "border-emerald-500/20 bg-emerald-500/[0.03]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Tooltip>
          <TooltipTrigger className="flex size-10 shrink-0 items-center justify-center border border-border bg-black/20 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            {iconLink ? (
              <img
                src={iconLink}
                alt={requirement.name}
                loading="lazy"
                className="size-full object-contain"
              />
            ) : (
              <Package className="size-4 text-muted-foreground" />
            )}
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={8}
            className="border border-border bg-card p-0 text-card-foreground shadow-md"
          >
            <div className="flex max-w-40 flex-col items-center gap-2 p-2">
              {iconLink ? (
                <img
                  src={iconLink}
                  alt={requirement.name}
                  className="size-20 object-contain"
                />
              ) : (
                <Package className="size-20 text-muted-foreground" />
              )}
              <span className="text-center text-xs font-semibold text-foreground">
                {requirement.name}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-xs font-semibold text-foreground",
              isComplete && "text-muted-foreground",
            )}
          >
            {requirement.name}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {requirement.note ?? `${Math.max(0, requirement.count - count)} remaining`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count <= 0}
          aria-label={`Decrease ${requirement.name}`}
          className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-12 text-center font-mono text-xs text-foreground">
          {count}/{requirement.count}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(requirement.count, count + 1))}
          disabled={count >= requirement.count}
          aria-label={`Increase ${requirement.name}`}
          className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
