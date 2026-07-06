const TARKOV_GRAPHQL_URL = "https://api.tarkov.dev/graphql";
const CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const browserJsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const previewBody = (body: string) =>
  body.length > 1000 ? `${body.slice(0, 1000)}...` : body;

const hashRequestBody = async (body: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const buildCacheRequest = async (request: Request, body: string) => {
  const url = new URL(request.url);
  url.pathname = "/api/tarkov/graphql-cache";
  url.search = `?bodyHash=${await hashRequestBody(body)}`;
  return new Request(url.toString(), { method: "GET" });
};

const getCache = () =>
  typeof caches === "undefined" ? null : caches.default;

const cacheHeaders = () => ({
  "Content-Type": "application/json",
  "Cache-Control": `public, max-age=${CACHE_MAX_AGE_SECONDS}`,
  "X-Kappas-Cached-At": new Date().toISOString(),
});

const buildBrowserHeaders = (extra?: HeadersInit) => ({
  ...browserJsonHeaders,
  ...Object.fromEntries(new Headers(extra).entries()),
});

const responseFromCachedData = async (
  cacheRequest: Request,
  reason: string,
): Promise<Response | null> => {
  const cache = getCache();
  if (!cache) return null;

  const cached = await cache.match(cacheRequest);
  if (!cached) return null;

  const cachedAt = cached.headers.get("X-Kappas-Cached-At");
  const cachedAtMs = cachedAt ? Date.parse(cachedAt) : NaN;
  const ageSeconds = Number.isFinite(cachedAtMs)
    ? Math.max(0, Math.floor((Date.now() - cachedAtMs) / 1000))
    : null;

  return new Response(cached.body, {
    status: 200,
    headers: buildBrowserHeaders({
      "X-Kappas-Data-Source": "stale-cache",
      "X-Kappas-Stale-Reason": reason,
      ...(cachedAt ? { "X-Kappas-Cached-At": cachedAt } : {}),
      ...(ageSeconds !== null
        ? { "X-Kappas-Cache-Age-Seconds": String(ageSeconds) }
        : {}),
      Warning: '110 - "Response is stale"',
    }),
  });
};

const cacheFreshResponse = (
  cacheRequest: Request,
  body: string,
  waitUntil?: (promise: Promise<unknown>) => void,
) => {
  const cache = getCache();
  if (!cache) return Promise.resolve();

  const cacheResponse = new Response(body, {
    status: 200,
    headers: cacheHeaders(),
  });
  const putPromise = cache.put(cacheRequest, cacheResponse);
  if (waitUntil) {
    waitUntil(putPromise);
    return Promise.resolve();
  }
  return putPromise;
};

const methodNotAllowed = () =>
  new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      ...browserJsonHeaders,
      Allow: "POST, OPTIONS",
    },
  });

export async function onRequest({
  request,
  waitUntil,
}: {
  request: Request;
  waitUntil?: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const requestBody = await request.text();
  const cacheRequest = await buildCacheRequest(request, requestBody);

  try {
    const upstream = await fetch(TARKOV_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      const cached = await responseFromCachedData(
        cacheRequest,
        `upstream-status-${upstream.status}`,
      );
      if (cached) return cached;

      return new Response(
        JSON.stringify({
          error: "Tarkov API upstream error",
          upstreamStatus: upstream.status,
          upstreamStatusText: upstream.statusText,
          upstreamBody: previewBody(body),
          upstreamContentType: upstream.headers.get("Content-Type"),
          upstreamCfRay: upstream.headers.get("CF-RAY"),
        }),
        {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: browserJsonHeaders,
        },
      );
    }

    const body = await upstream.text();
    await cacheFreshResponse(cacheRequest, body, waitUntil);

    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildBrowserHeaders({
        "X-Kappas-Data-Source": "fresh",
      }),
    });
  } catch {
    const cached = await responseFromCachedData(cacheRequest, "fetch-error");
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: "Tarkov API request failed" }),
      {
        status: 502,
        headers: browserJsonHeaders,
      },
    );
  }
}
