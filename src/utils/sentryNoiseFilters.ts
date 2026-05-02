const STALE_ASSET_RELOAD_KEY = "task-tracker:stale-asset-reload-attempted";

const STALE_ASSET_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "unable to preload css",
  "loading chunk",
  "loading css chunk",
  "mime type",
];

const REACT_DOM_MUTATION_PATTERNS = [
  "failed to execute 'removechild' on 'node'",
  "failed to execute 'insertbefore' on 'node'",
];

const EXTERNAL_ASSET_HOSTS = ["assets.tarkov.dev"];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

function eventContainsHost(value: unknown, host: string): boolean {
  if (typeof value === "string") {
    return value.includes(host);
  }

  if (Array.isArray(value)) {
    return value.some((item) => eventContainsHost(item, host));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => eventContainsHost(item, host));
  }

  return false;
}

export function isStaleAssetError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return STALE_ASSET_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

export function isReactDomMutationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return REACT_DOM_MUTATION_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

export function isExternalAssetLoadError(
  error: unknown,
  event?: unknown,
): boolean {
  const message = getErrorMessage(error).toLowerCase();

  if (!message.includes("load failed")) {
    return false;
  }

  return EXTERNAL_ASSET_HOSTS.some((host) => eventContainsHost(event, host));
}

export function requestStaleAssetReload(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(STALE_ASSET_RELOAD_KEY)) {
      return false;
    }

    window.sessionStorage.setItem(
      STALE_ASSET_RELOAD_KEY,
      new Date().toISOString(),
    );
  } catch {
    // If storage is unavailable, still try one recovery reload.
  }

  window.location.reload();
  return true;
}

export function installStaleAssetReloadHandler(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    requestStaleAssetReload();
  });
}
