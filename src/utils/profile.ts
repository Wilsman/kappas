export type Profile = {
  id: string;
  name: string;
  faction?: "USEC" | "BEAR";
  createdAt: number;
};

const PROFILES_KEY = "taskTracker_profiles_v1";
const ACTIVE_PROFILE_KEY = "taskTracker_activeProfile_v1";
const DELETED_PROFILES_KEY = "taskTracker_deletedProfiles_v1";

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Profile[];
  } catch {
    /* empty */
  }
  return [];
}

function saveProfiles(list: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

export function ensureProfiles(): { profiles: Profile[]; activeId: string } {
  let profiles = loadProfiles();
  let activeId = localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
  if (profiles.length === 0) {
    const def: Profile = {
      id: crypto.randomUUID(),
      name: "Default",
      createdAt: Date.now(),
    };
    profiles = [def];
    saveProfiles(profiles);
    activeId = def.id;
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
  } else if (!activeId || !profiles.find((p) => p.id === activeId)) {
    activeId = profiles[0].id;
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
  }
  return { profiles, activeId };
}

export function getProfiles(): Profile[] {
  const { profiles } = ensureProfiles();
  return profiles;
}

export function getActiveProfileId(): string {
  const { activeId } = ensureProfiles();
  return activeId;
}

export function setActiveProfileId(id: string) {
  const profiles = loadProfiles();
  if (!profiles.find((p) => p.id === id)) return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function createProfile(name: string, faction?: "USEC" | "BEAR"): Profile {
  const list = loadProfiles();
  const p: Profile = {
    id: crypto.randomUUID(),
    name: name || "New Character",
    faction,
    createdAt: Date.now(),
  };
  list.push(p);
  saveProfiles(list);
  localStorage.setItem(ACTIVE_PROFILE_KEY, p.id);
  return p;
}

/**
 * Generate a unique profile name by appending a number if the name already exists
 */
export function getUniqueProfileName(baseName: string): string {
  const profiles = loadProfiles();
  const existingNames = new Set(profiles.map((p) => p.name.toLowerCase()));

  // If the name doesn't exist, return it as-is
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  // Find a unique name by appending a number
  let counter = 2;
  let uniqueName = `${baseName} (${counter})`;
  while (existingNames.has(uniqueName.toLowerCase())) {
    counter++;
    uniqueName = `${baseName} (${counter})`;
  }

  return uniqueName;
}

/**
 * Check if a profile name already exists
 */
export function profileNameExists(name: string): boolean {
  const profiles = loadProfiles();
  return profiles.some((p) => p.name.toLowerCase() === name.toLowerCase());
}

export function renameProfile(id: string, name: string) {
  const list = loadProfiles();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], name };
    saveProfiles(list);
  }
}

export function updateProfileFaction(id: string, faction: "USEC" | "BEAR") {
  const list = loadProfiles();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], faction };
    saveProfiles(list);
  }
}

export function deleteProfile(id: string) {
  let list = loadProfiles();
  list = list.filter((p) => p.id !== id);
  saveProfiles(list);
  const active = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (active === id) {
    // switch to first remaining or recreate default
    if (list.length > 0) localStorage.setItem(ACTIVE_PROFILE_KEY, list[0].id);
    else {
      const { activeId } = ensureProfiles();
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
    }
  }
  // Archive the profile ID so its IndexedDB is not loaded/migrated
  markProfileAsDeleted(id);
}

/**
 * Mark a profile ID as deleted (archived). The IndexedDB remains but won't be used.
 */
function markProfileAsDeleted(id: string) {
  try {
    const raw = localStorage.getItem(DELETED_PROFILES_KEY);
    const deleted: string[] = raw ? JSON.parse(raw) : [];
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(deleted));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Check if a profile ID has been deleted/archived.
 */
export function isProfileDeleted(id: string): boolean {
  try {
    const raw = localStorage.getItem(DELETED_PROFILES_KEY);
    if (!raw) return false;
    const deleted: string[] = JSON.parse(raw);
    return deleted.includes(id);
  } catch {
    return false;
  }
}

/**
 * Get all deleted/archived profile IDs.
 */
export function getDeletedProfileIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/**
 * Restore a deleted profile by removing it from the archived list.
 * Note: The profile metadata must be re-added separately if needed.
 */
export function unarchiveProfile(id: string) {
  try {
    const raw = localStorage.getItem(DELETED_PROFILES_KEY);
    if (!raw) return;
    const deleted: string[] = JSON.parse(raw);
    const filtered = deleted.filter((d) => d !== id);
    localStorage.setItem(DELETED_PROFILES_KEY, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

// Optional helper for namespacing per-profile localStorage entries
export function withProfileKey(baseKey: string, profileId: string): string {
  return `${baseKey}::${profileId}`;
}
