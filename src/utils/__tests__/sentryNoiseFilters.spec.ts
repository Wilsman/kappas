import { describe, expect, it } from "vitest";
import {
  isExternalAssetLoadError,
  isReactDomMutationError,
  isStaleAssetError,
} from "@/utils/sentryNoiseFilters";

describe("sentry noise filters", () => {
  it("detects stale Vite asset and chunk load errors", () => {
    expect(
      isStaleAssetError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://kappas.pages.dev/assets/CheckListView-CdMXbzGU.js",
        ),
      ),
    ).toBe(true);

    expect(
      isStaleAssetError(
        new Error("Unable to preload CSS for /assets/index-BZV40eAE.css"),
      ),
    ).toBe(true);

    expect(isStaleAssetError(new Error("GraphQL error"))).toBe(false);
  });

  it("detects known React DOM mutation recoverable errors", () => {
    expect(
      isReactDomMutationError(
        new DOMException(
          "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
          "NotFoundError",
        ),
      ),
    ).toBe(true);

    expect(
      isReactDomMutationError(
        new DOMException(
          "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
          "NotFoundError",
        ),
      ),
    ).toBe(true);

    expect(isReactDomMutationError(new Error("Network request failed"))).toBe(
      false,
    );
  });

  it("detects external Tarkov asset load failures with event evidence", () => {
    expect(
      isExternalAssetLoadError(new TypeError("Load failed"), {
        metadata: {
          type: "TypeError",
          value: "Load failed (assets.tarkov.dev)",
        },
      }),
    ).toBe(true);

    expect(
      isExternalAssetLoadError(new TypeError("Load failed"), {
        request: { url: "https://api.tarkov.dev/graphql" },
      }),
    ).toBe(false);

    expect(
      isExternalAssetLoadError(new TypeError("Failed to fetch"), {
        request: { url: "https://assets.tarkov.dev/item-icon.webp" },
      }),
    ).toBe(false);
  });
});
