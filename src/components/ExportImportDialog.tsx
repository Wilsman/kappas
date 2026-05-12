import { useState, useRef, useCallback } from "react";
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AutoBackupService,
  ExportImportService,
  type ExportData,
  type AllProfilesExportData,
} from "@/utils/indexedDB";
import {
  type Profile,
  getUniqueProfileName,
  profileNameExists,
} from "@/utils/profile";
import { cn } from "@/lib/utils";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profiles: Profile[];
  activeProfileId: string;
  onImportComplete: () => void;
  onImportAsNewProfile: (name: string, data: ExportData) => Promise<void>;
  onImportAllProfiles: (data: AllProfilesExportData) => Promise<void>;
}

type DialogMode =
  | "menu"
  | "export"
  | "export-all"
  | "import"
  | "import-confirm"
  | "import-choose-target"
  | "import-all-confirm";

interface ImportPreview {
  data: ExportData;
  file: File;
}

interface AllProfilesImportPreview {
  data: AllProfilesExportData;
  file: File;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  profileName,
  profiles,
  activeProfileId,
  onImportComplete,
  onImportAsNewProfile,
  onImportAllProfiles,
}: ExportImportDialogProps) {
  const [mode, setMode] = useState<DialogMode>("menu");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null
  );
  const [allProfilesImportPreview, setAllProfilesImportPreview] =
    useState<AllProfilesImportPreview | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setMode("menu");
    setIsProcessing(false);
    setError(null);
    setSuccess(null);
    setImportPreview(null);
    setAllProfilesImportPreview(null);
    setNewProfileName("");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await ExportImportService.exportAllData(profileName);
      ExportImportService.downloadExport(data);
      setSuccess("Export downloaded successfully!");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsProcessing(false);
    }
  }, [profileName, handleClose]);

  const handleExportAllProfiles = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const data = await ExportImportService.exportAllProfiles(
        profiles,
        activeProfileId
      );
      ExportImportService.downloadAllProfilesExport(data);
      setSuccess(`Exported ${profiles.length} profile(s) successfully!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsProcessing(false);
    }
  }, [profiles, activeProfileId, handleClose]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setError(null);
      try {
        const data = await ExportImportService.readImportFile(file);

        // Check if it's an all-profiles export
        if (ExportImportService.isAllProfilesExport(data)) {
          setAllProfilesImportPreview({ data, file });
          setMode("import-all-confirm");
        } else {
          setImportPreview({ data, file });
          // Suggest a unique name based on the original profile name
          const baseName =
            data.profileName || file.name.replace(/\.json$/i, "");
          const suggestedName = getUniqueProfileName(baseName);
          setNewProfileName(suggestedName);
          setMode("import-choose-target");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      } finally {
        setIsProcessing(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    []
  );

  const handleImportToCurrentProfile = useCallback(async () => {
    if (!importPreview) return;

    setIsProcessing(true);
    setError(null);
    try {
      await AutoBackupService.createBackup(
        profiles,
        activeProfileId,
        "before-import-current-profile",
        { force: true },
      );
      await ExportImportService.importAllData(importPreview.data);
      setSuccess("Import completed successfully!");
      // Trigger app refresh
      onImportComplete();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsProcessing(false);
    }
  }, [activeProfileId, importPreview, onImportComplete, handleClose, profiles]);

  const handleImportToNewProfile = useCallback(async () => {
    if (!importPreview || !newProfileName.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      await onImportAsNewProfile(newProfileName.trim(), importPreview.data);
      setSuccess(
        `Created new profile "${newProfileName.trim()}" with imported data!`
      );
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsProcessing(false);
    }
  }, [importPreview, newProfileName, onImportAsNewProfile, handleClose]);

  const handleImportAllProfiles = useCallback(async () => {
    if (!allProfilesImportPreview) return;

    setIsProcessing(true);
    setError(null);
    try {
      await onImportAllProfiles(allProfilesImportPreview.data);
      setSuccess(
        `Imported ${allProfilesImportPreview.data.profiles.length} profile(s) successfully!`
      );
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsProcessing(false);
    }
  }, [allProfilesImportPreview, onImportAllProfiles, handleClose]);

  const handleDownloadAutoBackup = useCallback((backupId: string) => {
    const data = AutoBackupService.readBackup(backupId);
    if (!data) {
      setError("Automatic backup could not be read");
      return;
    }
    ExportImportService.downloadAllProfilesExport(
      data,
      `eft-tracker-auto-backup-${backupId}.json`,
    );
    setSuccess("Automatic backup downloaded successfully!");
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getDataSummary = (data: ExportData) => {
    return [
      { label: "Tasks", count: data.completedTasks?.length || 0 },
      {
        label: "Collector Items",
        count: data.completedCollectorItems?.length || 0,
      },
      {
        label: "Hideout Items",
        count: data.completedHideoutItems?.length || 0,
      },
      { label: "Achievements", count: data.completedAchievements?.length || 0 },
      {
        label: "Storyline Objectives",
        count: data.completedStorylineObjectives?.length || 0,
      },
      {
        label: "Storyline Map Nodes",
        count: data.completedStorylineMapNodes?.length || 0,
      },
      {
        label: "Prestige Entries",
        count: Object.keys(data.prestigeProgress || {}).length,
      },
    ];
  };

  const autoBackups = AutoBackupService.listBackups();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {mode === "menu" && (
          <>
            <DialogHeader>
              <DialogTitle>Export / Import Progress</DialogTitle>
              <DialogDescription>
                Backup your progress or restore from a previous backup.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start gap-4"
                onClick={() => setMode("export")}
              >
                <Download className="h-5 w-5 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Export Current Profile</div>
                  <div className="text-xs text-muted-foreground">
                    Download "{profileName}" as a JSON file
                  </div>
                </div>
              </Button>
              {profiles.length > 1 && (
                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start gap-4"
                  onClick={() => setMode("export-all")}
                >
                  <Users className="h-5 w-5 text-violet-500" />
                  <div className="text-left">
                    <div className="font-medium">Export All Profiles</div>
                    <div className="text-xs text-muted-foreground">
                      Download all {profiles.length} profiles in one file
                    </div>
                  </div>
                </Button>
              )}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-auto py-4 justify-start gap-4"
                onClick={() => setMode("import")}
              >
                <Upload className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Import Progress</div>
                  <div className="text-xs text-muted-foreground">
                    Restore from a backup file (single or all profiles)
                  </div>
                </div>
              </Button>
              {autoBackups.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">Automatic safety backups</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Latest: {formatDate(autoBackups[0].createdAt)} (
                    {autoBackups[0].reason})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={() => handleDownloadAutoBackup(autoBackups[0].id)}
                  >
                    Download Latest Auto Backup
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {mode === "export" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Progress
              </DialogTitle>
              <DialogDescription>
                Export all progress for "{profileName}" to a JSON file.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium mb-2">What will be exported:</div>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Completed tasks</li>
                  <li>• Collector items progress</li>
                  <li>• Hideout items progress</li>
                  <li>• Achievements</li>
                  <li>• Storyline objectives & map nodes</li>
                  <li>• Prestige progress</li>
                  <li>• Notes & preferences</li>
                </ul>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setMode("menu")}>
                Back
              </Button>
              <Button onClick={handleExport} disabled={isProcessing}>
                {isProcessing ? "Exporting..." : "Download Export"}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "export-all" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Export All Profiles
              </DialogTitle>
              <DialogDescription>
                Export all {profiles.length} profiles to a single JSON file.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium mb-2">Profiles to export:</div>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  {profiles.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          p.id === activeProfileId
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/50"
                        )}
                      />
                      {p.name}
                      {p.id === activeProfileId && (
                        <span className="text-emerald-500">(active)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setMode("menu")}>
                Back
              </Button>
              <Button onClick={handleExportAllProfiles} disabled={isProcessing}>
                {isProcessing ? "Exporting..." : "Download All Profiles"}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "import" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Progress
              </DialogTitle>
              <DialogDescription>
                Select a backup file to restore progress for "{profileName}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                <FileJson className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <div className="text-sm text-muted-foreground mb-3">
                  Select a JSON export file
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Reading..." : "Choose File"}
                </Button>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <strong>Warning:</strong> Importing will replace all current
                progress for this character.
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMode("menu")}>
                Back
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "import-choose-target" && importPreview && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Import Destination
              </DialogTitle>
              <DialogDescription>
                Choose where to import the data.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {/* File info summary */}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {importPreview.file.name}
                  </span>
                </div>
                {importPreview.data.profileName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">
                      {importPreview.data.profileName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exported:</span>
                  <span className="font-medium">
                    {formatDate(importPreview.data.exportedAt)}
                  </span>
                </div>
              </div>

              {/* Import options */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 justify-start gap-3"
                  onClick={() => setMode("import-confirm")}
                >
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  <div className="text-left">
                    <div className="font-medium">Replace "{profileName}"</div>
                    <div className="text-xs text-muted-foreground">
                      Overwrite current profile's progress
                    </div>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium">Create New Profile</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-profile-name"
                      className="text-xs text-muted-foreground"
                    >
                      Profile Name
                    </Label>
                    <Input
                      id="new-profile-name"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name"
                      className={cn(
                        "h-9",
                        profileNameExists(newProfileName.trim()) &&
                          "border-amber-500 focus-visible:ring-amber-500"
                      )}
                    />
                    {profileNameExists(newProfileName.trim()) && (
                      <p className="text-xs text-amber-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />A profile with this
                        name already exists
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleImportToNewProfile}
                    disabled={isProcessing || !newProfileName.trim()}
                  >
                    {isProcessing ? "Creating..." : "Create & Import"}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setImportPreview(null);
                  setMode("import");
                }}
                disabled={isProcessing}
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "import-confirm" && importPreview && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Confirm Replace
              </DialogTitle>
              <DialogDescription>
                Review the data before replacing "{profileName}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium mb-2">Data Summary:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {getDataSummary(importPreview.data).map(
                    ({ label, count }) => (
                      <div
                        key={label}
                        className={cn(
                          "flex justify-between",
                          count > 0
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <span>{label}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                This will <strong>replace all current progress</strong> for "
                {profileName}". This cannot be undone.
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setMode("import-choose-target")}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleImportToCurrentProfile}
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? "Importing..." : "Replace & Import"}
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "import-all-confirm" && allProfilesImportPreview && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Import All Profiles
              </DialogTitle>
              <DialogDescription>
                Review the profiles before importing.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {allProfilesImportPreview.file.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exported:</span>
                  <span className="font-medium">
                    {formatDate(allProfilesImportPreview.data.exportedAt)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="font-medium mb-2">
                  Profiles to import (
                  {allProfilesImportPreview.data.profiles.length}):
                </div>
                <ul className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                  {allProfilesImportPreview.data.profiles.map((p) => {
                    const uniqueName = getUniqueProfileName(p.name);
                    const willRename = uniqueName !== p.name;
                    return (
                      <li key={p.id} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            p.id ===
                              allProfilesImportPreview.data.activeProfileId
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/50"
                          )}
                        />
                        <span className="text-foreground">
                          {willRename ? (
                            <>
                              <span className="line-through text-muted-foreground">
                                {p.name}
                              </span>
                              <span className="mx-1">→</span>
                              <span className="text-amber-500 font-medium">
                                {uniqueName}
                              </span>
                            </>
                          ) : (
                            p.name
                          )}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          ({p.data.completedTasks?.length || 0} tasks)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400">
                Profiles will be created with unique names. Existing profiles
                will not be modified.
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setAllProfilesImportPreview(null);
                  setMode("import");
                }}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button onClick={handleImportAllProfiles} disabled={isProcessing}>
                {isProcessing ? "Importing..." : "Import All Profiles"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
