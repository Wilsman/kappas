import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Welcome to EFT Task Tracker
          </DialogTitle>
          <DialogDescription className="text-center">
            A comprehensive guide to help you track your progress in Escape from
            Tarkov.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Focus Control */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Focus Mode</h3>
            <p className="text-sm text-muted-foreground">
              Filter tasks for focusing on either Kappa or Lightkeeper:
            </p>

            {/* Dummy Focus Control */}
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg border bg-muted/30">
              <span className="text-xs text-muted-foreground mr-2">Focus</span>
              <div className="flex items-center gap-1 p-1 rounded-full border bg-muted/30">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full px-3"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full px-3",
                    "text-violet-600 hover:text-violet-700 border border-violet-500/30",
                  )}
                >
                  <span
                    className="mr-2 h-2 w-2 rounded-full bg-violet-500"
                    aria-hidden
                  />
                  Kappa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full px-3",
                    "text-amber-600 hover:text-amber-700 border border-amber-500/30",
                  )}
                >
                  <span
                    className="mr-2 h-2 w-2 rounded-full bg-amber-500"
                    aria-hidden
                  />
                  Lightkeeper
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Switch to show ONLY Kappa-required tasks or ONLY
              Lightkeeper-required tasks. Click All to show everything.
            </p>
          </div>
          {/* Search Feature */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Quick Search</h3>
            <p className="text-sm text-muted-foreground">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl</kbd>{" "}
              + <kbd className="px-1.5 py-0.5 rounded border bg-muted">K</kbd>{" "}
              or click the Search button to open command palette.
            </p>
            <p className="text-sm text-muted-foreground">
              Search for tasks, items, achievements, and navigate between views
              instantly.
            </p>
          </div>

          {/* Filter by trader/map for tasks Feature */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">
              Filter by trader/map for tasks
            </h3>
            <p className="text-sm text-muted-foreground">
              Use the trader/map filter to group the tasks by trader or map.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Get Started</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
