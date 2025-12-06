import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { EndingSelector } from "./EndingSelector";
import { EndingFlowView } from "./EndingFlowView";
import { StorylineMapView } from "./StorylineMapView";

type ViewMode = "selector" | "ending" | "fullMap";

interface StorylineContainerProps {
  completedNodes: Set<string>;
  currentNodeId?: string;
  onToggleNode: (id: string) => void;
  onBack?: () => void;
}

export function StorylineContainer({
  completedNodes,
  currentNodeId,
  onToggleNode,
  onBack,
}: StorylineContainerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("selector");
  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null);

  const handleSelectEnding = (endingId: string) => {
    setSelectedEndingId(endingId);
    setViewMode("ending");
  };

  const handleViewFullMap = () => {
    setViewMode("fullMap");
  };

  const handleBackToSelector = () => {
    setViewMode("selector");
    setSelectedEndingId(null);
  };

  const handleBackFromFullMap = () => {
    if (onBack) {
      onBack();
    } else {
      setViewMode("selector");
    }
  };

  if (viewMode === "selector") {
    return (
      <EndingSelector
        onSelectEnding={handleSelectEnding}
        onViewFullMap={handleViewFullMap}
      />
    );
  }

  if (viewMode === "ending" && selectedEndingId) {
    return (
      <ReactFlowProvider>
        <EndingFlowView
          endingId={selectedEndingId}
          onBack={handleBackToSelector}
        />
      </ReactFlowProvider>
    );
  }

  return (
    <ReactFlowProvider>
      <StorylineMapView
        completedNodes={completedNodes}
        currentNodeId={currentNodeId}
        onToggleNode={onToggleNode}
        onBack={handleBackFromFullMap}
      />
    </ReactFlowProvider>
  );
}
