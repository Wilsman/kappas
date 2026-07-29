import { describe, expect, it } from "vitest";
import {
  KORD_BREACH_ALL_MODIFIERS,
  KORD_BREACH_GLOBAL_MODIFIERS,
  KORD_BREACH_NEGATIVE_MODIFIERS,
  KORD_BREACH_PERSONAL_MODIFIERS,
  KORD_BREACH_POSITIVE_MODIFIERS,
} from "@/data/kordBreachModifiers";
import {
  calculateKordBreachBalance,
  findExactKordBreachSuggestions,
  formatKordBreachBuildSummary,
  getKordBreachSelectedModifiers,
  getKordBreachStatus,
  parseStoredKordBreachLayout,
  parseStoredKordBreachSelection,
  serializeKordBreachSelection,
  tokenizeKordBreachEffect,
} from "@/utils/kordBreach";

describe("Kord Breach modifier data", () => {
  it("contains the announced global and personal modifier counts", () => {
    expect(KORD_BREACH_GLOBAL_MODIFIERS).toHaveLength(6);
    expect(KORD_BREACH_POSITIVE_MODIFIERS).toHaveLength(17);
    expect(KORD_BREACH_NEGATIVE_MODIFIERS).toHaveLength(13);
    expect(KORD_BREACH_ALL_MODIFIERS).toHaveLength(36);
  });

  it("uses unique ids and correctly signed personal values", () => {
    const ids = KORD_BREACH_ALL_MODIFIERS.map((modifier) => modifier.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      KORD_BREACH_POSITIVE_MODIFIERS.every(
        (modifier) => modifier.points < 0,
      ),
    ).toBe(true);
    expect(
      KORD_BREACH_NEGATIVE_MODIFIERS.every(
        (modifier) => modifier.points > 0,
      ),
    ).toBe(true);
  });

  it("preserves the announced headline values", () => {
    expect(
      KORD_BREACH_PERSONAL_MODIFIERS.find(
        (modifier) => modifier.id === "kappa-protocol",
      )?.points,
    ).toBe(-21);
    expect(
      KORD_BREACH_PERSONAL_MODIFIERS.find(
        (modifier) => modifier.id === "no-flea-market",
      )?.points,
    ).toBe(6);
  });
});

describe("Kord Breach balance", () => {
  it("distinguishes empty, balanced, surplus, and deficit builds", () => {
    const empty = calculateKordBreachBalance([]);
    expect(getKordBreachStatus(empty).kind).toBe("empty");

    const balanced = calculateKordBreachBalance(
      getKordBreachSelectedModifiers(["street-tax", "third-leg"]),
    );
    expect(balanced.balance).toBe(0);
    expect(getKordBreachStatus(balanced).kind).toBe("balanced");

    const surplus = calculateKordBreachBalance(
      getKordBreachSelectedModifiers(["third-leg"]),
    );
    expect(surplus.balance).toBe(1);
    expect(getKordBreachStatus(surplus).kind).toBe("surplus");

    const deficit = calculateKordBreachBalance(
      getKordBreachSelectedModifiers(["kappa-protocol"]),
    );
    expect(deficit.balance).toBe(-21);
    expect(getKordBreachStatus(deficit).kind).toBe("deficit");
  });
});

describe("Kord Breach exact-match suggestions", () => {
  it("suggests the fewest deterministic negative additions", () => {
    const suggestions = findExactKordBreachSuggestions(["juice-time"]);
    expect(suggestions.map((match) => match.map((item) => item.name))).toEqual([
      ["Hemophilia"],
      ["Personality Vacuum"],
      ["Well That Hurt!"],
    ]);
  });

  it("suggests positive additions when points remain", () => {
    const suggestions = findExactKordBreachSuggestions(["hemophilia"]);
    expect(suggestions.map((match) => match.map((item) => item.name))).toEqual([
      ["Hypodipsia"],
      ["Juice Time"],
      ["Polyphagia"],
    ]);
  });

  it("never suggests an already selected modifier", () => {
    const suggestions = findExactKordBreachSuggestions([
      "hemophilia",
      "juice-time",
    ]);
    expect(suggestions).toEqual([]);
  });

  it("returns no add-only match when the remaining side cannot cover the gap", () => {
    const allPositiveIds = KORD_BREACH_POSITIVE_MODIFIERS.map(
      (modifier) => modifier.id,
    );
    expect(findExactKordBreachSuggestions(allPositiveIds)).toEqual([]);
  });
});

describe("Kord Breach saved builds", () => {
  it("round-trips valid ids and removes duplicates or unknown ids", () => {
    const stored = serializeKordBreachSelection([
      "juice-time",
      "unknown",
      "juice-time",
      "hemophilia",
    ]);
    expect(parseStoredKordBreachSelection(stored)).toEqual([
      "juice-time",
      "hemophilia",
    ]);
  });

  it("safely ignores malformed or obsolete stored state", () => {
    expect(parseStoredKordBreachSelection("not-json")).toEqual([]);
    expect(
      parseStoredKordBreachSelection(
        JSON.stringify({ version: 0, selectedIds: ["juice-time"] }),
      ),
    ).toEqual([]);
  });
});

describe("Kord Breach saved layout", () => {
  it("restores supported layouts and defaults unknown values to detailed", () => {
    expect(parseStoredKordBreachLayout("compact")).toBe("compact");
    expect(parseStoredKordBreachLayout("dense")).toBe("detailed");
    expect(parseStoredKordBreachLayout("unknown")).toBe("detailed");
    expect(parseStoredKordBreachLayout(null)).toBe("detailed");
  });
});

describe("Kord Breach effect emphasis", () => {
  it("marks important values and qualifiers for emphasis", () => {
    const segments = tokenizeKordBreachEffect(
      "Skills start at level 15, consume 20% more, level 25% slower, and recover 15% slower for 60 seconds.",
    );

    expect(
      segments
        .filter((segment) => segment.emphasized)
        .map((segment) => segment.text),
    ).toEqual([
      "level 15",
      "20% more",
      "25% slower",
      "15% slower",
      "60 seconds",
    ]);
  });

  it("preserves effects without numeric values", () => {
    expect(tokenizeKordBreachEffect("Trading is disabled.")).toEqual([
      { text: "Trading is disabled.", emphasized: false },
    ]);
  });
});

describe("Kord Breach copied build", () => {
  it("formats a categorized, shareable summary", () => {
    const modifiers = getKordBreachSelectedModifiers([
      "juice-time",
      "hemophilia",
    ]);
    const summary = formatKordBreachBuildSummary(
      modifiers,
      "https://example.com/Kord-Breach",
    );

    expect(summary).toContain("0 points");
    expect(summary).toContain("Juice Time (-2)");
    expect(summary).toContain("Hemophilia (+2)");
    expect(summary).toContain("https://example.com/Kord-Breach");
  });
});
