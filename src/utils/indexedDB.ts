const DB_NAME = 'TarkovQuests';
const DB_VERSION = 1;
const STORE_NAME = 'completedTasks';

export class TaskStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveCompletedTasks(completedTasks: Set<string>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await store.clear();
    
    for (const taskId of completedTasks) {
      await store.add({ id: taskId, completed: true });
    }
  }

  async loadCompletedTasks(): Promise<Set<string>> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
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
}

export const taskStorage = new TaskStorage();