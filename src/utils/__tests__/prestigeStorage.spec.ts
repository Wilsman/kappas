import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("@/utils/indexedDB", () => ({
  taskStorage: {
    loadPrestigeProgress: vi.fn(async (id: string) => store.get(id) ?? null),
    savePrestigeProgress: vi.fn(async (id: string, data: unknown) => {
      store.set(id, data);
    }),
  },
}));

import {
  getPrestigeStateId,
  loadPrestigeState,
  PRESTIGE_STATE_ID,
  savePrestigeState,
} from "@/utils/prestige";

describe("per-mode prestige state", () => {
  beforeEach(() => store.clear());

  it("keeps PvP and PvE prestige separate", async () => {
    await savePrestigeState({ currentLevel: 2, roubles: 0, skills: {} }, "regular");
    await savePrestigeState({ currentLevel: 1, roubles: 5, skills: {} }, "pve");

    expect((await loadPrestigeState("regular")).currentLevel).toBe(2);
    expect(await loadPrestigeState("pve")).toEqual({
      currentLevel: 1,
      roubles: 5,
      skills: {},
    });
  });

  it("starts each mode from the old shared record", async () => {
    store.set(PRESTIGE_STATE_ID, { currentLevel: 3, roubles: 10, skills: {} });

    expect((await loadPrestigeState("regular")).currentLevel).toBe(3);
    expect((await loadPrestigeState("pve")).currentLevel).toBe(3);
  });

  it("prefers the mode record over the shared one", async () => {
    store.set(PRESTIGE_STATE_ID, { currentLevel: 3, roubles: 0, skills: {} });
    await savePrestigeState({ currentLevel: 1, roubles: 0, skills: {} }, "pve");

    expect((await loadPrestigeState("pve")).currentLevel).toBe(1);
    expect((await loadPrestigeState("regular")).currentLevel).toBe(3);
    expect(store.has(getPrestigeStateId("pve"))).toBe(true);
  });
});
