import { Task, TaskObjective } from "@/types";

const taskObjectiveKeysCache = new WeakMap<object, string[]>();
type FallbackKeys = string | string[] | undefined;

function normalizePart(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

const hasNamedItem = (
  item: { name?: unknown } | null | undefined,
): item is { id?: string; name: string } =>
  typeof item?.name === "string" && item.name.trim().length > 0;

function serializeObjective(objective: TaskObjective): string {
  const maps = (objective.maps ?? [])
    .map((map) => normalizePart(map?.name))
    .filter(Boolean)
    .sort();
  const items = (objective.items ?? [])
    .filter(hasNamedItem)
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

function buildContentTaskObjectiveKey(
  taskId: string,
  objective: TaskObjective,
  duplicateOrdinal: number,
): string {
  const signature = serializeObjective(objective);
  return `${taskId}::objective::${encodeKeyPart(signature)}::${duplicateOrdinal}`;
}

export function buildTaskObjectiveKeys(
  task: Pick<Task, "id" | "objectives">,
): string[] {
  const cacheKey = task as object;
  const cached = taskObjectiveKeysCache.get(cacheKey);
  if (cached) return cached;

  const seenPerSignature = new Map<string, number>();
  const seenPerId = new Map<string, number>();
  const keys = (task.objectives ?? []).map((objective) => {
    const signature = serializeObjective(objective);
    const seen = (seenPerSignature.get(signature) ?? 0) + 1;
    seenPerSignature.set(signature, seen);
    if (objective.id) {
      const idSeen = (seenPerId.get(objective.id) ?? 0) + 1;
      seenPerId.set(objective.id, idSeen);
      const suffix = idSeen > 1 ? `::${idSeen}` : "";
      return `${task.id}::objective-id::${encodeKeyPart(objective.id)}${suffix}`;
    }
    return buildContentTaskObjectiveKey(task.id, objective, seen);
  });

  taskObjectiveKeysCache.set(cacheKey, keys);
  return keys;
}

export function buildTaskObjectiveFallbackKeys(
  task: Pick<Task, "id" | "objectives">,
  objectiveIndex: number,
  primaryObjectiveKey?: string,
): string[] {
  const objective = task.objectives?.[objectiveIndex];
  const fallbacks = new Set<string>([
    buildLegacyTaskObjectiveKey(task.id, objectiveIndex),
  ]);

  if (objective) {
    const sameSignatureOrdinal =
      (task.objectives ?? [])
        .slice(0, objectiveIndex + 1)
        .filter((candidate) => serializeObjective(candidate) === serializeObjective(objective))
        .length || 1;
    fallbacks.add(
      buildContentTaskObjectiveKey(task.id, objective, sameSignatureOrdinal),
    );
  }

  if (primaryObjectiveKey) fallbacks.delete(primaryObjectiveKey);
  return Array.from(fallbacks);
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

export function buildTaskObjectiveProgressKey(objectiveKey: string): string {
  return `${objectiveKey}::progress`;
}

export function buildLegacyTaskObjectiveItemProgressKey(
  taskId: string,
  objectiveIndex: number,
  itemKey: string,
): string {
  return `${taskId}::${objectiveIndex}::${itemKey}`;
}

export function buildLegacyTaskObjectiveProgressKey(
  taskId: string,
  objectiveIndex: number,
): string {
  return `${taskId}::${objectiveIndex}::progress`;
}

export function isTaskObjectiveCompleted(
  completedTaskObjectives: Set<string>,
  objectiveKey: string,
  legacyObjectiveKey?: FallbackKeys,
): boolean {
  const fallbackKeys = Array.isArray(legacyObjectiveKey)
    ? legacyObjectiveKey
    : legacyObjectiveKey
      ? [legacyObjectiveKey]
      : [];
  return (
    completedTaskObjectives.has(objectiveKey) ||
    fallbackKeys.some((key) => completedTaskObjectives.has(key))
  );
}

export function getTaskObjectiveItemProgress(
  taskObjectiveItemProgress: Record<string, number>,
  objectiveItemKey: string,
  legacyObjectiveItemKey?: FallbackKeys,
): number {
  const stableCount = taskObjectiveItemProgress[objectiveItemKey];
  if (typeof stableCount === "number") return stableCount;
  const fallbackKeys = Array.isArray(legacyObjectiveItemKey)
    ? legacyObjectiveItemKey
    : legacyObjectiveItemKey
      ? [legacyObjectiveItemKey]
      : [];
  for (const fallbackKey of fallbackKeys) {
    const legacyCount = taskObjectiveItemProgress[fallbackKey];
    if (typeof legacyCount === "number") return legacyCount;
  }
  return 0;
}

export function getTaskObjectiveProgress(
  taskObjectiveItemProgress: Record<string, number>,
  objectiveProgressKey: string,
  legacyObjectiveProgressKey?: FallbackKeys,
): number {
  return getTaskObjectiveItemProgress(
    taskObjectiveItemProgress,
    objectiveProgressKey,
    legacyObjectiveProgressKey,
  );
}

export function formatTaskObjectiveLabel(
  objective: Pick<TaskObjective, "description" | "playerLevel" | "count" | "items">,
): string {
  const baseLabel =
    typeof objective.playerLevel === "number"
      ? `Reach level ${objective.playerLevel}`
      : (objective.description ?? "").trim();
  const hasInlineSellAnyCount =
    typeof objective.count === "number" &&
    /\bsell any \d+ items? to\b/i.test(baseLabel);
  const shouldAppendCount =
    !hasInlineSellAnyCount &&
    !objective.items?.length &&
    typeof objective.count === "number" &&
    objective.count > 1;

  if (!shouldAppendCount) return baseLabel;
  if (!baseLabel) return `x${objective.count}`;
  return `${baseLabel} x${objective.count}`;
}
