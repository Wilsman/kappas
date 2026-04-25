export type GameMode = "regular" | "pve";

export const DEFAULT_GAME_MODE: GameMode = "regular";

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  regular: "PvP",
  pve: "PvE",
};

export const GAME_MODES: GameMode[] = ["regular", "pve"];

export function normalizeGameMode(value: unknown): GameMode {
  return value === "pve" ? "pve" : DEFAULT_GAME_MODE;
}

export function getInactiveGameMode(gameMode: GameMode): GameMode {
  return gameMode === "regular" ? "pve" : "regular";
}
