import { describe, expect, it, beforeEach } from "vitest";
import {
  createProfile,
  ensureProfiles,
  getProfiles,
  updateProfileGameMode,
} from "../profile";

const PROFILES_KEY = "taskTracker_profiles_v1";

describe("profile game mode metadata", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes existing profiles without a game mode to regular", () => {
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify([
        {
          id: "profile-1",
          name: "Default",
          faction: "USEC",
          edition: "standard",
          createdAt: 1,
        },
      ]),
    );

    const ensured = ensureProfiles();

    expect(ensured.profiles[0].gameMode).toBe("regular");
    expect(getProfiles()[0].gameMode).toBe("regular");
  });

  it("creates profiles in regular mode by default", () => {
    const profile = createProfile("New PMC");

    expect(profile.gameMode).toBe("regular");
    expect(getProfiles()[0].gameMode).toBe("regular");
  });

  it("persists game mode per profile", () => {
    const profile = createProfile("PvE PMC");

    updateProfileGameMode(profile.id, "pve");

    expect(getProfiles()[0].gameMode).toBe("pve");
  });
});
