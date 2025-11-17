import {
  BookOpen,
  Package,
  Scroll,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface StorylineObjective {
  id: string;
  description: string;
  type: "main" | "optional";
  progress?: {
    current: number;
    required: number;
  };
  notes?: string;
}

interface StorylineRewards {
  description: string;
  items?: string[];
}

interface StorylineQuest {
  id: string;
  name: string;
  description: string;
  icon: string;
  notes?: string;
  objectives?: StorylineObjective[];
  rewards?: StorylineRewards;
}

const STORYLINE_QUESTS: StorylineQuest[] = [
  {
    id: "tour",
    name: "Tour",
    description:
      "Starting quest - automatically unlocked at the beginning of the storyline",
    icon: "/1.png",
    objectives: [
      // Objectives in chronological order (first to last)
      {
        id: "tour-main-1",
        type: "main",
        description: "Escape Ground Zero",
      },
      {
        id: "tour-main-2",
        type: "main",
        description: "Hand over the cash to Therapist",
        progress: { current: 0, required: 250000 },
      },
      {
        id: "tour-main-3",
        type: "main",
        description: "Talk to Therapist",
      },
      {
        id: "tour-main-4",
        type: "main",
        description: "Survive and extract from Interchange",
      },
      {
        id: "tour-main-5",
        type: "main",
        description: "Talk to Ragman",
      },
      {
        id: "tour-main-6",
        type: "main",
        description: "Tell Ragman what you found during the recon",
      },
      {
        id: "tour-main-7",
        type: "main",
        description: "Hand over any Building materials items to Skier",
        progress: { current: 0, required: 5 },
        notes: "Items must have the Found in Raid mark",
      },
      {
        id: "tour-main-8",
        type: "main",
        description: "Survive and extract from Customs",
      },
      {
        id: "tour-main-9",
        type: "main",
        description: "Talk to Skier",
      },
      {
        id: "tour-main-10",
        type: "main",
        description: "Hand over any weapon to Mechanic",
        progress: { current: 0, required: 2 },
        notes: "Items must have the Found in Raid mark",
      },
      {
        id: "tour-main-11",
        type: "main",
        description: "Survive and extract from Factory",
      },
      {
        id: "tour-main-12",
        type: "main",
        description: "Talk to Mechanic",
      },
      {
        id: "tour-main-13",
        type: "main",
        description: "Eliminate any target on Woods",
        progress: { current: 0, required: 3 },
      },
      {
        id: "tour-main-14",
        type: "main",
        description: "Survive and extract from Woods",
      },
      {
        id: "tour-main-15",
        type: "main",
        description: "Talk to Skier",
      },
      {
        id: "tour-main-16",
        type: "main",
        description: "Locate the entrance to the port Terminal",
        notes: "The only way to access the port should be through Shoreline",
      },
      {
        id: "tour-main-17",
        type: "main",
        description: "Find a way to contact the soldiers at the Terminal",
        notes:
          "There's bound to be a radio or some other comms device somewhere along that road to the Terminal",
      },
      {
        id: "tour-main-18",
        type: "main",
        description: "Use the intercom to contact the port garrison",
      },
      {
        id: "tour-main-19",
        type: "main",
        description: "Learn how to escape Tarkov",
        notes: "Some of the traders must at least know something",
      },
      {
        id: "tour-main-20",
        type: "main",
        description: "Hand over the cash to Mechanic",
        progress: { current: 0, required: 20000 },
      },
      {
        id: "tour-main-21",
        type: "main",
        description: "Survive and extract from Shoreline",
      },
      {
        id: "tour-main-22",
        type: "main",
        description: "Hand over the item to Prapor: PMC dogtag",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-main-23",
        type: "main",
        description: "Access the secret TerraGroup facility",
      },
      {
        id: "tour-opt-1",
        type: "optional",
        description: "Find any weapon in raid",
        progress: { current: 0, required: 2 },
      },
      {
        id: "tour-opt-2",
        type: "optional",
        description:
          "Find any item in raid from the Building materials category",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-opt-3",
        type: "optional",
        description: "Collect the required amount in RUB",
        progress: { current: 0, required: 250000 },
      },
      {
        id: "tour-opt-4",
        type: "optional",
        description: "Locate the entrance to the facility on Factory",
        notes:
          "Polikhim #16 was bought out by TerraGroup, so it might be connected to their secret projects",
      },
      {
        id: "tour-opt-5",
        type: "optional",
        description: "Locate the entrance to the facility on Streets of Tarkov",
        notes:
          "If the facility is somewhere downtown, I can get inside through the emergency exits",
      },
      {
        id: "tour-opt-6",
        type: "optional",
        description: "Obtain a keycard or access codes to enter the facility",
        notes:
          "Entrances to the facility may be secured with a keycard or some kind of access code",
      },
      {
        id: "tour-opt-7",
        type: "optional",
        description: "Find the item in raid: PMC dogtag",
        progress: { current: 0, required: 5 },
      },
      {
        id: "tour-opt-8",
        type: "optional",
        description: "Collect the required amount in USD",
        progress: { current: 0, required: 20000 },
      },
    ],
    rewards: {
      description: "Access to Shoreline and buy equipment from Peacekeeper",
    },
  },
  {
    id: "falling-skies",
    name: "Falling Skies",
    description:
      "Best method: Keep doing Tour until completing Mechanic's quest, then go to the broken plane in Woods",
    notes:
      "⚠️ Known Issues:\n• Quest is rumored to be bugged\n• Some reports say standard accounts need 0.2 Prapor Reputation to progress\n• Quest actually requires 'Reach Prapor LVL 2' which may cause softlock for some players",
    icon: "/2.png",
  },
  {
    id: "batya",
    name: "Batya",
    description:
      "Visit Grenade Launcher OR Find BEAR Patch\n\nGrenade Launcher Locations:\n• Stronghold Customs\n• Shoreline near tank behind Sanatorium\n• Reserve Dome\n\nBEAR Patch Locations:\n• Woods: At the convoy below dead BEAR body\n• Customs: Radio Tower next to new gas station, up the hill in small cabin below pillow",
    icon: "/3.png",
  },
  {
    id: "the-unheard",
    name: "The Unheard",
    description: "Activated by picking up a Note on the table in streets",
    icon: "/4.png",
  },
  {
    id: "blue-fire",
    name: "Blue Fire",
    description:
      "Find flyer at any of these locations:\n• Woods med camp: Inside a GREEN container taped to a white drawer\n• Interchange: New area flyer\n• Interchange: Big Terragroup area behind old co-op extract, med tent/bunker",
    icon: "/5.png",
  },
  {
    id: "they-are-already-here",
    name: "They Are Already Here",
    description:
      "Complete any ONE of these:\n• Kill cultist\n• Loot dorms marked room\n• Get note next to cultist circle in abandoned village\n• Fisherman island on Shoreline where the green box is",
    icon: "/6.png",
  },
  {
    id: "accidental-witness",
    name: "Accidental Witness",
    description: "Check the car between customs dorm",
    icon: "/7.png",
  },
  {
    id: "the-labyrinth",
    name: "The Labyrinth",
    description:
      "Go into the access tunnel in Shoreline Resort Basement\n\nRequires: Knossos key\nSee: escapefromtarkov.fandom.com/wiki/Knossos_LLC_facility_key",
    icon: "/8.png",
  },
  {
    id: "the-ticket",
    name: "The Ticket",
    description: "Earned automatically after completing Falling Skies",
    icon: "/9.png",
  },
];

interface StorylineQuestsViewProps {
  completedObjectives: Set<string>;
  onToggleObjective: (id: string) => void;
}

export function StorylineQuestsView({
  completedObjectives,
  onToggleObjective,
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
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">1.0 Storyline Quests</h1>
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
