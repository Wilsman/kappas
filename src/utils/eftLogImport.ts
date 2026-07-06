import type { Task } from "@/types";
import {
  completeTaskWithDependencies,
  uncompleteTasks,
} from "@/utils/taskCompletion";
import type { GameMode } from "@/utils/gameMode";
import { getEquivalentTaskIds } from "@/utils/taskProgressView";

export type EftLogImportMatchStatus = "new" | "already-complete";
export type EftLogSessionGameMode = GameMode | "unknown";
export type EftLogSourceGameMode = GameMode;

export interface EftLogImportQuestMatch {
  taskId: string;
  taskName: string;
  traderName?: string;
  status: EftLogImportMatchStatus;
  sourceQuestId: string;
  equivalentTaskIds: string[];
}

export interface EftLogImportBackfillCandidate {
  taskId: string;
  taskName: string;
  traderName?: string;
}

export interface EftLogImportPatchVersionSummary {
  version: string;
  sessionCount: number;
  fileCount: number;
}

export interface EftLogImportConflict {
  questId: string;
  reason: "unmatched";
}

export interface EftLogImportScanSummary {
  selectedFolderName: string;
  sourceGameMode: EftLogSourceGameMode;
  scannedSessions: number;
  skippedModeSessions: number;
  scannedFiles: number;
  patchVersions: EftLogImportPatchVersionSummary[];
  selectedPatchVersions: string[];
  skippedEntries: string[];
  detectedQuestIds: string[];
  matches: EftLogImportQuestMatch[];
  conflicts: EftLogImportConflict[];
}

export interface EftLogImportApplyResult {
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  importedTaskIds: string[];
  autoCompletedTaskIds: string[];
}

export interface EftLogImportPlanParams {
  selectedFolderName: string;
  sourceGameMode?: EftLogSourceGameMode;
  scannedSessions: number;
  skippedModeSessions?: number;
  scannedFiles: number;
  patchVersions?: EftLogImportPatchVersionSummary[];
  selectedPatchVersions?: Iterable<string>;
  skippedEntries: string[];
  detectedQuestIds: Iterable<string>;
  tasks: Task[];
  knownTasksById: Map<string, Task>;
  completedTasks: Set<string>;
  logicalTaskIdsByTaskId: Map<string, Set<string>>;
}

export interface ApplyEftLogImportParams {
  matches: EftLogImportQuestMatch[];
  tasks: Task[];
  knownTasksById: Map<string, Task>;
  completedTasks: Set<string>;
  completedTaskObjectives: Set<string>;
  logicalTaskIdsByTaskId: Map<string, Set<string>>;
  excludedAutoCompleteTaskIds?: Iterable<string>;
}

const SESSION_FOLDER_PATTERN = /^log_\d{4}\.\d{2}\.\d{2}_/i;
const SESSION_PATCH_VERSION_PATTERN =
  /^log_\d{4}\.\d{2}\.\d{2}_[^_]+_(\d+(?:\.\d+)+)$/i;
const QUEST_LOG_FILE_PATTERN = /(backend|push-notifications).*\.log$/i;
const MODE_LOG_FILE_PATTERN =
  /(application|backend|output|push-notifications).*\.log$/i;
const QUEST_ID_PATTERN = /^[a-f0-9]{24}$/i;
const QUEST_SUCCESS_TEMPLATE_PATTERN =
  /\b([a-f0-9]{24})\s+successMessageText\b/gi;
const SESSION_MODE_PATTERN = /\bSession mode:\s*([A-Za-z]+)/gi;
const COMPLETED_STATUS_NUMBERS = new Set([3, 4]);
const COMPLETED_STATUS_WORDS = new Set([
  "availableforfinish",
  "available-for-finish",
  "available_for_finish",
  "completed",
  "complete",
  "success",
  "successful",
  "finished",
  "readytofinish",
  "ready-to-finish",
]);
const QUEST_ID_KEYS_BY_PRIORITY = [
  "qid",
  "questid",
  "templateid",
  "_id",
  "id",
];
const STATUS_KEYS = new Set(["status", "state", "queststatus"]);
const QUEST_COLLECTION_KEYS = new Set([
  "quests",
  "questitems",
  "questlist",
  "questdata",
]);
const COMPLETED_COLLECTION_KEYS = new Set([
  "completedquests",
  "completedquestids",
  "successquests",
  "finishedquests",
]);

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isQuestId(value: unknown): value is string {
  return typeof value === "string" && QUEST_ID_PATTERN.test(value);
}

function normalizeStatusValue(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function isCompletedStatus(value: unknown): boolean {
  const normalized = normalizeStatusValue(value);
  if (typeof normalized === "number") return COMPLETED_STATUS_NUMBERS.has(normalized);
  return normalized ? COMPLETED_STATUS_WORDS.has(normalized) : false;
}

function readQuestId(record: Record<string, unknown>): string | null {
  const entries = Object.entries(record).map(
    ([key, value]) => [normalizeKey(key), value] as const,
  );
  for (const targetKey of QUEST_ID_KEYS_BY_PRIORITY) {
    for (const [key, value] of entries) {
      if (key === targetKey && isQuestId(value)) return value;
    }
  }
  return null;
}

function readQuestStatus(record: Record<string, unknown>): unknown {
  for (const [key, value] of Object.entries(record)) {
    if (STATUS_KEYS.has(normalizeKey(key))) {
      return value;
    }
  }
  return undefined;
}

function collectQuestIdsFromCompletedCollection(
  value: unknown,
  questIds: Set<string>,
) {
  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (isQuestId(entry)) {
        questIds.add(entry);
        return;
      }
      if (isPlainRecord(entry)) {
        const questId = readQuestId(entry);
        if (questId) questIds.add(questId);
      }
    });
  }
}

function collectCompletedQuestIds(value: unknown, questIds: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectCompletedQuestIds(entry, questIds));
    return;
  }

  if (!isPlainRecord(value)) return;

  const questId = readQuestId(value);
  if (questId && isCompletedStatus(readQuestStatus(value))) {
    questIds.add(questId);
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (COMPLETED_COLLECTION_KEYS.has(normalizedKey)) {
      collectQuestIdsFromCompletedCollection(child, questIds);
      continue;
    }
    if (QUEST_COLLECTION_KEYS.has(normalizedKey) || typeof child === "object") {
      collectCompletedQuestIds(child, questIds);
    }
  }
}

function getJsonBounds(text: string, startIndex: number): [number, number] | null {
  const first = text[startIndex];
  if (first !== "{" && first !== "[") return null;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let index = startIndex; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      stack.push("}");
    } else if (char === "[") {
      stack.push("]");
    } else if (char === "}" || char === "]") {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return [startIndex, index + 1];
    }
  }

  return null;
}

function parseJsonAt(text: string, startIndex: number): {
  value: unknown;
  endIndex: number;
} | null {
  const bounds = getJsonBounds(text, startIndex);
  if (!bounds) return null;
  try {
    return {
      value: JSON.parse(text.slice(bounds[0], bounds[1])),
      endIndex: bounds[1],
    };
  } catch {
    return null;
  }
}

export function extractCompletedQuestIdsFromLogText(text: string): string[] {
  const questIds = new Set<string>();
  for (const match of text.matchAll(QUEST_SUCCESS_TEMPLATE_PATTERN)) {
    questIds.add(match[1]);
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char !== "{" && char !== "[") continue;
    const parsed = parseJsonAt(text, index);
    if (parsed !== null) {
      collectCompletedQuestIds(parsed.value, questIds);
      index = parsed.endIndex - 1;
    }
  }
  return Array.from(questIds).sort();
}

export function detectEftLogSessionGameMode(
  text: string,
): EftLogSessionGameMode {
  for (const match of text.matchAll(SESSION_MODE_PATTERN)) {
    const mode = match[1].trim().toLowerCase();
    if (mode === "pve") return "pve";
    if (["pvp", "regular", "normal"].includes(mode)) return "regular";
  }

  let hasPveEvidence = false;
  let hasRegularEvidence = false;
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const normalizedLine = line.toLowerCase();
    if (
      normalizedLine.includes("gw-pve.escapefromtarkov.com") ||
      normalizedLine.includes("wsn-pve-") ||
      normalizedLine.includes("vhost=pve")
    ) {
      hasPveEvidence = true;
    }

    if (
      normalizedLine.includes("wsn-pvp-") ||
      normalizedLine.includes("vhost=pvp")
    ) {
      hasRegularEvidence = true;
    }

    if (normalizedLine.includes("gw-pvp.escapefromtarkov.com")) {
      const isBootstrapModeRequest =
        normalizedLine.includes("/client/game/mode") ||
        normalizedLine.includes("/client/menu/locale");
      if (!isBootstrapModeRequest) hasRegularEvidence = true;
    }
  }

  if (hasPveEvidence) return "pve";
  if (hasRegularEvidence) return "regular";
  return "unknown";
}

export function isEftTopLevelLogsFolder(
  folderName: string,
  childDirectoryNames: Iterable<string>,
): boolean {
  if (SESSION_FOLDER_PATTERN.test(folderName)) return false;
  for (const name of childDirectoryNames) {
    if (SESSION_FOLDER_PATTERN.test(name)) return true;
  }
  return false;
}

export function isEftSessionFolderName(folderName: string): boolean {
  return SESSION_FOLDER_PATTERN.test(folderName);
}

export function getEftSessionPatchVersion(folderName: string): string | null {
  return folderName.match(SESSION_PATCH_VERSION_PATTERN)?.[1] ?? null;
}

function comparePatchVersionsDesc(left: string, right: string): number {
  const leftParts = left.split(".").map((part) => Number(part));
  const rightParts = right.split(".").map((part) => Number(part));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index++) {
    const leftValue = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
    const rightValue = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;
    if (leftValue !== rightValue) return rightValue - leftValue;
  }

  return right.localeCompare(left);
}

export function buildEftPatchVersionSummaries(
  sessions: Iterable<{ patchVersion: string; fileCount?: number }>,
): EftLogImportPatchVersionSummary[] {
  const byVersion = new Map<string, EftLogImportPatchVersionSummary>();

  for (const session of sessions) {
    const summary =
      byVersion.get(session.patchVersion) ??
      {
        version: session.patchVersion,
        sessionCount: 0,
        fileCount: 0,
      };
    summary.sessionCount += 1;
    summary.fileCount += session.fileCount ?? 0;
    byVersion.set(session.patchVersion, summary);
  }

  return Array.from(byVersion.values()).sort((left, right) =>
    comparePatchVersionsDesc(left.version, right.version),
  );
}

export function isQuestLogFileName(fileName: string): boolean {
  return QUEST_LOG_FILE_PATTERN.test(fileName);
}

export function isModeLogFileName(fileName: string): boolean {
  return MODE_LOG_FILE_PATTERN.test(fileName);
}

export function isEftLogSessionIncludedForSourceMode(
  sessionMode: EftLogSessionGameMode,
  sourceGameMode: EftLogSourceGameMode,
): boolean {
  if (sourceGameMode === "pve") return sessionMode === "pve";
  return sessionMode === "regular" || sessionMode === "unknown";
}

export function buildEftLogImportScanSummary(
  params: EftLogImportPlanParams,
): EftLogImportScanSummary {
  const matches: EftLogImportQuestMatch[] = [];
  const conflicts: EftLogImportConflict[] = [];

  Array.from(new Set(params.detectedQuestIds))
    .sort()
    .forEach((questId) => {
      const task = params.knownTasksById.get(questId);
      if (!task) {
        conflicts.push({ questId, reason: "unmatched" });
        return;
      }

      const equivalentTaskIds = getEquivalentTaskIds(
        questId,
        params.logicalTaskIdsByTaskId,
      );
      const isAlreadyComplete = equivalentTaskIds.some((taskId) =>
        params.completedTasks.has(taskId),
      );
      matches.push({
        taskId: questId,
        taskName: task.name,
        traderName: task.trader?.name,
        status: isAlreadyComplete ? "already-complete" : "new",
        sourceQuestId: questId,
        equivalentTaskIds,
      });
    });

  return {
    selectedFolderName: params.selectedFolderName,
    sourceGameMode: params.sourceGameMode ?? "regular",
    scannedSessions: params.scannedSessions,
    skippedModeSessions: params.skippedModeSessions ?? 0,
    scannedFiles: params.scannedFiles,
    patchVersions: params.patchVersions ?? [],
    selectedPatchVersions: Array.from(params.selectedPatchVersions ?? []),
    skippedEntries: params.skippedEntries,
    detectedQuestIds: Array.from(new Set(params.detectedQuestIds)).sort(),
    matches,
    conflicts,
  };
}

export function buildEftLogImportBackfillCandidates(
  params: ApplyEftLogImportParams,
): EftLogImportBackfillCandidate[] {
  const result = applyEftLogImport(params);
  const directImportTaskIds = new Set(result.importedTaskIds);
  const seenTaskIds = new Set<string>();

  return result.autoCompletedTaskIds.reduce<EftLogImportBackfillCandidate[]>(
    (candidates, taskId) => {
      if (seenTaskIds.has(taskId) || directImportTaskIds.has(taskId)) {
        return candidates;
      }

      seenTaskIds.add(taskId);
      const task = params.knownTasksById.get(taskId);
      candidates.push({
        taskId,
        taskName: task?.name ?? taskId,
        traderName: task?.trader?.name,
      });
      return candidates;
    },
    [],
  );
}

export function applyEftLogImport(
  params: ApplyEftLogImportParams,
): EftLogImportApplyResult {
  let completedTasks = new Set(params.completedTasks);
  let completedTaskObjectives = new Set(params.completedTaskObjectives);
  const importedTaskIds: string[] = [];
  const autoCompletedTaskIds = new Set<string>();
  const excludedAutoCompleteTaskIds = new Set(
    params.excludedAutoCompleteTaskIds ?? [],
  );

  params.matches
    .filter((match) => match.status === "new")
    .forEach((match) => {
      const result = completeTaskWithDependencies({
        taskId: match.taskId,
        tasks: params.tasks,
        knownTasksById: params.knownTasksById,
        completedTasks,
        completedTaskObjectives,
        logicalTaskIdsByTaskId: params.logicalTaskIdsByTaskId,
      });
      completedTasks = result.completedTasks;
      completedTaskObjectives = result.completedTaskObjectives;
      importedTaskIds.push(match.taskId);
      result.autoCompletedTaskIds.forEach((taskId) =>
        autoCompletedTaskIds.add(taskId),
      );
    });

  const removableAutoCompletedTaskIds = Array.from(
    excludedAutoCompleteTaskIds,
  ).filter(
    (taskId) =>
      autoCompletedTaskIds.has(taskId) &&
      !importedTaskIds.includes(taskId) &&
      !params.completedTasks.has(taskId),
  );

  if (removableAutoCompletedTaskIds.length > 0) {
    const uncompleted = uncompleteTasks({
      taskId: "",
      taskIds: removableAutoCompletedTaskIds,
      tasks: params.tasks,
      knownTasksById: params.knownTasksById,
      completedTasks,
      completedTaskObjectives,
      logicalTaskIdsByTaskId: params.logicalTaskIdsByTaskId,
    });
    completedTasks = uncompleted.completedTasks;
    completedTaskObjectives = uncompleted.completedTaskObjectives;
    removableAutoCompletedTaskIds.forEach((taskId) =>
      autoCompletedTaskIds.delete(taskId),
    );
  }

  return {
    completedTasks,
    completedTaskObjectives,
    importedTaskIds,
    autoCompletedTaskIds: Array.from(autoCompletedTaskIds),
  };
}
