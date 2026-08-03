export type GameMode = "regular" | "pve" | "pvp-season";

export type GraphqlGameMode = Exclude<GameMode, "pvp-season">;

export const DEFAULT_GAME_MODE: GameMode = "regular";

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  regular: "PvP",
  pve: "PvE",
  "pvp-season": "Seasonal",
};

export const GAME_MODES: GameMode[] = ["regular", "pve", "pvp-season"];

export function normalizeGameMode(value: unknown): GameMode {
  return value === "pve" || value === "pvp-season"
    ? value
    : DEFAULT_GAME_MODE;
}

export function getInactiveGameModes(gameMode: GameMode): GameMode[] {
  return GAME_MODES.filter((candidate) => candidate !== gameMode);
}
