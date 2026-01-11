import { isProfileDeleted } from "./profile";

const DB_BASE_NAME = "TarkovQuests";
const DB_VERSION = 12;
const TASKS_STORE = "completedTasks";
const COLLECTOR_STORE = "completedCollectorItems";
const PRESTIGE_STORE = "prestigeProgress";
const ACHIEVEMENTS_STORE = "completedAchievements";
const HIDEOUT_ITEMS_STORE = "completedHideoutItems";
const HIDEOUT_ITEM_QUANTITIES_STORE = "hideoutItemQuantities";
const STORYLINE_OBJECTIVES_STORE = "completedStorylineObjectives";
const STORYLINE_MAP_NODES_STORE = "completedStorylineMapNodes";
const USER_PREFS_STORE = "userPreferences";
const WORKING_ON_STORE = "workingOnItems";
const TASK_OBJECTIVES_STORE = "completedTaskObjectives";
const TASK_OBJECTIVE_ITEM_PROGRESS_STORE = "taskObjectiveItemProgress";

// User preferences interface for export/import
export interface UserPreferences {
  notes: string;
  playerLevel: number;
  enableLevelFilter: boolean;
  showCompleted: boolean;
  showEvents: boolean;
}

export class TaskStorage {
  private db: IDBDatabase | null = null;
  private profileId: string = "default";

  getProfileId(): string {
    return this.profileId;
  }

  setProfile(profileId: string) {
    if (this.profileId !== profileId) {
      try {
        this.db?.close();
      } catch {
        /* ignore close errors */
      }
      this.db = null;
      this.profileId = profileId || "default";
    }
  }

  private getDbName(): string {
    return `${DB_BASE_NAME}_${this.profileId}`;
  }

  async init(): Promise<void> {
    // Skip if already initialized with a valid connection
    if (this.db) {
      return;
    }

    // Prevent loading data from archived/deleted profiles
    if (isProfileDeleted(this.profileId)) {
      console.warn(
        `[Storage] Profile ${this.profileId} is archived, skipping DB init`
      );
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.getDbName(), DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          db.createObjectStore(TASKS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(COLLECTOR_STORE)) {
          db.createObjectStore(COLLECTOR_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(PRESTIGE_STORE)) {
          db.createObjectStore(PRESTIGE_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(ACHIEVEMENTS_STORE)) {
          db.createObjectStore(ACHIEVEMENTS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(HIDEOUT_ITEMS_STORE)) {
          db.createObjectStore(HIDEOUT_ITEMS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORYLINE_OBJECTIVES_STORE)) {
          db.createObjectStore(STORYLINE_OBJECTIVES_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORYLINE_MAP_NODES_STORE)) {
          db.createObjectStore(STORYLINE_MAP_NODES_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(USER_PREFS_STORE)) {
          db.createObjectStore(USER_PREFS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(WORKING_ON_STORE)) {
          db.createObjectStore(WORKING_ON_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(TASK_OBJECTIVES_STORE)) {
          db.createObjectStore(TASK_OBJECTIVES_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(TASK_OBJECTIVE_ITEM_PROGRESS_STORE)) {
          db.createObjectStore(TASK_OBJECTIVE_ITEM_PROGRESS_STORE, {
            keyPath: "id",
          });
        }
        if (!db.objectStoreNames.contains(HIDEOUT_ITEM_QUANTITIES_STORE)) {
          db.createObjectStore(HIDEOUT_ITEM_QUANTITIES_STORE, {
            keyPath: "id",
          });
        }
      };
    });
  }

  async saveCompletedTasks(completedTasks: Set<string>): Promise<void> {
    if (!this.db) await this.init();

    console.debug(
      `[Storage] Saving ${completedTasks.size} tasks to profile ${this.profileId}`
    );

    const transaction = this.db!.transaction([TASKS_STORE], "readwrite");
    const store = transaction.objectStore(TASKS_STORE);

    await store.clear();

    for (const taskId of completedTasks) {
      await store.add({ id: taskId, completed: true });
    }
  }

  async loadCompletedTasks(): Promise<Set<string>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], "readonly");
      const store = transaction.objectStore(TASKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const completedTasks = new Set<string>();
        request.result.forEach((item: { id: string }) => {
          completedTasks.add(item.id);
        });
        resolve(completedTasks);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveCompletedCollectorItems(
    completedItems: Set<string>
  ): Promise<void> {
    if (!this.db) await this.init();

    console.debug(
      `[Storage] Saving ${completedItems.size} collector items to profile ${this.profileId}`
    );

    const transaction = this.db!.transaction([COLLECTOR_STORE], "readwrite");
    const store = transaction.objectStore(COLLECTOR_STORE);

    await store.clear();

    for (const itemName of completedItems) {
      await store.add({ id: itemName, completed: true });
    }
  }

  async loadCompletedCollectorItems(): Promise<Set<string>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COLLECTOR_STORE], "readonly");
      const store = transaction.objectStore(COLLECTOR_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const completedItems = new Set<string>();
        request.result.forEach((item: { id: string }) => {
          completedItems.add(item.id);
        });
        console.debug(
          `[Storage] Loaded ${completedItems.size} collector items from profile ${this.profileId}`
        );
        resolve(completedItems);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async savePrestigeProgress(id: string, data: unknown): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PRESTIGE_STORE], "readwrite");
    const store = tx.objectStore(PRESTIGE_STORE);
    await store.put({ id, data });
  }

  async loadPrestigeProgress<T = unknown>(id: string): Promise<T | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PRESTIGE_STORE], "readonly");
      const store = tx.objectStore(PRESTIGE_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve((req.result?.data as T) ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllPrestigeProgress(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PRESTIGE_STORE], "readwrite");
    const store = tx.objectStore(PRESTIGE_STORE);
    await store.clear();
  }

  async saveCompletedAchievements(completed: Set<string>): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([ACHIEVEMENTS_STORE], "readwrite");
    const store = tx.objectStore(ACHIEVEMENTS_STORE);
    await store.clear();
    for (const id of completed) {
      await store.add({ id, completed: true });
    }
  }

  async loadCompletedAchievements(): Promise<Set<string>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([ACHIEVEMENTS_STORE], "readonly");
      const store = tx.objectStore(ACHIEVEMENTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const set = new Set<string>();
        req.result.forEach((item: { id: string }) => set.add(item.id));
        resolve(set);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveCompletedHideoutItems(completedItems: Set<string>): Promise<void> {
    if (!this.db) await this.init();

    console.debug(
      `[Storage] Saving ${completedItems.size} hideout items to profile ${this.profileId}`
    );

    const tx = this.db!.transaction([HIDEOUT_ITEMS_STORE], "readwrite");
    const store = tx.objectStore(HIDEOUT_ITEMS_STORE);
    await store.clear();
    for (const id of completedItems) {
      await store.add({ id, completed: true });
    }
  }

  async loadCompletedHideoutItems(): Promise<Set<string>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HIDEOUT_ITEMS_STORE], "readonly");
      const store = tx.objectStore(HIDEOUT_ITEMS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const completed = new Set<string>();
        req.result.forEach((item: { id: string }) => {
          completed.add(item.id);
        });
        console.debug(
          `[Storage] Loaded ${completed.size} hideout items from profile ${this.profileId}`
        );
        resolve(completed);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveCompletedStorylineObjectives(
    completedObjectives: Set<string>
  ): Promise<void> {
    if (!this.db) await this.init();

    console.debug(
      `[Storage] Saving ${completedObjectives.size} storyline objectives to profile ${this.profileId}`
    );

    const transaction = this.db!.transaction(
      [STORYLINE_OBJECTIVES_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORYLINE_OBJECTIVES_STORE);

    await store.clear();

    for (const objectiveId of completedObjectives) {
      await store.add({ id: objectiveId, completed: true });
    }
  }

  async loadCompletedStorylineObjectives(): Promise<Set<string>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORYLINE_OBJECTIVES_STORE],
        "readonly"
      );
      const store = transaction.objectStore(STORYLINE_OBJECTIVES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const completed = new Set<string>();
        request.result.forEach((item: { id: string }) => {
          completed.add(item.id);
        });
        console.debug(
          `[Storage] Loaded ${completed.size} storyline objectives from profile ${this.profileId}`
        );
        resolve(completed);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveCompletedStorylineMapNodes(
    completedNodes: Set<string>
  ): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(
      [STORYLINE_MAP_NODES_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORYLINE_MAP_NODES_STORE);

    await store.clear();

    for (const nodeId of completedNodes) {
      await store.add({ id: nodeId, completed: true });
    }
  }

  async loadCompletedStorylineMapNodes(): Promise<Set<string>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORYLINE_MAP_NODES_STORE],
        "readonly"
      );
      const store = transaction.objectStore(STORYLINE_MAP_NODES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const completed = new Set<string>();
        request.result.forEach((item: { id: string }) => {
          completed.add(item.id);
        });
        resolve(completed);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveCompletedTaskObjectives(
    completedObjectives: Set<string>
  ): Promise<void> {
    if (!this.db) await this.init();

    console.debug(
      `[Storage] Saving ${completedObjectives.size} task objectives to profile ${this.profileId}`
    );

    const tx = this.db!.transaction([TASK_OBJECTIVES_STORE], "readwrite");
    const store = tx.objectStore(TASK_OBJECTIVES_STORE);
    await store.clear();
    for (const id of completedObjectives) {
      await store.add({ id, completed: true });
    }
  }

  async loadCompletedTaskObjectives(): Promise<Set<string>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([TASK_OBJECTIVES_STORE], "readonly");
      const store = tx.objectStore(TASK_OBJECTIVES_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const completed = new Set<string>();
        req.result.forEach((item: { id: string }) => {
          completed.add(item.id);
        });
        console.debug(
          `[Storage] Loaded ${completed.size} task objectives from profile ${this.profileId}`
        );
        resolve(completed);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveTaskObjectiveItemProgress(
    progress: Record<string, number>
  ): Promise<void> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction(
      [TASK_OBJECTIVE_ITEM_PROGRESS_STORE],
      "readwrite"
    );
    const store = tx.objectStore(TASK_OBJECTIVE_ITEM_PROGRESS_STORE);
    await store.clear();
    for (const [id, count] of Object.entries(progress)) {
      if (!Number.isFinite(count) || count <= 0) continue;
      await store.add({ id, count });
    }
  }

  async loadTaskObjectiveItemProgress(): Promise<Record<string, number>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        [TASK_OBJECTIVE_ITEM_PROGRESS_STORE],
        "readonly"
      );
      const store = tx.objectStore(TASK_OBJECTIVE_ITEM_PROGRESS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const progress: Record<string, number> = {};
        req.result.forEach((item: { id: string; count?: number }) => {
          if (Number.isFinite(item.count)) {
            progress[item.id] = Number(item.count);
          }
        });
        resolve(progress);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveHideoutItemQuantities(
    quantities: Record<string, number>
  ): Promise<void> {
    if (!this.db) await this.init();

    // Skip if the store doesn't exist yet (backwards compatibility)
    if (!this.db!.objectStoreNames.contains(HIDEOUT_ITEM_QUANTITIES_STORE)) {
      console.warn(
        "[Storage] HIDEOUT_ITEM_QUANTITIES_STORE not found, skipping save. Database may need upgrade."
      );
      return;
    }

    const tx = this.db!.transaction(
      [HIDEOUT_ITEM_QUANTITIES_STORE],
      "readwrite"
    );
    const store = tx.objectStore(HIDEOUT_ITEM_QUANTITIES_STORE);
    await store.clear();
    for (const [id, count] of Object.entries(quantities)) {
      if (!Number.isFinite(count) || count <= 0) continue;
      await store.add({ id, count });
    }
  }

  async loadHideoutItemQuantities(): Promise<Record<string, number>> {
    if (!this.db) await this.init();

    // Return empty object if the store doesn't exist yet (backwards compatibility)
    if (!this.db!.objectStoreNames.contains(HIDEOUT_ITEM_QUANTITIES_STORE)) {
      return {};
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        [HIDEOUT_ITEM_QUANTITIES_STORE],
        "readonly"
      );
      const store = tx.objectStore(HIDEOUT_ITEM_QUANTITIES_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const quantities: Record<string, number> = {};
        req.result.forEach((item: { id: string; count?: number }) => {
          if (Number.isFinite(item.count)) {
            quantities[item.id] = Number(item.count);
          }
        });
        resolve(quantities);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // User preferences (notes, player level, filters)
  async saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USER_PREFS_STORE], "readwrite");
      const store = tx.objectStore(USER_PREFS_STORE);

      // Save each preference as a separate entry for granular updates
      for (const [key, value] of Object.entries(prefs)) {
        store.put({ id: key, value });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadUserPreferences(): Promise<Partial<UserPreferences>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USER_PREFS_STORE], "readonly");
      const store = tx.objectStore(USER_PREFS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const prefs: Partial<UserPreferences> = {};
        req.result.forEach((item: { id: string; value: unknown }) => {
          if (item.id === "notes") prefs.notes = item.value as string;
          else if (item.id === "playerLevel")
            prefs.playerLevel = item.value as number;
          else if (item.id === "enableLevelFilter")
            prefs.enableLevelFilter = item.value as boolean;
          else if (item.id === "showCompleted")
            prefs.showCompleted = item.value as boolean;
          else if (item.id === "showEvents")
            prefs.showEvents = item.value as boolean;
        });
        resolve(prefs);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearUserPreferences(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([USER_PREFS_STORE], "readwrite");
      const store = tx.objectStore(USER_PREFS_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Working on items (currently working towards)
  async saveWorkingOnItems(data: {
    tasks: Set<string>;
    storylineObjectives: Set<string>;
    collectorItems: Set<string>;
    hideoutStations: Set<string>;
  }): Promise<void> {
    if (!this.db) await this.init();

    // Skip if the store doesn't exist yet (backwards compatibility)
    if (!this.db!.objectStoreNames.contains(WORKING_ON_STORE)) {
      console.warn(
        "[Storage] WORKING_ON_STORE not found, skipping save. Database may need upgrade."
      );
      return;
    }

    const tx = this.db!.transaction([WORKING_ON_STORE], "readwrite");
    const store = tx.objectStore(WORKING_ON_STORE);

    // Save each category as a separate entry
    await store.put({ id: "tasks", items: Array.from(data.tasks) });
    await store.put({
      id: "storylineObjectives",
      items: Array.from(data.storylineObjectives),
    });
    await store.put({
      id: "collectorItems",
      items: Array.from(data.collectorItems),
    });
    await store.put({
      id: "hideoutStations",
      items: Array.from(data.hideoutStations),
    });
  }

  async loadWorkingOnItems(): Promise<{
    tasks: Set<string>;
    storylineObjectives: Set<string>;
    collectorItems: Set<string>;
    hideoutStations: Set<string>;
  }> {
    if (!this.db) await this.init();

    // Return empty sets if the store doesn't exist (backwards compatibility)
    if (!this.db!.objectStoreNames.contains(WORKING_ON_STORE)) {
      return {
        tasks: new Set<string>(),
        storylineObjectives: new Set<string>(),
        collectorItems: new Set<string>(),
        hideoutStations: new Set<string>(),
      };
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([WORKING_ON_STORE], "readonly");
      const store = tx.objectStore(WORKING_ON_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = {
          tasks: new Set<string>(),
          storylineObjectives: new Set<string>(),
          collectorItems: new Set<string>(),
          hideoutStations: new Set<string>(),
        };

        req.result.forEach((item: { id: string; items: string[] }) => {
          if (item.id === "tasks") result.tasks = new Set(item.items || []);
          else if (item.id === "storylineObjectives")
            result.storylineObjectives = new Set(item.items || []);
          else if (item.id === "collectorItems")
            result.collectorItems = new Set(item.items || []);
          else if (item.id === "hideoutStations")
            result.hideoutStations = new Set(item.items || []);
        });

        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearWorkingOnItems(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([WORKING_ON_STORE], "readwrite");
    const store = tx.objectStore(WORKING_ON_STORE);
    await store.clear();
  }
}

// Export data interface for backup/restore (single profile)
export interface ExportData {
  version: number;
  exportedAt: string;
  profileName?: string;
  profileId?: string;
  completedTasks: string[];
  completedCollectorItems: string[];
  completedHideoutItems: string[];
  completedAchievements: string[];
  completedStorylineObjectives: string[];
  completedStorylineMapNodes: string[];
  taskObjectiveItemProgress?: Record<string, number>;
  hideoutItemQuantities?: Record<string, number>;
  prestigeProgress: Record<string, unknown>;
  userPreferences: Partial<UserPreferences>;
  workingOnItems?: {
    tasks: string[];
    storylineObjectives: string[];
    collectorItems: string[];
    hideoutStations: string[];
  };
}

// Export data interface for all profiles bundle
export interface AllProfilesExportData {
  version: number;
  exportedAt: string;
  profiles: Array<{
    id: string;
    name: string;
    createdAt: number;
    data: ExportData;
  }>;
  activeProfileId: string;
}

const EXPORT_VERSION = 1;

export class ExportImportService {
  /**
   * Export all user progression data from the current profile
   */
  static async exportAllData(profileName?: string): Promise<ExportData> {
    await taskStorage.init();

    // Load all data stores
    const [
      completedTasks,
      completedCollectorItems,
      completedHideoutItems,
      completedAchievements,
      completedStorylineObjectives,
      completedStorylineMapNodes,
      taskObjectiveItemProgress,
      hideoutItemQuantities,
      userPreferences,
      workingOnItems,
    ] = await Promise.all([
      taskStorage.loadCompletedTasks(),
      taskStorage.loadCompletedCollectorItems(),
      taskStorage.loadCompletedHideoutItems(),
      taskStorage.loadCompletedAchievements(),
      taskStorage.loadCompletedStorylineObjectives(),
      taskStorage.loadCompletedStorylineMapNodes(),
      taskStorage.loadTaskObjectiveItemProgress(),
      taskStorage.loadHideoutItemQuantities(),
      taskStorage.loadUserPreferences(),
      taskStorage.loadWorkingOnItems(),
    ]);

    // Load prestige progress for all prestiges (prestige-1 through prestige-6)
    const prestigeProgress: Record<string, unknown> = {};
    for (let i = 1; i <= 6; i++) {
      const prestigeId = `prestige-${i}`;
      const data = await taskStorage.loadPrestigeProgress(prestigeId);
      if (data) {
        prestigeProgress[prestigeId] = data;
      }
    }

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      profileName,
      completedTasks: Array.from(completedTasks),
      completedCollectorItems: Array.from(completedCollectorItems),
      completedHideoutItems: Array.from(completedHideoutItems),
      completedAchievements: Array.from(completedAchievements),
      completedStorylineObjectives: Array.from(completedStorylineObjectives),
      completedStorylineMapNodes: Array.from(completedStorylineMapNodes),
      taskObjectiveItemProgress,
      hideoutItemQuantities,
      prestigeProgress,
      userPreferences,
      workingOnItems: {
        tasks: Array.from(workingOnItems.tasks),
        storylineObjectives: Array.from(workingOnItems.storylineObjectives),
        collectorItems: Array.from(workingOnItems.collectorItems),
        hideoutStations: Array.from(workingOnItems.hideoutStations),
      },
    };
  }

  /**
   * Import user progression data into the current profile
   * Returns true if successful, throws on error
   */
  static async importAllData(data: ExportData): Promise<void> {
    // Validate the data structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid export data format");
    }

    if (data.version !== EXPORT_VERSION) {
      console.warn(
        `Export version mismatch: expected ${EXPORT_VERSION}, got ${data.version}`
      );
      // Continue anyway for forward compatibility
    }

    await taskStorage.init();

    // Import all data stores
    await Promise.all([
      taskStorage.saveCompletedTasks(new Set(data.completedTasks || [])),
      taskStorage.saveCompletedCollectorItems(
        new Set(data.completedCollectorItems || [])
      ),
      taskStorage.saveCompletedHideoutItems(
        new Set(data.completedHideoutItems || [])
      ),
      taskStorage.saveCompletedAchievements(
        new Set(data.completedAchievements || [])
      ),
      taskStorage.saveCompletedStorylineObjectives(
        new Set(data.completedStorylineObjectives || [])
      ),
      taskStorage.saveCompletedStorylineMapNodes(
        new Set(data.completedStorylineMapNodes || [])
      ),
      taskStorage.saveTaskObjectiveItemProgress(
        data.taskObjectiveItemProgress || {}
      ),
      taskStorage.saveHideoutItemQuantities(data.hideoutItemQuantities || {}),
    ]);

    // Import working on items (backward compatible)
    if (data.workingOnItems) {
      await taskStorage.saveWorkingOnItems({
        tasks: new Set(data.workingOnItems.tasks || []),
        storylineObjectives: new Set(
          data.workingOnItems.storylineObjectives || []
        ),
        collectorItems: new Set(data.workingOnItems.collectorItems || []),
        hideoutStations: new Set(data.workingOnItems.hideoutStations || []),
      });
    }

    // Import prestige progress
    if (data.prestigeProgress) {
      for (const [prestigeId, progressData] of Object.entries(
        data.prestigeProgress
      )) {
        await taskStorage.savePrestigeProgress(prestigeId, progressData);
      }
    }

    // Import user preferences
    if (data.userPreferences) {
      await taskStorage.saveUserPreferences(data.userPreferences);
    }
  }

  /**
   * Download export data as a JSON file
   */
  static downloadExport(data: ExportData, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const safeName = (data.profileName || "profile")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const defaultFilename = `eft-tracker-${safeName}-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Read and parse an import file (single profile or all profiles)
   */
  static async readImportFile(
    file: File
  ): Promise<ExportData | AllProfilesExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);

          // Basic validation
          if (!data.version || !data.exportedAt) {
            throw new Error("Invalid file format: missing required fields");
          }

          // Check if it's an all-profiles export
          if ("profiles" in data && Array.isArray(data.profiles)) {
            resolve(data as AllProfilesExportData);
          } else {
            resolve(data as ExportData);
          }
        } catch (err) {
          reject(
            new Error(
              `Failed to parse file: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            )
          );
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  /**
   * Check if data is an all-profiles export
   */
  static isAllProfilesExport(
    data: ExportData | AllProfilesExportData
  ): data is AllProfilesExportData {
    return "profiles" in data && Array.isArray(data.profiles);
  }

  /**
   * Export all profiles data into a single bundle
   */
  static async exportAllProfiles(
    profiles: Array<{ id: string; name: string; createdAt: number }>,
    activeProfileId: string
  ): Promise<AllProfilesExportData> {
    const exportedProfiles: AllProfilesExportData["profiles"] = [];

    // Save current profile to restore later
    const originalProfileId = taskStorage["profileId"];

    for (const profile of profiles) {
      // Switch to this profile's database
      taskStorage.setProfile(profile.id);
      await taskStorage.init();

      // Export its data
      const data = await this.exportAllData(profile.name);
      data.profileId = profile.id;

      exportedProfiles.push({
        id: profile.id,
        name: profile.name,
        createdAt: profile.createdAt,
        data,
      });
    }

    // Restore original profile
    taskStorage.setProfile(originalProfileId);
    await taskStorage.init();

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      profiles: exportedProfiles,
      activeProfileId,
    };
  }

  /**
   * Download all profiles export as a JSON file
   */
  static downloadAllProfilesExport(
    data: AllProfilesExportData,
    filename?: string
  ): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    const defaultFilename = `eft-tracker-all-profiles-${date}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const taskStorage = new TaskStorage();

// One-time migration from legacy single-DB (TarkovQuests) into the first profile DB
const LEGACY_DB_NAME = "TarkovQuests";
const LEGACY_DEFAULT_DB_NAME = "TarkovQuests_default";
const MIGRATION_FLAG = "taskTracker_profile_migrated_v1";
const MIGRATION_DEFAULT_FLAG = "taskTracker_default_migrated_v1";

export async function migrateLegacyDataIfNeeded(
  targetProfileId: string
): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === "1") return;
  } catch {
    // continue
  }
  // If the legacy DB doesn't exist, bail
  const legacyExists = await new Promise<boolean>((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME);
    let existed = true;
    req.onupgradeneeded = () => {
      // onupgradeneeded only fires when DB didn't exist; abort creation
      existed = false;
      req.transaction?.abort();
    };
    req.onsuccess = () => {
      req.result.close();
      resolve(existed);
    };
    req.onerror = () => resolve(false);
  });
  if (!legacyExists) {
    try {
      localStorage.setItem(MIGRATION_FLAG, "1");
    } catch {
      /* ignore localStorage errors */
    }
    return;
  }

  // Open legacy and read stores, then write into profile-scoped DB
  const readStoreAll = <T>(db: IDBDatabase, storeName: string) =>
    new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction([storeName], "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });

  await new Promise<void>((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME, DB_VERSION);
    req.onsuccess = async () => {
      const legacyDb = req.result;
      try {
        const tasks = await readStoreAll<{ id: string }>(
          legacyDb,
          TASKS_STORE
        ).catch(() => []);
        const col = await readStoreAll<{ id: string }>(
          legacyDb,
          COLLECTOR_STORE
        ).catch(() => []);
        const ach = await readStoreAll<{ id: string }>(
          legacyDb,
          ACHIEVEMENTS_STORE
        ).catch(() => []);
        const pres = await readStoreAll<{ id: string; data: unknown }>(
          legacyDb,
          PRESTIGE_STORE
        ).catch(() => []);

        const t = new TaskStorage();
        t.setProfile(targetProfileId);
        await t.init();
        await t.saveCompletedTasks(new Set(tasks.map((x) => x.id)));
        await t.saveCompletedCollectorItems(new Set(col.map((x) => x.id)));
        await t.saveCompletedAchievements(new Set(ach.map((x) => x.id)));
        for (const p of pres) {
          await t.savePrestigeProgress(p.id, p.data);
        }

        try {
          localStorage.setItem(MIGRATION_FLAG, "1");
        } catch {
          /* ignore localStorage errors */
        }
      } catch {
        // ignore migration errors; do not block app
      } finally {
        legacyDb.close();
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}

/**
 * Migrate data from TarkovQuests_default database (if it exists) into the active profile.
 * This handles edge cases where data may have been saved before profile was properly set.
 */
export async function migrateDefaultDbIfNeeded(
  targetProfileId: string
): Promise<void> {
  // Skip if already migrated or if target is "default" (would be same DB)
  if (targetProfileId === "default") return;
  try {
    if (localStorage.getItem(MIGRATION_DEFAULT_FLAG) === "1") return;
  } catch {
    // continue
  }

  // Check if the default DB exists and has data
  const defaultDbExists = await new Promise<boolean>((resolve) => {
    const req = indexedDB.open(LEGACY_DEFAULT_DB_NAME);
    let existed = true;
    req.onupgradeneeded = () => {
      existed = false;
      req.transaction?.abort();
    };
    req.onsuccess = () => {
      req.result.close();
      resolve(existed);
    };
    req.onerror = () => resolve(false);
  });

  if (!defaultDbExists) {
    try {
      localStorage.setItem(MIGRATION_DEFAULT_FLAG, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  // Read from default DB and merge into target profile
  const readStoreAll = <T>(db: IDBDatabase, storeName: string) =>
    new Promise<T[]>((resolve, reject) => {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      const tx = db.transaction([storeName], "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });

  await new Promise<void>((resolve) => {
    const req = indexedDB.open(LEGACY_DEFAULT_DB_NAME, DB_VERSION);
    req.onsuccess = async () => {
      const defaultDb = req.result;
      try {
        const tasks = await readStoreAll<{ id: string }>(
          defaultDb,
          TASKS_STORE
        ).catch(() => []);

        // Only migrate if there's actually data in the default DB
        if (tasks.length === 0) {
          try {
            localStorage.setItem(MIGRATION_DEFAULT_FLAG, "1");
          } catch {
            /* ignore */
          }
          defaultDb.close();
          resolve();
          return;
        }

        const col = await readStoreAll<{ id: string }>(
          defaultDb,
          COLLECTOR_STORE
        ).catch(() => []);
        const ach = await readStoreAll<{ id: string }>(
          defaultDb,
          ACHIEVEMENTS_STORE
        ).catch(() => []);
        const pres = await readStoreAll<{ id: string; data: unknown }>(
          defaultDb,
          PRESTIGE_STORE
        ).catch(() => []);
        const hideout = await readStoreAll<{ id: string }>(
          defaultDb,
          HIDEOUT_ITEMS_STORE
        ).catch(() => []);
        const storylineObj = await readStoreAll<{ id: string }>(
          defaultDb,
          STORYLINE_OBJECTIVES_STORE
        ).catch(() => []);
        const storylineMap = await readStoreAll<{ id: string }>(
          defaultDb,
          STORYLINE_MAP_NODES_STORE
        ).catch(() => []);

        // Load existing data from target profile to merge (not overwrite)
        const t = new TaskStorage();
        t.setProfile(targetProfileId);
        await t.init();

        const existingTasks = await t.loadCompletedTasks();
        const existingCol = await t.loadCompletedCollectorItems();
        const existingAch = await t.loadCompletedAchievements();
        const existingHideout = await t.loadCompletedHideoutItems();
        const existingStorylineObj = await t.loadCompletedStorylineObjectives();
        const existingStorylineMap = await t.loadCompletedStorylineMapNodes();

        // Merge: add items from default DB to existing sets
        tasks.forEach((x) => existingTasks.add(x.id));
        col.forEach((x) => existingCol.add(x.id));
        ach.forEach((x) => existingAch.add(x.id));
        hideout.forEach((x) => existingHideout.add(x.id));
        storylineObj.forEach((x) => existingStorylineObj.add(x.id));
        storylineMap.forEach((x) => existingStorylineMap.add(x.id));

        // Save merged data
        await t.saveCompletedTasks(existingTasks);
        await t.saveCompletedCollectorItems(existingCol);
        await t.saveCompletedAchievements(existingAch);
        await t.saveCompletedHideoutItems(existingHideout);
        await t.saveCompletedStorylineObjectives(existingStorylineObj);
        await t.saveCompletedStorylineMapNodes(existingStorylineMap);

        // Merge prestige progress
        for (const p of pres) {
          const existing = await t.loadPrestigeProgress(p.id);
          if (!existing || Object.keys(existing).length === 0) {
            await t.savePrestigeProgress(p.id, p.data);
          }
        }

        console.log(
          `[Migration] Migrated ${tasks.length} tasks from default DB to profile ${targetProfileId}`
        );

        try {
          localStorage.setItem(MIGRATION_DEFAULT_FLAG, "1");
        } catch {
          /* ignore */
        }

        // Delete the default DB after successful migration to prevent future leaks
        defaultDb.close();
        try {
          const deleteReq = indexedDB.deleteDatabase(LEGACY_DEFAULT_DB_NAME);
          deleteReq.onsuccess = () => {
            console.log("[Migration] Deleted TarkovQuests_default database");
          };
          deleteReq.onerror = () => {
            console.warn("[Migration] Failed to delete TarkovQuests_default");
          };
        } catch {
          /* ignore delete errors */
        }
        resolve();
        return;
      } catch (err) {
        console.error("[Migration] Error migrating default DB:", err);
      } finally {
        defaultDb.close();
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}
