import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOverlay, resetOverlayFetchCache } from "@/services/tarkovApi";

const overlay = { tasks: {}, $meta: { version: "1.2.3", generated: "2026-01-01" } };

describe("fetchOverlay request sharing", () => {
  beforeEach(() => {
    resetOverlayFetchCache();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shares one network request between concurrent and recent callers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => overlay });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([fetchOverlay(), fetchOverlay()]);
    const third = await fetchOverlay();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(overlay);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("does not reuse the empty fallback after a failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => overlay });
    vi.stubGlobal("fetch", fetchMock);

    const failed = await fetchOverlay();
    expect(failed.$meta.version).toBe("0.0.0-empty");

    const retried = await fetchOverlay();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(retried).toEqual(overlay);
  });
});
