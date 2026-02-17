import { describe, it, expect, beforeEach } from "vitest";
import {
  TaskStorage,
  ExportImportService,
  taskStorage,
  ExportData,
} from "../indexedDB";
import "./setup";

describe("TaskStorage - Tasks", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load completed tasks", async () => {
    const tasks = new Set(["task-1", "task-2", "task-3"]);

    await storage.saveCompletedTasks(tasks);
    const loaded = await storage.loadCompletedTasks();

    expect(loaded.size).toBe(3);
    expect(loaded.has("task-1")).toBe(true);
    expect(loaded.has("task-2")).toBe(true);
    expect(loaded.has("task-3")).toBe(true);
  });

  it("should return empty set when no tasks completed", async () => {
    const loaded = await storage.loadCompletedTasks();
    expect(loaded.size).toBe(0);
  });

  it("should overwrite previous tasks when saving", async () => {
    await storage.saveCompletedTasks(new Set(["task-1", "task-2"]));
    await storage.saveCompletedTasks(new Set(["task-3"]));

    const loaded = await storage.loadCompletedTasks();

    expect(loaded.size).toBe(1);
    expect(loaded.has("task-3")).toBe(true);
    expect(loaded.has("task-1")).toBe(false);
  });

  it("should recover tasks from local snapshot when IndexedDB is empty", async () => {
    const profileId = "snapshot-recovery-profile";
    const snapshotKey = `taskTracker_completedTasks_snapshot_v1::${profileId}`;
    localStorage.setItem(snapshotKey, JSON.stringify(["task-1", "task-2"]));

    const session1 = new TaskStorage();
    session1.setProfile(profileId);
    await session1.init();

    const loadedFromSnapshot = await session1.loadCompletedTasks();
    expect(loadedFromSnapshot.size).toBe(2);
    expect(loadedFromSnapshot.has("task-1")).toBe(true);
    expect(loadedFromSnapshot.has("task-2")).toBe(true);

    // Confirm reconciliation persisted into IndexedDB.
    localStorage.removeItem(snapshotKey);
    const session2 = new TaskStorage();
    session2.setProfile(profileId);
    await session2.init();
    const loadedFromDb = await session2.loadCompletedTasks();
    expect(loadedFromDb.size).toBe(2);
    expect(loadedFromDb.has("task-1")).toBe(true);
    expect(loadedFromDb.has("task-2")).toBe(true);
  });

  it("should treat snapshot as latest state and reconcile stale IndexedDB task data", async () => {
    const profileId = "snapshot-authoritative-profile";
    const snapshotKey = `taskTracker_completedTasks_snapshot_v1::${profileId}`;

    const session1 = new TaskStorage();
    session1.setProfile(profileId);
    await session1.init();
    await session1.saveCompletedTasks(new Set(["task-a", "task-b"]));

    // Simulate a newer UI state where task-b was unchecked before refresh.
    localStorage.setItem(snapshotKey, JSON.stringify(["task-a"]));

    const session2 = new TaskStorage();
    session2.setProfile(profileId);
    await session2.init();
    const reconciled = await session2.loadCompletedTasks();
    expect(reconciled.size).toBe(1);
    expect(reconciled.has("task-a")).toBe(true);
    expect(reconciled.has("task-b")).toBe(false);

    // Confirm stale DB data was corrected.
    localStorage.removeItem(snapshotKey);
    const session3 = new TaskStorage();
    session3.setProfile(profileId);
    await session3.init();
    const afterReconcile = await session3.loadCompletedTasks();
    expect(afterReconcile.size).toBe(1);
    expect(afterReconcile.has("task-a")).toBe(true);
    expect(afterReconcile.has("task-b")).toBe(false);
  });
});

describe("TaskStorage - Collector Items", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load completed collector items", async () => {
    const items = new Set(["item-1", "item-2", "item-3"]);

    await storage.saveCompletedCollectorItems(items);
    const loaded = await storage.loadCompletedCollectorItems();

    expect(loaded.size).toBe(3);
    expect(loaded.has("item-1")).toBe(true);
  });

  it("should handle empty collector items", async () => {
    const loaded = await storage.loadCompletedCollectorItems();
    expect(loaded.size).toBe(0);
  });
});

describe("TaskStorage - Hideout Items", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load completed hideout items", async () => {
    const items = new Set(["hideout-item-1", "hideout-item-2"]);

    await storage.saveCompletedHideoutItems(items);
    const loaded = await storage.loadCompletedHideoutItems();

    expect(loaded.size).toBe(2);
    expect(loaded.has("hideout-item-1")).toBe(true);
    expect(loaded.has("hideout-item-2")).toBe(true);
  });
});

describe("TaskStorage - Storyline Objectives", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load completed storyline objectives", async () => {
    const objectives = new Set(["objective-1", "objective-2", "objective-3"]);

    await storage.saveCompletedStorylineObjectives(objectives);
    const loaded = await storage.loadCompletedStorylineObjectives();

    expect(loaded.size).toBe(3);
    expect(loaded.has("objective-1")).toBe(true);
  });

  it("should save and load completed storyline map nodes", async () => {
    const nodes = new Set(["node-1", "node-2"]);

    await storage.saveCompletedStorylineMapNodes(nodes);
    const loaded = await storage.loadCompletedStorylineMapNodes();

    expect(loaded.size).toBe(2);
    expect(loaded.has("node-1")).toBe(true);
  });
});

describe("TaskStorage - Task Objective Item Progress", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load task objective item progress", async () => {
    const progress = {
      "task-1::0::item-a": 2,
      "task-1::1::item-b": 5,
    };

    await storage.saveTaskObjectiveItemProgress(progress);
    const loaded = await storage.loadTaskObjectiveItemProgress();

    expect(loaded["task-1::0::item-a"]).toBe(2);
    expect(loaded["task-1::1::item-b"]).toBe(5);
  });
});

describe("TaskStorage - Achievements", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load completed achievements", async () => {
    const achievements = new Set(["achievement-1", "achievement-2"]);

    await storage.saveCompletedAchievements(achievements);
    const loaded = await storage.loadCompletedAchievements();

    expect(loaded.size).toBe(2);
    expect(loaded.has("achievement-1")).toBe(true);
  });
});

describe("TaskStorage - Prestige Progress", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load prestige progress", async () => {
    const prestigeData = { level: 5, checkpoints: ["cp-1", "cp-2"] };

    await storage.savePrestigeProgress("prestige-1", prestigeData);
    const loaded = await storage.loadPrestigeProgress<typeof prestigeData>(
      "prestige-1"
    );

    expect(loaded).toEqual(prestigeData);
  });

  it("should return null for non-existent prestige", async () => {
    const loaded = await storage.loadPrestigeProgress("non-existent");
    expect(loaded).toBeNull();
  });

  it("should clear all prestige progress", async () => {
    await storage.savePrestigeProgress("prestige-1", { level: 1 });
    await storage.savePrestigeProgress("prestige-2", { level: 2 });

    await storage.clearAllPrestigeProgress();

    const loaded1 = await storage.loadPrestigeProgress("prestige-1");
    const loaded2 = await storage.loadPrestigeProgress("prestige-2");

    expect(loaded1).toBeNull();
    expect(loaded2).toBeNull();
  });
});

describe("TaskStorage - User Preferences", () => {
  let storage: TaskStorage;

  beforeEach(async () => {
    storage = new TaskStorage();
    storage.setProfile("test-profile");
    await storage.init();
  });

  it("should save and load user preferences", async () => {
    const prefs = {
      notes: "Test notes",
      playerLevel: 42,
      enableLevelFilter: true,
      showCompleted: false,
    };

    await storage.saveUserPreferences(prefs);
    const loaded = await storage.loadUserPreferences();

    expect(loaded).toEqual(prefs);
  });

  it("should support partial preference updates", async () => {
    await storage.saveUserPreferences({ notes: "Initial notes" });
    await storage.saveUserPreferences({ playerLevel: 10 });

    const loaded = await storage.loadUserPreferences();

    expect(loaded.notes).toBe("Initial notes");
    expect(loaded.playerLevel).toBe(10);
  });

  it("should clear user preferences", async () => {
    await storage.saveUserPreferences({ notes: "Test", playerLevel: 5 });
    await storage.clearUserPreferences();

    const loaded = await storage.loadUserPreferences();
    expect(Object.keys(loaded).length).toBe(0);
  });
});

describe("TaskStorage - Profile Switching", () => {
  it("should isolate data between profiles", async () => {
    const storage1 = new TaskStorage();
    storage1.setProfile("profile-1");
    await storage1.init();
    await storage1.saveCompletedTasks(new Set(["task-1"]));

    const storage2 = new TaskStorage();
    storage2.setProfile("profile-2");
    await storage2.init();
    await storage2.saveCompletedTasks(new Set(["task-2"]));

    // Load from profile-1
    storage1.setProfile("profile-1");
    await storage1.init();
    const loaded1 = await storage1.loadCompletedTasks();

    // Load from profile-2
    storage2.setProfile("profile-2");
    await storage2.init();
    const loaded2 = await storage2.loadCompletedTasks();

    expect(loaded1.has("task-1")).toBe(true);
    expect(loaded1.has("task-2")).toBe(false);
    expect(loaded2.has("task-2")).toBe(true);
    expect(loaded2.has("task-1")).toBe(false);
  });

  it("should get current profile ID", () => {
    const storage = new TaskStorage();
    storage.setProfile("my-profile");
    expect(storage.getProfileId()).toBe("my-profile");
  });

  it("should use default profile if none specified", async () => {
    const storage = new TaskStorage();
    expect(storage.getProfileId()).toBe("default");
  });
});

describe("TaskStorage - Progress Persistence (Refresh Simulation)", () => {
  const PROFILE_ID = "persistence-test-profile";

  it("should persist tasks after simulated refresh", async () => {
    // Session 1: User marks some tasks complete
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.saveCompletedTasks(new Set(["task-a", "task-b", "task-c"]));

    // Simulate page refresh: create new storage instance, re-init
    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadCompletedTasks();

    expect(loaded.size).toBe(3);
    expect(loaded.has("task-a")).toBe(true);
    expect(loaded.has("task-b")).toBe(true);
    expect(loaded.has("task-c")).toBe(true);
  });

  it("should persist collector items after simulated refresh", async () => {
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.saveCompletedCollectorItems(
      new Set(["item-1", "item-2", "item-3"])
    );

    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadCompletedCollectorItems();

    expect(loaded.size).toBe(3);
    expect(loaded.has("item-1")).toBe(true);
    expect(loaded.has("item-2")).toBe(true);
    expect(loaded.has("item-3")).toBe(true);
  });

  it("should persist hideout items after simulated refresh", async () => {
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.saveCompletedHideoutItems(
      new Set(["hideout-a", "hideout-b"])
    );

    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadCompletedHideoutItems();

    expect(loaded.size).toBe(2);
    expect(loaded.has("hideout-a")).toBe(true);
    expect(loaded.has("hideout-b")).toBe(true);
  });

  it("should persist storyline objectives after simulated refresh", async () => {
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.saveCompletedStorylineObjectives(
      new Set(["obj-1", "obj-2"])
    );

    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadCompletedStorylineObjectives();

    expect(loaded.size).toBe(2);
    expect(loaded.has("obj-1")).toBe(true);
    expect(loaded.has("obj-2")).toBe(true);
  });

  it("should persist prestige progress after simulated refresh", async () => {
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.savePrestigeProgress("prestige-1", {
      level: 15,
      strength: 3,
      endurance: 2,
    });

    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadPrestigeProgress("prestige-1");

    expect(loaded).toEqual({ level: 15, strength: 3, endurance: 2 });
  });

  it("should persist user preferences after simulated refresh", async () => {
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();

    await session1.saveUserPreferences({
      notes: "My game notes",
      playerLevel: 42,
      enableLevelFilter: true,
      showCompleted: false,
    });

    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const loaded = await session2.loadUserPreferences();

    expect(loaded.notes).toBe("My game notes");
    expect(loaded.playerLevel).toBe(42);
    expect(loaded.enableLevelFilter).toBe(true);
    expect(loaded.showCompleted).toBe(false);
  });

  it("should persist incremental task updates after simulated refresh", async () => {
    // Session 1: Mark initial tasks
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();
    await session1.saveCompletedTasks(new Set(["task-1", "task-2"]));

    // Session 2: Add more tasks (simulating user marking more complete)
    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const existing = await session2.loadCompletedTasks();
    existing.add("task-3");
    existing.add("task-4");
    await session2.saveCompletedTasks(existing);

    // Session 3: Verify all tasks persisted
    const session3 = new TaskStorage();
    session3.setProfile(PROFILE_ID);
    await session3.init();

    const loaded = await session3.loadCompletedTasks();

    expect(loaded.size).toBe(4);
    expect(loaded.has("task-1")).toBe(true);
    expect(loaded.has("task-2")).toBe(true);
    expect(loaded.has("task-3")).toBe(true);
    expect(loaded.has("task-4")).toBe(true);
  });

  it("should persist task removal after simulated refresh", async () => {
    // Session 1: Mark tasks complete
    const session1 = new TaskStorage();
    session1.setProfile(PROFILE_ID);
    await session1.init();
    await session1.saveCompletedTasks(new Set(["task-1", "task-2", "task-3"]));

    // Session 2: Remove a task (user unchecks it)
    const session2 = new TaskStorage();
    session2.setProfile(PROFILE_ID);
    await session2.init();

    const existing = await session2.loadCompletedTasks();
    existing.delete("task-2");
    await session2.saveCompletedTasks(existing);

    // Session 3: Verify removal persisted
    const session3 = new TaskStorage();
    session3.setProfile(PROFILE_ID);
    await session3.init();

    const loaded = await session3.loadCompletedTasks();

    expect(loaded.size).toBe(2);
    expect(loaded.has("task-1")).toBe(true);
    expect(loaded.has("task-2")).toBe(false);
    expect(loaded.has("task-3")).toBe(true);
  });
});

describe("ExportImportService - Single Profile", () => {
  beforeEach(async () => {
    // Use the global taskStorage singleton that ExportImportService uses
    taskStorage.setProfile("test-profile");
    await taskStorage.init();

    // Populate with test data
    await taskStorage.saveCompletedTasks(new Set(["task-1", "task-2"]));
    await taskStorage.saveCompletedCollectorItems(new Set(["item-1"]));
    await taskStorage.saveCompletedHideoutItems(new Set(["hideout-1"]));
    await taskStorage.saveCompletedAchievements(new Set(["ach-1"]));
    await taskStorage.saveCompletedStorylineObjectives(new Set(["obj-1"]));
    await taskStorage.saveTaskObjectiveItemProgress({
      "task-1::0::item-a": 2,
    });
    await taskStorage.savePrestigeProgress("prestige-1", { level: 3 });
    await taskStorage.saveUserPreferences({ notes: "Test notes" });
  });

  it("should export all data", async () => {
    const exported = await ExportImportService.exportAllData("Test Profile");

    // Version may vary - just check it exists
    expect(exported.version).toBeDefined();
    expect(exported.profileName).toBe("Test Profile");
    expect(exported.completedTasks).toContain("task-1");
    expect(exported.completedTasks).toContain("task-2");
    expect(exported.completedCollectorItems).toContain("item-1");
    expect(exported.completedHideoutItems).toContain("hideout-1");
    expect(exported.completedAchievements).toContain("ach-1");
    expect(exported.completedStorylineObjectives).toContain("obj-1");
    expect(exported.taskObjectiveItemProgress?.["task-1::0::item-a"]).toBe(2);
    expect(exported.prestigeProgress["prestige-1"]).toEqual({ level: 3 });
    expect(exported.userPreferences.notes).toBe("Test notes");
  });

  it("should import all data", async () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completedTasks: ["task-a", "task-b"],
      completedCollectorItems: ["item-a"],
      completedHideoutItems: ["hideout-a"],
      completedAchievements: ["ach-a"],
      completedStorylineObjectives: ["obj-a"],
      completedStorylineMapNodes: ["node-a"],
      taskObjectiveItemProgress: { "task-b::1::item-c": 1 },
      prestigeProgress: { "prestige-2": { level: 5 } },
      userPreferences: { notes: "Imported notes", playerLevel: 20 },
    };

    await ExportImportService.importAllData(exportData);

    const tasks = await taskStorage.loadCompletedTasks();
    const items = await taskStorage.loadCompletedCollectorItems();
    const progress = await taskStorage.loadTaskObjectiveItemProgress();
    const prefs = await taskStorage.loadUserPreferences();
    const prestige = await taskStorage.loadPrestigeProgress("prestige-2");

    expect(tasks.has("task-a")).toBe(true);
    expect(tasks.has("task-b")).toBe(true);
    expect(items.has("item-a")).toBe(true);
    expect(progress["task-b::1::item-c"]).toBe(1);
    expect(prefs.notes).toBe("Imported notes");
    expect(prefs.playerLevel).toBe(20);
    expect(prestige).toEqual({ level: 5 });
  });

  it("should handle import with missing fields gracefully", async () => {
    const partialExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completedTasks: ["task-x"],
      completedCollectorItems: [],
      completedHideoutItems: [],
      completedAchievements: [],
      completedStorylineObjectives: [],
      completedStorylineMapNodes: [],
      prestigeProgress: {},
      userPreferences: {},
    };

    await expect(
      ExportImportService.importAllData(partialExport)
    ).resolves.not.toThrow();

    const tasks = await taskStorage.loadCompletedTasks();
    expect(tasks.size).toBe(1);
    expect(tasks.has("task-x")).toBe(true);
  });

  it("should throw on invalid export data", async () => {
    await expect(
      ExportImportService.importAllData(null as unknown as ExportData)
    ).rejects.toThrow("Invalid export data");
  });
});

describe("ExportImportService - File Operations", () => {
  it("should identify all-profiles export", () => {
    const allProfiles = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles: [],
      activeProfileId: "test",
    };

    expect(ExportImportService.isAllProfilesExport(allProfiles)).toBe(true);
  });

  it("should identify single profile export", () => {
    const singleProfile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completedTasks: [],
      completedCollectorItems: [],
      completedHideoutItems: [],
      completedAchievements: [],
      completedStorylineObjectives: [],
      completedStorylineMapNodes: [],
      prestigeProgress: {},
      userPreferences: {},
    };

    expect(ExportImportService.isAllProfilesExport(singleProfile)).toBe(false);
  });

  it("should read and parse import file", async () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completedTasks: ["task-1"],
      completedCollectorItems: [],
      completedHideoutItems: [],
      completedAchievements: [],
      completedStorylineObjectives: [],
      completedStorylineMapNodes: [],
      prestigeProgress: {},
      userPreferences: {},
    };

    const jsonString = JSON.stringify(exportData);
    const file = new File([jsonString], "test-export.json", {
      type: "application/json",
    });

    const parsed = await ExportImportService.readImportFile(file);

    expect(parsed.version).toBeDefined();
    if (ExportImportService.isAllProfilesExport(parsed)) {
      throw new Error("Expected single profile export");
    }
    expect(parsed.completedTasks[0]).toBe("task-1");
  });

  it("should reject invalid JSON files", async () => {
    const file = new File(["invalid json {"], "bad.json", {
      type: "application/json",
    });

    await expect(ExportImportService.readImportFile(file)).rejects.toThrow(
      "Failed to parse"
    );
  });
});
