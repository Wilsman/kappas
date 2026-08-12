import type {
  HideoutStation,
  HideoutStationLevel,
  HideoutStationLevelRequirement,
  HideoutStationSkillRequirement,
} from "@/types";

export interface HideoutProgressState {
  completedItems: Set<string>;
  itemQuantities: Record<string, number>;
  completedRequirements: Set<string>;
}

export interface HideoutLevelProgress {
  completed: number;
  total: number;
  isBuilt: boolean;
}

export type HideoutLevelProgressUpdate = HideoutProgressState;

const hasNamedRequirementItem = (
  item: { name?: unknown } | null | undefined,
): item is { name: string; iconLink?: string } =>
  typeof item?.name === "string" && item.name.trim().length > 0;

const buildRequirementKey = (kind: string, parts: Array<string | number>) =>
  `hideout-${kind}:${JSON.stringify(parts)}`;

export const getHideoutItemKey = (
  stationName: string,
  level: number,
  itemName: string,
) => `${stationName}-${level}-${itemName}`;

export const getHideoutSkillRequirementKey = (
  stationName: string,
  level: number,
  requirement: HideoutStationSkillRequirement,
) =>
  buildRequirementKey("skill", [
    stationName,
    level,
    requirement.skill.name,
    requirement.level,
  ]);

export const getHideoutStationRequirementKey = (
  stationName: string,
  level: number,
  requirement: HideoutStationLevelRequirement,
) =>
  buildRequirementKey("station", [
    stationName,
    level,
    requirement.station.id ?? requirement.station.name,
    requirement.level,
  ]);

export const getRequirementFreeLevelKey = (
  stationName: string,
  level: number,
) => buildRequirementKey("built", [stationName, level]);

const getTrackableItemRequirements = (level: HideoutStationLevel) =>
  level.itemRequirements.filter((requirement) =>
    hasNamedRequirementItem(requirement.item),
  );

export const isHideoutItemRequirementComplete = (
  stationName: string,
  level: number,
  itemName: string,
  requiredCount: number,
  state: HideoutProgressState,
) => {
  const itemKey = getHideoutItemKey(stationName, level, itemName);
  return (
    state.completedItems.has(itemKey) ||
    (state.itemQuantities[itemKey] ?? 0) >= requiredCount
  );
};

export const getHideoutLevelProgress = (
  stationName: string,
  level: HideoutStationLevel,
  state: HideoutProgressState,
): HideoutLevelProgress => {
  const itemRequirements = getTrackableItemRequirements(level);
  const realRequirementCount =
    itemRequirements.length +
    level.skillRequirements.length +
    level.stationLevelRequirements.length;

  if (realRequirementCount === 0) {
    const isBuilt = state.completedRequirements.has(
      getRequirementFreeLevelKey(stationName, level.level),
    );
    return { completed: isBuilt ? 1 : 0, total: 1, isBuilt };
  }

  const completedItems = itemRequirements.filter((requirement) =>
    isHideoutItemRequirementComplete(
      stationName,
      level.level,
      requirement.item.name,
      requirement.count,
      state,
    ),
  ).length;
  const completedSkills = level.skillRequirements.filter((requirement) =>
    state.completedRequirements.has(
      getHideoutSkillRequirementKey(stationName, level.level, requirement),
    ),
  ).length;
  const completedStations = level.stationLevelRequirements.filter(
    (requirement) =>
      state.completedRequirements.has(
        getHideoutStationRequirementKey(
          stationName,
          level.level,
          requirement,
        ),
      ),
  ).length;
  const completed = completedItems + completedSkills + completedStations;

  return {
    completed,
    total: realRequirementCount,
    isBuilt: completed === realRequirementCount,
  };
};

export const getHideoutStationProgress = (
  station: HideoutStation,
  state: HideoutProgressState,
) => {
  const builtLevels = station.levels.filter(
    (level) => getHideoutLevelProgress(station.name, level, state).isBuilt,
  ).length;
  return {
    builtLevels,
    totalLevels: station.levels.length,
    isBuilt:
      station.levels.length > 0 && builtLevels === station.levels.length,
  };
};

export const setHideoutLevelBuilt = (
  stationName: string,
  level: HideoutStationLevel,
  built: boolean,
  state: HideoutProgressState,
): HideoutLevelProgressUpdate => {
  const completedItems = new Set(state.completedItems);
  const itemQuantities = { ...state.itemQuantities };
  const completedRequirements = new Set(state.completedRequirements);
  const itemRequirements = getTrackableItemRequirements(level);

  itemRequirements.forEach((requirement) => {
    const itemKey = getHideoutItemKey(
      stationName,
      level.level,
      requirement.item.name,
    );
    if (built) {
      completedItems.add(itemKey);
      itemQuantities[itemKey] = requirement.count;
    } else {
      completedItems.delete(itemKey);
      delete itemQuantities[itemKey];
    }
  });

  level.skillRequirements.forEach((requirement) => {
    const requirementKey = getHideoutSkillRequirementKey(
      stationName,
      level.level,
      requirement,
    );
    if (built) completedRequirements.add(requirementKey);
    else completedRequirements.delete(requirementKey);
  });

  level.stationLevelRequirements.forEach((requirement) => {
    const requirementKey = getHideoutStationRequirementKey(
      stationName,
      level.level,
      requirement,
    );
    if (built) completedRequirements.add(requirementKey);
    else completedRequirements.delete(requirementKey);
  });

  const requirementFreeLevelKey = getRequirementFreeLevelKey(
    stationName,
    level.level,
  );
  if (
    itemRequirements.length === 0 &&
    level.skillRequirements.length === 0 &&
    level.stationLevelRequirements.length === 0 &&
    built
  ) {
    completedRequirements.add(requirementFreeLevelKey);
  } else {
    completedRequirements.delete(requirementFreeLevelKey);
  }

  return { completedItems, itemQuantities, completedRequirements };
};

const levelMatchesSearch = (level: HideoutStationLevel, term: string) =>
  level.itemRequirements.some(
    (requirement) =>
      hasNamedRequirementItem(requirement.item) &&
      requirement.item.name.toLowerCase().includes(term),
  ) ||
  level.skillRequirements.some((requirement) =>
    requirement.skill.name.toLowerCase().includes(term),
  ) ||
  level.stationLevelRequirements.some((requirement) =>
    requirement.station.name.toLowerCase().includes(term),
  );

export const filterHideoutStations = (
  stations: HideoutStation[],
  searchTerm: string,
  hideBuilt: boolean,
  state: HideoutProgressState,
): HideoutStation[] => {
  const term = searchTerm.trim().toLowerCase();

  return stations.flatMap((station) => {
    const stationMatches = !term || station.name.toLowerCase().includes(term);
    const levels = station.levels.filter((level) => {
      if (
        hideBuilt &&
        getHideoutLevelProgress(station.name, level, state).isBuilt
      ) {
        return false;
      }
      return stationMatches || levelMatchesSearch(level, term);
    });

    if (levels.length === 0) return [];
    return [{ ...station, levels }];
  });
};
