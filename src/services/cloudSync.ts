import {
  ExportImportService,
  taskStorage,
  type ExportData,
} from "@/utils/indexedDB";

const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL || "";

export interface CloudSyncData {
  profileId: string;
  data: ExportData;
  updatedAt: number;
  syncVersion: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  conflict?: boolean;
  cloudData?: CloudSyncData;
}

async function getAuthToken(): Promise<string | null> {
  const clerk = (
    window as unknown as {
      Clerk?: { session?: { getToken: () => Promise<string> } };
    }
  ).Clerk;
  if (!clerk?.session) return null;
  return clerk.session.getToken();
}

async function exportProfileData(profileId: string): Promise<ExportData> {
  taskStorage.setProfile(profileId);
  await taskStorage.init();
  return ExportImportService.exportAllData();
}

async function importProfileData(
  profileId: string,
  data: ExportData
): Promise<void> {
  taskStorage.setProfile(profileId);
  await taskStorage.init();
  await ExportImportService.importAllData(data);
}

export async function pushToCloud(
  profileId: string,
  userId: string
): Promise<SyncResult> {
  if (!SYNC_API_URL) {
    return { success: false, error: "Sync API URL not configured" };
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const data = await exportProfileData(profileId);
    const payload: CloudSyncData = {
      profileId,
      data,
      updatedAt: Date.now(),
      syncVersion: Date.now(),
    };

    const response = await fetch(`${SYNC_API_URL}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function pullFromCloud(
  profileId: string,
  userId: string
): Promise<SyncResult> {
  if (!SYNC_API_URL) {
    return { success: false, error: "Sync API URL not configured" };
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${SYNC_API_URL}/api/sync/pull?userId=${userId}&profileId=${profileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      return { success: true, cloudData: undefined };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const cloudData: CloudSyncData = await response.json();
    return { success: true, cloudData };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function syncProfile(
  profileId: string,
  userId: string,
  strategy: "push" | "pull" | "auto" = "auto"
): Promise<SyncResult> {
  if (strategy === "push") {
    return pushToCloud(profileId, userId);
  }

  if (strategy === "pull") {
    const result = await pullFromCloud(profileId, userId);
    if (result.success && result.cloudData) {
      await importProfileData(profileId, result.cloudData.data);
    }
    return result;
  }

  // Auto strategy: pull first, then push if no conflicts
  const pullResult = await pullFromCloud(profileId, userId);

  if (!pullResult.success) {
    return pullResult;
  }

  if (pullResult.cloudData) {
    await importProfileData(profileId, pullResult.cloudData.data);
  }

  return pushToCloud(profileId, userId);
}

export function saveSyncTimestamp(userId: string, timestamp: number) {
  localStorage.setItem(`sync_lastSyncedAt_${userId}`, timestamp.toString());
}

export function getSyncTimestamp(userId: string): number | null {
  const stored = localStorage.getItem(`sync_lastSyncedAt_${userId}`);
  return stored ? parseInt(stored, 10) : null;
}
