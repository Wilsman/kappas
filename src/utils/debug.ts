import {
  taskStorage,
  ExportImportService,
  type ExportData,
} from "./indexedDB";
import {
  getProfiles,
  getActiveProfileId,
  getDeletedProfileIds,
  type Profile,
} from "./profile";

// Track export count per session for "before/after" comparison support
let exportCounter = 0;

export interface DebugReport {
  timestamp: string;
  userAgent: string;
  url: string;
  exportContext?: string;
  exportNumber: number;
  profiles: {
    all: Profile[];
    activeId: string;
    deletedIds: string[];
  };
  storage: {
    indexedDB: {
      databases: string[];
      currentProfileDb: {
        name: string;
        exists: boolean;
        objectStores: Record<
          string,
          {
            count: number;
            sampleKeys: string[];
          }
        >;
      };
    };
    localStorage: {
      keys: string[];
      values: Record<string, string>;
    };
    persistence: {
      isPersisted: boolean | null;
      persistedGranted: boolean | null;
      quota: {
        usage: number | null;
        quota: number | null;
        usageDetails: Record<string, number> | null;
      };
    };
  };
  data: {
    currentProfile: ExportData | null;
    dataLoadErrors: string[];
  };
  diagnostics: {
    warnings: string[];
    recommendations: string[];
  };
}

async function getIndexedDBDatabases(): Promise<string[]> {
  try {
    // Check if databases() method exists (not all browsers support it)
    const idb = indexedDB as typeof indexedDB & { databases?: () => Promise<Array<{ name?: string }>> };
    if (typeof idb.databases === "function") {
      const dbs = await idb.databases();
      return dbs.map((db) => db.name || "unknown").filter(Boolean);
    }
  } catch {
    /* ignore */
  }
  return [];
}

async function getStorageQuota(): Promise<DebugReport["storage"]["persistence"]["quota"]> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? null,
        quota: estimate.quota ?? null,
        usageDetails: (estimate as { usageDetails?: Record<string, number> }).usageDetails ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return { usage: null, quota: null, usageDetails: null };
}

async function checkPersistence(): Promise<{
  isPersisted: boolean | null;
  persistedGranted: boolean | null;
}> {
  let isPersisted: boolean | null = null;
  let persistedGranted: boolean | null = null;

  try {
    if (navigator.storage && typeof navigator.storage.persisted === "function") {
      isPersisted = await navigator.storage.persisted();
    }
  } catch {
    /* ignore */
  }

  // Check if persistence API is available (just check availability, don't request)
  if (navigator.storage && typeof navigator.storage.persist === "function") {
    // API is available - persistence status is already in isPersisted
    persistedGranted = isPersisted;
  }

  return { isPersisted, persistedGranted };
}

async function inspectDatabase(
  profileId: string
): Promise<DebugReport["storage"]["indexedDB"]["currentProfileDb"]> {
  const dbName = `TarkovQuests_${profileId}`;
  const result: DebugReport["storage"]["indexedDB"]["currentProfileDb"] = {
    name: dbName,
    exists: false,
    objectStores: {},
  };

  try {
    const dbExists = await new Promise<boolean>((resolve) => {
      const req = indexedDB.open(dbName);
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

    result.exists = dbExists;

    if (!dbExists) {
      return result;
    }

    // Open and inspect the database
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, 12);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Inspect each object store
    const storeNames = Array.from(db.objectStoreNames);
    for (const storeName of storeNames) {
      try {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);

        const count = await new Promise<number>((resolve, reject) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        // Get sample keys (first 5)
        const sampleKeys: string[] = [];
        await new Promise<void>((resolve, reject) => {
          const req = store.openCursor();
          let collected = 0;
          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor && collected < 5) {
              sampleKeys.push(String(cursor.key));
              collected++;
              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        });

        result.objectStores[storeName] = { count, sampleKeys };
      } catch (err) {
        result.objectStores[storeName] = {
          count: -1,
          sampleKeys: [`Error: ${err instanceof Error ? err.message : "unknown"}`],
        };
      }
    }

    db.close();
  } catch {
    result.exists = false;
  }

  return result;
}

function getLocalStorageData(): DebugReport["storage"]["localStorage"] {
  const keys: string[] = [];
  const values: Record<string, string> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
        try {
          values[key] = localStorage.getItem(key) || "";
        } catch {
          values[key] = "[Error reading value]";
        }
      }
    }
  } catch {
    /* ignore */
  }

  return { keys, values };
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "unknown";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function generateWarnings(report: DebugReport): string[] {
  const warnings: string[] = [];

  // Check if database exists but has no data
  const taskStore = report.storage.indexedDB.currentProfileDb.objectStores["completedTasks"];
  if (report.storage.indexedDB.currentProfileDb.exists && taskStore && taskStore.count === 0) {
    warnings.push("Database exists but 'completedTasks' store is empty - this may explain missing progress");
  }

  // Check if database doesn't exist at all
  if (!report.storage.indexedDB.currentProfileDb.exists) {
    warnings.push(`Database '${report.storage.indexedDB.currentProfileDb.name}' does not exist - no data has been saved for this profile`);
  }

  // Check storage persistence
  if (report.storage.persistence.isPersisted === false) {
    warnings.push("Storage is NOT persisted - browser may clear data automatically");
  }

  // Check for low quota
  if (report.storage.persistence.quota.quota && report.storage.persistence.quota.usage) {
    const usageRatio = report.storage.persistence.quota.usage / report.storage.persistence.quota.quota;
    if (usageRatio > 0.9) {
      warnings.push(`Storage is ${(usageRatio * 100).toFixed(1)}% full - may cause data loss`);
    }
  }

  // Check if data counts don't match
  if (report.data.currentProfile) {
    const exportTasks = report.data.currentProfile.completedTasks.length;
    const dbTasks = taskStore?.count ?? 0;
    if (exportTasks !== dbTasks) {
      warnings.push(`Data inconsistency: Export shows ${exportTasks} tasks but DB has ${dbTasks} - possible sync issue`);
    }
  }

  // Check for orphaned localStorage entries without matching DB
  const hasLocalStorageData = report.storage.localStorage.keys.some(k => 
    k.startsWith("taskTracker_") && !k.includes("::")
  );
  if (hasLocalStorageData && !report.storage.indexedDB.currentProfileDb.exists) {
    warnings.push("Found legacy localStorage data but no IndexedDB - data may need migration");
  }

  return warnings;
}

function generateRecommendations(report: DebugReport): string[] {
  const recommendations: string[] = [];

  if (report.storage.persistence.isPersisted === false) {
    recommendations.push("Consider enabling persistent storage in your browser settings to prevent data loss");
  }

  if (!report.storage.indexedDB.currentProfileDb.exists) {
    recommendations.push("Your progress data may have been cleared. Try importing from a backup file if you have one.");
  }

  const taskCount = report.storage.indexedDB.currentProfileDb.objectStores["completedTasks"]?.count ?? 0;
  if (taskCount === 0 && report.profiles.all.length > 0) {
    recommendations.push("No completed tasks found. Check if you're using the correct profile or if data was cleared.");
  }

  // Check for multiple profiles
  if (report.profiles.all.length > 1) {
    const activeProfile = report.profiles.all.find(p => p.id === report.profiles.activeId);
    recommendations.push(`You have ${report.profiles.all.length} profiles. Active: "${activeProfile?.name || "Unknown"}". Make sure you're using the correct profile.`);
  }

  return recommendations;
}

async function generateDebugReport(context?: string): Promise<DebugReport> {
  const errors: string[] = [];
  let currentProfileData: ExportData | null = null;
  exportCounter++;

  // Get basic info
  const profiles = getProfiles();
  const activeId = getActiveProfileId();
  const deletedIds = getDeletedProfileIds();

  // Check storage
  const databases = await getIndexedDBDatabases();
  const dbInfo = await inspectDatabase(activeId);
  const localStorageData = getLocalStorageData();
  const persistence = await checkPersistence();
  const quota = await getStorageQuota();

  // Try to load actual data
  try {
    taskStorage.setProfile(activeId);
    await taskStorage.init();
    currentProfileData = await ExportImportService.exportAllData(
      profiles.find((p) => p.id === activeId)?.name
    );
  } catch (err) {
    errors.push(`Failed to export data: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  const report: DebugReport = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    exportContext: context,
    exportNumber: exportCounter,
    profiles: {
      all: profiles,
      activeId,
      deletedIds,
    },
    storage: {
      indexedDB: {
        databases,
        currentProfileDb: dbInfo,
      },
      localStorage: localStorageData,
      persistence: {
        ...persistence,
        quota,
      },
    },
    data: {
      currentProfile: currentProfileData,
      dataLoadErrors: errors,
    },
    diagnostics: {
      warnings: [],
      recommendations: [],
    },
  };

  // Generate warnings and recommendations
  report.diagnostics.warnings = generateWarnings(report);
  report.diagnostics.recommendations = generateRecommendations(report);

  return report;
}

function formatReportAsText(report: DebugReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("ESCAPE FROM TARKOV QUEST TRACKER - DEBUG REPORT");
  lines.push("=".repeat(80));
  lines.push("");

  // Basic Info
  lines.push("GENERAL INFORMATION");
  lines.push("-".repeat(40));
  lines.push(`Export #${report.exportNumber}${report.exportContext ? ` - ${report.exportContext}` : ""}`);
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`URL: ${report.url}`);
  lines.push(`User Agent: ${report.userAgent}`);
  if (report.exportContext) {
    lines.push(`Context: ${report.exportContext}`);
  }
  lines.push("");
  
  // User guidance for before/after workflow
  if (report.exportNumber === 1) {
    lines.push("📋 TROUBLESHOOTING TIP:");
    lines.push("  If you're experiencing data loss, export again AFTER");
    lines.push("  the issue occurs and send both files for comparison.");
    lines.push("");
  }

  // Profiles
  lines.push("PROFILES");
  lines.push("-".repeat(40));
  lines.push(`Total Profiles: ${report.profiles.all.length}`);
  lines.push(`Active Profile ID: ${report.profiles.activeId}`);
  const activeProfile = report.profiles.all.find((p) => p.id === report.profiles.activeId);
  lines.push(`Active Profile Name: ${activeProfile?.name || "N/A"}`);
  lines.push(`Active Profile Faction: ${activeProfile?.faction || "N/A"}`);
  lines.push(`Active Profile Level: ${activeProfile?.level || "N/A"}`);
  lines.push(`Active Profile Edition: ${activeProfile?.edition || "N/A"}`);
  lines.push("");
  
  if (report.profiles.all.length > 0) {
    lines.push("All Profiles:");
    report.profiles.all.forEach((p) => {
      const isActive = p.id === report.profiles.activeId ? " [ACTIVE]" : "";
      lines.push(`  - ${p.name} (ID: ${p.id}, Faction: ${p.faction}, Level: ${p.level})${isActive}`);
    });
    lines.push("");
  }

  if (report.profiles.deletedIds.length > 0) {
    lines.push(`Deleted/Archived Profiles: ${report.profiles.deletedIds.length}`);
    lines.push("");
  }

  // Storage Diagnostics
  lines.push("STORAGE DIAGNOSTICS");
  lines.push("-".repeat(40));
  lines.push("");

  lines.push("IndexedDB:");
  lines.push(`  Current Profile DB: ${report.storage.indexedDB.currentProfileDb.name}`);
  lines.push(`  DB Exists: ${report.storage.indexedDB.currentProfileDb.exists ? "YES" : "NO"}`);
  lines.push("");

  if (report.storage.indexedDB.currentProfileDb.exists) {
    lines.push("  Object Stores:");
    Object.entries(report.storage.indexedDB.currentProfileDb.objectStores).forEach(
      ([name, info]) => {
        lines.push(`    - ${name}: ${info.count} items`);
        if (info.sampleKeys.length > 0) {
          lines.push(`      Sample keys: ${info.sampleKeys.join(", ")}`);
        }
      }
    );
  }
  lines.push("");

  lines.push(`All IndexedDB Databases (${report.storage.indexedDB.databases.length}):`);
  report.storage.indexedDB.databases.forEach((db) => {
    lines.push(`  - ${db}`);
  });
  lines.push("");

  // Storage Persistence
  lines.push("Storage Persistence:");
  lines.push(`  Is Persisted: ${report.storage.persistence.isPersisted === null ? "unknown" : report.storage.persistence.isPersisted ? "YES" : "NO"}`);
  lines.push(`  Usage: ${formatBytes(report.storage.persistence.quota.usage)}`);
  lines.push(`  Quota: ${formatBytes(report.storage.persistence.quota.quota)}`);
  lines.push("");

  // LocalStorage
  const relevantLsKeys = report.storage.localStorage.keys.filter((k) =>
    k.startsWith("taskTracker_")
  );
  lines.push(`LocalStorage (relevant keys: ${relevantLsKeys.length}):`);
  relevantLsKeys.forEach((key) => {
    const value = report.storage.localStorage.values[key];
    const truncated = value.length > 100 ? value.substring(0, 100) + "..." : value;
    lines.push(`  - ${key}: ${truncated}`);
  });
  lines.push("");

  // Data Summary
  if (report.data.currentProfile) {
    lines.push("CURRENT PROFILE DATA SUMMARY");
    lines.push("-".repeat(40));
    lines.push(`Completed Tasks: ${report.data.currentProfile.completedTasks.length}`);
    lines.push(`Completed Collector Items: ${report.data.currentProfile.completedCollectorItems.length}`);
    lines.push(`Completed Hideout Items: ${report.data.currentProfile.completedHideoutItems.length}`);
    lines.push(`Completed Achievements: ${report.data.currentProfile.completedAchievements.length}`);
    lines.push(`Storyline Objectives: ${report.data.currentProfile.completedStorylineObjectives.length}`);
    lines.push(`Storyline Map Nodes: ${report.data.currentProfile.completedStorylineMapNodes.length}`);
    lines.push(`Prestige Entries: ${Object.keys(report.data.currentProfile.prestigeProgress).length}`);
    lines.push(`Working On Tasks: ${report.data.currentProfile.workingOnItems?.tasks.length || 0}`);
    lines.push(`Player Level: ${report.data.currentProfile.userPreferences.playerLevel || "N/A"}`);
    lines.push(`Show Completed: ${report.data.currentProfile.userPreferences.showCompleted ?? "N/A"}`);
    lines.push(`Enable Level Filter: ${report.data.currentProfile.userPreferences.enableLevelFilter ?? "N/A"}`);
    lines.push(`Notes Length: ${(report.data.currentProfile.userPreferences.notes || "").length} chars`);
    lines.push("");

    // Show some completed task IDs if available
    if (report.data.currentProfile.completedTasks.length > 0) {
      lines.push("Sample Completed Task IDs (first 10):");
      report.data.currentProfile.completedTasks.slice(0, 10).forEach((id) => {
        lines.push(`  - ${id}`);
      });
      lines.push("");
    }
  } else {
    lines.push("CURRENT PROFILE DATA: FAILED TO LOAD");
    lines.push("-".repeat(40));
    report.data.dataLoadErrors.forEach((err) => {
      lines.push(`  Error: ${err}`);
    });
    lines.push("");
  }

  // Warnings
  if (report.diagnostics.warnings.length > 0) {
    lines.push("⚠️  WARNINGS");
    lines.push("-".repeat(40));
    report.diagnostics.warnings.forEach((warning) => {
      lines.push(`  ! ${warning}`);
    });
    lines.push("");
  }

  // Recommendations
  if (report.diagnostics.recommendations.length > 0) {
    lines.push("💡 RECOMMENDATIONS");
    lines.push("-".repeat(40));
    report.diagnostics.recommendations.forEach((rec) => {
      lines.push(`  • ${rec}`);
    });
    lines.push("");
  }

  lines.push("=".repeat(80));
  lines.push("END OF DEBUG REPORT");
  lines.push("=".repeat(80));

  return lines.join("\n");
}

function downloadReport(text: string, exportNumber: number, context?: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split("T")[0];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  
  // Build filename with export number and optional context
  let filename = `eft-tracker-debug-${date}-export${exportNumber}`;
  if (context) {
    // Sanitize context for filename (remove special chars, limit length)
    const safeContext = context.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
    filename += `-${safeContext}`;
  }
  filename += `-${timestamp}.txt`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main debug function - call this from browser console
 * Usage: debugTracker() or window.debugTracker()
 * 
 * For best results when troubleshooting data loss:
 * 1. Export BEFORE the problem occurs (e.g., after marking tasks complete)
 * 2. Export AFTER the problem occurs (e.g., after refresh when tasks are missing)
 * 3. Send both files for comparison
 */
export async function debugTracker(): Promise<void> {
  console.log("🔍 Generating debug report...");

  try {
    // Prompt user for context (what's happening right now)
    const currentExportNum = exportCounter + 1;
    let context: string | undefined;
    
    // Only show prompt after first export to guide the workflow
    if (currentExportNum > 1) {
      context = window.prompt(
        `Debug Export #${currentExportNum}\n\n` +
        `Describe the current state:\n` +
        `• "after refresh - tasks missing"\n` +
        `• "before closing browser"\n` +
        `• "after data loss occurred"\n\n` +
        `Leave empty if not applicable:`,
        ""
      ) || undefined;
    } else {
      // First export - show guidance
      const wantContext = window.confirm(
        `Debug Export #1\n\n` +
        `💡 Tip: If you're troubleshooting data loss, export again AFTER\n` +
        `the problem happens and send both files for comparison.\n\n` +
        `Would you like to add a description for this export?\n` +
        `(e.g., "before refresh - all tasks done")`
      );
      if (wantContext) {
        context = window.prompt("Describe the current state:", "before issue - tasks complete") || undefined;
      }
    }

    const report = await generateDebugReport(context);
    const textReport = formatReportAsText(report);

    // Log to console
    console.log("%c DEBUG REPORT ", "background: #ff6b6b; color: white; font-weight: bold;");
    console.log(textReport);
    console.log("%c FULL JSON DATA ", "background: #4ecdc4; color: white; font-weight: bold;");
    console.log(report);

    // Download as file
    downloadReport(textReport, report.exportNumber, context);

    console.log(`✅ Debug report #${report.exportNumber} downloaded! Check your downloads folder.`);

    // Show alert with key findings and guidance
    const warnings = report.diagnostics.warnings;
    let message = `Debug report #${report.exportNumber} downloaded!`;
    
    if (context) {
      message += `\nContext: "${context}"`;
    }
    
    if (warnings.length > 0) {
      message += `\n\n⚠️ ${warnings.length} warning(s) found:\n` +
        warnings.slice(0, 3).map(w => `• ${w}`).join("\n") +
        (warnings.length > 3 ? `\n...and ${warnings.length - 3} more` : "");
    }
    
    if (report.exportNumber === 1) {
      message += `\n\n💡 Troubleshooting tip:\n` +
        `If you experience data loss, export again AFTER\n` +
        `it happens and send both files for comparison.`;
    } else {
      message += `\n\n✉️ Send all exported files together\n` +
        `so we can compare the before/after state.`;
    }
    
    alert(message);
  } catch (err) {
    console.error("Failed to generate debug report:", err);
    alert(`Error generating debug report: ${err instanceof Error ? err.message : "unknown error"}`);
  }
}

// Expose to window for console access
declare global {
  interface Window {
    debugTracker: typeof debugTracker;
  }
}

if (typeof window !== "undefined") {
  window.debugTracker = debugTracker;
}
