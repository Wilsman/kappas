const DB_BASE_NAME = 'TarkovQuests';
const DB_VERSION = 4;
const TASKS_STORE = 'completedTasks';
const COLLECTOR_STORE = 'completedCollectorItems';
const PRESTIGE_STORE = 'prestigeProgress';
const ACHIEVEMENTS_STORE = 'completedAchievements';

export class TaskStorage {
  private db: IDBDatabase | null = null;
  private profileId: string = 'default';

  setProfile(profileId: string) {
    if (this.profileId !== profileId) {
      try {
        this.db?.close();
      } catch {}
      this.db = null;
      this.profileId = profileId || 'default';
    }
  }

  private getDbName(): string {
    return `${DB_BASE_NAME}_${this.profileId}`;
  }

  async init(): Promise<void> {
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
          db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(COLLECTOR_STORE)) {
          db.createObjectStore(COLLECTOR_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PRESTIGE_STORE)) {
          db.createObjectStore(PRESTIGE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(ACHIEVEMENTS_STORE)) {
          db.createObjectStore(ACHIEVEMENTS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async saveCompletedTasks(completedTasks: Set<string>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([TASKS_STORE], 'readwrite');
    const store = transaction.objectStore(TASKS_STORE);
    
    await store.clear();
    
    for (const taskId of completedTasks) {
      await store.add({ id: taskId, completed: true });
    }
  }

  async loadCompletedTasks(): Promise<Set<string>> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TASKS_STORE], 'readonly');
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

  async saveCompletedCollectorItems(completedItems: Set<string>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([COLLECTOR_STORE], 'readwrite');
    const store = transaction.objectStore(COLLECTOR_STORE);
    
    await store.clear();
    
    for (const itemName of completedItems) {
      await store.add({ id: itemName, completed: true });
    }
  }

  async loadCompletedCollectorItems(): Promise<Set<string>> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([COLLECTOR_STORE], 'readonly');
      const store = transaction.objectStore(COLLECTOR_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const completedItems = new Set<string>();
        request.result.forEach((item: { id: string }) => {
          completedItems.add(item.id);
        });
        resolve(completedItems);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async savePrestigeProgress(id: string, data: unknown): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PRESTIGE_STORE], 'readwrite');
    const store = tx.objectStore(PRESTIGE_STORE);
    await store.put({ id, data });
  }

  async loadPrestigeProgress<T = unknown>(id: string): Promise<T | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PRESTIGE_STORE], 'readonly');
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
    const tx = this.db!.transaction([PRESTIGE_STORE], 'readwrite');
    const store = tx.objectStore(PRESTIGE_STORE);
    await store.clear();
  }

  async saveCompletedAchievements(completed: Set<string>): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([ACHIEVEMENTS_STORE], 'readwrite');
    const store = tx.objectStore(ACHIEVEMENTS_STORE);
    await store.clear();
    for (const id of completed) {
      await store.add({ id, completed: true });
    }
  }

  async loadCompletedAchievements(): Promise<Set<string>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([ACHIEVEMENTS_STORE], 'readonly');
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
}

export const taskStorage = new TaskStorage();

// One-time migration from legacy single-DB (TarkovQuests) into the first profile DB
const LEGACY_DB_NAME = 'TarkovQuests';
const MIGRATION_FLAG = 'taskTracker_profile_migrated_v1';

export async function migrateLegacyDataIfNeeded(targetProfileId: string): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === '1') return;
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
    try { localStorage.setItem(MIGRATION_FLAG, '1'); } catch {}
    return;
  }

  // Open legacy and read stores, then write into profile-scoped DB
  const readStoreAll = <T,>(db: IDBDatabase, storeName: string) => new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
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
        const tasks = await readStoreAll<{ id: string }>(legacyDb, TASKS_STORE).catch(() => []);
        const col = await readStoreAll<{ id: string }>(legacyDb, COLLECTOR_STORE).catch(() => []);
        const ach = await readStoreAll<{ id: string }>(legacyDb, ACHIEVEMENTS_STORE).catch(() => []);
        const pres = await readStoreAll<{ id: string; data: unknown }>(legacyDb, PRESTIGE_STORE).catch(() => []);

        const t = new TaskStorage();
        t.setProfile(targetProfileId);
        await t.init();
        await t.saveCompletedTasks(new Set(tasks.map(x => x.id)));
        await t.saveCompletedCollectorItems(new Set(col.map(x => x.id)));
        await t.saveCompletedAchievements(new Set(ach.map(x => x.id)));
        for (const p of pres) {
          await t.savePrestigeProgress(p.id, p.data);
        }

        try { localStorage.setItem(MIGRATION_FLAG, '1'); } catch {}
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
