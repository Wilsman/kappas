import type { GameMode } from "@/utils/gameMode";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type LanguageCode,
} from "@/utils/language";
import { taskStorage } from "@/utils/indexedDB";
import type {
  StorylineChapter,
  StorylineItem,
  StorylineLoadResult,
  StorylineObjective,
  StorylineRequirement,
  StorylineRewardEntry,
  StorylineRewardGroup,
  StorylineStep,
} from "@/types/storyline";

export const STORYLINE_API_BASE_URL = "https://json-dev.tarkov.dev";
export const STORYLINE_CACHE_TTL_MS = 30 * 60 * 1000;

type TranslationMap = Record<string, string>;

interface RawRequirement {
  id?: string;
  type?: string;
  task?: string;
  status?: string[];
  items?: string[];
  variableId?: string;
  compareMethod?: string;
  value?: string | number | boolean;
  trader?: string;
  level?: number;
  standing?: number;
}

interface RawObjective {
  id?: string;
  description?: string;
  type?: string;
  optional?: boolean;
  count?: number;
  foundInRaid?: boolean;
  maps?: string[];
  items?: string[];
  questItem?: string;
  task?: string;
  status?: string[];
  traders?: string[];
  trader?: string;
  level?: number;
  skill?: string;
  station?: string;
  stationLevel?: number;
  targetNames?: string[];
  distance?: number;
  timeFromHour?: number;
  timeUntilHour?: number;
  bodyParts?: string[];
  compareMethod?: string;
  value?: string | number | boolean;
}

interface RawRewardContainer {
  items?: Array<{ item?: string; count?: number }>;
  offerUnlock?: Array<{ item?: string; trader?: string; level?: number }>;
  traderStanding?: Array<{ trader?: string; standing?: number }>;
  skillLevelReward?: Array<{
    name?: string;
    level?: number;
    skill?: string | { id?: string; name?: string };
  }>;
  traderUnlock?: Array<string | { id?: string; name?: string }>;
  craftUnlock?: Array<{
    id?: string;
    level?: number;
    station?: string | { id?: string; name?: string };
  }>;
  achievement?: Array<string | { id?: string; name?: string; description?: string }>;
  customization?: Array<string | { id?: string; name?: string }>;
  traderDialogueUnlock?: string[];
  locationUnlock?: string[];
}

interface RawStoryTask {
  id?: string;
  name?: string;
  trader?: string;
  wikiLink?: string;
  minPlayerLevel?: number;
  factionName?: string | null;
  map?: string | null;
  taskRequirements?: RawRequirement[];
  traderRequirements?: RawRequirement[];
  otherRequirements?: RawRequirement[];
  objectives?: RawObjective[];
  startRewards?: RawRewardContainer;
  finishRewards?: RawRewardContainer;
  failureOutcome?: RawRewardContainer;
  experience?: number;
  availableDelaySecondsMin?: number;
  availableDelaySecondsMax?: number;
}

interface RawStoryChapter {
  id?: string;
  _name?: string;
  name?: string;
  tasks?: RawStoryTask[];
}

interface RawQuestItem {
  id?: string;
  name?: string;
  shortName?: string;
  iconLink?: string;
}

interface RawNormalTask {
  id?: string;
  name?: string;
}

interface RawStoryPayload {
  data?: {
    story?: RawStoryChapter[];
    tasks?: Record<string, RawNormalTask>;
    questItems?: Record<string, RawQuestItem>;
  };
}

interface TranslationPayload {
  data?: TranslationMap;
}

interface StorylineTranslations {
  tasks: TranslationMap;
  items: TranslationMap;
  traders: TranslationMap;
  maps: TranslationMap;
  hideout: TranslationMap;
}

interface StepDraft extends StorylineStep {
  rawTaskRequirements: RawRequirement[];
  rawTraderRequirements: RawRequirement[];
  rawOtherRequirements: RawRequirement[];
}

const translate = (
  translations: TranslationMap,
  key: string | null | undefined,
  fallback = "",
): string => {
  if (!key) return fallback;
  return translations[key] ?? fallback;
};

const translateIdName = (
  translations: TranslationMap,
  id: string | null | undefined,
  fallback = "",
): string => {
  if (!id) return fallback;
  return (
    translations[`${id} Name`] ??
    translations[`${id} name`] ??
    translations[id] ??
    fallback
  );
};

const translateTrader = (
  translations: TranslationMap,
  id: string | null | undefined,
): string => {
  if (!id) return "";
  return (
    translations[`${id} Nickname`] ??
    translations[`${id} Name`] ??
    translations[id] ??
    ""
  );
};

const buildItem = (
  id: string | undefined,
  translations: TranslationMap,
  fallback?: RawQuestItem,
): StorylineItem | null => {
  if (!id) return null;
  const name = translate(
    translations,
    fallback?.name,
    translateIdName(translations, id, id),
  );
  return {
    id,
    name,
    shortName: translate(translations, fallback?.shortName),
    iconLink:
      fallback?.iconLink ?? `https://assets.tarkov.dev/${id}-icon.webp`,
  };
};

const fetchJson = async <T>(url: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new TypeError("Storyline API request failed", { cause: error });
  }
  if (!response.ok) {
    throw new Error(`Storyline API returned HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const buildUrl = (
  gameMode: GameMode,
  endpoint: string,
  language?: LanguageCode,
): string => {
  const suffix = language ? `_${normalizeLanguage(language)}` : "";
  return `${STORYLINE_API_BASE_URL}/${gameMode}/${endpoint}${suffix}`;
};

const formatStatus = (status: string): string => {
  switch (status) {
    case "complete":
      return "completed";
    case "active":
      return "active";
    case "failed":
      return "failed";
    default:
      return status;
  }
};

const normalizeObjective = (
  raw: RawObjective,
  translations: StorylineTranslations,
  questItems: Record<string, RawQuestItem>,
  taskLabels: Map<string, string>,
): StorylineObjective | null => {
  if (!raw.id) return null;
  const items = (raw.items ?? [])
    .map((id) => buildItem(id, translations.items))
    .filter((item): item is StorylineItem => item !== null);
  const questItem = raw.questItem
    ? buildItem(raw.questItem, translations.tasks, questItems[raw.questItem])
    : null;
  const maps = (raw.maps ?? []).map((id) =>
    translateIdName(translations.maps, id, id),
  );
  const details: string[] = [];

  if (raw.task) {
    const statuses = (raw.status ?? []).map(formatStatus).join(" or ");
    details.push(
      `${taskLabels.get(raw.task) ?? "Related task"}${statuses ? `: ${statuses}` : ""}`,
    );
  }
  if (raw.trader) {
    const trader = translateTrader(translations.traders, raw.trader);
    if (trader) details.push(`Trader: ${trader}`);
  }
  if (raw.traders?.length) {
    const traders = raw.traders
      .map((id) => translateTrader(translations.traders, id))
      .filter(Boolean);
    if (traders.length) details.push(`Traders: ${traders.join(", ")}`);
  }
  if (raw.skill) {
    details.push(
      `Skill: ${translateIdName(translations.tasks, raw.skill, raw.skill)}${raw.level ? ` level ${raw.level}` : ""}`,
    );
  }
  if (raw.station) {
    details.push(
      `${translateIdName(translations.hideout, raw.station, "Hideout station")}${raw.stationLevel ? ` level ${raw.stationLevel}` : ""}`,
    );
  }
  if (raw.targetNames?.length) {
    details.push(`Targets: ${raw.targetNames.join(", ")}`);
  }
  if (raw.distance) details.push(`Distance: ${raw.distance}m or more`);
  if (raw.timeFromHour !== undefined && raw.timeUntilHour !== undefined) {
    details.push(`Time: ${raw.timeFromHour}:00–${raw.timeUntilHour}:00`);
  }
  if (raw.bodyParts?.length) details.push(`Body parts: ${raw.bodyParts.join(", ")}`);
  if (raw.compareMethod && raw.value !== undefined) {
    details.push(`Requirement: ${raw.compareMethod} ${String(raw.value)}`);
  }

  return {
    id: raw.id,
    description: translate(
      translations.tasks,
      raw.description,
      raw.description ?? "Unknown objective",
    ),
    type: raw.type ?? "unknown",
    optional: raw.optional === true,
    count:
      typeof raw.count === "number" && raw.count > 0 ? raw.count : undefined,
    foundInRaid: raw.foundInRaid,
    maps,
    items,
    questItem: questItem ?? undefined,
    details,
  };
};

const makeRewardEntry = (
  type: string,
  id: string,
  label: string,
  extras: Partial<StorylineRewardEntry> = {},
): StorylineRewardEntry => ({ id: `${type}:${id}`, type, label, ...extras });

const normalizeRewards = (
  rewards: RawRewardContainer | undefined,
  translations: StorylineTranslations,
  experience = 0,
): StorylineRewardGroup | undefined => {
  const entries: StorylineRewardEntry[] = [];

  for (const reward of rewards?.items ?? []) {
    const item = buildItem(reward.item, translations.items);
    if (item) {
      entries.push(
        makeRewardEntry("item", item.id, item.name, {
          count: reward.count ?? 1,
          iconLink: item.iconLink,
        }),
      );
    }
  }
  for (const unlock of rewards?.offerUnlock ?? []) {
    const item = buildItem(unlock.item, translations.items);
    if (!item) continue;
    const trader = translateTrader(translations.traders, unlock.trader);
    entries.push(
      makeRewardEntry("offer", `${item.id}:${unlock.trader ?? "trader"}`, item.name, {
        description: `${trader || "Trader"} loyalty level ${unlock.level ?? 1} offer`,
        iconLink: item.iconLink,
      }),
    );
  }
  for (const reward of rewards?.traderStanding ?? []) {
    const trader = translateTrader(translations.traders, reward.trader);
    entries.push(
      makeRewardEntry(
        "standing",
        `${reward.trader ?? "trader"}:${reward.standing ?? 0}`,
        `${trader || "Trader"} standing`,
        { count: reward.standing },
      ),
    );
  }
  for (const reward of rewards?.skillLevelReward ?? []) {
    const rawSkill =
      typeof reward.skill === "string" ? reward.skill : reward.skill?.name;
    const skill = translate(
      translations.tasks,
      rawSkill,
      typeof reward.skill === "object" ? reward.skill?.name ?? "Skill" : rawSkill ?? "Skill",
    );
    entries.push(
      makeRewardEntry("skill", rawSkill ?? skill, skill, {
        count: reward.level,
      }),
    );
  }
  for (const reward of rewards?.traderUnlock ?? []) {
    const id = typeof reward === "string" ? reward : reward.id;
    if (!id) continue;
    const rawName = typeof reward === "string" ? undefined : reward.name;
    entries.push(
      makeRewardEntry(
        "trader",
        id,
        translate(translations.tasks, rawName, translateTrader(translations.traders, id) || id),
        { description: "Trader unlocked" },
      ),
    );
  }
  for (const reward of rewards?.craftUnlock ?? []) {
    const stationId =
      typeof reward.station === "string" ? reward.station : reward.station?.id;
    const stationName =
      typeof reward.station === "object"
        ? translate(translations.hideout, reward.station?.name, "Hideout craft")
        : translateIdName(translations.hideout, stationId, "Hideout craft");
    entries.push(
      makeRewardEntry("craft", reward.id ?? `${stationId}:${reward.level}`, stationName, {
        description: `Level ${reward.level ?? 1} craft unlocked`,
      }),
    );
  }
  for (const reward of rewards?.achievement ?? []) {
    const id = typeof reward === "string" ? reward : reward.id;
    if (!id) continue;
    const rawName = typeof reward === "string" ? undefined : reward.name;
    const rawDescription =
      typeof reward === "string" ? undefined : reward.description;
    entries.push(
      makeRewardEntry(
        "achievement",
        id,
        translate(translations.tasks, rawName, translateIdName(translations.tasks, id, id)),
        {
          description: translate(translations.tasks, rawDescription),
        },
      ),
    );
  }
  for (const reward of rewards?.customization ?? []) {
    const id = typeof reward === "string" ? reward : reward.id;
    if (!id) continue;
    const rawName = typeof reward === "string" ? undefined : reward.name;
    entries.push(
      makeRewardEntry(
        "customization",
        id,
        translate(translations.tasks, rawName, translateIdName(translations.tasks, id, id)),
        { description: "Customization unlocked" },
      ),
    );
  }
  for (const id of rewards?.traderDialogueUnlock ?? []) {
    entries.push(
      makeRewardEntry(
        "dialogue",
        id,
        translateTrader(translations.traders, id) || "Trader dialogue",
        { description: "Dialogue unlocked" },
      ),
    );
  }
  for (const id of rewards?.locationUnlock ?? []) {
    entries.push(
      makeRewardEntry(
        "location",
        id,
        translateIdName(translations.maps, id, id),
        { description: "Location unlocked" },
      ),
    );
  }
  if (experience > 0) {
    entries.unshift(
      makeRewardEntry("experience", String(experience), "Experience", {
        count: experience,
      }),
    );
  }

  return entries.length > 0 ? { entries } : undefined;
};

const normalizeRequirement = (
  raw: RawRequirement,
  index: number,
  labels: Map<string, string>,
  translations: StorylineTranslations,
): StorylineRequirement => {
  const id = raw.id ?? `${raw.type ?? "requirement"}:${raw.task ?? index}`;
  if (raw.task) {
    const target = labels.get(raw.task);
    const status = raw.status ?? [];
    return {
      id,
      type: "task",
      targetId: raw.task,
      status,
      unresolved: !target,
      label: `${target ?? "Unresolved prerequisite"}${status.length ? ` must be ${status.map(formatStatus).join(" or ")}` : ""}`,
    };
  }
  if (raw.items?.length) {
    const items = raw.items
      .map((itemId) => {
        const item = buildItem(itemId, translations.items);
        return item?.name === itemId
          ? buildItem(itemId, translations.tasks)
          : item;
      })
      .filter((item): item is StorylineItem => item !== null);
    return {
      id,
      type: raw.type ?? "items",
      label:
        items.length === 1
          ? `Requires ${items[0].name}`
          : `Requires one of ${items.length} items`,
      items,
    };
  }
  if (raw.trader) {
    const trader = translateTrader(translations.traders, raw.trader);
    return {
      id,
      type: raw.type ?? "trader",
      label: `${trader || "Trader"}${raw.level ? ` level ${raw.level}` : ""}${raw.standing !== undefined ? ` standing ${raw.standing}` : ""}`,
    };
  }
  return {
    id,
    type: raw.type ?? "story-state",
    label: "Story route condition",
  };
};

export const normalizeStorylineData = (
  payload: RawStoryPayload,
  translations: StorylineTranslations,
): StorylineChapter[] => {
  const rawChapters = payload.data?.story ?? [];
  const questItems = payload.data?.questItems ?? {};
  const normalTasks = payload.data?.tasks ?? {};
  const labels = new Map<string, string>();

  for (const chapter of rawChapters) {
    if (chapter.id) labels.set(chapter.id, chapter._name ?? chapter.id);
  }
  for (const [id, task] of Object.entries(normalTasks)) {
    labels.set(
      id,
      translate(
        translations.tasks,
        task.name,
        translateIdName(translations.tasks, id, id),
      ),
    );
  }
  for (const chapter of rawChapters) {
    chapter.tasks?.forEach((task, index) => {
      if (!task.id) return;
      const translatedName = translate(translations.tasks, task.name).trim();
      labels.set(
        task.id,
        `${chapter._name ?? chapter.id ?? "Storyline"} · ${translatedName || `Step ${index + 1}`}`,
      );
    });
  }

  return rawChapters.flatMap((chapter): StorylineChapter[] => {
    if (!chapter.id) return [];
    const steps = (chapter.tasks ?? []).flatMap((task, index): StepDraft[] => {
      if (!task.id) return [];
      const name = translate(translations.tasks, task.name).trim();
      const objectives = (task.objectives ?? [])
        .map((objective) =>
          normalizeObjective(
            objective,
            translations,
            questItems,
            labels,
          ),
        )
        .filter((objective): objective is StorylineObjective => objective !== null);
      const trader = translateTrader(translations.traders, task.trader);

      return [
        {
          id: task.id,
          index: index + 1,
          name: name || undefined,
          trader: trader || undefined,
          traderId: task.trader,
          minPlayerLevel: task.minPlayerLevel ?? 0,
          factionName: task.factionName,
          map: task.map
            ? translateIdName(translations.maps, task.map, task.map)
            : undefined,
          wikiLink: task.wikiLink || undefined,
          delaySecondsMin: task.availableDelaySecondsMin ?? 0,
          delaySecondsMax: task.availableDelaySecondsMax ?? 0,
          requirements: [],
          objectives,
          startRewards: normalizeRewards(task.startRewards, translations),
          finishRewards: normalizeRewards(
            task.finishRewards,
            translations,
            task.experience ?? 0,
          ),
          failureOutcome: normalizeRewards(task.failureOutcome, translations),
          rawTaskRequirements: task.taskRequirements ?? [],
          rawTraderRequirements: task.traderRequirements ?? [],
          rawOtherRequirements: task.otherRequirements ?? [],
        },
      ];
    });

    return [
      {
        id: chapter.id,
        name: chapter._name ??
          translate(translations.tasks, chapter.name, chapter.id),
        steps: steps.map((step) => {
          const requirements = [
            ...step.rawTaskRequirements,
            ...step.rawTraderRequirements,
            ...step.rawOtherRequirements,
          ].map((requirement, index) =>
            normalizeRequirement(requirement, index, labels, translations),
          );
          const {
            rawTaskRequirements: _rawTaskRequirements,
            rawTraderRequirements: _rawTraderRequirements,
            rawOtherRequirements: _rawOtherRequirements,
            ...normalizedStep
          } = step;
          void _rawTaskRequirements;
          void _rawTraderRequirements;
          void _rawOtherRequirements;
          return { ...normalizedStep, requirements };
        }),
      },
    ];
  });
};

const fetchStorylineFromNetwork = async (
  gameMode: GameMode,
  language: LanguageCode,
): Promise<StorylineChapter[]> => {
  const normalizedLanguage = normalizeLanguage(language);
  const [payload, taskTranslations, itemTranslations, traderTranslations, mapTranslations, hideoutTranslations] =
    await Promise.all([
      fetchJson<RawStoryPayload>(buildUrl(gameMode, "tasks")),
      fetchJson<TranslationPayload>(
        buildUrl(gameMode, "tasks", normalizedLanguage),
      ),
      fetchJson<TranslationPayload>(
        buildUrl(gameMode, "items", normalizedLanguage),
      ),
      fetchJson<TranslationPayload>(
        buildUrl(gameMode, "traders", normalizedLanguage),
      ),
      fetchJson<TranslationPayload>(
        buildUrl(gameMode, "maps", normalizedLanguage),
      ),
      fetchJson<TranslationPayload>(
        buildUrl(gameMode, "hideout", normalizedLanguage),
      ),
    ]);

  const chapters = normalizeStorylineData(payload, {
    tasks: taskTranslations.data ?? {},
    items: itemTranslations.data ?? {},
    traders: traderTranslations.data ?? {},
    maps: mapTranslations.data ?? {},
    hideout: hideoutTranslations.data ?? {},
  });
  if (chapters.length === 0) {
    throw new Error("Storyline API response did not include story data");
  }
  return chapters;
};

export async function loadStorylineData(
  gameMode: GameMode,
  language: LanguageCode = DEFAULT_LANGUAGE,
  options: { forceRefresh?: boolean } = {},
): Promise<StorylineLoadResult> {
  const normalizedLanguage = normalizeLanguage(language);
  const startingProfileId = taskStorage.getProfileId();
  const cached = await taskStorage.loadStorylineApiCache(
    gameMode,
    normalizedLanguage,
  );
  const cacheIsFresh =
    cached && Date.now() - cached.updatedAt < STORYLINE_CACHE_TTL_MS;

  if (cached && cacheIsFresh && !options.forceRefresh) {
    return {
      chapters: cached.chapters,
      updatedAt: cached.updatedAt,
      source: "cache",
      stale: false,
    };
  }

  try {
    const chapters = await fetchStorylineFromNetwork(
      gameMode,
      normalizedLanguage,
    );
    const updatedAt = Date.now();
    if (taskStorage.getProfileId() === startingProfileId) {
      await taskStorage.saveStorylineApiCache(
        gameMode,
        normalizedLanguage,
        chapters,
      );
    }
    return { chapters, updatedAt, source: "network", stale: false };
  } catch (error) {
    if (cached) {
      return {
        chapters: cached.chapters,
        updatedAt: cached.updatedAt,
        source: "cache",
        stale: true,
      };
    }
    throw error;
  }
}
