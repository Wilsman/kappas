import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import {
  applyEftLogImport,
  buildEftLogImportBackfillCandidates,
  buildEftPatchVersionSummaries,
  buildEftLogImportScanSummary,
  detectEftLogSessionGameMode,
  extractCompletedQuestIdsFromLogText,
  getEftSessionPatchVersion,
  isEftLogSessionIncludedForSourceMode,
  isEftTopLevelLogsFolder,
} from "@/utils/eftLogImport";

function task(id: string, name: string, requirementIds: string[] = []): Task {
  return {
    id,
    name,
    minPlayerLevel: 1,
    taskRequirements: requirementIds.map((requirementId) => ({
      task: { id: requirementId, name: requirementId },
    })),
    wikiLink: "",
    map: null,
    maps: [],
    trader: { name: "Prapor" },
    objectives: [
      {
        id: `${id}-objective`,
        description: `Finish ${name}`,
      },
    ],
  };
}

const knownTasks = [
  task("aaaaaaaaaaaaaaaaaaaaaaaa", "First quest"),
  task("bbbbbbbbbbbbbbbbbbbbbbbb", "Second quest"),
];
const knownTasksById = new Map(knownTasks.map((entry) => [entry.id, entry]));

describe("eftLogImport", () => {
  it("accepts a top-level Logs folder and rejects a session folder", () => {
    expect(
      isEftTopLevelLogsFolder("Logs", [
        "log_2026.02.19_13-14-36_1.0.2.0.43037",
      ]),
    ).toBe(true);
    expect(
      isEftTopLevelLogsFolder(
        "log_2026.02.19_13-14-36_1.0.2.0.43037",
        [],
      ),
    ).toBe(false);
  });

  it("extracts patch versions from EFT session folder names", () => {
    expect(
      getEftSessionPatchVersion(
        "log_2026.05.27_10-08-25_1.0.5.0.45272",
      ),
    ).toBe("1.0.5.0.45272");
    expect(getEftSessionPatchVersion("Logs")).toBeNull();
    expect(getEftSessionPatchVersion("log_2026.05.27_10-08-25")).toBeNull();
  });

  it("groups patch version summaries newest first", () => {
    expect(
      buildEftPatchVersionSummaries([
        { patchVersion: "1.0.5.0.45272", fileCount: 2 },
        { patchVersion: "1.0.5.0.45464", fileCount: 2 },
        { patchVersion: "1.0.5.0.45272", fileCount: 4 },
      ]),
    ).toEqual([
      { version: "1.0.5.0.45464", sessionCount: 1, fileCount: 2 },
      { version: "1.0.5.0.45272", sessionCount: 2, fileCount: 6 },
    ]);
  });

  it("detects PvE sessions from explicit session mode", () => {
    expect(
      detectEftLogSessionGameMode(
        "2026-05-27|Info|application|Session mode: Pve",
      ),
    ).toBe("pve");
  });

  it("does not classify PvE bootstrap gw-pvp calls as regular", () => {
    const text = [
      "URL: https://gw-pvp.escapefromtarkov.com/client/menu/locale/en.",
      "URL: https://gw-pvp.escapefromtarkov.com/client/game/mode.",
      "URL: https://gw-pve.escapefromtarkov.com/client/game/start.",
    ].join("\n");

    expect(detectEftLogSessionGameMode(text)).toBe("pve");
    expect(
      detectEftLogSessionGameMode(
        "URL: https://gw-pvp.escapefromtarkov.com/client/game/mode.",
      ),
    ).toBe("unknown");
  });

  it("detects PvE sessions from gateway, websocket, and vhost fallbacks", () => {
    expect(
      detectEftLogSessionGameMode(
        "URL: https://gw-pve.escapefromtarkov.com/client/profile/status.",
      ),
    ).toBe("pve");
    expect(
      detectEftLogSessionGameMode(
        "ws:wss://wsn-pve-02.escapefromtarkov.com/push/notifier/getwebsocket",
      ),
    ).toBe("pve");
    expect(
      detectEftLogSessionGameMode(
        "URL: https://lobby.escapefromtarkov.com/router?vhost=pve.",
      ),
    ).toBe("pve");
  });

  it("detects regular sessions from explicit mode and strong PvP fallbacks", () => {
    expect(
      detectEftLogSessionGameMode("2026-05-27|application|Session mode: PvP"),
    ).toBe("regular");
    expect(
      detectEftLogSessionGameMode("2026-05-27|application|Session mode: Normal"),
    ).toBe("regular");
    expect(
      detectEftLogSessionGameMode(
        "URL: https://gw-pvp.escapefromtarkov.com/client/profile/status.",
      ),
    ).toBe("regular");
    expect(
      detectEftLogSessionGameMode(
        "URL: https://lobby.escapefromtarkov.com/router?vhost=pvp.",
      ),
    ).toBe("regular");
  });

  it("includes unknown sessions for PvP imports but excludes them for PvE", () => {
    expect(isEftLogSessionIncludedForSourceMode("unknown", "regular")).toBe(
      true,
    );
    expect(isEftLogSessionIncludedForSourceMode("regular", "regular")).toBe(
      true,
    );
    expect(isEftLogSessionIncludedForSourceMode("pve", "regular")).toBe(false);
    expect(isEftLogSessionIncludedForSourceMode("unknown", "pve")).toBe(false);
    expect(isEftLogSessionIncludedForSourceMode("pve", "pve")).toBe(true);
  });

  it("extracts completed quest IDs from backend and push notification payloads", () => {
    const text = [
      "2026-06-13|Info|backend|<--- Response HTTPS responseText:",
      JSON.stringify({
        data: [
          { qid: "aaaaaaaaaaaaaaaaaaaaaaaa", status: "Success" },
          { qid: "cccccccccccccccccccccccc", status: "Started" },
        ],
      }),
      "2026-06-13|Info|push-notifications|LongPollingWebSocketRequest received:1024",
      JSON.stringify({
        extendedProfile: {
          Quests: [
            { qid: "bbbbbbbbbbbbbbbbbbbbbbbb", status: 4 },
            { qid: "dddddddddddddddddddddddd", status: 1 },
          ],
        },
      }),
    ].join("\n");

    expect(extractCompletedQuestIdsFromLogText(text)).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
  });

  it("deduplicates IDs and classifies new, already complete, and unmatched quests", () => {
    const summary = buildEftLogImportScanSummary({
      selectedFolderName: "Logs",
      sourceGameMode: "pve",
      scannedSessions: 2,
      skippedModeSessions: 3,
      scannedFiles: 4,
      skippedEntries: [],
      patchVersions: [
        { version: "1.0.5.0.45464", sessionCount: 1, fileCount: 2 },
        { version: "1.0.5.0.45272", sessionCount: 1, fileCount: 2 },
      ],
      selectedPatchVersions: ["1.0.5.0.45464"],
      detectedQuestIds: [
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        "bbbbbbbbbbbbbbbbbbbbbbbb",
        "cccccccccccccccccccccccc",
      ],
      tasks: knownTasks,
      knownTasksById,
      completedTasks: new Set(["bbbbbbbbbbbbbbbbbbbbbbbb"]),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(summary.detectedQuestIds).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbbbbbbbbbb",
      "cccccccccccccccccccccccc",
    ]);
    expect(summary.patchVersions).toEqual([
      { version: "1.0.5.0.45464", sessionCount: 1, fileCount: 2 },
      { version: "1.0.5.0.45272", sessionCount: 1, fileCount: 2 },
    ]);
    expect(summary.selectedPatchVersions).toEqual(["1.0.5.0.45464"]);
    expect(summary.sourceGameMode).toBe("pve");
    expect(summary.skippedModeSessions).toBe(3);
    expect(summary.matches).toMatchObject([
      { taskId: "aaaaaaaaaaaaaaaaaaaaaaaa", status: "new" },
      { taskId: "bbbbbbbbbbbbbbbbbbbbbbbb", status: "already-complete" },
    ]);
    expect(summary.conflicts).toEqual([
      { questId: "cccccccccccccccccccccccc", reason: "unmatched" },
    ]);
  });

  it("prefers quest template IDs over generic object IDs", () => {
    const text = JSON.stringify({
      Quests: [
        {
          _id: "cccccccccccccccccccccccc",
          qid: "aaaaaaaaaaaaaaaaaaaaaaaa",
          status: "AvailableForFinish",
        },
      ],
    });

    expect(extractCompletedQuestIdsFromLogText(text)).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
  });

  it("extracts completed quests from EFT success message templates only", () => {
    const text = [
      JSON.stringify({
        message: {
          text: "quest started",
          templateId: "aaaaaaaaaaaaaaaaaaaaaaaa successMessageText",
        },
      }),
      JSON.stringify({
        message: {
          text: "quest started",
          templateId: "bbbbbbbbbbbbbbbbbbbbbbbb startedMessageText",
        },
      }),
      JSON.stringify({
        message: {
          text: "quest started",
          templateId:
            "cccccccccccccccccccccccc successMessageText dddddddddddddddddddddddd 0",
        },
      }),
    ].join("\n");

    expect(extractCompletedQuestIdsFromLogText(text)).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaa",
      "cccccccccccccccccccccccc",
    ]);
  });

  it("applies only new quest completions and marks objectives complete", () => {
    const summary = buildEftLogImportScanSummary({
      selectedFolderName: "Logs",
      scannedSessions: 1,
      scannedFiles: 1,
      skippedEntries: [],
      detectedQuestIds: [
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        "bbbbbbbbbbbbbbbbbbbbbbbb",
      ],
      tasks: knownTasks,
      knownTasksById,
      completedTasks: new Set(["bbbbbbbbbbbbbbbbbbbbbbbb"]),
      logicalTaskIdsByTaskId: new Map(),
    });

    const result = applyEftLogImport({
      matches: summary.matches,
      tasks: knownTasks,
      knownTasksById,
      completedTasks: new Set(["bbbbbbbbbbbbbbbbbbbbbbbb"]),
      completedTaskObjectives: new Set(),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(result.importedTaskIds).toEqual(["aaaaaaaaaaaaaaaaaaaaaaaa"]);
    expect(result.autoCompletedTaskIds).toEqual([]);
    expect(result.completedTasks).toEqual(
      new Set(["aaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbb"]),
    );
    expect(
      Array.from(result.completedTaskObjectives).some((key) =>
        key.includes("aaaaaaaaaaaaaaaaaaaaaaaa::objective-id::"),
      ),
    ).toBe(true);
  });

  it("backfills prerequisite quests when applying imported completions", () => {
    const prerequisite = task("aaaaaaaaaaaaaaaaaaaaaaaa", "Prerequisite quest");
    const imported = task("bbbbbbbbbbbbbbbbbbbbbbbb", "Imported quest", [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
    const tasks = [prerequisite, imported];
    const knownTasksById = new Map(tasks.map((entry) => [entry.id, entry]));
    const summary = buildEftLogImportScanSummary({
      selectedFolderName: "Logs",
      scannedSessions: 1,
      scannedFiles: 1,
      skippedEntries: [],
      detectedQuestIds: ["bbbbbbbbbbbbbbbbbbbbbbbb"],
      tasks,
      knownTasksById,
      completedTasks: new Set(),
      logicalTaskIdsByTaskId: new Map(),
    });

    const result = applyEftLogImport({
      matches: summary.matches,
      tasks,
      knownTasksById,
      completedTasks: new Set(),
      completedTaskObjectives: new Set(),
      logicalTaskIdsByTaskId: new Map(),
    });

    expect(result.importedTaskIds).toEqual(["bbbbbbbbbbbbbbbbbbbbbbbb"]);
    expect(result.autoCompletedTaskIds).toEqual(["aaaaaaaaaaaaaaaaaaaaaaaa"]);
    expect(result.completedTasks).toEqual(
      new Set(["aaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbb"]),
    );
    expect(
      Array.from(result.completedTaskObjectives).some((key) =>
        key.includes("aaaaaaaaaaaaaaaaaaaaaaaa::objective-id::"),
      ),
    ).toBe(true);
  });

  it("builds and respects backfill opt-out candidates", () => {
    const first = task("aaaaaaaaaaaaaaaaaaaaaaaa", "First prerequisite");
    const second = task("bbbbbbbbbbbbbbbbbbbbbbbb", "Second prerequisite", [
      "aaaaaaaaaaaaaaaaaaaaaaaa",
    ]);
    const imported = task("cccccccccccccccccccccccc", "Imported quest", [
      "bbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
    const tasks = [first, second, imported];
    const knownTasksById = new Map(tasks.map((entry) => [entry.id, entry]));
    const summary = buildEftLogImportScanSummary({
      selectedFolderName: "Logs",
      scannedSessions: 1,
      scannedFiles: 1,
      skippedEntries: [],
      detectedQuestIds: ["cccccccccccccccccccccccc"],
      tasks,
      knownTasksById,
      completedTasks: new Set(),
      logicalTaskIdsByTaskId: new Map(),
    });
    const params = {
      matches: summary.matches,
      tasks,
      knownTasksById,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      logicalTaskIdsByTaskId: new Map<string, Set<string>>(),
    };

    expect(buildEftLogImportBackfillCandidates(params)).toEqual([
      {
        taskId: "bbbbbbbbbbbbbbbbbbbbbbbb",
        taskName: "Second prerequisite",
        traderName: "Prapor",
      },
      {
        taskId: "aaaaaaaaaaaaaaaaaaaaaaaa",
        taskName: "First prerequisite",
        traderName: "Prapor",
      },
    ]);

    const result = applyEftLogImport({
      ...params,
      excludedAutoCompleteTaskIds: ["bbbbbbbbbbbbbbbbbbbbbbbb"],
    });

    expect(result.importedTaskIds).toEqual(["cccccccccccccccccccccccc"]);
    expect(result.autoCompletedTaskIds).toEqual(["aaaaaaaaaaaaaaaaaaaaaaaa"]);
    expect(result.completedTasks).toEqual(
      new Set(["aaaaaaaaaaaaaaaaaaaaaaaa", "cccccccccccccccccccccccc"]),
    );
    expect(
      Array.from(result.completedTaskObjectives).some((key) =>
        key.includes("bbbbbbbbbbbbbbbbbbbbbbbb::objective-id::"),
      ),
    ).toBe(false);
  });
});
