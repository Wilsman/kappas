export type Profile = {
  id: string;
  name: string;
  createdAt: number;
};

const PROFILES_KEY = 'taskTracker_profiles_v1';
const ACTIVE_PROFILE_KEY = 'taskTracker_activeProfile_v1';

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Profile[];
  } catch { /* empty */ }
  return [];
}

function saveProfiles(list: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

export function ensureProfiles(): { profiles: Profile[]; activeId: string } {
  let profiles = loadProfiles();
  let activeId = localStorage.getItem(ACTIVE_PROFILE_KEY) || '';
  if (profiles.length === 0) {
    const def: Profile = { id: crypto.randomUUID(), name: 'Default', createdAt: Date.now() };
    profiles = [def];
    saveProfiles(profiles);
    activeId = def.id;
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeId);
  } else if (!activeId || !profiles.find(p => p.id === activeId)) {
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
  if (!profiles.find(p => p.id === id)) return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function createProfile(name: string): Profile {
  const list = loadProfiles();
  const p: Profile = { id: crypto.randomUUID(), name: name || 'New Character', createdAt: Date.now() };
  list.push(p);
  saveProfiles(list);
  localStorage.setItem(ACTIVE_PROFILE_KEY, p.id);
  return p;
}

export function renameProfile(id: string, name: string) {
  const list = loadProfiles();
  const idx = list.findIndex(p => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], name };
    saveProfiles(list);
  }
}

export function deleteProfile(id: string) {
  let list = loadProfiles();
  list = list.filter(p => p.id !== id);
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
}

// Optional helper for namespacing per-profile localStorage entries
export function withProfileKey(baseKey: string, profileId: string): string {
  return `${baseKey}::${profileId}`;
}

