import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./graphql";

const makeContext = (request: Request) => ({ request });
const makeCacheMock = (cachedResponse: Response | null = null) => ({
  match: vi.fn().mockResolvedValue(cachedResponse),
  put: vi.fn().mockResolvedValue(undefined),
});

describe("tarkov GraphQL Pages Function", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("responds to CORS preflight requests", async () => {
    const response = await onRequest(
      makeContext(new Request("https://kappas.pages.dev/api/tarkov/graphql", {
        method: "OPTIONS",
      })),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS",
    );
  });

  it("rejects unsupported methods", async () => {
    const response = await onRequest(
      makeContext(new Request("https://kappas.pages.dev/api/tarkov/graphql")),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
    await expect(response.json()).resolves.toEqual({
      error: "Method not allowed",
    });
  });

  it("forwards POST bodies to the Tarkov GraphQL API", async () => {
    const upstreamBody = { data: { tasks: [] } };
    const cache = makeCacheMock();
    vi.stubGlobal("caches", { default: cache });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstreamBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = JSON.stringify({ query: "{ tasks { id } }" });

    const response = await onRequest(
      makeContext(
        new Request("https://kappas.pages.dev/api/tarkov/graphql", {
          method: "POST",
          body,
        }),
      ),
    );

    expect(fetchSpy).toHaveBeenCalledWith("https://api.tarkov.dev/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    expect(cache.put).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Kappas-Data-Source")).toBe("fresh");
    await expect(response.json()).resolves.toEqual(upstreamBody);
  });

  it("returns structured JSON when the upstream API returns an error", async () => {
    vi.stubGlobal("caches", { default: makeCacheMock() });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error code: 1102\n", {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "CF-RAY": "test-ray",
        },
      }),
    );

    const response = await onRequest(
      makeContext(
        new Request("https://kappas.pages.dev/api/tarkov/graphql", {
          method: "POST",
          body: "{}",
        }),
      ),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Tarkov API upstream error",
      upstreamStatus: 503,
      upstreamStatusText: "Service Unavailable",
      upstreamBody: "error code: 1102\n",
      upstreamContentType: "text/plain; charset=UTF-8",
      upstreamCfRay: "test-ray",
    });
  });

  it("returns stale cached data when the upstream API returns an error", async () => {
    const cachedAt = new Date(Date.now() - 60_000).toISOString();
    vi.stubGlobal("caches", {
      default: makeCacheMock(
        new Response(JSON.stringify({ data: { tasks: [{ id: "cached" }] } }), {
          headers: {
            "Content-Type": "application/json",
            "X-Kappas-Cached-At": cachedAt,
          },
        }),
      ),
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error code: 1102\n", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    const response = await onRequest(
      makeContext(
        new Request("https://kappas.pages.dev/api/tarkov/graphql", {
          method: "POST",
          body: "{}",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Kappas-Data-Source")).toBe("stale-cache");
    expect(response.headers.get("X-Kappas-Stale-Reason")).toBe(
      "upstream-status-503",
    );
    expect(response.headers.get("X-Kappas-Cached-At")).toBe(cachedAt);
    await expect(response.json()).resolves.toEqual({
      data: { tasks: [{ id: "cached" }] },
    });
  });

  it("returns 502 when the upstream request fails", async () => {
    vi.stubGlobal("caches", { default: makeCacheMock() });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const response = await onRequest(
      makeContext(
        new Request("https://kappas.pages.dev/api/tarkov/graphql", {
          method: "POST",
          body: "{}",
        }),
      ),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Tarkov API request failed",
    });
  });

  it("returns stale cached data when the upstream request fails", async () => {
    vi.stubGlobal("caches", {
      default: makeCacheMock(
        new Response(JSON.stringify({ data: { tasks: [{ id: "cached" }] } }), {
          headers: { "X-Kappas-Cached-At": new Date().toISOString() },
        }),
      ),
    });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const response = await onRequest(
      makeContext(
        new Request("https://kappas.pages.dev/api/tarkov/graphql", {
          method: "POST",
          body: "{}",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Kappas-Data-Source")).toBe("stale-cache");
    expect(response.headers.get("X-Kappas-Stale-Reason")).toBe("fetch-error");
    await expect(response.json()).resolves.toEqual({
      data: { tasks: [{ id: "cached" }] },
    });
  });
});
