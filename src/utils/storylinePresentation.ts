import type {
  StorylineChapter,
  StorylineObjective,
  StorylineStep,
} from "@/types/storyline";

const COLLECTION_TYPES = new Set([
  "findItem",
  "haveItem",
  "findQuestItem",
  "haveQuestItem",
]);

const HANDOVER_TYPES = new Set(["giveItem", "giveQuestItem"]);

export interface StorylineObjectiveGroup {
  id: string;
  objectives: StorylineObjective[];
  objectiveIds: string[];
  primaryObjective: StorylineObjective;
  collectionObjective?: StorylineObjective;
  handoverObjective?: StorylineObjective;
  canonicalObjectiveId: string;
  paired: boolean;
}

const getObjectiveItemSignature = (
  objective: StorylineObjective,
): string | null => {
  const itemIds = objective.items.map((item) => `item:${item.id}`);
  if (objective.questItem) {
    itemIds.push(`quest-item:${objective.questItem.id}`);
  }
  if (itemIds.length === 0) return null;
  return `${objective.count ?? 1}::${itemIds.sort().join("|")}`;
};

const arePairTypes = (
  first: StorylineObjective,
  second: StorylineObjective,
): boolean =>
  (COLLECTION_TYPES.has(first.type) && HANDOVER_TYPES.has(second.type)) ||
  (HANDOVER_TYPES.has(first.type) && COLLECTION_TYPES.has(second.type));

export const groupStorylineObjectives = (
  objectives: StorylineObjective[],
): StorylineObjectiveGroup[] => {
  const consumed = new Set<string>();
  const groups: StorylineObjectiveGroup[] = [];

  objectives.forEach((objective, index) => {
    if (consumed.has(objective.id)) return;
    const signature = getObjectiveItemSignature(objective);
    const pair = signature
      ? objectives.find(
          (candidate, candidateIndex) =>
            candidateIndex !== index &&
            !consumed.has(candidate.id) &&
            arePairTypes(objective, candidate) &&
            getObjectiveItemSignature(candidate) === signature,
        )
      : undefined;

    if (!pair) {
      consumed.add(objective.id);
      groups.push({
        id: objective.id,
        objectives: [objective],
        objectiveIds: [objective.id],
        primaryObjective: objective,
        canonicalObjectiveId: objective.id,
        paired: false,
      });
      return;
    }

    const pairedObjectives = objectives.filter(
      (candidate) => candidate.id === objective.id || candidate.id === pair.id,
    );
    const collectionObjective = pairedObjectives.find((candidate) =>
      COLLECTION_TYPES.has(candidate.type),
    );
    const handoverObjective = pairedObjectives.find((candidate) =>
      HANDOVER_TYPES.has(candidate.type),
    );
    if (!collectionObjective || !handoverObjective) return;

    consumed.add(collectionObjective.id);
    consumed.add(handoverObjective.id);
    groups.push({
      id: `storyline-pair::${collectionObjective.id}::${handoverObjective.id}`,
      objectives: pairedObjectives,
      objectiveIds: pairedObjectives.map((candidate) => candidate.id),
      primaryObjective: handoverObjective,
      collectionObjective,
      handoverObjective,
      canonicalObjectiveId: handoverObjective.id,
      paired: true,
    });
  });

  return groups;
};

export const isStorylineObjectiveGroupOptional = (
  group: StorylineObjectiveGroup,
): boolean => group.objectives.every((objective) => objective.optional);

export const isStorylineObjectiveGroupCompleted = (
  group: StorylineObjectiveGroup,
  completedObjectives: Set<string>,
): boolean =>
  group.objectiveIds.every((objectiveId) =>
    completedObjectives.has(objectiveId),
  );

export const isStorylineObjectiveGroupPartiallyCompleted = (
  group: StorylineObjectiveGroup,
  completedObjectives: Set<string>,
): boolean => {
  const completedCount = group.objectiveIds.filter((objectiveId) =>
    completedObjectives.has(objectiveId),
  ).length;
  return completedCount > 0 && completedCount < group.objectiveIds.length;
};

export const isStorylineObjectiveGroupWorkingOn = (
  group: StorylineObjectiveGroup,
  workingOnObjectives: Set<string>,
): boolean =>
  group.objectiveIds.some((objectiveId) =>
    workingOnObjectives.has(objectiveId),
  );

export const getStorylineStepTitle = (
  step: StorylineStep,
  groups = groupStorylineObjectives(step.objectives),
): string => {
  const translatedName = step.name?.trim();
  if (translatedName) return translatedName;

  const requiredNonDialogue = groups.find(
    (group) =>
      !isStorylineObjectiveGroupOptional(group) &&
      group.primaryObjective.type !== "dialogue",
  );
  const required = groups.find(
    (group) => !isStorylineObjectiveGroupOptional(group),
  );
  return (
    requiredNonDialogue?.primaryObjective.description ||
    required?.primaryObjective.description ||
    groups[0]?.primaryObjective.description ||
    `Task ${step.index}`
  );
};

export const getStorylineDisplayProgress = (
  chapters: StorylineChapter[],
  completedObjectives: Set<string>,
): { total: number; completed: number } => {
  const groups = chapters.flatMap((chapter) =>
    chapter.steps.flatMap((step) => groupStorylineObjectives(step.objectives)),
  );
  return {
    total: groups.length,
    completed: groups.filter((group) =>
      isStorylineObjectiveGroupCompleted(group, completedObjectives),
    ).length,
  };
};
