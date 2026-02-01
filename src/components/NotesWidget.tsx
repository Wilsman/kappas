import { useEffect, useMemo, useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  // Listen for open notes event from sidebar
  useEffect(() => {
    const handleOpenNotes = () => {
      setIsOpen(true);
    };
    window.addEventListener(
      "taskTracker:openNotes",
      handleOpenNotes as EventListener
    );
    return () => {
      window.removeEventListener(
        "taskTracker:openNotes",
        handleOpenNotes as EventListener
      );
    };
  }, []);

  // Keyboard shortcut Ctrl+Shift+U to open notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "U") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[450px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            My Notes
            <span className="ml-auto text-[10px] font-normal text-muted-foreground">
              {isSaving ? "Saving…" : "Saved"}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 p-4 flex flex-col">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Write your notes here..."
            className="flex-1 resize-none text-sm min-h-[300px]"
            spellCheck={false}
            autoFocus
          />
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{chars} characters</span>
            <span>Auto-saved per profile</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
