import { describe, expect, it } from "vitest";
import {
  GAME_MODE_LABELS,
  GAME_MODES,
  getInactiveGameModes,
  normalizeGameMode,
} from "@/utils/gameMode";

describe("game modes", () => {
  it("keeps pvp-season as the Seasonal profile mode", () => {
    expect(normalizeGameMode("pvp-season")).toBe("pvp-season");
    expect(GAME_MODES).toEqual(["regular", "pve", "pvp-season"]);
    expect(GAME_MODE_LABELS["pvp-season"]).toBe("Seasonal");
  });

  it("returns both inactive modes for background loading", () => {
    expect(getInactiveGameModes("pvp-season")).toEqual(["regular", "pve"]);
    expect(getInactiveGameModes("regular")).toEqual(["pve", "pvp-season"]);
  });

  it("continues to normalize unknown legacy values to regular", () => {
    expect(normalizeGameMode("seasonal")).toBe("regular");
    expect(normalizeGameMode(undefined)).toBe("regular");
  });
});
