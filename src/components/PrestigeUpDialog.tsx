import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import type { Prestige } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  EMPTY_RESET_OPTIONS,
  RESET_OPTION_LABELS,
  type ResetOptions,
} from "@/utils/resetOptions";
import { cn } from "@/lib/utils";

/** Preselected areas when wiping for a new run. Achievements persist in game. */
const NEW_RUN_RESET_OPTIONS: ResetOptions = {
  ...EMPTY_RESET_OPTIONS,
  storylineQuests: true,
  normalTasks: true,
  hideoutItems: true,
  collectorItems: true,
  prestiges: true,
  workingOnItems: true,
  trackedItems: true,
};

interface PrestigeUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestiges: Prestige[];
  currentLevel: number;
  profileName: string;
  modeLabel: string;
  onConfirm: (level: number, options: ResetOptions) => void;
}

export function PrestigeUpDialog({
  open,
  onOpenChange,
  prestiges,
  currentLevel,
  profileName,
  modeLabel,
  onConfirm,
}: PrestigeUpDialogProps) {
  const reduceMotion = useReducedMotion();
  const sorted = [...prestiges].sort(
    (a, b) => a.prestigeLevel - b.prestigeLevel,
  );
  const maxLevel = sorted[sorted.length - 1]?.prestigeLevel ?? 0;
  const defaultTarget = Math.min(currentLevel + 1, maxLevel);

  const [target, setTarget] = useState(defaultTarget);
  const [wipe, setWipe] = useState(false);
  const [options, setOptions] = useState<ResetOptions>(NEW_RUN_RESET_OPTIONS);

  // Start fresh each time the dialog opens. Wiping is opt-in.
  useEffect(() => {
    if (!open) return;
    setTarget(defaultTarget);
    setWipe(false);
    setOptions(NEW_RUN_RESET_OPTIONS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const targetPrestige = sorted.find((p) => p.prestigeLevel === target);
  const targetName = targetPrestige?.name ?? "Not prestiged";
  const unchanged = target === currentLevel;
  const anyWipe = wipe && Object.values(options).some(Boolean);

  const confirm = () => {
    onConfirm(target, anyWipe ? options : EMPTY_RESET_OPTIONS);
    onOpenChange(false);
  };

  const levels = [0, ...sorted.map((p) => p.prestigeLevel)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-none border-amber-500/30 p-0">
        {/* Target prestige showcase */}
        <div className="relative flex flex-col items-center gap-2 overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.16),transparent_70%)] px-6 pb-5 pt-7">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={target}
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 6 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex size-20 items-center justify-center"
            >
              {targetPrestige?.iconLink ? (
                <img
                  src={targetPrestige.iconLink}
                  alt=""
                  className="size-20 object-contain drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]"
                />
              ) : (
                <Sparkles className="size-10 text-muted-foreground" />
              )}
            </motion.div>
          </AnimatePresence>
          <DialogHeader className="items-center space-y-1 text-center sm:text-center">
            <DialogTitle className="font-mono text-base font-bold uppercase tracking-[0.14em]">
              {targetName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pick the prestige your {modeLabel} character is on in game.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div
            role="radiogroup"
            aria-label="Your prestige in game"
            className="grid grid-cols-4 gap-1.5 sm:grid-cols-7"
          >
            {levels.map((level) => {
              const prestige = sorted.find((p) => p.prestigeLevel === level);
              const active = level === target;
              const isCurrent = level === currentLevel;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTarget(level)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 border px-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400",
                    active
                      ? "border-amber-400/80 bg-amber-500/15 text-amber-300"
                      : "border-border text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground",
                  )}
                >
                  {prestige?.iconLink ? (
                    <img
                      src={prestige.iconLink}
                      alt=""
                      className={cn(
                        "size-6 object-contain transition",
                        !active && "opacity-60 grayscale",
                      )}
                    />
                  ) : (
                    <span className="flex size-6 items-center justify-center text-[11px]">
                      –
                    </span>
                  )}
                  {level === 0 ? "None" : `P${level}`}
                  {isCurrent && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-background px-1 text-[8px] tracking-widest text-emerald-400">
                      NOW
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border border-border">
            <div className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <Label
                  htmlFor="prestige-wipe"
                  className="cursor-pointer text-sm font-semibold"
                >
                  Start a fresh run
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {wipe
                    ? `Wipes the ticked areas on "${profileName}". This cannot be undone.`
                    : "Off: only your prestige changes. Turn on if you just prestiged and want to wipe progress."}
                </p>
              </div>
              <Switch
                id="prestige-wipe"
                checked={wipe}
                onCheckedChange={setWipe}
              />
            </div>
            <AnimatePresence initial={false}>
              {wipe && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-2.5 border-t border-border px-4 py-3 sm:grid-cols-2">
                    {RESET_OPTION_LABELS.map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`prestige-wipe-${key}`}
                          checked={options[key]}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              [key]: checked === true,
                            }))
                          }
                        />
                        <Label
                          htmlFor={`prestige-wipe-${key}`}
                          className="cursor-pointer text-xs"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            className="rounded-none"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={unchanged && !anyWipe}
            className={cn(
              "rounded-none font-mono text-xs font-bold uppercase tracking-wider",
              anyWipe
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-amber-500 text-black hover:bg-amber-400",
            )}
          >
            <Check className="size-4" />
            {unchanged && !anyWipe
              ? "Already set"
              : anyWipe
                ? `Wipe & set ${target === 0 ? "None" : `P${target}`}`
                : `Set ${target === 0 ? "None" : `P${target}`}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
