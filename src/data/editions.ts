import type { Edition } from "@/types";

// Local copy of game edition data, taken from the tarkov-data-overlay
// (generated 2026-02-24). Used while the upstream overlay is unavailable;
// see EDITIONS_SOURCE in `@/services/tarkovApi` to switch back.

const ALL_TRADERS_REP_BONUS: Record<string, number> = {
  prapor: 0.2,
  therapist: 0.2,
  fence: 0.2,
  skier: 0.2,
  peacekeeper: 0.2,
  mechanic: 0.2,
  ragman: 0.2,
  jaeger: 0.2,
};

const EOD_EXCLUSIVE_TASK_IDS = [
  "666314b0acf8442f8b0531a1",
  "666314b2a9290f9e0806cca3",
  "666314b4d7f171c4c20226c3",
  "666314b696a9349baa021bac",
  "666314b8312343839d032d24",
  "666314bafd5ca9577902e03a",
  "666314bc1d3ec95634095e77",
  "666314bd920800278d0f6748",
  "666314bf1cd52e3d040a2e78",
  "666314c10aa5c7436c00908c",
  "666314c3acf8442f8b0531a3",
  "666314c5a9290f9e0806cca5",
];

const UNHEARD_EXCLUDED_TASK_IDS = ["666314a50aa5c7436c00908a"];

export const LOCAL_EDITIONS: Record<string, Edition> = {
  standard: {
    id: "standard",
    value: 1,
    title: "Standard",
    defaultStashLevel: 1,
    defaultCultistCircleLevel: 0,
    traderRepBonus: {},
  },
  left_behind: {
    id: "left_behind",
    value: 2,
    title: "Left Behind",
    defaultStashLevel: 2,
    defaultCultistCircleLevel: 0,
    traderRepBonus: {},
  },
  prepare_for_escape: {
    id: "prepare_for_escape",
    value: 3,
    title: "Prepare for Escape",
    defaultStashLevel: 3,
    defaultCultistCircleLevel: 0,
    traderRepBonus: {},
  },
  edge_of_darkness: {
    id: "edge_of_darkness",
    value: 4,
    title: "Edge of Darkness",
    defaultStashLevel: 4,
    defaultCultistCircleLevel: 0,
    traderRepBonus: { ...ALL_TRADERS_REP_BONUS },
    exclusiveTaskIds: [...EOD_EXCLUSIVE_TASK_IDS],
  },
  unheard: {
    id: "unheard",
    value: 5,
    title: "The Unheard",
    defaultStashLevel: 5,
    defaultCultistCircleLevel: 3,
    traderRepBonus: { ...ALL_TRADERS_REP_BONUS },
    excludedTaskIds: [...UNHEARD_EXCLUDED_TASK_IDS],
  },
  edge_of_darkness_unheard: {
    id: "edge_of_darkness_unheard",
    value: 6,
    title: "Edge of Darkness + Unheard",
    defaultStashLevel: 5,
    defaultCultistCircleLevel: 3,
    traderRepBonus: { ...ALL_TRADERS_REP_BONUS },
    exclusiveTaskIds: [...EOD_EXCLUSIVE_TASK_IDS],
    excludedTaskIds: [...UNHEARD_EXCLUDED_TASK_IDS],
  },
};
