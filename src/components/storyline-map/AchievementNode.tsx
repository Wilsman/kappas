import React from 'react';
import type { Node } from '@xyflow/react';
import { Trophy, Star } from 'lucide-react';

interface AchievementNodeData {
  label: string;
  description: string;
  note?: string;
  isCompleted?: boolean;
  isCurrentStep?: boolean;
  isSelected?: boolean;
  isOnPath?: boolean;
  isAchievement?: boolean;
}

export default function AchievementNode({ data }: Node<AchievementNodeData>) {
  const {
    label,
    description,
    note,
    isCompleted = false,
    isCurrentStep = false,
    isSelected = false,
    isOnPath = false,
  } = data;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-card shadow-lg transition-all duration-200
        ${isCompleted ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/10'}
        ${isCurrentStep ? 'ring-2 ring-amber-500 ring-offset-2' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isOnPath ? 'border-amber-400 shadow-amber-200/50 dark:shadow-amber-400/20' : ''}
        hover:shadow-xl hover:scale-105 cursor-pointer
      `}
    >
      {/* Achievement Icon */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
        <Trophy className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="ml-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">
            {label}
          </h3>
          {isCompleted && <Star className="w-4 h-4 text-amber-500 fill-current" />}
        </div>
        
        <p className="text-xs text-amber-800 dark:text-amber-200 mb-1">
          {description}
        </p>
        
        {note && (
          <p className="text-xs text-amber-600 dark:text-amber-400 italic">
            {note}
          </p>
        )}
      </div>

      {/* Completion indicator */}
      {isCompleted && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <Star className="w-3 h-3 text-white fill-current" />
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
}
