import React from "react";
import { Minus, Plus } from "lucide-react";
import type { Achievement, Task } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  buildLegacyTaskObjectiveItemProgressKey,
  buildLegacyTaskObjectiveProgressKey,
  buildTaskObjectiveFallbackKeys,
  buildTaskObjectiveItemProgressKey,
  buildTaskObjectiveKeys,
  buildTaskObjectiveProgressKey,
  formatTaskObjectiveLabel,
  getTaskObjectiveItemProgress,
  getTaskObjectiveProgress,
  isTaskObjectiveCompleted,
} from "@/utils/taskObjectives";

interface TaskDetailsContentProps {
  task: Task;
  achievements?: Achievement[];
  completedTaskObjectives: Set<string>;
  taskObjectiveItemProgress: Record<string, number>;
  onToggleTaskObjective: (
    taskId: string,
    objectiveKey: string,
    legacyObjectiveKey?: string | string[],
  ) => void;
  onUpdateTaskObjectiveItemProgress: (
    objectiveItemKey: string,
    count: number,
    legacyObjectiveItemKey?: string | string[],
  ) => void;
  className?: string;
}

function clampProgress(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

export function TaskDetailsContent({
  task,
  achievements = [],
  completedTaskObjectives,
  taskObjectiveItemProgress,
  onToggleTaskObjective,
  onUpdateTaskObjectiveItemProgress,
  className,
}: TaskDetailsContentProps) {
  const objectiveKeys = buildTaskObjectiveKeys(task);
  const achievementById = new Map(
    achievements.map((achievement) => [achievement.id, achievement]),
  );
  const achievementByName = new Map(
    achievements.map((achievement) => [
      achievement.name.toLowerCase(),
      achievement,
    ]),
  );
  const rewardItems = [
    ...(task.startRewards?.items ?? []),
    ...(task.finishRewards?.items ?? []),
  ];
  const traderStandingRewards = (
    task.finishRewards?.traderStanding ?? []
  ).filter(
    (reward) =>
      typeof reward.standing === "number" && Boolean(reward.trader?.name),
  );
  const skillRewards = (task.finishRewards?.skillLevelReward ?? []).filter(
    (reward) =>
      typeof reward.level === "number" &&
      Boolean(reward.name || reward.skill?.name),
  );
  const traderUnlocks = (task.finishRewards?.traderUnlock ?? []).filter(
    (reward) => Boolean(reward.name),
  );
  const customizationRewards = (
    task.finishRewards?.customization ?? []
  ).filter((reward) => Boolean(reward.name));
  const achievementRewards = (task.finishRewards?.achievement ?? [])
    .filter((reward) => Boolean(reward.name))
    .map((reward) => {
      const achievement =
        (reward.id ? achievementById.get(reward.id) : undefined) ??
        achievementByName.get(reward.name.toLowerCase());
      return {
        ...reward,
        imageLink: reward.imageLink ?? achievement?.imageLink,
      };
    });
  const offerUnlocks = task.finishRewards?.offerUnlock ?? [];
  const craftUnlocks = task.finishRewards?.craftUnlock ?? [];
  const hasRewards =
    rewardItems.length > 0 ||
    traderStandingRewards.length > 0 ||
    skillRewards.length > 0 ||
    traderUnlocks.length > 0 ||
    customizationRewards.length > 0 ||
    achievementRewards.length > 0 ||
    offerUnlocks.length > 0 ||
    craftUnlocks.length > 0 ||
    (typeof task.experience === "number" && task.experience > 0);

  return (
    <div
      className={cn(
        "space-y-4 border-t border-border/70 bg-background/35 px-3 py-4 text-xs text-muted-foreground sm:px-5",
        className,
      )}
    >
      {task.map && (
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">Map:</span>
          <span>{task.map.name}</span>
        </p>
      )}

      {(task.objectives?.length ?? 0) > 0 && (
        <section aria-label={`${task.name} objectives`}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-500">
            Objectives
          </p>
          <ul className="space-y-3">
            {task.objectives?.map((objective, index) => {
              const objectiveKey = objectiveKeys[index];
              const fallbackKeys = buildTaskObjectiveFallbackKeys(
                task,
                index,
                objectiveKey,
              );
              const checked = isTaskObjectiveCompleted(
                completedTaskObjectives,
                objectiveKey,
                fallbackKeys,
              );
              const requiredCount = Math.max(1, objective.count ?? 1);
              const progressKey = buildTaskObjectiveProgressKey(objectiveKey);
              const legacyProgressKeys = [
                ...fallbackKeys.map(buildTaskObjectiveProgressKey),
                buildLegacyTaskObjectiveProgressKey(task.id, index),
              ];
              const objectiveCount = clampProgress(
                getTaskObjectiveProgress(
                  taskObjectiveItemProgress,
                  progressKey,
                  legacyProgressKeys,
                ),
                requiredCount,
              );
              const isCountOnly =
                !objective.items?.length && requiredCount > 1;
              const items = objective.items ?? [];
              const usesSharedPool = items.length > 1 && requiredCount > 1;
              const itemProgress = items.map((item, itemIndex) => {
                const itemIdentity = item.id || item.name || String(itemIndex);
                const itemKey = buildTaskObjectiveItemProgressKey(
                  objectiveKey,
                  itemIdentity,
                );
                const legacyItemKeys = [
                  ...fallbackKeys.map((fallbackKey) =>
                    buildTaskObjectiveItemProgressKey(
                      fallbackKey,
                      itemIdentity,
                    ),
                  ),
                  buildLegacyTaskObjectiveItemProgressKey(
                    task.id,
                    index,
                    itemIdentity,
                  ),
                ];
                return {
                  item,
                  itemKey,
                  legacyItemKeys,
                  count: clampProgress(
                    getTaskObjectiveItemProgress(
                      taskObjectiveItemProgress,
                      itemKey,
                      legacyItemKeys,
                    ),
                    requiredCount,
                  ),
                };
              });

              return (
                <li key={objectiveKey} className="space-y-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        onToggleTaskObjective(
                          task.id,
                          objectiveKey,
                          fallbackKeys,
                        )
                      }
                      aria-label={`Mark ${formatTaskObjectiveLabel(objective)} ${checked ? "incomplete" : "complete"}`}
                      className="mt-0.5 size-5 shrink-0 rounded-full border-blue-500 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] leading-5 text-foreground/80">
                        {items.length === 1 && (
                          <ItemImage
                            item={items[0]}
                            className="size-5"
                          />
                        )}
                        <span>{formatTaskObjectiveLabel(objective)}</span>
                        {objective.foundInRaid && (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-500">
                            FIR
                          </span>
                        )}
                      </div>

                      {isCountOnly && (
                        <ProgressControls
                          label={formatTaskObjectiveLabel(objective)}
                          current={objectiveCount}
                          maximum={requiredCount}
                          onChange={(next) =>
                            onUpdateTaskObjectiveItemProgress(
                              progressKey,
                              next,
                              legacyProgressKeys,
                            )
                          }
                        />
                      )}

                      {items.length > 0 && (
                        <div className="mt-2 grid gap-2">
                          {itemProgress.map(
                            ({ item, itemKey, legacyItemKeys, count }) => {
                              const otherCount = usesSharedPool
                                ? itemProgress.reduce(
                                    (total, entry) =>
                                      entry.itemKey === itemKey
                                        ? total
                                        : total + entry.count,
                                    0,
                                  )
                                : 0;
                              const maximum = usesSharedPool
                                ? Math.max(0, requiredCount - otherCount)
                                : requiredCount;
                              return (
                                <div
                                  key={itemKey}
                                  className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/80 bg-card/45 p-2.5 sm:flex-row sm:items-center"
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <ItemImage item={item} className="size-9" />
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-foreground">
                                        {item.name}
                                      </p>
                                      <p className="mt-0.5 text-[11px]">
                                        {Math.max(0, requiredCount - count)} remaining
                                      </p>
                                    </div>
                                  </div>
                                  <ProgressControls
                                    compact
                                    label={item.name}
                                    current={count}
                                    maximum={maximum}
                                    onChange={(next) =>
                                      onUpdateTaskObjectiveItemProgress(
                                        itemKey,
                                        next,
                                        legacyItemKeys,
                                      )
                                    }
                                  />
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {hasRewards && (
        <section aria-label={`${task.name} rewards`} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-500">
              Rewards
            </p>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {traderStandingRewards.map((reward, index) => {
              const standing = reward.standing ?? 0;
              return (
                <RewardBadge key={`rep-${index}`} tone="emerald">
                  {standing > 0 ? "+" : ""}
                  {standing.toFixed(2)} {reward.trader?.name}
                </RewardBadge>
              );
            })}
            {skillRewards.map((reward, index) => (
              <RewardBadge key={`skill-${index}`} tone="sky">
                +{reward.level} {reward.name || reward.skill?.name}
              </RewardBadge>
            ))}
            {typeof task.experience === "number" && task.experience > 0 && (
              <RewardBadge tone="amber">
                {task.experience.toLocaleString()} XP
              </RewardBadge>
            )}
            {traderUnlocks.map((reward, index) => (
              <RewardBadge key={`trader-${index}`} tone="orange">
                Unlock {reward.name}
              </RewardBadge>
            ))}
            {achievementRewards.map((reward, index) => (
              <RewardBadge key={`achievement-${index}`} tone="violet">
                {reward.imageLink && (
                  <img
                    src={reward.imageLink}
                    alt=""
                    className="size-4 rounded-sm object-contain"
                  />
                )}
                {reward.name}
              </RewardBadge>
            ))}
            {customizationRewards.map((reward, index) => (
              <RewardBadge key={`customization-${index}`} tone="blue">
                {reward.name}
              </RewardBadge>
            ))}
            {craftUnlocks.map((reward, index) => (
              <RewardBadge key={`craft-${index}`} tone="blue">
                Craft: {reward.station?.name ?? "Hideout"} level {reward.level}
              </RewardBadge>
            ))}
          </div>

          {rewardItems.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {rewardItems.map((reward, index) => (
                <div
                  key={`reward-${reward.item.id ?? reward.item.name}-${index}`}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-sky-500/15 bg-sky-500/5 px-2.5 py-2"
                >
                  <ItemImage item={reward.item} className="size-8" />
                  <span className="min-w-0 truncate text-[11px] text-sky-100/90">
                    {reward.item.name}
                    {reward.count > 1 ? ` x${reward.count.toLocaleString()}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {offerUnlocks.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {offerUnlocks.map((unlock, index) => (
                <div
                  key={`offer-${unlock.item.id ?? unlock.item.name}-${index}`}
                  className="flex min-w-0 items-center gap-2.5 rounded-md border border-amber-500/15 bg-amber-500/5 px-2.5 py-2"
                >
                  <ItemImage item={unlock.item} className="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-foreground">
                      {unlock.item.name}
                    </p>
                    <p className="text-[10px] text-amber-300">
                      {unlock.trader.name} LL{unlock.level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ItemImage({
  item,
  className,
}: {
  item: { id?: string; name: string; iconLink?: string };
  className?: string;
}) {
  const source =
    item.iconLink ||
    (item.id ? `https://assets.tarkov.dev/${item.id}-icon.webp` : undefined);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded border border-border/70 bg-black/25 p-0.5",
        className,
      )}
    >
      {source ? (
        <img
          src={source}
          alt={item.name}
          loading="lazy"
          className="size-full object-contain"
        />
      ) : (
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      )}
    </span>
  );
}

function ProgressControls({
  label,
  current,
  maximum,
  onChange,
  compact = false,
}: {
  label: string;
  current: number;
  maximum: number;
  onChange: (count: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2",
        compact && "mt-0 justify-end sm:shrink-0",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clampProgress(current - 1, maximum))}
        disabled={current <= 0}
        aria-label={`Decrease ${label}`}
        className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-10 text-center font-mono text-xs text-foreground">
        {current}/{Math.max(current, maximum)}
      </span>
      <button
        type="button"
        onClick={() => onChange(clampProgress(current + 1, maximum))}
        disabled={current >= maximum}
        aria-label={`Increase ${label}`}
        className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Plus className="size-3.5" />
      </button>
      {!compact && (
        <span className="text-[11px]">{Math.max(0, maximum - current)} remaining</span>
      )}
    </div>
  );
}

function RewardBadge({
  tone,
  children,
}: {
  tone: "emerald" | "sky" | "amber" | "orange" | "violet" | "blue";
  children: React.ReactNode;
}) {
  const tones = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    orange: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
