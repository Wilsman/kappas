import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FolderInput,
  HardDrive,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import {
  buildEftLogImportBackfillCandidates,
  buildEftPatchVersionSummaries,
  buildEftLogImportScanSummary,
  detectEftLogSessionGameMode,
  extractCompletedQuestIdsFromLogText,
  getEftSessionPatchVersion,
  isEftLogSessionIncludedForSourceMode,
  isEftSessionFolderName,
  isEftTopLevelLogsFolder,
  isModeLogFileName,
  isQuestLogFileName,
  type EftLogImportBackfillCandidate,
  type EftLogImportPatchVersionSummary,
  type EftLogImportScanSummary,
  type EftLogSourceGameMode,
  type EftLogSessionGameMode,
} from "@/utils/eftLogImport";
import type { GameMode } from "@/utils/gameMode";

interface BrowserFileSystemFileHandle {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
}

interface BrowserFileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  queryPermission?: (descriptor?: { mode?: "read" }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: "read" }) => Promise<PermissionState>;
  values: () => AsyncIterable<
    BrowserFileSystemDirectoryHandle | BrowserFileSystemFileHandle
  >;
}

interface EftLogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  activeGameMode: GameMode;
  tasks: Task[];
  knownTasksById: Map<string, Task>;
  completedTasks: Set<string>;
  logicalTaskIdsByTaskId: Map<string, Set<string>>;
  onApply: (
    summary: EftLogImportScanSummary,
    options?: { excludedAutoCompleteTaskIds?: string[] },
  ) => Promise<void>;
}

type DialogStep =
  | "intro"
  | "versions"
  | "scanning"
  | "preview"
  | "no-changes"
  | "complete";

interface DirectorySessionPlan {
  handle: BrowserFileSystemDirectoryHandle;
  patchVersion: string;
  fileCount: number;
  modeFileCount: number;
}

interface DirectoryScanPlan {
  type: "directory";
  rootName: string;
  handle: BrowserFileSystemDirectoryHandle;
  sessions: DirectorySessionPlan[];
  patchVersions: EftLogImportPatchVersionSummary[];
}

interface FileSessionPlan {
  sessionName: string;
  patchVersion: string;
  files: File[];
  modeFiles: File[];
}

interface FileScanPlan {
  type: "files";
  rootName: string;
  sessions: FileSessionPlan[];
  patchVersions: EftLogImportPatchVersionSummary[];
}

type ScanPlan = DirectoryScanPlan | FileScanPlan;

const TYPICAL_LOGS_PATH = "C:\\Battlestate Games\\Escape from Tarkov\\Logs";
const SESSION_FOLDER_EXAMPLE =
  "C:\\Battlestate Games\\Escape from Tarkov\\Logs\\log_2026.05.27_10-08-25_1.0.5.0.45272";
const QUICK_IMPORT_SETTINGS_KEY = "eftLogImport.quickSettings.v1";
const QUICK_IMPORT_DB_NAME = "task-tracker-eft-log-import";
const QUICK_IMPORT_DB_VERSION = 1;
const QUICK_IMPORT_STORE = "handles";
const QUICK_IMPORT_HANDLE_KEY = "logsDirectory";
const SOURCE_GAME_MODE_LABELS: Record<EftLogSourceGameMode, string> = {
  regular: "PvP",
  pve: "PvE",
};

interface QuickImportSettings {
  sourceGameMode: EftLogSourceGameMode;
  selectedPatchVersionCount: number;
  excludedAutoCompleteTaskIds: string[];
}

function canUseDirectoryPicker(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

function readDirectoryPicker(): Promise<BrowserFileSystemDirectoryHandle> {
  const picker = (
    window as typeof window & {
      showDirectoryPicker?: (options?: {
        mode?: "read" | "readwrite";
      }) => Promise<BrowserFileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker)
    throw new Error("Folder picker is not available in this browser.");
  return picker({ mode: "read" });
}

async function readLogFile(file: File): Promise<string> {
  return file.text();
}

function readQuickImportSettings(): QuickImportSettings | null {
  try {
    const raw = localStorage.getItem(QUICK_IMPORT_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuickImportSettings>;
    const sourceGameMode = parsed.sourceGameMode === "pve" ? "pve" : "regular";
    return {
      sourceGameMode,
      selectedPatchVersionCount: Math.max(
        1,
        Number(parsed.selectedPatchVersionCount) || 1,
      ),
      excludedAutoCompleteTaskIds: Array.isArray(
        parsed.excludedAutoCompleteTaskIds,
      )
        ? parsed.excludedAutoCompleteTaskIds.filter(
            (taskId): taskId is string => typeof taskId === "string",
          )
        : [],
    };
  } catch {
    return null;
  }
}

function writeQuickImportSettings(settings: QuickImportSettings) {
  localStorage.setItem(QUICK_IMPORT_SETTINGS_KEY, JSON.stringify(settings));
}

function openQuickImportDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUICK_IMPORT_DB_NAME, QUICK_IMPORT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUICK_IMPORT_STORE)) {
        db.createObjectStore(QUICK_IMPORT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveQuickImportDirectoryHandle(
  handle: BrowserFileSystemDirectoryHandle,
) {
  const db = await openQuickImportDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([QUICK_IMPORT_STORE], "readwrite");
    tx.objectStore(QUICK_IMPORT_STORE).put(handle, QUICK_IMPORT_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadQuickImportDirectoryHandle(): Promise<BrowserFileSystemDirectoryHandle | null> {
  const db = await openQuickImportDb();
  const handle = await new Promise<BrowserFileSystemDirectoryHandle | null>(
    (resolve, reject) => {
      const tx = db.transaction([QUICK_IMPORT_STORE], "readonly");
      const request = tx
        .objectStore(QUICK_IMPORT_STORE)
        .get(QUICK_IMPORT_HANDLE_KEY);
      request.onsuccess = () =>
        resolve((request.result as BrowserFileSystemDirectoryHandle) ?? null);
      request.onerror = () => reject(request.error);
    },
  );
  db.close();
  return handle;
}

async function ensureReadPermission(
  handle: BrowserFileSystemDirectoryHandle,
): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true;
  const current = await handle.queryPermission({ mode: "read" });
  if (current === "granted") return true;
  const requested = await handle.requestPermission({ mode: "read" });
  return requested === "granted";
}

async function countQuestLogFiles(
  handle: BrowserFileSystemDirectoryHandle,
): Promise<number> {
  let fileCount = 0;
  for await (const fileEntry of handle.values()) {
    if (fileEntry.kind === "file" && isQuestLogFileName(fileEntry.name)) {
      fileCount++;
    }
  }
  return fileCount;
}

async function countModeLogFiles(
  handle: BrowserFileSystemDirectoryHandle,
): Promise<number> {
  let fileCount = 0;
  for await (const fileEntry of handle.values()) {
    if (fileEntry.kind === "file" && isModeLogFileName(fileEntry.name)) {
      fileCount++;
    }
  }
  return fileCount;
}

async function buildDirectoryScanPlan(
  handle: BrowserFileSystemDirectoryHandle,
): Promise<DirectoryScanPlan> {
  const entries: Array<
    BrowserFileSystemDirectoryHandle | BrowserFileSystemFileHandle
  > = [];
  for await (const entry of handle.values()) {
    entries.push(entry);
  }

  const sessionFolders = entries.filter(
    (entry): entry is BrowserFileSystemDirectoryHandle =>
      entry.kind === "directory" && isEftSessionFolderName(entry.name),
  );
  if (
    !isEftTopLevelLogsFolder(
      handle.name,
      sessionFolders.map((entry) => entry.name),
    )
  ) {
    throw new Error(
      "Select the top-level Logs folder, not an individual log_* session folder.",
    );
  }

  const sessions: DirectorySessionPlan[] = [];
  for (const sessionFolder of sessionFolders) {
    const patchVersion = getEftSessionPatchVersion(sessionFolder.name);
    if (!patchVersion) continue;
    sessions.push({
      handle: sessionFolder,
      patchVersion,
      fileCount: await countQuestLogFiles(sessionFolder),
      modeFileCount: await countModeLogFiles(sessionFolder),
    });
  }

  return {
    type: "directory",
    rootName: handle.name,
    handle,
    sessions,
    patchVersions: buildEftPatchVersionSummaries(sessions),
  };
}

function mergeSessionMode(
  current: EftLogSessionGameMode,
  next: EftLogSessionGameMode,
): EftLogSessionGameMode {
  if (current === "pve" || next === "pve") return "pve";
  if (current === "regular" || next === "regular") return "regular";
  return "unknown";
}

async function detectDirectorySessionMode(
  sessionFolder: BrowserFileSystemDirectoryHandle,
  skippedEntries: string[],
): Promise<EftLogSessionGameMode> {
  let mode: EftLogSessionGameMode = "unknown";
  for await (const fileEntry of sessionFolder.values()) {
    if (fileEntry.kind !== "file" || !isModeLogFileName(fileEntry.name)) {
      continue;
    }
    try {
      const text = await readLogFile(await fileEntry.getFile());
      mode = mergeSessionMode(mode, detectEftLogSessionGameMode(text));
    } catch {
      skippedEntries.push(`${sessionFolder.name}/${fileEntry.name}`);
    }
  }
  return mode;
}

async function scanDirectoryPlan(
  plan: DirectoryScanPlan,
  selectedPatchVersions: Set<string>,
  sourceGameMode: EftLogSourceGameMode,
  tasks: Task[],
  knownTasksById: Map<string, Task>,
  completedTasks: Set<string>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): Promise<EftLogImportScanSummary> {
  const detectedQuestIds = new Set<string>();
  const skippedEntries: string[] = [];
  let scannedFiles = 0;
  let scannedSessions = 0;
  let skippedModeSessions = 0;

  for (const session of plan.sessions) {
    if (!selectedPatchVersions.has(session.patchVersion)) continue;
    const sessionFolder = session.handle;
    const sessionMode = await detectDirectorySessionMode(
      sessionFolder,
      skippedEntries,
    );
    if (!isEftLogSessionIncludedForSourceMode(sessionMode, sourceGameMode)) {
      skippedModeSessions++;
      continue;
    }
    scannedSessions++;
    for await (const fileEntry of sessionFolder.values()) {
      if (fileEntry.kind !== "file" || !isQuestLogFileName(fileEntry.name)) {
        continue;
      }
      scannedFiles++;
      try {
        const text = await readLogFile(await fileEntry.getFile());
        extractCompletedQuestIdsFromLogText(text).forEach((questId) =>
          detectedQuestIds.add(questId),
        );
      } catch {
        skippedEntries.push(`${sessionFolder.name}/${fileEntry.name}`);
      }
    }
  }

  return buildEftLogImportScanSummary({
    selectedFolderName: plan.rootName,
    sourceGameMode,
    scannedSessions,
    skippedModeSessions,
    scannedFiles,
    patchVersions: plan.patchVersions,
    selectedPatchVersions,
    skippedEntries,
    detectedQuestIds,
    tasks,
    knownTasksById,
    completedTasks,
    logicalTaskIdsByTaskId,
  });
}

function buildFileScanPlan(
  files: FileList,
): FileScanPlan {
  const allFiles = Array.from(files);
  const rootName =
    allFiles[0]?.webkitRelativePath?.split("/").filter(Boolean)[0] ?? "Logs";
  const sessionNames = new Set<string>();
  const sessionsByName = new Map<string, FileSessionPlan>();

  allFiles.forEach((file) => {
    const parts = file.webkitRelativePath.split("/").filter(Boolean);
    const sessionName = parts.find((part) => isEftSessionFolderName(part));
    if (!sessionName) return;
    sessionNames.add(sessionName);
    const patchVersion = getEftSessionPatchVersion(sessionName);
    if (!patchVersion) return;
    if (!isQuestLogFileName(file.name) && !isModeLogFileName(file.name)) return;
    const session =
      sessionsByName.get(sessionName) ??
      {
        sessionName,
        patchVersion,
        files: [],
        modeFiles: [],
      };
    sessionsByName.set(sessionName, session);
    if (isQuestLogFileName(file.name)) {
      session.files.push(file);
    }
    if (isModeLogFileName(file.name)) {
      session.modeFiles.push(file);
    }
  });

  if (!isEftTopLevelLogsFolder(rootName, sessionNames)) {
    throw new Error(
      "Select the top-level Logs folder, not an individual log_* session folder.",
    );
  }

  const sessions = Array.from(sessionsByName.values());
  return {
    type: "files",
    rootName,
    sessions,
    patchVersions: buildEftPatchVersionSummaries(
      sessions.map((session) => ({
        patchVersion: session.patchVersion,
        fileCount: session.files.length,
      })),
    ),
  };
}

async function detectFileSessionMode(
  session: FileSessionPlan,
  skippedEntries: string[],
): Promise<EftLogSessionGameMode> {
  let mode: EftLogSessionGameMode = "unknown";
  for (const file of session.modeFiles) {
    try {
      const text = await readLogFile(file);
      mode = mergeSessionMode(mode, detectEftLogSessionGameMode(text));
    } catch {
      skippedEntries.push(`${session.sessionName}/${file.name}`);
    }
  }
  return mode;
}

async function scanFilePlan(
  plan: FileScanPlan,
  selectedPatchVersions: Set<string>,
  sourceGameMode: EftLogSourceGameMode,
  tasks: Task[],
  knownTasksById: Map<string, Task>,
  completedTasks: Set<string>,
  logicalTaskIdsByTaskId: Map<string, Set<string>>,
): Promise<EftLogImportScanSummary> {
  const detectedQuestIds = new Set<string>();
  const skippedEntries: string[] = [];
  let scannedFiles = 0;
  let scannedSessions = 0;
  let skippedModeSessions = 0;

  for (const session of plan.sessions) {
    if (!selectedPatchVersions.has(session.patchVersion)) continue;
    const sessionMode = await detectFileSessionMode(session, skippedEntries);
    if (!isEftLogSessionIncludedForSourceMode(sessionMode, sourceGameMode)) {
      skippedModeSessions++;
      continue;
    }
    scannedSessions++;
    for (const file of session.files) {
      scannedFiles++;
      try {
        const text = await readLogFile(file);
        extractCompletedQuestIdsFromLogText(text).forEach((questId) =>
          detectedQuestIds.add(questId),
        );
      } catch {
        skippedEntries.push(`${session.sessionName}/${file.name}`);
      }
    }
  }

  return buildEftLogImportScanSummary({
    selectedFolderName: plan.rootName,
    sourceGameMode,
    scannedSessions,
    skippedModeSessions,
    scannedFiles,
    patchVersions: plan.patchVersions,
    selectedPatchVersions,
    skippedEntries,
    detectedQuestIds,
    tasks,
    knownTasksById,
    completedTasks,
    logicalTaskIdsByTaskId,
  });
}

export function EftLogImportDialog({
  open,
  onOpenChange,
  profileName,
  activeGameMode,
  tasks,
  knownTasksById,
  completedTasks,
  logicalTaskIdsByTaskId,
  onApply,
}: EftLogImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<DialogStep>("intro");
  const [summary, setSummary] = useState<EftLogImportScanSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [scanPlan, setScanPlan] = useState<ScanPlan | null>(null);
  const [selectedPatchVersions, setSelectedPatchVersions] = useState<
    Set<string>
  >(new Set());
  const [selectedBackfillTaskIds, setSelectedBackfillTaskIds] = useState<
    Set<string>
  >(new Set());
  const [sourceGameMode, setSourceGameMode] =
    useState<EftLogSourceGameMode>(() => {
      return readQuickImportSettings()?.sourceGameMode ?? activeGameMode;
    });

  const resetState = useCallback(() => {
    setStep("intro");
    setSummary(null);
    setError(null);
    setIsApplying(false);
    setScanPlan(null);
    setSelectedPatchVersions(new Set());
    setSelectedBackfillTaskIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!readQuickImportSettings()) {
      setSourceGameMode(activeGameMode);
    }
  }, [activeGameMode]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState],
  );

  const scanParams = useMemo(
    () => ({
      tasks,
      knownTasksById,
      completedTasks,
      logicalTaskIdsByTaskId,
    }),
    [completedTasks, knownTasksById, logicalTaskIdsByTaskId, tasks],
  );

  const initializeBackfillSelection = useCallback(
    (
      nextSummary: EftLogImportScanSummary,
      excludedAutoCompleteTaskIds: Iterable<string> = [],
    ) => {
      const excluded = new Set(excludedAutoCompleteTaskIds);
      setSelectedBackfillTaskIds(
        new Set(
          buildEftLogImportBackfillCandidates({
            matches: nextSummary.matches,
            ...scanParams,
            completedTaskObjectives: new Set(),
          })
            .filter((candidate) => !excluded.has(candidate.taskId))
            .map((candidate) => candidate.taskId),
        ),
      );
    },
    [scanParams],
  );

  const handlePickFolder = useCallback(async () => {
    setError(null);
    if (!canUseDirectoryPicker()) {
      fileInputRef.current?.click();
      return;
    }
    setStep("scanning");
    try {
      const handle = await readDirectoryPicker();
      const nextScanPlan = await buildDirectoryScanPlan(handle);
      setScanPlan(nextScanPlan);
      setSelectedPatchVersions(
        new Set(nextScanPlan.patchVersions.map((patch) => patch.version)),
      );
      setStep("versions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan logs.");
      setStep("intro");
    }
  }, []);

  const handleFallbackFiles = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      setError(null);
      setStep("scanning");
      try {
        const nextScanPlan = buildFileScanPlan(files);
        setScanPlan(nextScanPlan);
        setSelectedPatchVersions(
          new Set(nextScanPlan.patchVersions.map((patch) => patch.version)),
        );
        setStep("versions");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to scan logs.");
        setStep("intro");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleTogglePatchVersion = useCallback(
    (version: string, checked: boolean) => {
      setSelectedPatchVersions((previous) => {
        const next = new Set(previous);
        if (checked) next.add(version);
        else next.delete(version);
        return next;
      });
    },
    [],
  );

  const handleScanSelectedVersions = useCallback(async () => {
    if (!scanPlan) return;
    setError(null);
    setStep("scanning");
    try {
      const nextSummary =
        scanPlan.type === "directory"
          ? await scanDirectoryPlan(
              scanPlan,
              selectedPatchVersions,
              sourceGameMode,
              scanParams.tasks,
              scanParams.knownTasksById,
              scanParams.completedTasks,
              scanParams.logicalTaskIdsByTaskId,
            )
          : await scanFilePlan(
              scanPlan,
              selectedPatchVersions,
              sourceGameMode,
              scanParams.tasks,
              scanParams.knownTasksById,
              scanParams.completedTasks,
              scanParams.logicalTaskIdsByTaskId,
            );
      setSummary(nextSummary);
      initializeBackfillSelection(nextSummary);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan logs.");
      setStep("versions");
    }
  }, [
    initializeBackfillSelection,
    scanParams,
    scanPlan,
    selectedPatchVersions,
    sourceGameMode,
  ]);

  const runQuickImport = useCallback(async () => {
    setError(null);
    setStep("scanning");
    onOpenChange(true);

    try {
      const settings = readQuickImportSettings();
      const handle = await loadQuickImportDirectoryHandle();
      if (!settings || !handle) {
        throw new Error(
          "Quick Sync needs a saved Logs folder. Choose your Logs folder once, then import normally to enable it.",
        );
      }

      const hasPermission = await ensureReadPermission(handle);
      if (!hasPermission) {
        throw new Error(
          "Quick Sync needs permission to read your saved Logs folder again.",
        );
      }

      const nextScanPlan = await buildDirectoryScanPlan(handle);
      const selectedVersions = new Set(
        nextScanPlan.patchVersions
          .slice(0, settings.selectedPatchVersionCount)
          .map((patch) => patch.version),
      );
      const nextSummary = await scanDirectoryPlan(
        nextScanPlan,
        selectedVersions,
        settings.sourceGameMode,
        scanParams.tasks,
        scanParams.knownTasksById,
        scanParams.completedTasks,
        scanParams.logicalTaskIdsByTaskId,
      );

      setSourceGameMode(settings.sourceGameMode);
      setScanPlan(nextScanPlan);
      setSelectedPatchVersions(selectedVersions);
      setSummary(nextSummary);
      initializeBackfillSelection(
        nextSummary,
        settings.excludedAutoCompleteTaskIds,
      );
      const hasNewMatches = nextSummary.matches.some(
        (match) => match.status === "new",
      );
      setStep(hasNewMatches ? "preview" : "no-changes");
    } catch (err) {
      setSummary(null);
      setScanPlan(null);
      setSelectedPatchVersions(new Set());
      setSelectedBackfillTaskIds(new Set());
      setError(
        err instanceof Error ? err.message : "Quick Sync could not start.",
      );
      setStep("intro");
    }
  }, [initializeBackfillSelection, onOpenChange, scanParams]);

  useEffect(() => {
    const handleQuickImport = () => {
      void runQuickImport();
    };
    window.addEventListener("eft-log-import:quick", handleQuickImport);
    return () => {
      window.removeEventListener("eft-log-import:quick", handleQuickImport);
    };
  }, [runQuickImport]);

  const newMatches =
    summary?.matches.filter((match) => match.status === "new") ?? [];
  const selectedPatchVersionCount =
    scanPlan?.patchVersions.filter((patch) =>
      selectedPatchVersions.has(patch.version),
    ).length ?? 0;
  const alreadyCompleteMatches =
    summary?.matches.filter((match) => match.status === "already-complete") ??
    [];
  const backfillCandidates = useMemo(() => {
    if (!summary) return [];
    return buildEftLogImportBackfillCandidates({
      matches: summary.matches,
      ...scanParams,
      completedTaskObjectives: new Set(),
    });
  }, [scanParams, summary]);
  const selectedBackfillCount = backfillCandidates.filter((candidate) =>
    selectedBackfillTaskIds.has(candidate.taskId),
  ).length;
  const handleToggleBackfillTask = useCallback(
    (taskId: string, checked: boolean) => {
      setSelectedBackfillTaskIds((previous) => {
        const next = new Set(previous);
        if (checked) next.add(taskId);
        else next.delete(taskId);
        return next;
      });
    },
    [],
  );

  const handleApply = useCallback(async () => {
    if (!summary) return;
    setIsApplying(true);
    setError(null);
    try {
      const excludedAutoCompleteTaskIds = backfillCandidates
        .filter((candidate) => !selectedBackfillTaskIds.has(candidate.taskId))
        .map((candidate) => candidate.taskId);
      await onApply(summary, { excludedAutoCompleteTaskIds });
      writeQuickImportSettings({
        sourceGameMode: summary.sourceGameMode,
        selectedPatchVersionCount: Math.max(1, selectedPatchVersionCount),
        excludedAutoCompleteTaskIds,
      });
      if (scanPlan?.type === "directory") {
        await saveQuickImportDirectoryHandle(scanPlan.handle);
      }
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import logs.");
    } finally {
      setIsApplying(false);
    }
  }, [
    backfillCandidates,
    onApply,
    scanPlan,
    selectedBackfillTaskIds,
    selectedPatchVersionCount,
    summary,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {step === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                EFT Game Logs Import
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Beta WIP
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Import quest progress detected from local Escape from Tarkov
                game log files for "{profileName}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-sm">
              <EftLogImportBetaWarning />
              <SourceGameModeToggle
                value={sourceGameMode}
                onChange={setSourceGameMode}
              />
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="font-medium">Select your Logs folder</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select the top-level Logs folder, not an individual log_*
                  session folder.
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <PathHint
                    tone="good"
                    marker="✓"
                    label="Select this folder"
                    helper="Typical path"
                    value={TYPICAL_LOGS_PATH}
                  />
                  <PathHint
                    tone="bad"
                    marker="✕"
                    label="Do not select"
                    helper="This is one log session inside the Logs folder"
                    value={SESSION_FOLDER_EXAMPLE}
                  />
                </div>
              </div>
              <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
                All parsing happens in this browser. Log contents are not
                uploaded. If old log sessions were deleted, they cannot be
                imported.
              </div>
              {error && (
                <StatusMessage
                  tone="error"
                  icon={<AlertCircle className="h-4 w-4" />}
                >
                  {error}
                </StatusMessage>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                // @ts-expect-error Chromium exposes folder selection through this attribute.
                webkitdirectory=""
                multiple
                onChange={handleFallbackFiles}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePickFolder} className="gap-2">
                <FolderInput className="h-4 w-4" />
                Choose Logs Folder
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "versions" && scanPlan && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderInput className="h-5 w-5" />
                Include Log Versions
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Beta WIP
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Untick older patches or wipes you do not want to import.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <EftLogImportBetaWarning compact />
              <SourceGameModeToggle
                value={sourceGameMode}
                onChange={setSourceGameMode}
              />
              <PatchVersionChecklist
                patchVersions={scanPlan.patchVersions}
                selectedPatchVersions={selectedPatchVersions}
                onToggle={handleTogglePatchVersion}
              />
              {error && (
                <StatusMessage
                  tone="error"
                  icon={<AlertCircle className="h-4 w-4" />}
                >
                  {error}
                </StatusMessage>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={resetState}>
                Back
              </Button>
              <Button
                onClick={handleScanSelectedVersions}
                disabled={selectedPatchVersionCount === 0}
                className="gap-2"
              >
                <FileSearch className="h-4 w-4" />
                Scan {selectedPatchVersionCount} Version
                {selectedPatchVersionCount === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "scanning" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Scanning EFT logs
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Beta WIP
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Reading backend and push notification logs for quest progress.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center text-sm text-muted-foreground">
              This can take a moment for large log folders.
            </div>
          </>
        )}

        {step === "preview" && summary && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Preview beta import
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Work in progress
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Review detected quest progress before anything is saved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <EftLogImportBetaWarning compact />
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
                <PreviewStat
                  label="Mode"
                  value={SOURCE_GAME_MODE_LABELS[summary.sourceGameMode]}
                />
                <PreviewStat label="Sessions" value={summary.scannedSessions} />
                <PreviewStat label="Files" value={summary.scannedFiles} />
                <PreviewStat
                  label="New"
                  value={newMatches.length}
                  tone="good"
                />
                <PreviewStat
                  label="Already"
                  value={alreadyCompleteMatches.length}
                />
                <PreviewStat
                  label="Unmatched"
                  value={summary.conflicts.length}
                  tone={summary.conflicts.length > 0 ? "warn" : undefined}
                />
                <PreviewStat
                  label="Skipped"
                  value={summary.skippedModeSessions}
                  tone={summary.skippedModeSessions > 0 ? "warn" : undefined}
                />
              </div>

              <ImportList
                title="New quest completions"
                empty="No new quests found in these logs."
                rows={newMatches.map((match) => ({
                  id: match.taskId,
                  title: match.taskName,
                  detail: match.traderName ?? match.taskId,
                  tone: "new" as const,
                }))}
              />

              {backfillCandidates.length > 0 && (
                <BackfillChecklist
                  candidates={backfillCandidates}
                  selectedTaskIds={selectedBackfillTaskIds}
                  selectedCount={selectedBackfillCount}
                  onToggle={handleToggleBackfillTask}
                />
              )}

              {(alreadyCompleteMatches.length > 0 ||
                summary.conflicts.length > 0 ||
                summary.skippedEntries.length > 0) && (
                <ImportList
                  title="Conflicts and skipped"
                  empty="No conflicts."
                  rows={[
                    ...alreadyCompleteMatches.map((match) => ({
                      id: `already-${match.taskId}`,
                      title: match.taskName,
                      detail: "Already complete",
                      tone: "muted" as const,
                    })),
                    ...summary.conflicts.map((conflict) => ({
                      id: `unmatched-${conflict.questId}`,
                      title: conflict.questId,
                      detail: "Unmatched quest ID",
                      tone: "warn" as const,
                    })),
                    ...summary.skippedEntries.map((entry) => ({
                      id: `skipped-${entry}`,
                      title: entry,
                      detail: "Skipped unreadable log file",
                      tone: "warn" as const,
                    })),
                  ]}
                />
              )}

              {error && (
                <StatusMessage
                  tone="error"
                  icon={<AlertCircle className="h-4 w-4" />}
                >
                  {error}
                </StatusMessage>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={resetState}
                disabled={isApplying}
              >
                Back
              </Button>
              <Button
                onClick={handleApply}
                disabled={isApplying || newMatches.length === 0}
                className="gap-2"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Beta Import {newMatches.length} Quest
                {newMatches.length === 1 ? "" : "s"}
                {selectedBackfillCount > 0
                  ? ` + ${selectedBackfillCount} Backfill`
                  : ""}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "no-changes" && summary && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                No changes in the logs detected
                <Badge variant="secondary" className="text-[10px] uppercase">
                  Beta WIP
                </Badge>
              </DialogTitle>
              <DialogDescription>
                No new quest completions were found in the saved EFT logs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <EftLogImportBetaWarning compact />
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <PreviewStat
                  label="Mode"
                  value={SOURCE_GAME_MODE_LABELS[summary.sourceGameMode]}
                />
                <PreviewStat label="Sessions" value={summary.scannedSessions} />
                <PreviewStat label="Files" value={summary.scannedFiles} />
                <PreviewStat
                  label="Skipped"
                  value={summary.skippedModeSessions}
                  tone={summary.skippedModeSessions > 0 ? "warn" : undefined}
                />
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                Use manual settings if you want to change PvP/PvE mode, patch
                versions, or backfill choices before scanning again.
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
              <Button onClick={() => setStep("versions")} className="gap-2">
                <FolderInput className="h-4 w-4" />
                Manual Settings
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "complete" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Beta import complete
              </DialogTitle>
              <DialogDescription>
                Imported {newMatches.length} quest completion
                {newMatches.length === 1 ? "" : "s"} into "{profileName}".
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PathHint({
  label,
  helper,
  marker,
  tone,
  value,
}: {
  label: string;
  helper: string;
  marker: string;
  tone: "good" | "bad";
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2",
        tone === "good" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "bad" &&
          "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            tone === "good" && "bg-emerald-500 text-white",
            tone === "bad" && "bg-red-500 text-white",
          )}
          aria-hidden
        >
          {marker}
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-1 pl-7 text-[11px] opacity-80">{helper}</div>
      <code className="mt-2 block overflow-x-auto rounded bg-background px-2 py-1 text-[11px] text-foreground">
        {value}
      </code>
    </div>
  );
}

function StatusMessage({
  tone,
  icon,
  children,
}: {
  tone: "error" | "success";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        tone === "error" ? "text-destructive" : "text-emerald-500",
      )}
    >
      {icon}
      {children}
    </div>
  );
}

function EftLogImportBetaWarning({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/40 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200",
        compact ? "p-2" : "p-3",
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Beta work in progress
      </div>
      <p className={cn("mt-1", compact ? "leading-4" : "leading-5")}>
        EFT log import might miss quests, mark the wrong source mode, or behave
        differently across patches. Try it on a new test character first, then
        review the preview before importing into a real profile.
      </p>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold",
          tone === "good" && "text-emerald-500",
          tone === "warn" && "text-amber-500",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SourceGameModeToggle({
  value,
  onChange,
}: {
  value: EftLogSourceGameMode;
  onChange: (value: EftLogSourceGameMode) => void;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Import log mode
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-background p-1">
        {(["regular", "pve"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={value === mode ? "default" : "ghost"}
            className="h-8"
            onClick={() => onChange(mode)}
            aria-pressed={value === mode}
          >
            {SOURCE_GAME_MODE_LABELS[mode]}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PatchVersionChecklist({
  patchVersions,
  selectedPatchVersions,
  onToggle,
}: {
  patchVersions: EftLogImportPatchVersionSummary[];
  selectedPatchVersions: Set<string>;
  onToggle: (version: string, checked: boolean) => void;
}) {
  const selectedCount = patchVersions.filter((patch) =>
    selectedPatchVersions.has(patch.version),
  ).length;

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
        <div>
          <span>Patch versions</span>
          <div className="text-xs font-normal text-muted-foreground">
            Checked versions will be scanned for quest completions.
          </div>
        </div>
        <Badge variant="outline">
          {selectedCount}/{patchVersions.length}
        </Badge>
      </div>
      {patchVersions.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No patch versions were found in this Logs folder.
        </div>
      ) : (
        <ScrollArea className="h-52">
          <ul className="divide-y">
            {patchVersions.map((patch) => {
              const checked = selectedPatchVersions.has(patch.version);
              return (
                <li
                  key={patch.version}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      onToggle(patch.version, Boolean(nextChecked))
                    }
                    aria-label={`Include log version ${patch.version}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{patch.version}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {patch.sessionCount} session
                      {patch.sessionCount === 1 ? "" : "s"} · {patch.fileCount}{" "}
                      file{patch.fileCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function BackfillChecklist({
  candidates,
  selectedTaskIds,
  selectedCount,
  onToggle,
}: {
  candidates: EftLogImportBackfillCandidate[];
  selectedTaskIds: Set<string>;
  selectedCount: number;
  onToggle: (taskId: string, checked: boolean) => void;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
        <div>
          <span>Previous quests to backfill</span>
          <div className="text-xs font-normal text-muted-foreground">
            Checked quests will be marked complete. Untick any you want to skip.
          </div>
        </div>
        <Badge variant="outline">
          {selectedCount}/{candidates.length}
        </Badge>
      </div>
      <ScrollArea className="h-52">
        <ul className="divide-y">
          {candidates.map((candidate) => {
            const checked = selectedTaskIds.has(candidate.taskId);
            return (
              <li key={candidate.taskId} className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) =>
                    onToggle(candidate.taskId, Boolean(nextChecked))
                  }
                  aria-label={`Backfill ${candidate.taskName}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{candidate.taskName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {candidate.traderName ?? candidate.taskId}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

function ImportList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{
    id: string;
    title: string;
    detail: string;
    tone: "new" | "muted" | "warn";
  }>;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
        <span>{title}</span>
        <Badge variant="outline">{rows.length}</Badge>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ScrollArea className="h-52">
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-3 py-2">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    row.tone === "new" && "bg-emerald-500",
                    row.tone === "muted" && "bg-muted-foreground/60",
                    row.tone === "warn" && "bg-amber-500",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{row.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {row.detail}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
