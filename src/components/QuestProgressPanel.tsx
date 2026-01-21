import React from 'react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Award, BookOpen } from "lucide-react";

export interface TraderProgress {
  id: string;
  name: string;
  completed: number;
  total: number;
  color: string;
  icon?: React.ReactNode;
  imageLink?: string;
}

interface QuestProgressPanelProps {
  className?: string;
  totalQuests: number;
  completedQuests: number;
  traders: TraderProgress[];
  totalCollectorItems?: number;
  completedCollectorItems?: number;
  totalAchievements?: number;
  completedAchievements?: number;
  totalStorylineObjectives?: number;
  completedStorylineObjectives?: number;
  totalKappaTasks?: number;
  completedKappaTasks?: number;
  totalLightkeeperTasks?: number;
  completedLightkeeperTasks?: number;
  totalPrestigeSteps?: number;
  completedPrestigeSteps?: number;
  currentPrestigeId?: string;
  progressTitle?: string;
}

export function QuestProgressPanel({
  className,
  totalQuests,
  completedQuests,
  traders,
  totalCollectorItems = 0,
  completedCollectorItems = 0,
  totalAchievements = 0,
  completedAchievements = 0,
  totalStorylineObjectives = 0,
  completedStorylineObjectives = 0,
  totalKappaTasks = 0,
  completedKappaTasks = 0,
  totalLightkeeperTasks = 0,
  completedLightkeeperTasks = 0,
  totalPrestigeSteps = 0,
  completedPrestigeSteps = 0,
  currentPrestigeId,
  progressTitle = "Progress Overview",
}: QuestProgressPanelProps) {
  const progress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  const itemProgress =
    totalCollectorItems > 0
      ? (completedCollectorItems / totalCollectorItems) * 100
      : 0;
  const achievementsProgress =
    totalAchievements > 0
      ? (completedAchievements / totalAchievements) * 100
      : 0;
  const storylineProgress =
    totalStorylineObjectives > 0
      ? (completedStorylineObjectives / totalStorylineObjectives) * 100
      : 0;
  const kappaProgress =
    totalKappaTasks > 0 ? (completedKappaTasks / totalKappaTasks) * 100 : 0;
  const lightkeeperProgress =
    totalLightkeeperTasks > 0
      ? (completedLightkeeperTasks / totalLightkeeperTasks) * 100
      : 0;
  const prestigeProgress =
    totalPrestigeSteps > 0
      ? (completedPrestigeSteps / totalPrestigeSteps) * 100
      : 0;
  const prestigeLabel = currentPrestigeId
    ? `Prestige ${currentPrestigeId.split("-")[1]}`
    : "Prestige";

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-3 sm:p-4 shadow-sm w-full md:w-72",
        className
      )}
    >
      {/* Overview card */}
      <div className="rounded-lg border bg-muted/10 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-foreground mb-2">
          <TrendingUp className="h-4 w-4 text-yellow-500" />
          <h2 className="text-sm sm:text-base font-semibold">{progressTitle}</h2>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold leading-tight">
            {Math.floor(progress)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {completedQuests} / {totalQuests} Quests
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={progress}
            className="h-2 bg-muted"
            indicatorClassName="bg-yellow-500"
          />
        </div>
      </div>

      {/* Storyline Progress Overview */}
      {totalStorylineObjectives > 0 && (
        <div className="rounded-lg border bg-purple-500/10 p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 text-foreground mb-2">
            <BookOpen className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm sm:text-base font-semibold">
              Storyline Progress
            </h2>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold leading-tight">
              {Math.floor(storylineProgress)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {completedStorylineObjectives} / {totalStorylineObjectives}{" "}
              Objectives
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={storylineProgress}
              className="h-2 bg-muted"
              indicatorClassName="bg-purple-500"
            />
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="rounded-lg border bg-muted/10 p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-600 mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Completed</span>
          </div>
          <div className="text-xl sm:text-2xl font-semibold">
            {completedQuests}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/10 p-2.5 sm:p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
            <Award className="h-4 w-4" />
            <span className="text-xs">Remaining</span>
          </div>
          <div className="text-xl sm:text-2xl font-semibold">
            {Math.max(totalQuests - completedQuests, 0)}
          </div>
        </div>
      </div>

      {/* Focused section (TOP) */}
      {(totalKappaTasks > 0 ||
        totalLightkeeperTasks > 0 ||
        totalCollectorItems > 0 ||
        totalAchievements > 0 ||
        totalPrestigeSteps > 0) && (
        <div className="rounded-lg border bg-muted/5 p-3 mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
            Focused Tasks
          </h3>

          {totalKappaTasks > 0 && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>🎯 Kappa Required</span>
                <span>
                  {completedKappaTasks}/{totalKappaTasks}
                </span>
              </div>
              <Progress
                value={kappaProgress}
                className="h-2"
                indicatorClassName="bg-yellow-500"
              />
            </div>
          )}

          {totalCollectorItems > 0 && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>🧩 Collector Items</span>
                <span>
                  {completedCollectorItems}/{totalCollectorItems}
                </span>
              </div>
              <Progress
                value={itemProgress}
                className="h-2"
                indicatorClassName="bg-green-500"
              />
            </div>
          )}

          {totalLightkeeperTasks > 0 && (
            // divider line
            <div className="space-y-2 mb-3">
              <div className="h-px bg-muted/50 my-4" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>💡 Lightkeeper Required</span>
                <span>
                  {completedLightkeeperTasks}/{totalLightkeeperTasks}
                </span>
              </div>
              <Progress
                value={lightkeeperProgress}
                className="h-2"
                indicatorClassName="bg-orange-500"
              />
            </div>
          )}

          {totalAchievements > 0 && (
            <div className="space-y-2 mb-3">
              <div className="h-px bg-muted/50 my-4" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>🏆 Achievements</span>
                <span>
                  {completedAchievements}/{totalAchievements}
                </span>
              </div>
              <Progress
                value={achievementsProgress}
                className="h-2"
                indicatorClassName="bg-blue-500"
              />
            </div>
          )}

          {totalPrestigeSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>🜲 {prestigeLabel}</span>
                <span>
                  {completedPrestigeSteps}/{totalPrestigeSteps}
                </span>
              </div>
              <Progress
                value={prestigeProgress}
                className="h-2"
                indicatorClassName="bg-violet-500"
              />
            </div>
          )}
        </div>
      )}
      {/* Overall section (BOTTOM) */}
      <div className="rounded-lg border bg-muted/10 p-3 space-y-4">
        <div className="mt-0">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
            All Tasks
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-2 md:max-h-100 md:overflow-y-auto md:pr-2">
            {traders.map((trader) => {
              const traderProgress =
                trader.total > 0 ? (trader.completed / trader.total) * 100 : 0;

              return (
                <div key={trader.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trader.color }}
                    />
                    {trader.imageLink && (
                      <img
                        src={trader.imageLink}
                        alt={trader.name}
                        className="w-4 h-4 rounded-full flex-shrink-0"
                      />
                    )}
                    <span className="text-sm text-foreground truncate">
                      {trader.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                      {trader.completed}/{trader.total}
                    </span>
                  </div>
                  <Progress
                    value={traderProgress}
                    className="h-1.5"
                    indicatorClassName="h-full"
                    style={
                      {
                        "--progress-color": trader.color,
                        "--progress-bg": `${trader.color}20`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
