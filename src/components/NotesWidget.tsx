import { useEffect, useMemo, useRef, useState } from "react";
import { StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getActiveProfileId, withProfileKey } from "@/utils/profile";
import { taskStorage } from "@/utils/indexedDB";

const BASE_STORAGE_KEY = "taskTracker_notes";

export function NotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Load once on mount (with migration from localStorage)
  useEffect(() => {
    const load = async () => {
      try {
        const id = getActiveProfileId();

        // Try loading from IndexedDB first
        const prefs = await taskStorage.loadUserPreferences();
        if (prefs.notes !== undefined) {
          setValue(prefs.notes);
          setIsLoaded(true);
          return;
        }

        // Fallback: migrate from localStorage if exists
        const raw = localStorage.getItem(withProfileKey(BASE_STORAGE_KEY, id));
        if (raw) {
          setValue(raw);
          // Migrate to IndexedDB
          await taskStorage.saveUserPreferences({ notes: raw });
          // Clean up localStorage
          localStorage.removeItem(withProfileKey(BASE_STORAGE_KEY, id));
        }
        setIsLoaded(true);
      } catch {
        setIsLoaded(true);
      }
    };
    load();
    const onProfile = () => {
      setIsLoaded(false);
      load();
    };
    window.addEventListener("taskTracker:profileChanged", onProfile);
    return () =>
      window.removeEventListener("taskTracker:profileChanged", onProfile);
  }, []);

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load completes
    if (!isOpen) return; // only show saving state when panel is open

    setIsSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await taskStorage.saveUserPreferences({ notes: value });
      } catch {
        // ignore
      } finally {
        setIsSaving(false);
      }
    }, 300);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [value, isOpen, isLoaded]);

  const chars = useMemo(() => value.trim().length, [value]);

  return (
    <TooltipProvider delayDuration={250}>
      {/* Floating trigger */}
      <div className="fixed z-50 bottom-12 left-4 flex flex-col items-end gap-2">
        {/* Panel */}
        {isOpen && (
          <div
            className={cn(
              "w-[320px] sm:w-[360px] h-[260px] rounded-xl border bg-card text-card-foreground shadow-xl",
              "backdrop-blur supports-[backdrop-filter]:bg-card/90 animate-in fade-in-0 zoom-in-95"
            )}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {isSaving ? "Saving…" : "Saved"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {chars} chars
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notes"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 h-[calc(100%-42px)]">
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Write quick notes…"
                className="h-full resize-none text-sm"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Trigger Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Hide notes" : "Show notes"}
            >
              <StickyNote className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" align="center" className="text-xs">
            Notes (saved locally)
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
