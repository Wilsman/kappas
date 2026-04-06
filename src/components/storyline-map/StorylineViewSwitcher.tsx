import { ChevronLeft, ChevronRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { endingInfos } from "./endingData";

type StorylineViewItem =
  | {
      id: "full-map";
      label: string;
      type: "fullMap";
    }
  | {
      id: string;
      label: string;
      type: "ending";
      color: string;
      iconUrl: string;
    };

const storylineViewItems: StorylineViewItem[] = [
  {
    id: "full-map",
    label: "Full Map",
    type: "fullMap",
  },
  ...endingInfos.map((ending) => ({
    id: ending.id,
    label: ending.label,
    type: "ending" as const,
    color: ending.color,
    iconUrl: ending.iconUrl,
  })),
];

interface StorylineViewSwitcherProps {
  currentViewId: "full-map" | string;
  onSelectEnding: (endingId: string) => void;
  onSelectFullMap: () => void;
}

export function StorylineViewSwitcher({
  currentViewId,
  onSelectEnding,
  onSelectFullMap,
}: StorylineViewSwitcherProps) {
  const currentIndex = storylineViewItems.findIndex(
    (item) => item.id === currentViewId
  );
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const previousItem =
    storylineViewItems[
      (safeIndex - 1 + storylineViewItems.length) % storylineViewItems.length
    ];
  const nextItem =
    storylineViewItems[(safeIndex + 1) % storylineViewItems.length];

  const handleSelect = (item: StorylineViewItem) => {
    if (item.type === "fullMap") {
      onSelectFullMap();
      return;
    }

    onSelectEnding(item.id);
  };

  const currentItem = storylineViewItems[safeIndex];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Switch View
        </span>
        <div className="h-px flex-1 bg-border/70" />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect(previousItem)}
          className="h-7 w-7 shrink-0"
          title={`Previous: ${previousItem.label}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="flex min-w-0 flex-1 flex-nowrap gap-1">
          {storylineViewItems.map((item) => {
            const isActive = item.id === currentItem.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(item)}
                className={cn(
                  "h-7 min-w-0 gap-1 px-2 text-[11px] whitespace-nowrap",
                  item.type === "fullMap" &&
                    !isActive &&
                    "border-sky-500/40 bg-sky-500/5 text-sky-200 hover:bg-sky-500/10 hover:text-sky-100",
                  item.type === "ending" &&
                    !isActive &&
                    "bg-background/70 text-foreground/85 hover:bg-muted/80"
                )}
                style={
                  item.type === "ending" && !isActive
                    ? { borderColor: `${item.color}66` }
                    : undefined
                }
              >
                {item.type === "fullMap" ? (
                  <Map className="h-3 w-3 shrink-0" />
                ) : (
                  <img
                    src={item.iconUrl}
                    alt={item.label}
                    className="h-3 w-3 shrink-0 object-contain"
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect(nextItem)}
          className="h-7 w-7 shrink-0"
          title={`Next: ${nextItem.label}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
