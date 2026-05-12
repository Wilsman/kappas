import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ResetOptions {
  storylineQuests: boolean;
  normalTasks: boolean;
  hideoutItems: boolean;
  collectorItems: boolean;
  achievements: boolean;
  prestiges: boolean;
  workingOnItems: boolean;
  trackedItems: boolean;
}

interface SelectiveResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  onConfirm: (options: ResetOptions) => void;
}

export function SelectiveResetDialog({
  open,
  onOpenChange,
  profileName,
  onConfirm,
}: SelectiveResetDialogProps) {
  const [options, setOptions] = React.useState<ResetOptions>({
    storylineQuests: false,
    normalTasks: false,
    hideoutItems: false,
    collectorItems: false,
    achievements: false,
    prestiges: false,
    workingOnItems: false,
    trackedItems: false,
  });

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setOptions({
        storylineQuests: false,
        normalTasks: false,
        hideoutItems: false,
        collectorItems: false,
        achievements: false,
        prestiges: false,
        workingOnItems: false,
        trackedItems: false,
      });
    }
  }, [open]);

  const allSelected = Object.values(options).every((v) => v);
  const someSelected = Object.values(options).some((v) => v);
  const noneSelected = !someSelected;

  const handleSelectAll = (checked: boolean) => {
    setOptions({
      storylineQuests: checked,
      normalTasks: checked,
      hideoutItems: checked,
      collectorItems: checked,
      achievements: checked,
      prestiges: checked,
      workingOnItems: checked,
      trackedItems: checked,
    });
  };

  const handleConfirm = () => {
    onConfirm(options);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose which areas to reset for "{profileName}". This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Select All */}
          <div className="flex items-center space-x-3 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-semibold cursor-pointer"
            >
              Select All
            </Label>
          </div>

          {/* Individual Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="storyline"
                checked={options.storylineQuests}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    storylineQuests: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="storyline" className="text-sm cursor-pointer">
                Storyline Quests (1.0 objectives & map nodes)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="normal-tasks"
                checked={options.normalTasks}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    normalTasks: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="normal-tasks" className="text-sm cursor-pointer">
                Normal Tasks (regular quests)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="hideout"
                checked={options.hideoutItems}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    hideoutItems: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="hideout" className="text-sm cursor-pointer">
                Hideout Items
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="collector"
                checked={options.collectorItems}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    collectorItems: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="collector" className="text-sm cursor-pointer">
                Collector Items
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="achievements"
                checked={options.achievements}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    achievements: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="achievements" className="text-sm cursor-pointer">
                Achievements
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="prestiges"
                checked={options.prestiges}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    prestiges: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="prestiges" className="text-sm cursor-pointer">
                Prestiges
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="working-on"
                checked={options.workingOnItems}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    workingOnItems: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="working-on" className="text-sm cursor-pointer">
                Currently Working On
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="tracked-items"
                checked={options.trackedItems}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({
                    ...prev,
                    trackedItems: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="tracked-items" className="text-sm cursor-pointer">
                Tracked Items
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={noneSelected}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            Reset Selected
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
