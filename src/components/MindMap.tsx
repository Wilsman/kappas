import React, { useMemo, useState, useCallback } from "react";
import { Task } from "../types";
import { QuestTreeView } from "./QuestTreeView";

interface MindMapProps {
  tasks: Task[];
  completedTasks: Set<string>;
  hiddenTraders: Set<string>;
  onToggleComplete: (taskId: string) => void;
  showKappa: boolean;
  showLightkeeper: boolean;
  highlightedTaskId?: string | null;
}

export const MindMap: React.FC<MindMapProps> = ({
  tasks,
  completedTasks,
  hiddenTraders,
  onToggleComplete,
  showKappa,
  showLightkeeper,
  highlightedTaskId = null,
}) => {
  // For now, we'll use the QuestTreeView as the new "Mind Map"
  // This provides a much cleaner, more navigable interface
  return (
    <QuestTreeView
      tasks={tasks}
      completedTasks={completedTasks}
      hiddenTraders={hiddenTraders}
      showKappa={showKappa}
      showLightkeeper={showLightkeeper}
      onToggleComplete={onToggleComplete}
      highlightedTaskId={highlightedTaskId}
    />
  );
};