import { Handle, Position } from "@xyflow/react";
import { Trophy, Star } from "lucide-react";

interface AchievementNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  note?: string;
  isCompleted?: boolean;
  isCurrentStep?: boolean;
  isSelected?: boolean;
  isOnPath?: boolean;
  isAchievement?: boolean;
}

export default function AchievementNode({
  data,
}: {
  data: AchievementNodeData;
}) {
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
    <>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-400 border-2 border-amber-600"
      />

      <div
        className={`
          relative px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-200
          ${
            isCompleted
              ? "border-amber-400 bg-gradient-to-br from-amber-950/65 to-amber-900/25"
              : "border-amber-500/70 bg-gradient-to-br from-zinc-900 to-amber-950/35"
          }
          ${isCurrentStep ? "ring-2 ring-amber-500 ring-offset-2" : ""}
          ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
          ${
            isOnPath
              ? "border-amber-400 shadow-amber-500/20"
              : ""
          }
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
            <h3 className="font-bold text-sm text-amber-100">
              {label}
            </h3>
            {isCompleted && (
              <Star className="w-4 h-4 text-amber-500 fill-current" />
            )}
          </div>

          <p className="text-xs text-amber-200/90 mb-1">
            {description}
          </p>

          {note && (
            <p className="text-xs text-amber-300/80 italic">
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

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-amber-400 border-2 border-amber-600"
      />
    </>
  );
}
