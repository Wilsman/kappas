import { Task, TaskObjective } from "@/types";

const taskObjectiveKeysCache = new WeakMap<object, string[]>();

function normalizePart(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function serializeObjective(objective: TaskObjective): string {
  const maps = (objective.maps ?? [])
    .map((map) => normalizePart(map?.name))
    .filter(Boolean)
    .sort();
  const items = (objective.items ?? [])
    .map((item) => `${normalizePart(item.id)}|${normalizePart(item.name)}`)
    .sort();
  const playerLevel =
    typeof objective.playerLevel === "number" ? objective.playerLevel : "";
  const count = typeof objective.count === "number" ? objective.count : "";
  const foundInRaid = objective.foundInRaid ? "1" : "0";
  const description = normalizePart(objective.description);

  return [
    description,
    String(playerLevel),
    String(count),
    foundInRaid,
    maps.join(","),
    items.join(","),
  ].join("~");
}

function encodeKeyPart(value: string): string {
  return encodeURIComponent(value);
}

export function buildTaskObjectiveKeys(
  task: Pick<Task, "id" | "objectives">,
): string[] {
  const cacheKey = task as object;
  const cached = taskObjectiveKeysCache.get(cacheKey);
  if (cached) return cached;

  const seenPerSignature = new Map<string, number>();
  const keys = (task.objectives ?? []).map((objective) => {
    const signature = serializeObjective(objective);
    const seen = (seenPerSignature.get(signature) ?? 0) + 1;
    seenPerSignature.set(signature, seen);
    return `${task.id}::objective::${encodeKeyPart(signature)}::${seen}`;
  });

  taskObjectiveKeysCache.set(cacheKey, keys);
  return keys;
}

export function buildLegacyTaskObjectiveKey(
  taskId: string,
  objectiveIndex: number,
): string {
  return `${taskId}-${objectiveIndex}`;
}

export function buildTaskObjectiveItemProgressKey(
  objectiveKey: string,
  itemKey: string,
): string {
  return `${objectiveKey}::item::${encodeKeyPart(normalizePart(itemKey))}`;
}

export function buildLegacyTaskObjectiveItemProgressKey(
  taskId: string,
  objectiveIndex: number,
  itemKey: string,
): string {
  return `${taskId}::${objectiveIndex}::${itemKey}`;
}

export function isTaskObjectiveCompleted(
  completedTaskObjectives: Set<string>,
  objectiveKey: string,
  legacyObjectiveKey?: string,
): boolean {
  return (
    completedTaskObjectives.has(objectiveKey) ||
    (!!legacyObjectiveKey && completedTaskObjectives.has(legacyObjectiveKey))
  );
}

export function getTaskObjectiveItemProgress(
  taskObjectiveItemProgress: Record<string, number>,
  objectiveItemKey: string,
  legacyObjectiveItemKey?: string,
): number {
  const stableCount = taskObjectiveItemProgress[objectiveItemKey];
  if (typeof stableCount === "number") return stableCount;
  if (!legacyObjectiveItemKey) return 0;
  const legacyCount = taskObjectiveItemProgress[legacyObjectiveItemKey];
  return typeof legacyCount === "number" ? legacyCount : 0;
}
