import type {
  HideoutStation,
  Prestige,
  PrestigeCondition,
  Task,
} from "@/types";
import type { GameMode } from "@/utils/gameMode";
import {
  getHideoutLevelProgress,
  type HideoutProgressState,
} from "@/utils/hideoutProgress";
import { taskStorage } from "@/utils/indexedDB";
import {
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveKeys,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";

export const PRESTIGE_UPDATED_EVENT = "prestige:updated";

/** Storage id for the per-profile prestige state record. */
export const PRESTIGE_STATE_ID = "prestige-state";
export const ROUBLES_ITEM_ID = "5449016a4bdc2d6f028b456f";
export const MAX_PRESTIGE_LEVEL = 6;

/** Values the tracker cannot derive, plus the prestige already reached. */
export interface PrestigeState {
  /** Number of prestiges already completed (0 = never prestiged). */
  currentLevel: number;
  roubles: number;
  /** Skill levels keyed by untranslated skill id (e.g. "Strength"). */
  skills: Record<string, number>;
}

export const EMPTY_PRESTIGE_STATE: PrestigeState = {
  currentLevel: 0,
  roubles: 0,
  skills: {},
};

const clampLevel = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(MAX_PRESTIGE_LEVEL, Math.max(0, Math.floor(value)))
    : 0;

const nonNegative = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

export function normalizePrestigeState(raw: unknown): PrestigeState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PRESTIGE_STATE };
  const record = raw as Partial<PrestigeState>;
  const skills: Record<string, number> = {};
  if (record.skills && typeof record.skills === "object") {
    Object.entries(record.skills).forEach(([key, value]) => {
      const level = nonNegative(value);
      if (level > 0) skills[key] = level;
    });
  }
  return {
    currentLevel: clampLevel(record.currentLevel),
    roubles: nonNegative(record.roubles),
    skills,
  };
}

/** Shape of the hand-entered records saved before prestiges came from the API. */
interface LegacyPrestigeSaved {
  strength?: number;
  endurance?: number;
  charisma?: number;
  hideout?: { roubles?: number };
}

/**
 * Carries roubles and skills over from the old per-prestige records. The
 * highest-numbered record with any value wins, since it reflects the
 * player's latest progress.
 */
export function migrateLegacyPrestigeState(
  legacyByLevel: Record<number, unknown>,
): PrestigeState {
  const levels = Object.keys(legacyByLevel)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  for (const level of levels) {
    const saved = legacyByLevel[level] as LegacyPrestigeSaved | null;
    if (!saved || typeof saved !== "object") continue;
    const skills: Record<string, number> = {};
    const strength = nonNegative(saved.strength);
    const endurance = nonNegative(saved.endurance);
    const charisma = nonNegative(saved.charisma);
    if (strength > 0) skills.Strength = strength;
    if (endurance > 0) skills.Endurance = endurance;
    if (charisma > 0) skills.Charisma = charisma;
    const roubles = nonNegative(saved.hideout?.roubles);
    if (roubles > 0 || Object.keys(skills).length > 0) {
      return { currentLevel: 0, roubles, skills };
    }
  }
  return { ...EMPTY_PRESTIGE_STATE };
}

export async function loadPrestigeState(): Promise<PrestigeState> {
  const saved = await taskStorage.loadPrestigeProgress(PRESTIGE_STATE_ID);
  if (saved) return normalizePrestigeState(saved);

  const legacyByLevel: Record<number, unknown> = {};
  for (let level = 1; level <= MAX_PRESTIGE_LEVEL; level++) {
    const legacy = await taskStorage.loadPrestigeProgress(`prestige-${level}`);
    if (legacy) legacyByLevel[level] = legacy;
  }
  const migrated = migrateLegacyPrestigeState(legacyByLevel);
  if (Object.keys(legacyByLevel).length > 0) {
    await taskStorage.savePrestigeProgress(PRESTIGE_STATE_ID, migrated);
  }
  return migrated;
}

export async function savePrestigeState(state: PrestigeState): Promise<void> {
  await taskStorage.savePrestigeProgress(
    PRESTIGE_STATE_ID,
    normalizePrestigeState(state),
  );
}

export interface PrestigeTrackerState {
  playerLevel: number;
  completedTasks: ReadonlySet<string>;
  completedTaskObjectives: Set<string>;
  tasksById: ReadonlyMap<string, Task>;
  hideoutStations: HideoutStation[];
  hideout: HideoutProgressState;
  manual: PrestigeState;
}

export type PrestigeRequirementLink =
  | { type: "task"; taskId: string; taskName: string }
  | { type: "hideout"; stationName: string };

export interface PrestigeRequirementStatus {
  condition: PrestigeCondition;
  label: string;
  /** What to do next, written for the player. */
  help: string;
  current: number;
  target: number;
  done: boolean;
  /** 0-1 progress toward the target. */
  progress: number;
  /** Manual rows need the player to type their value in. */
  source: "auto" | "manual";
  link?: PrestigeRequirementLink;
}

export interface PrestigeProgress {
  prestige: Prestige;
  requirements: PrestigeRequirementStatus[];
  completed: number;
  total: number;
  ready: boolean;
}

const formatNumber = (value: number) => value.toLocaleString("en-US");

export const formatRoubles = (value: number) => `₽${formatNumber(value)}`;

const ratio = (current: number, target: number) =>
  target <= 0 ? 1 : Math.min(1, Math.max(0, current / target));

const getBuiltStationLevel = (
  station: HideoutStation | undefined,
  hideout: HideoutProgressState,
) => {
  if (!station) return 0;
  let built = 0;
  for (const level of [...station.levels].sort((a, b) => a.level - b.level)) {
    if (!getHideoutLevelProgress(station.name, level, hideout).isBuilt) break;
    built = level.level;
  }
  return built;
};

const getTaskObjectiveCounts = (
  task: Task,
  completedTaskObjectives: Set<string>,
) => {
  const objectives = task.objectives ?? [];
  const keys = buildTaskObjectiveKeys(task);
  const required = objectives
    .map((objective, index) => ({ objective, index }))
    .filter(({ objective }) => !objective.optional);
  const done = required.filter(({ index }) =>
    isTaskObjectiveCompleted(
      completedTaskObjectives,
      keys[index],
      buildTaskObjectiveFallbackKeys(task, index, keys[index]),
    ),
  ).length;
  return { done, total: required.length };
};

function describeTaskHelp(
  task: Task | undefined,
  taskName: string,
  state: PrestigeTrackerState,
  objectiveCounts: { done: number; total: number },
): string {
  if (!task) {
    return `Complete "${taskName}". It isn't in this mode's task list, so mark it once you've handed it in.`;
  }
  const blockers = task.taskRequirements
    .filter((requirement) => !state.completedTasks.has(requirement.task.id))
    .map((requirement) => requirement.task.name);
  if (blockers.length > 0) {
    return `Unlock it first by finishing ${blockers
      .map((name) => `"${name}"`)
      .join(", ")}.`;
  }
  if (task.minPlayerLevel > state.playerLevel) {
    return `Unlocks at level ${task.minPlayerLevel} from ${task.trader.name}.`;
  }
  if (objectiveCounts.total > 0 && objectiveCounts.done < objectiveCounts.total) {
    const left = objectiveCounts.total - objectiveCounts.done;
    return `Available from ${task.trader.name}. ${left} objective${
      left === 1 ? "" : "s"
    } left. Tick them off below, then hand it in.`;
  }
  return `Available from ${task.trader.name}. Hand it in and mark it complete.`;
}

export function evaluatePrestigeRequirement(
  condition: PrestigeCondition,
  state: PrestigeTrackerState,
): PrestigeRequirementStatus {
  switch (condition.type) {
    case "playerLevel": {
      const current = state.playerLevel;
      const done = current >= condition.level;
      return {
        condition,
        label: `Reach PMC level ${condition.level}`,
        help: done
          ? `You're level ${current}.`
          : `You're level ${current}. ${condition.level - current} more to go. Keep your level in the header up to date.`,
        current,
        target: condition.level,
        done,
        progress: ratio(current, condition.level),
        source: "auto",
      };
    }
    case "taskStatus": {
      const task = state.tasksById.get(condition.taskId);
      const taskName = task?.name ?? condition.taskName;
      const done = state.completedTasks.has(condition.taskId);
      const counts = task
        ? getTaskObjectiveCounts(task, state.completedTaskObjectives)
        : { done: 0, total: 0 };
      return {
        condition,
        label: `Complete "${taskName}"`,
        help: done
          ? "Task handed in."
          : describeTaskHelp(task, taskName, state, counts),
        current: done ? 1 : 0,
        target: 1,
        done,
        progress: done
          ? 1
          : counts.total > 0
            ? (counts.done / counts.total) * 0.99
            : 0,
        source: "auto",
        link: { type: "task", taskId: condition.taskId, taskName },
      };
    }
    case "hideoutStation": {
      const station = state.hideoutStations.find(
        (candidate) =>
          candidate.id === condition.stationId ||
          candidate.name === condition.stationName,
      );
      const stationName = station?.name ?? condition.stationName;
      const current = getBuiltStationLevel(station, state.hideout);
      const done = current >= condition.level;
      return {
        condition,
        label: `${stationName} level ${condition.level}`,
        help: done
          ? `Built (level ${current}).`
          : current === 0
            ? `Not built yet. Build ${stationName} up to level ${condition.level} in your Hideout.`
            : `Built to level ${current}. Upgrade it to level ${condition.level}.`,
        current,
        target: condition.level,
        done,
        progress: ratio(current, condition.level),
        source: "auto",
        link: { type: "hideout", stationName },
      };
    }
    case "skill": {
      const current = state.manual.skills[condition.skillId] ?? 0;
      const done = current >= condition.level;
      return {
        condition,
        label: `${condition.skillName} level ${condition.level}`,
        help: done
          ? "Skill target reached."
          : `Check Character > Skills in game and enter your ${condition.skillName} level.`,
        current,
        target: condition.level,
        done,
        progress: ratio(current, condition.level),
        source: "manual",
      };
    }
    case "haveItem": {
      const isRoubles = condition.itemId === ROUBLES_ITEM_ID;
      const current = isRoubles ? state.manual.roubles : 0;
      const done = current >= condition.count;
      return {
        condition,
        label: isRoubles
          ? `Have ${formatRoubles(condition.count)}`
          : `Have ${formatNumber(condition.count)}x ${condition.itemName}`,
        help: isRoubles
          ? done
            ? "Enough roubles in stash. They're spent when you prestige."
            : `Keep ${formatRoubles(condition.count)} in your stash. They're spent when you prestige. Enter your current balance.`
          : `Have ${formatNumber(condition.count)}x ${condition.itemName}${
              condition.foundInRaid ? " (found in raid)" : ""
            } in your stash.`,
        current,
        target: condition.count,
        done,
        progress: ratio(current, condition.count),
        source: "manual",
      };
    }
    default:
      return {
        condition,
        label: condition.description || "Additional requirement",
        help: "Check the in-game Prestige screen for details.",
        current: 0,
        target: 1,
        done: false,
        progress: 0,
        source: "manual",
      };
  }
}

const REQUIREMENT_ORDER: Record<PrestigeCondition["type"], number> = {
  playerLevel: 0,
  taskStatus: 1,
  hideoutStation: 2,
  skill: 3,
  haveItem: 4,
  other: 5,
};

export function evaluatePrestige(
  prestige: Prestige,
  state: PrestigeTrackerState,
): PrestigeProgress {
  const requirements = prestige.conditions
    .map((condition) => evaluatePrestigeRequirement(condition, state))
    .sort(
      (a, b) =>
        REQUIREMENT_ORDER[a.condition.type] -
        REQUIREMENT_ORDER[b.condition.type],
    );
  const completed = requirements.filter((requirement) => requirement.done)
    .length;
  return {
    prestige,
    requirements,
    completed,
    total: requirements.length,
    ready: requirements.length > 0 && completed === requirements.length,
  };
}

/** The prestige the player is working toward, or null once all are done. */
export function getNextPrestige(
  prestiges: Prestige[],
  currentLevel: number,
): Prestige | null {
  return (
    prestiges.find((prestige) => prestige.prestigeLevel === currentLevel + 1) ??
    null
  );
}

/** Short, mode-aware notes to show alongside a prestige. */
export function getPrestigeModeNotes(
  prestige: Prestige,
  gameMode: GameMode,
): string[] {
  const notes: string[] = [];
  const hasTask = prestige.conditions.some((c) => c.type === "taskStatus");
  const hasHideout = prestige.conditions.some(
    (c) => c.type === "hideoutStation",
  );
  if (gameMode === "pve") {
    if (!hasTask) notes.push("PvE: no prestige quest required.");
    if (!hasHideout) notes.push("PvE: no hideout requirements.");
  }
  return notes;
}

/** Maps each prestige id to its level, for gating tasks by requiredPrestigeId. */
export function buildPrestigeLevelById(
  prestiges: Prestige[],
): Map<string, number> {
  return new Map(prestiges.map((prestige) => [prestige.id, prestige.prestigeLevel]));
}

/**
 * Whether a task should be listed at the player's current prestige.
 * Tasks gated behind a higher prestige are hidden, as are quests that exist
 * only to unlock a prestige the player has already reached (e.g. the first
 * "New Beginning"). Tasks shared by several prestiges, like Collector, stay.
 */
export function createPrestigeTaskFilter(
  prestiges: Prestige[],
  currentLevel: number,
): (task: Pick<Task, "id" | "requiredPrestigeId">) => boolean {
  const levelById = buildPrestigeLevelById(prestiges);
  const prestigesByTaskId = new Map<string, number[]>();
  prestiges.forEach((prestige) => {
    prestige.conditions.forEach((condition) => {
      if (condition.type !== "taskStatus") return;
      const levels = prestigesByTaskId.get(condition.taskId) ?? [];
      levels.push(prestige.prestigeLevel);
      prestigesByTaskId.set(condition.taskId, levels);
    });
  });

  return (task) => {
    if (task.requiredPrestigeId) {
      const requiredLevel = levelById.get(task.requiredPrestigeId);
      if (requiredLevel !== undefined && requiredLevel > currentLevel) {
        return false;
      }
    }
    const unlocks = prestigesByTaskId.get(task.id);
    if (unlocks?.length === 1 && unlocks[0] <= currentLevel) return false;
    return true;
  };
}
