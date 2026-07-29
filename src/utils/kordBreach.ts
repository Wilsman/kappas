import {
  KORD_BREACH_PERSONAL_MODIFIERS,
  type KordBreachModifier,
} from "@/data/kordBreachModifiers";

export const KORD_BREACH_STORAGE_KEY = "kord-breach-build:v1";
export const KORD_BREACH_LAYOUT_STORAGE_KEY = "kord-breach-layout:v1";
const KORD_BREACH_STORAGE_VERSION = 1;

export type KordBreachLayout = "detailed" | "compact";

export interface KordBreachEffectSegment {
  text: string;
  emphasized: boolean;
}

export type KordBreachBalanceStatus =
  | "empty"
  | "balanced"
  | "surplus"
  | "deficit";

export interface KordBreachBalance {
  balance: number;
  pointsSpent: number;
  pointsGained: number;
  positiveCount: number;
  negativeCount: number;
  selectedCount: number;
}

export interface KordBreachStatus {
  kind: KordBreachBalanceStatus;
  title: string;
  detail: string;
}

const personalModifierById = new Map(
  KORD_BREACH_PERSONAL_MODIFIERS.map((modifier) => [modifier.id, modifier]),
);

export function parseStoredKordBreachLayout(
  raw: string | null,
): KordBreachLayout {
  return raw === "compact" ? "compact" : "detailed";
}

export function tokenizeKordBreachEffect(
  effect: string,
): KordBreachEffectSegment[] {
  const valuePattern =
    /(level\s+\d+(?![\d%])|\([+-]?\d+\)|[+-]?\d+(?:\.\d+)?%(?:\s+(?:slower|faster|less|more|cheaper))?|\d+\s+seconds?|\d+)/gi;
  const segments: KordBreachEffectSegment[] = [];
  let cursor = 0;

  for (const match of effect.matchAll(valuePattern)) {
    const index = match.index ?? cursor;
    if (index > cursor) {
      segments.push({
        text: effect.slice(cursor, index),
        emphasized: false,
      });
    }
    segments.push({ text: match[0], emphasized: true });
    cursor = index + match[0].length;
  }

  if (cursor < effect.length) {
    segments.push({ text: effect.slice(cursor), emphasized: false });
  }

  return segments.length > 0
    ? segments
    : [{ text: effect, emphasized: false }];
}

export function sanitizeKordBreachModifierIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter(
        (id): id is string =>
          typeof id === "string" && personalModifierById.has(id),
      ),
    ),
  );
}

export function parseStoredKordBreachSelection(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown;
      selectedIds?: unknown;
    };
    if (parsed?.version !== KORD_BREACH_STORAGE_VERSION) return [];
    return sanitizeKordBreachModifierIds(parsed.selectedIds);
  } catch {
    return [];
  }
}

export function serializeKordBreachSelection(
  selectedIds: Iterable<string>,
): string {
  return JSON.stringify({
    version: KORD_BREACH_STORAGE_VERSION,
    selectedIds: sanitizeKordBreachModifierIds(Array.from(selectedIds)),
  });
}

export function getKordBreachSelectedModifiers(
  selectedIds: Iterable<string>,
): KordBreachModifier[] {
  const ids = new Set(selectedIds);
  return KORD_BREACH_PERSONAL_MODIFIERS.filter((modifier) =>
    ids.has(modifier.id),
  );
}

export function calculateKordBreachBalance(
  modifiers: readonly KordBreachModifier[],
): KordBreachBalance {
  return modifiers.reduce<KordBreachBalance>(
    (total, modifier) => {
      if (modifier.category === "positive") {
        total.pointsSpent += Math.abs(modifier.points);
        total.positiveCount += 1;
      } else if (modifier.category === "negative") {
        total.pointsGained += modifier.points;
        total.negativeCount += 1;
      }
      total.balance += modifier.points;
      total.selectedCount += 1;
      return total;
    },
    {
      balance: 0,
      pointsSpent: 0,
      pointsGained: 0,
      positiveCount: 0,
      negativeCount: 0,
      selectedCount: 0,
    },
  );
}

export function getKordBreachStatus(
  balance: KordBreachBalance,
): KordBreachStatus {
  if (balance.selectedCount === 0) {
    return {
      kind: "empty",
      title: "No personal modifiers selected",
      detail: "A clean 0-point start is valid.",
    };
  }
  if (balance.balance === 0) {
    return {
      kind: "balanced",
      title: "Balanced — ready for Kord Breach",
      detail: "Your selected positives and negatives finish exactly on 0.",
    };
  }
  if (balance.balance > 0) {
    return {
      kind: "surplus",
      title: `${balance.balance} point${balance.balance === 1 ? "" : "s"} unused`,
      detail: "This build is valid, but you can still spend the remaining balance.",
    };
  }
  const missing = Math.abs(balance.balance);
  return {
    kind: "deficit",
    title: `Need ${missing} more negative point${missing === 1 ? "" : "s"}`,
    detail: "Add drawbacks or remove positive modifiers before locking in.",
  };
}

export function findExactKordBreachSuggestions(
  selectedIds: Iterable<string>,
  limit = 3,
  modifiers: readonly KordBreachModifier[] = KORD_BREACH_PERSONAL_MODIFIERS,
): KordBreachModifier[][] {
  const selected = new Set(selectedIds);
  const selectedModifiers = modifiers.filter((modifier) =>
    selected.has(modifier.id),
  );
  const { balance } = calculateKordBreachBalance(selectedModifiers);
  if (balance === 0 || limit <= 0) return [];

  const neededCategory = balance < 0 ? "negative" : "positive";
  const target = Math.abs(balance);
  const candidates = modifiers
    .filter(
      (modifier) =>
        modifier.category === neededCategory && !selected.has(modifier.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const matches: KordBreachModifier[][] = [];

  function search(
    startIndex: number,
    remaining: number,
    current: KordBreachModifier[],
  ) {
    if (remaining === 0) {
      matches.push([...current]);
      return;
    }

    for (let index = startIndex; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const value = Math.abs(candidate.points);
      if (value > remaining) continue;
      current.push(candidate);
      search(index + 1, remaining - value, current);
      current.pop();
    }
  }

  search(0, target, []);

  return matches
    .sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a
        .map((modifier) => modifier.name)
        .join("|")
        .localeCompare(b.map((modifier) => modifier.name).join("|"));
    })
    .slice(0, limit);
}

export function formatKordBreachBuildSummary(
  modifiers: readonly KordBreachModifier[],
  plannerUrl = "/Kord-Breach",
): string {
  const balance = calculateKordBreachBalance(modifiers);
  const positives = modifiers.filter(
    (modifier) => modifier.category === "positive",
  );
  const negatives = modifiers.filter(
    (modifier) => modifier.category === "negative",
  );
  const formatLine = (modifier: KordBreachModifier) =>
    `- ${modifier.name} (${modifier.points > 0 ? "+" : ""}${modifier.points})`;

  return [
    `Kord Breach Season 1 build — ${balance.balance > 0 ? "+" : ""}${balance.balance} points`,
    "",
    "Positive modifiers",
    ...(positives.length > 0
      ? positives.map(formatLine)
      : ["- None selected"]),
    "",
    "Negative modifiers",
    ...(negatives.length > 0
      ? negatives.map(formatLine)
      : ["- None selected"]),
    "",
    `Planner: ${plannerUrl}`,
  ].join("\n");
}
