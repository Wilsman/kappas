import type { HideoutStation, Task } from "@/types";
import {
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveKey,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  getTaskObjectiveItemProgress,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";

type TrackedItemSourceType = "task" | "hideout";

const MAX_DIRECT_ITEM_OPTIONS = 12;

export interface TrackedItemSource {
  id: string;
  itemName: string;
  sourceType: TrackedItemSourceType;
  sourceName: string;
  sourceDetail: string;
  taskMinPlayerLevel?: number;
  taskPrerequisiteDepth?: number;
  hideoutLevel?: number;
  objectiveDescription?: string;
  requiredCount: number;
  currentCount: number;
  remainingCount: number;
  foundInRaid: boolean;
  actionable: boolean;
  isAlternative: boolean;
  iconLink?: string;
  objectiveItemKey?: string;
  legacyObjectiveItemKey?: string;
  objectiveProgressTargets?: Array<{
    objectiveItemKey: string;
    legacyObjectiveItemKey?: string;
  }>;
  hideoutItemKey?: string;
}

export interface TrackedItem {
  itemKey: string;
  itemName: string;
  iconLink?: string;
  totalRequired: number;
  totalCurrent: number;
  totalRemaining: number;
  minTaskLevel?: number;
  minTaskPrerequisiteDepth?: number;
  minHideoutLevel?: number;
  taskSourceCount: number;
  hideoutSourceCount: number;
  foundInRaidRequired: number;
  actionableSourceCount: number;
  hasAlternativeSources: boolean;
  sources: TrackedItemSource[];
}

export interface BuildTrackedItemsOptions {
  tasks: Task[];
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  hideoutStations: HideoutStation[];
  completedHideoutItems: Set<string>;
  hideoutItemQuantities: Record<string, number>;
  playerLevel: number;
}

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const buildItemGroupKey = (itemName: string) => normalizeText(itemName);

const classifyTaskItemObjective = (description?: string) => {
  const normalized = normalizeText(description ?? "");
  if (!normalized) return "other" as const;
  if (
    normalized.startsWith("hand over") ||
    normalized.startsWith("turn in") ||
    normalized.startsWith("give ")
  ) {
    return "handover" as const;
  }
  if (
    normalized.startsWith("find ") ||
    normalized.startsWith("collect ") ||
    normalized.startsWith("obtain ")
  ) {
    return "acquire" as const;
  }
  return "other" as const;
};

const shouldSkipTaskItemObjective = (description?: string) => {
  const normalized = normalizeText(description ?? "");
  return normalized.startsWith("sell any items");
};

const normalizeTaskMinPlayerLevel = (level?: number) =>
  level != null && level > 0 ? level : undefined;

const minDefinedNumber = (left?: number, right?: number) => {
  if (left == null) return right;
  if (right == null) return left;
  return Math.min(left, right);
};

const buildTaskSourceDedupKey = (source: TrackedItemSource) =>
  source.sourceType !== "task"
    ? null
    : [
        source.sourceName,
        source.sourceDetail,
        source.itemName,
        normalizeText(source.objectiveDescription ?? ""),
        source.requiredCount,
        source.foundInRaid ? "fir" : "non-fir",
        source.isAlternative ? "alt" : "direct",
      ].join("::");

const mergeObjectiveProgressTargets = (
  left?: TrackedItemSource["objectiveProgressTargets"],
  right?: TrackedItemSource["objectiveProgressTargets"],
) => {
  const merged = [...(left ?? []), ...(right ?? [])];
  const seen = new Set<string>();

  return merged.filter((target) => {
    const key = `${target.objectiveItemKey}::${target.legacyObjectiveItemKey ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const buildTaskPrerequisiteDepthMap = (tasks: Task[]) => {
  const tasksById = new Map(tasks.map((task) => [task.id, task] as const));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const getDepth = (taskId: string): number => {
    if (memo.has(taskId)) {
      return memo.get(taskId) ?? 0;
    }
    if (visiting.has(taskId)) {
      return 0;
    }

    visiting.add(taskId);

    const task = tasksById.get(taskId);
    const depth =
      task?.taskRequirements?.length
        ? Math.max(
            ...task.taskRequirements.map((requirement) => {
              const requirementId = requirement.task?.id;
              if (!requirementId) return 1;
              return getDepth(requirementId) + 1;
            }),
          )
        : 0;

    visiting.delete(taskId);
    memo.set(taskId, depth);
    return depth;
  };

  tasks.forEach((task) => {
    getDepth(task.id);
  });

  return memo;
};

const isTaskActionable = (
  task: Task,
  completedTasks: Set<string>,
  playerLevel: number,
) =>
  task.minPlayerLevel <= playerLevel &&
  task.taskRequirements.every((requirement) =>
    completedTasks.has(requirement.task.id),
  );

const isHideoutItemComplete = (
  itemKey: string,
  requiredCount: number,
  completedHideoutItems: Set<string>,
  hideoutItemQuantities: Record<string, number>,
) =>
  completedHideoutItems.has(itemKey) ||
  (hideoutItemQuantities[itemKey] ?? 0) >= requiredCount;

const getHideoutProgressCount = (
  itemKey: string,
  requiredCount: number,
  completedHideoutItems: Set<string>,
  hideoutItemQuantities: Record<string, number>,
) => {
  if (completedHideoutItems.has(itemKey)) {
    return requiredCount;
  }
  return Math.min(requiredCount, hideoutItemQuantities[itemKey] ?? 0);
};

const getHighestCompletedHideoutLevels = (
  hideoutStations: HideoutStation[],
  completedHideoutItems: Set<string>,
  hideoutItemQuantities: Record<string, number>,
) => {
  const highestCompletedLevelByStation = new Map<string, number>();

  hideoutStations.forEach((station) => {
    const sortedLevels = [...station.levels].sort((a, b) => a.level - b.level);
    let highestCompletedLevel = 0;

    for (const level of sortedLevels) {
      const isLevelComplete = level.itemRequirements.every((requirement) =>
        isHideoutItemComplete(
          `${station.name}-${level.level}-${requirement.item.name}`,
          requirement.count,
          completedHideoutItems,
          hideoutItemQuantities,
        ),
      );

      if (!isLevelComplete) {
        break;
      }

      highestCompletedLevel = level.level;
    }

    highestCompletedLevelByStation.set(station.name, highestCompletedLevel);
  });

  return highestCompletedLevelByStation;
};

const getFirstIncompleteHideoutLevels = (
  hideoutStations: HideoutStation[],
  completedHideoutItems: Set<string>,
  hideoutItemQuantities: Record<string, number>,
) => {
  const firstIncompleteLevelByStation = new Map<string, number | null>();

  hideoutStations.forEach((station) => {
    const sortedLevels = [...station.levels].sort((a, b) => a.level - b.level);
    const firstIncompleteLevel =
      sortedLevels.find((level) =>
        level.itemRequirements.some(
          (requirement) =>
            !isHideoutItemComplete(
              `${station.name}-${level.level}-${requirement.item.name}`,
              requirement.count,
              completedHideoutItems,
              hideoutItemQuantities,
            ),
        ),
      )?.level ?? null;

    firstIncompleteLevelByStation.set(station.name, firstIncompleteLevel);
  });

  return firstIncompleteLevelByStation;
};

export function buildTrackedItems({
  tasks,
  completedTasks,
  completedTaskObjectives,
  taskObjectiveItemProgress,
  hideoutStations,
  completedHideoutItems,
  hideoutItemQuantities,
  playerLevel,
}: BuildTrackedItemsOptions): TrackedItem[] {
  const itemsByKey = new Map<string, TrackedItem>();
  const taskPrerequisiteDepthById = buildTaskPrerequisiteDepthMap(tasks);

  const addSource = (
    itemName: string,
    iconLink: string | undefined,
    source: TrackedItemSource,
  ) => {
    const itemKey = buildItemGroupKey(itemName);
    const existing = itemsByKey.get(itemKey);

    if (existing) {
      const taskSourceDedupKey = buildTaskSourceDedupKey(source);
      if (taskSourceDedupKey) {
        const duplicateIndex = existing.sources.findIndex(
          (candidate) => buildTaskSourceDedupKey(candidate) === taskSourceDedupKey,
        );

        if (duplicateIndex >= 0) {
          const previousSource = existing.sources[duplicateIndex];
          const mergedCurrentCount = Math.max(
            previousSource.currentCount,
            source.currentCount,
          );
          const mergedRequiredCount = Math.max(
            previousSource.requiredCount,
            source.requiredCount,
          );
          const mergedRemainingCount = Math.max(
            0,
            mergedRequiredCount - mergedCurrentCount,
          );
          const mergedTargets = mergeObjectiveProgressTargets(
            previousSource.objectiveProgressTargets,
            source.objectiveProgressTargets,
          );
          const mergedSource: TrackedItemSource = {
            ...previousSource,
            currentCount: mergedCurrentCount,
            requiredCount: mergedRequiredCount,
            remainingCount: mergedRemainingCount,
            actionable: previousSource.actionable || source.actionable,
            isAlternative: previousSource.isAlternative || source.isAlternative,
            taskMinPlayerLevel: minDefinedNumber(
              previousSource.taskMinPlayerLevel,
              source.taskMinPlayerLevel,
            ),
            taskPrerequisiteDepth: minDefinedNumber(
              previousSource.taskPrerequisiteDepth,
              source.taskPrerequisiteDepth,
            ),
            objectiveProgressTargets: mergedTargets,
            objectiveItemKey:
              previousSource.objectiveItemKey ?? source.objectiveItemKey,
            legacyObjectiveItemKey:
              previousSource.legacyObjectiveItemKey ??
              source.legacyObjectiveItemKey,
          };

          existing.sources[duplicateIndex] = mergedSource;
          existing.totalCurrent += mergedCurrentCount - previousSource.currentCount;
          existing.totalRemaining +=
            mergedRemainingCount - previousSource.remainingCount;
          existing.minTaskLevel = minDefinedNumber(
            existing.minTaskLevel,
            mergedSource.taskMinPlayerLevel,
          );
          existing.minTaskPrerequisiteDepth = minDefinedNumber(
            existing.minTaskPrerequisiteDepth,
            mergedSource.taskPrerequisiteDepth,
          );
          if (!previousSource.actionable && mergedSource.actionable) {
            existing.actionableSourceCount += 1;
          }
          if (!existing.iconLink && iconLink) {
            existing.iconLink = iconLink;
          }
          return;
        }
      }

      existing.totalRequired += source.requiredCount;
      existing.totalCurrent += source.currentCount;
      existing.totalRemaining += source.remainingCount;
      existing.minTaskLevel = minDefinedNumber(
        existing.minTaskLevel,
        source.taskMinPlayerLevel,
      );
      existing.minTaskPrerequisiteDepth = minDefinedNumber(
        existing.minTaskPrerequisiteDepth,
        source.taskPrerequisiteDepth,
      );
      existing.minHideoutLevel = minDefinedNumber(
        existing.minHideoutLevel,
        source.hideoutLevel,
      );
      existing.taskSourceCount += source.sourceType === "task" ? 1 : 0;
      existing.hideoutSourceCount += source.sourceType === "hideout" ? 1 : 0;
      existing.foundInRaidRequired += source.foundInRaid ? source.requiredCount : 0;
      existing.actionableSourceCount += source.actionable ? 1 : 0;
      existing.hasAlternativeSources =
        existing.hasAlternativeSources || source.isAlternative;
      existing.sources.push(source);

      if (!existing.iconLink && iconLink) {
        existing.iconLink = iconLink;
      }
      return;
    }

    itemsByKey.set(itemKey, {
      itemKey,
      itemName,
      iconLink,
      totalRequired: source.requiredCount,
      totalCurrent: source.currentCount,
      totalRemaining: source.remainingCount,
      minTaskLevel: source.taskMinPlayerLevel,
      minTaskPrerequisiteDepth: source.taskPrerequisiteDepth,
      minHideoutLevel: source.hideoutLevel,
      taskSourceCount: source.sourceType === "task" ? 1 : 0,
      hideoutSourceCount: source.sourceType === "hideout" ? 1 : 0,
      foundInRaidRequired: source.foundInRaid ? source.requiredCount : 0,
      actionableSourceCount: source.actionable ? 1 : 0,
      hasAlternativeSources: source.isAlternative,
      sources: [source],
    });
  };

  tasks.forEach((task) => {
    if (completedTasks.has(task.id)) {
      return;
    }

    const actionable = isTaskActionable(task, completedTasks, playerLevel);
    const taskPrerequisiteDepth = taskPrerequisiteDepthById.get(task.id) ?? 0;
    const objectiveKeys = buildTaskObjectiveKeys(task);

    const taskItemSources: TrackedItemSource[] = [];

    (task.objectives ?? []).forEach((objective, index) => {
      if (!objective.items?.length) {
        return;
      }
      if (shouldSkipTaskItemObjective(objective.description)) {
        return;
      }
      if (objective.items.length > MAX_DIRECT_ITEM_OPTIONS) {
        return;
      }

      const requiredCount = Math.max(1, objective.count ?? 1);
      const objectiveKey =
        objectiveKeys[index] ?? buildLegacyTaskObjectiveKey(task.id, index);
      const legacyObjectiveKey = buildLegacyTaskObjectiveKey(task.id, index);
      const objectiveCompleted = isTaskObjectiveCompleted(
        completedTaskObjectives,
        objectiveKey,
        legacyObjectiveKey,
      );
      const usesSharedPool =
        objective.items.length > 1 && requiredCount > 1;

      const pooledCounts = objective.items.map((item) => {
        const sourceItemKey = item.id || item.name;
        return getTaskObjectiveItemProgress(
          taskObjectiveItemProgress,
          buildTaskObjectiveItemProgressKey(objectiveKey, sourceItemKey),
          buildLegacyTaskObjectiveItemProgressKey(task.id, index, sourceItemKey),
        );
      });
      const totalPooledCount = Math.min(
        requiredCount,
        pooledCounts.reduce((sum, count) => sum + count, 0),
      );

      objective.items.forEach((item) => {
        const sourceItemKey = item.id || item.name;
        const objectiveItemKey = buildTaskObjectiveItemProgressKey(
          objectiveKey,
          sourceItemKey,
        );
        const legacyObjectiveItemKey = buildLegacyTaskObjectiveItemProgressKey(
          task.id,
          index,
          sourceItemKey,
        );
        const persistedCount = getTaskObjectiveItemProgress(
          taskObjectiveItemProgress,
          objectiveItemKey,
          legacyObjectiveItemKey,
        );
        const currentCount = objectiveCompleted && !usesSharedPool
          ? requiredCount
          : Math.min(requiredCount, persistedCount);
        const maxCountForItem = usesSharedPool
          ? Math.max(
              currentCount,
              requiredCount - (totalPooledCount - currentCount),
            )
          : requiredCount;
        const remainingCount = Math.max(0, maxCountForItem - currentCount);

        taskItemSources.push({
          id: `task::${task.id}::${objectiveKey}::${sourceItemKey}`,
          itemName: item.name,
          sourceType: "task",
          sourceName: task.name,
          sourceDetail: task.trader.name,
          taskMinPlayerLevel: normalizeTaskMinPlayerLevel(task.minPlayerLevel),
          taskPrerequisiteDepth,
          objectiveDescription: objective.description,
          requiredCount: maxCountForItem,
          currentCount,
          remainingCount,
          foundInRaid: Boolean(objective.foundInRaid),
          actionable,
          isAlternative: usesSharedPool,
          iconLink: item.iconLink,
          objectiveItemKey,
          legacyObjectiveItemKey,
          objectiveProgressTargets: [
            {
              objectiveItemKey,
              legacyObjectiveItemKey,
            },
          ],
        });
      });
    });

    const groupedTaskSources = new Map<string, TrackedItemSource[]>();
    taskItemSources.forEach((source) => {
      const taskMergeKey = [
        source.sourceName,
        source.itemName,
        source.requiredCount,
        source.foundInRaid ? "fir" : "non-fir",
        source.isAlternative ? "alt" : "direct",
      ].join("::");
      const existing = groupedTaskSources.get(taskMergeKey) ?? [];
      existing.push(source);
      groupedTaskSources.set(taskMergeKey, existing);
    });

    groupedTaskSources.forEach((sources) => {
      if (sources.length === 2 && sources.every((source) => !source.isAlternative)) {
        const [first, second] = sources;
        const firstKind = classifyTaskItemObjective(first.objectiveDescription);
        const secondKind = classifyTaskItemObjective(second.objectiveDescription);
        const canMergeFindAndHandOver =
          new Set([firstKind, secondKind]).size === 2 &&
          [firstKind, secondKind].includes("acquire") &&
          [firstKind, secondKind].includes("handover");

        if (canMergeFindAndHandOver) {
          const mergedCurrentCount = Math.max(
            first.currentCount,
            second.currentCount,
          );
          const mergedTargets = [
            ...(first.objectiveProgressTargets ?? []),
            ...(second.objectiveProgressTargets ?? []),
          ];

          addSource(first.itemName, first.iconLink, {
            ...first,
            id: `${first.id}::merged-find-hand-over`,
            objectiveDescription: "Find and hand over",
            currentCount: mergedCurrentCount,
            remainingCount: Math.max(0, first.requiredCount - mergedCurrentCount),
            objectiveProgressTargets: mergedTargets,
            objectiveItemKey: mergedTargets[0]?.objectiveItemKey,
            legacyObjectiveItemKey: mergedTargets[0]?.legacyObjectiveItemKey,
          });
          return;
        }
      }

      sources.forEach((source) => {
        addSource(source.itemName, source.iconLink, source);
      });
    });
  });

  const highestCompletedLevelByStation = getHighestCompletedHideoutLevels(
    hideoutStations,
    completedHideoutItems,
    hideoutItemQuantities,
  );
  const firstIncompleteLevelByStation = getFirstIncompleteHideoutLevels(
    hideoutStations,
    completedHideoutItems,
    hideoutItemQuantities,
  );

  hideoutStations.forEach((station) => {
    station.levels.forEach((level) => {
      const itemKeys = level.itemRequirements.map(
        (requirement) => `${station.name}-${level.level}-${requirement.item.name}`,
      );
      const levelComplete =
        itemKeys.length > 0 &&
        itemKeys.every((itemKey, index) =>
          isHideoutItemComplete(
            itemKey,
            level.itemRequirements[index].count,
            completedHideoutItems,
            hideoutItemQuantities,
          ),
        );

      const stationRequirementsMet = level.stationLevelRequirements.every(
        (requirement) =>
          (highestCompletedLevelByStation.get(requirement.station.name) ?? 0) >=
          requirement.level,
      );
      const actionable =
        !levelComplete &&
        firstIncompleteLevelByStation.get(station.name) === level.level &&
        stationRequirementsMet;

      level.itemRequirements.forEach((requirement) => {
        const hideoutItemKey = `${station.name}-${level.level}-${requirement.item.name}`;
        const currentCount = getHideoutProgressCount(
          hideoutItemKey,
          requirement.count,
          completedHideoutItems,
          hideoutItemQuantities,
        );

        addSource(requirement.item.name, requirement.item.iconLink, {
          id: `hideout::${station.name}::${level.level}::${requirement.item.name}`,
          itemName: requirement.item.name,
          sourceType: "hideout",
          sourceName: station.name,
          sourceDetail: `Level ${level.level}`,
          hideoutLevel: level.level,
          requiredCount: requirement.count,
          currentCount,
          remainingCount: Math.max(0, requirement.count - currentCount),
          foundInRaid: false,
          actionable,
          isAlternative: false,
          iconLink: requirement.item.iconLink,
          hideoutItemKey,
        });
      });
    });
  });

  return [...itemsByKey.values()]
    .map((item) => ({
      ...item,
      sources: [...item.sources].sort((left, right) => {
        if (left.sourceType !== right.sourceType) {
          return left.sourceType === "task" ? -1 : 1;
        }
        if (left.sourceType === "task" && right.sourceType === "task") {
          const leftLevel = left.taskMinPlayerLevel ?? Number.POSITIVE_INFINITY;
          const rightLevel = right.taskMinPlayerLevel ?? Number.POSITIVE_INFINITY;
          if (leftLevel !== rightLevel) {
            return leftLevel - rightLevel;
          }
          const leftDepth = left.taskPrerequisiteDepth ?? Number.POSITIVE_INFINITY;
          const rightDepth = right.taskPrerequisiteDepth ?? Number.POSITIVE_INFINITY;
          if (leftDepth !== rightDepth) {
            return leftDepth - rightDepth;
          }
        }
        if (left.sourceType === "hideout" && right.sourceType === "hideout") {
          const leftLevel = left.hideoutLevel ?? Number.POSITIVE_INFINITY;
          const rightLevel = right.hideoutLevel ?? Number.POSITIVE_INFINITY;
          if (leftLevel !== rightLevel) {
            return leftLevel - rightLevel;
          }
        }
        if (left.actionable !== right.actionable) {
          return left.actionable ? -1 : 1;
        }
        if (left.foundInRaid !== right.foundInRaid) {
          return left.foundInRaid ? -1 : 1;
        }
        if (left.remainingCount !== right.remainingCount) {
          return right.remainingCount - left.remainingCount;
        }
        return left.sourceName.localeCompare(right.sourceName);
      }),
    }));
}
