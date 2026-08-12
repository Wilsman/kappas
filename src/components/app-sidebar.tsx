import * as React from "react";
import {
  ListChecks,
  Package,
  Medal,
  MapPin,
  Filter,
  Database,
  ChevronRight,
  ListTodo,
  RotateCcw,
  Home,
  Map,
  Target,
  Bug,
  StickyNote,
  Scale,
  TowerControl,
  Award,
  Compass,
  Boxes,
  Trophy,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Profile } from "@/utils/profile";
import { GAME_MODE_LABELS, GAME_MODES, type GameMode } from "@/utils/gameMode";
import type { Edition } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  MoreHorizontal,
  UserPlus,
  Edit3,
  Trash2,
  FolderSync,
} from "lucide-react";
import { ExportImportDialog } from "@/components/ExportImportDialog";
import { EftLogImportDialog } from "@/components/EftLogImportDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SelectiveResetDialog,
  type ResetOptions,
} from "@/components/SelectiveResetDialog";
import type { Task } from "@/types";
import type { EftLogImportScanSummary } from "@/utils/eftLogImport";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function NavigationStatus({
  children,
  tone = "amber",
}: {
  children: React.ReactNode;
  tone?: "amber" | "green";
}) {
  return (
    <span
      className={
        tone === "green"
          ? "ml-auto rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-400/90"
          : "ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-amber-400/90"
      }
    >
      {children}
    </span>
  );
}

function NavigationSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <li
      aria-hidden="true"
      className="px-2 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40 first:pt-1 group-data-[collapsible=icon]:hidden"
    >
      {children}
    </li>
  );
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  viewMode:
    | "tree"
    | "grouped"
    | "desk"
    | "collector"
    | "tracked-items"
    | "flow"
    | "prestiges"
    | "achievements"
    | "storyline"
    | "storyline-map"
    | "hideout-requirements"
    | "current"
    | "kord-breach"
    | "lightkeeper"
    | "kappa";
  onSetViewMode: (mode: AppSidebarProps["viewMode"]) => void;
  onOpenStorylineMap: () => void;
  onSetFocus: (mode: "all" | "kappa") => void;
  focusMode: "all" | "kappa";
  traders: string[];
  hiddenTraders: Set<string>;
  onToggleTraderVisibility: (trader: string) => void;
  onClearTraderFilter: () => void;
  maps: string[];
  selectedMap: string | null;
  onSelectMap: (map: string | null) => void;
  collectorGroupBy: "collector" | "hideout-stations";
  onSetCollectorGroupBy: (mode: "collector" | "hideout-stations") => void;
  playerLevel: number;
  onSetPlayerLevel: (level: number) => void;
  profiles: Profile[];
  activeProfileId: string;
  editions: Edition[];
  activeEditionId?: string;
  activeGameMode: GameMode;
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name?: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onUpdateFaction: (id: string, faction: "USEC" | "BEAR") => void;
  onUpdateEdition: (id: string, edition: string) => void;
  onUpdateGameMode: (id: string, gameMode: GameMode) => void;
  onDeleteProfile: (id: string) => void;
  onResetProfile: (options?: ResetOptions) => void;
  onImportComplete: () => void;
  onImportAsNewProfile: (
    name: string,
    data: import("@/utils/indexedDB").ExportData,
  ) => Promise<void>;
  onImportAllProfiles: (
    data: import("@/utils/indexedDB").AllProfilesExportData,
  ) => Promise<void>;
  tasks: Task[];
  knownTasksById: Map<string, Task>;
  completedTasks: Set<string>;
  logicalTaskIdsByTaskId: Map<string, Set<string>>;
  onImportGameLogs: (
    summary: EftLogImportScanSummary,
    options?: { excludedAutoCompleteTaskIds?: string[] },
  ) => Promise<void>;
  isLoading?: boolean;
  isGameModeLoading?: boolean;
  isSwitchingMode?: boolean;
}

export function AppSidebar({
  viewMode,
  onSetViewMode,
  onOpenStorylineMap,
  onSetFocus,
  focusMode,
  traders,
  hiddenTraders,
  onToggleTraderVisibility,
  onClearTraderFilter,
  maps,
  selectedMap,
  onSelectMap,
  collectorGroupBy,
  onSetCollectorGroupBy,
  playerLevel,
  onSetPlayerLevel,
  profiles,
  activeProfileId,
  editions,
  activeEditionId,
  activeGameMode,
  onSwitchProfile,
  onCreateProfile,
  onRenameProfile,
  onUpdateFaction,
  onUpdateEdition,
  onUpdateGameMode,
  onDeleteProfile,
  onResetProfile,
  onImportComplete,
  onImportAsNewProfile,
  onImportAllProfiles,
  tasks,
  knownTasksById,
  completedTasks,
  logicalTaskIdsByTaskId,
  onImportGameLogs,
  isLoading = false,
  isGameModeLoading = false,
  isSwitchingMode = false,
  ...props
}: AppSidebarProps) {
  const [perTraderOpen, setPerTraderOpen] = React.useState(false);
  const [exportImportOpen, setExportImportOpen] = React.useState(false);
  const [eftLogImportOpen, setEftLogImportOpen] = React.useState(false);
  const [perMapOpen, setPerMapOpen] = React.useState(false);
  const [questsOpen, setQuestsOpen] = React.useState(
    viewMode === "grouped" ||
      viewMode === "tree" ||
      viewMode === "flow" ||
      viewMode === "desk",
  );
  const [hideoutOpen, setHideoutOpen] = React.useState(
    (viewMode === "collector" && collectorGroupBy === "hideout-stations") ||
      viewMode === "hideout-requirements",
  );
  const [storylineOpen, setStorylineOpen] = React.useState(
    viewMode === "storyline" || viewMode === "storyline-map",
  );
  const [nameModalOpen, setNameModalOpen] = React.useState<null | {
    mode: "create" | "rename";
  }>(null);
  const [nameInput, setNameInput] = React.useState("");
  const activeProfile = React.useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [profiles, activeProfileId],
  );
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeAllOverlays = React.useCallback(() => {
    setMenuOpen(false);
    setNameModalOpen(null);
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch {
      /* ignore blur errors */
    }
  }, []);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    const questsAreActive =
      viewMode === "grouped" ||
      viewMode === "tree" ||
      viewMode === "flow" ||
      viewMode === "desk";
    const hideoutIsActive =
      (viewMode === "collector" && collectorGroupBy === "hideout-stations") ||
      viewMode === "hideout-requirements";
    const storylineIsActive =
      viewMode === "storyline" || viewMode === "storyline-map";

    setQuestsOpen(questsAreActive);
    setHideoutOpen(hideoutIsActive);
    setStorylineOpen(storylineIsActive);
  }, [collectorGroupBy, viewMode]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex flex-col gap-3 px-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                onSetViewMode("grouped");
              }}
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="Go to EFT Tracker homepage"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent/30 text-sidebar-foreground">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
                EFT Tracker
              </span>
            </a>
            <span className="rounded-full border border-sidebar-border/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              Beta
            </span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden text-[11px] leading-relaxed text-muted-foreground">
            Report bugs on{" "}
            <a
              href="https://discord.gg/X6v7RVQAC8"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground font-medium"
            >
              Discord
            </a>
          </div>
          {/* Profile selector */}
          <div className="group-data-[collapsible=icon]:hidden rounded-lg border border-sidebar-border/60 bg-sidebar-accent/10 p-2">
            {isLoading ? (
              /* Skeleton loading state */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9" />
                </div>
                <Skeleton className="h-8 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <Select
                    value={activeProfileId}
                    onValueChange={(v) => onSwitchProfile(v)}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select character" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Character actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          setNameInput("");
                          setNameModalOpen({ mode: "create" });
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> New character
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setMenuOpen(false);
                          setNameInput(activeProfile?.name || "");
                          setNameModalOpen({ mode: "rename" });
                        }}
                        disabled={!activeProfile}
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!activeProfile}
                        onClick={() => {
                          setMenuOpen(false);
                          setExportImportOpen(true);
                        }}
                      >
                        <FolderSync className="mr-2 h-4 w-4" />
                        Import \ Export
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!activeProfile}
                        onClick={() => {
                          setMenuOpen(false);
                          setResetOpen(true);
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset progress
                      </DropdownMenuItem>
                      <button
                        className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-muted disabled:opacity-50"
                        disabled={!activeProfile}
                        onClick={() => {
                          setMenuOpen(false);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Faction Toggle & PMC Level */}
                {activeProfile && (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {(["USEC", "BEAR"] as const).map((faction) => (
                          <button
                            key={faction}
                            onClick={() =>
                              onUpdateFaction(activeProfile.id, faction)
                            }
                            className={`flex items-center justify-center px-2 py-2 text-xs font-medium rounded-md border transition-all ${
                              activeProfile.faction === faction
                                ? faction === "USEC"
                                  ? "border-blue-600/60 text-blue-500"
                                  : "border-red-600/60 text-red-500"
                                : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {faction}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {GAME_MODES.map((gameMode) => (
                        <button
                          key={gameMode}
                          type="button"
                          onClick={() =>
                            onUpdateGameMode(activeProfile.id, gameMode)
                          }
                          disabled={isGameModeLoading || isSwitchingMode}
                          aria-pressed={activeGameMode === gameMode}
                          className={`relative flex items-center justify-center px-2 py-2 text-xs font-medium rounded-md border transition-all disabled:cursor-wait disabled:opacity-70 ${
                            activeGameMode === gameMode
                              ? "border-emerald-500/60 text-emerald-400"
                              : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {GAME_MODE_LABELS[gameMode]}
                          {gameMode === "pvp-season" && !isSwitchingMode && (
                            <span className="absolute -right-1 -top-1 rounded-full border border-amber-500/40 bg-background px-1 py-0.5 text-[7px] font-bold uppercase leading-none tracking-wide text-amber-400">
                              Beta
                            </span>
                          )}
                          {isSwitchingMode && activeGameMode === gameMode && (
                            <div className="absolute -top-1 -right-1 h-3 w-3">
                              <svg
                                className="animate-spin h-3 w-3 text-amber-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {editions.length > 0 && (
                      <div className="space-y-1">
                        <Select
                          value={
                            activeEditionId ||
                            activeProfile.edition ||
                            editions[0]?.id ||
                            ""
                          }
                          onValueChange={(v) =>
                            onUpdateEdition(activeProfile.id, v)
                          }
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="Select edition" />
                          </SelectTrigger>
                          <SelectContent>
                            {editions.map((edition) => (
                              <SelectItem key={edition.id} value={edition.id}>
                                {edition.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="sidebar-player-level"
                        className="text-[11px] text-muted-foreground"
                      >
                        Level
                      </label>
                      <Input
                        id="sidebar-player-level"
                        type="number"
                        min={1}
                        value={Number.isFinite(playerLevel) ? playerLevel : ""}
                        onChange={(e) =>
                          onSetPlayerLevel(
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
                        className="h-8 w-20 text-xs"
                      />
                    </div>
                  </div>
                )}
                {/* Standalone delete confirmation outside the menu so it doesn't close instantly */}
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete character?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes local progress for "{activeProfile?.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (activeProfile) onDeleteProfile(activeProfile.id);
                          setDeleteOpen(false);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {/* Export/Import dialog */}
                <ExportImportDialog
                  open={exportImportOpen}
                  onOpenChange={setExportImportOpen}
                  profileName={activeProfile?.name || "Profile"}
                  profiles={profiles}
                  activeProfileId={activeProfileId}
                  onImportComplete={onImportComplete}
                  onImportAsNewProfile={onImportAsNewProfile}
                  onImportAllProfiles={onImportAllProfiles}
                  onOpenGameLogImport={() => setEftLogImportOpen(true)}
                />
                <EftLogImportDialog
                  open={eftLogImportOpen}
                  onOpenChange={setEftLogImportOpen}
                  profileName={activeProfile?.name || "Profile"}
                  activeGameMode={activeGameMode}
                  tasks={tasks}
                  knownTasksById={knownTasksById}
                  completedTasks={completedTasks}
                  logicalTaskIdsByTaskId={logicalTaskIdsByTaskId}
                  onApply={onImportGameLogs}
                />
                {/* Reset confirmation */}
                <SelectiveResetDialog
                  open={resetOpen}
                  onOpenChange={setResetOpen}
                  profileName={activeProfile?.name || "Profile"}
                  onConfirm={(options) => {
                    onResetProfile(options);
                    setResetOpen(false);
                  }}
                />
              </>
            )}
          </div>

          {/* Create/Rename dialog */}
          <Dialog
            open={!!nameModalOpen}
            onOpenChange={(o) => !o && setNameModalOpen(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {nameModalOpen?.mode === "create"
                    ? "New Character"
                    : "Rename Character"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {nameModalOpen?.mode === "create"
                    ? "Create a new character profile to track your progress separately."
                    : "Change the name of your current character profile."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm">Name</label>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Hardcore Wipe"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setNameModalOpen(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const trimmed = nameInput.trim();
                    if (!trimmed) return;
                    // Close overlays immediately to avoid focus trap during async work
                    closeAllOverlays();
                    if (nameModalOpen?.mode === "create")
                      onCreateProfile(trimmed);
                    else if (nameModalOpen?.mode === "rename" && activeProfile)
                      onRenameProfile(activeProfile.id, trimmed);
                  }}
                >
                  {nameModalOpen?.mode === "create" ? "Create" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {/* Navigate */}
        <SidebarGroup className="pb-1">
          <SidebarGroupLabel className="gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/55">
            <Compass className="h-3.5 w-3.5" />
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem className="mb-1 group-data-[collapsible=icon]:mb-0">
                <SidebarMenuButton
                  isActive={viewMode === "current"}
                  onClick={() => onSetViewMode("current")}
                  tooltip="Currently Working On"
                  size="lg"
                  className="h-11 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/20 px-2.5 shadow-sm transition-colors hover:border-sidebar-border hover:bg-sidebar-accent/50 data-[active=true]:border-amber-500/30 data-[active=true]:bg-amber-500/10 data-[active=true]:text-sidebar-foreground"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-background/60 text-amber-400 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:bg-transparent">
                    <Target className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-xs font-semibold">
                      Current work
                    </span>
                    <span className="truncate text-[10px] font-normal text-sidebar-foreground/45">
                      Pick up where you left off
                    </span>
                  </span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <NavigationSectionLabel>Plan</NavigationSectionLabel>

              <Collapsible
                asChild
                open={questsOpen}
                onOpenChange={setQuestsOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Quests"
                      isActive={
                        viewMode === "grouped" ||
                        viewMode === "tree" ||
                        viewMode === "flow" ||
                        viewMode === "desk"
                      }
                      onClick={() => {
                        if (!questsOpen) {
                          onSetViewMode("grouped");
                          onSetFocus("all");
                        }
                      }}
                      className="data-[active=true]:bg-sidebar-accent/70"
                    >
                      <ListChecks />
                      <span>Quests</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/menu-item:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 my-1 border-sidebar-border/60 px-2 py-0">
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={
                            viewMode === "grouped" && focusMode === "all"
                          }
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => {
                              onSetViewMode("grouped");
                              onSetFocus("all");
                            }}
                          >
                            <ListTodo />
                            <span>All tasks</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={
                            viewMode === "grouped" && focusMode === "kappa"
                          }
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => {
                              onSetViewMode("grouped");
                              onSetFocus("kappa");
                            }}
                          >
                            <Award />
                            <span>Kappa tasks</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={viewMode === "desk"}
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => onSetViewMode("desk")}
                          >
                            <ListChecks />
                            <span>Kanban board</span>
                            <NavigationStatus tone="green">New</NavigationStatus>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Item tracker"
                  isActive={viewMode === "tracked-items"}
                  onClick={() => onSetViewMode("tracked-items")}
                >
                  <Boxes />
                  <span>Item tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Collector items"
                  isActive={
                    viewMode === "collector" &&
                    collectorGroupBy === "collector"
                  }
                  onClick={() => {
                    onSetCollectorGroupBy("collector");
                    onSetViewMode("collector");
                  }}
                >
                  <Package />
                  <span>Collector items</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                asChild
                open={hideoutOpen}
                onOpenChange={setHideoutOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Hideout"
                      isActive={
                        (viewMode === "collector" &&
                          collectorGroupBy === "hideout-stations") ||
                        viewMode === "hideout-requirements"
                      }
                      onClick={() => {
                        if (!hideoutOpen) {
                          onSetCollectorGroupBy("hideout-stations");
                          onSetViewMode("collector");
                        }
                      }}
                      className="data-[active=true]:bg-sidebar-accent/70"
                    >
                      <Home />
                      <span>Hideout</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/menu-item:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 my-1 border-sidebar-border/60 px-2 py-0">
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={
                            viewMode === "collector" &&
                            collectorGroupBy === "hideout-stations"
                          }
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => {
                              onSetCollectorGroupBy("hideout-stations");
                              onSetViewMode("collector");
                            }}
                          >
                            <Database />
                            <span>Stations</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={viewMode === "hideout-requirements"}
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() =>
                              onSetViewMode("hideout-requirements")
                            }
                          >
                            <Home />
                            <span>Requirements</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <NavigationSectionLabel>Journeys</NavigationSectionLabel>

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Kappa journey"
                  isActive={viewMode === "kappa"}
                  onClick={() => onSetViewMode("kappa")}
                >
                  <Award />
                  <span>Kappa journey</span>
                  <NavigationStatus>New</NavigationStatus>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Lightkeeper access"
                  isActive={viewMode === "lightkeeper"}
                  onClick={() => onSetViewMode("lightkeeper")}
                >
                  <TowerControl />
                  <span>Lightkeeper access</span>
                  <NavigationStatus>New</NavigationStatus>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                asChild
                open={storylineOpen}
                onOpenChange={setStorylineOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="1.0 Storyline"
                      isActive={
                        viewMode === "storyline" ||
                        viewMode === "storyline-map"
                      }
                      onClick={() => {
                        if (!storylineOpen) onSetViewMode("storyline");
                      }}
                      className="data-[active=true]:bg-sidebar-accent/70"
                    >
                      <Package />
                      <span>1.0 Storyline</span>
                      <NavigationStatus>WIP</NavigationStatus>
                      <ChevronRight className="transition-transform duration-200 group-data-[state=open]/menu-item:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 my-1 border-sidebar-border/60 px-2 py-0">
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={viewMode === "storyline"}
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => onSetViewMode("storyline")}
                          >
                            <ListTodo />
                            <span>Quest objectives</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                      <li>
                        <SidebarMenuSubButton
                          asChild
                          isActive={viewMode === "storyline-map"}
                        >
                          <button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={onOpenStorylineMap}
                          >
                            <Map />
                            <span>Decision map</span>
                          </button>
                        </SidebarMenuSubButton>
                      </li>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <NavigationSectionLabel>Records</NavigationSectionLabel>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "prestiges"}
                  onClick={() => onSetViewMode("prestiges")}
                  tooltip="Prestiges"
                >
                  <Trophy />
                  <span>Prestiges</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "achievements"}
                  onClick={() => onSetViewMode("achievements")}
                  tooltip="Achievements"
                >
                  <Medal />
                  <span>Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <NavigationSectionLabel>Tools</NavigationSectionLabel>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "kord-breach"}
                  onClick={() => onSetViewMode("kord-breach")}
                  tooltip="Kord Breach planner"
                >
                  <Scale />
                  <span>Kord Breach planner</span>
                  <NavigationStatus tone="green">New</NavigationStatus>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Filters */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Filters
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Per Trader */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setPerTraderOpen((v) => !v)}>
                  <Filter />
                  <span>Traders</span>
                  <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform ${
                      perTraderOpen ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {perTraderOpen && (
                  <SidebarMenuSub>
                    <li>
                      <SidebarMenuSubButton asChild>
                        <a onClick={() => onClearTraderFilter()}>
                          <Filter />
                          <span>Show All Traders</span>
                        </a>
                      </SidebarMenuSubButton>
                    </li>
                    {traders.map((t) => {
                      const visible = !hiddenTraders.has(t);
                      return (
                        <li key={t}>
                          <SidebarMenuSubButton asChild>
                            <a onClick={() => onToggleTraderVisibility(t)}>
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  visible ? "bg-green-500" : "bg-muted"
                                }`}
                              />
                              <span>{t}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </li>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* Per Map */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setPerMapOpen((v) => !v)}>
                  <MapPin />
                  <span>Maps</span>
                  <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform ${
                      perMapOpen ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
                {perMapOpen && (
                  <SidebarMenuSub>
                    <li>
                      <SidebarMenuSubButton asChild>
                        <a onClick={() => onSelectMap(null)}>
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              selectedMap === null ? "bg-green-500" : "bg-muted"
                            }`}
                          />
                          <span>All Maps</span>
                        </a>
                      </SidebarMenuSubButton>
                    </li>
                    {maps.map((m) => (
                      <li key={m}>
                        <SidebarMenuSubButton asChild>
                          <a
                            onClick={() => {
                              onSelectMap(m);
                              onSetViewMode("grouped");
                            }}
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                selectedMap === m ? "bg-green-500" : "bg-muted"
                              }`}
                            />
                            <span>{m}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </li>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Notes Quick Access */}
        <div className="px-3 py-2 border-t border-sidebar-border/30 group-data-[collapsible=icon]:hidden">
          <button
            onClick={() => {
              // Open notes modal/sheet
              window.dispatchEvent(new CustomEvent("taskTracker:openNotes"));
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs rounded-md bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Open notes"
          >
            <StickyNote className="h-3.5 w-3.5" />
            <span>My Notes</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Ctrl+Shift+U
            </span>
          </button>
        </div>
        {/* Debug Export - Support Section */}
        <div className="px-3 py-2 border-t border-sidebar-border/30 group-data-[collapsible=icon]:hidden">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && "debugTracker" in window) {
                (
                  window as Window & { debugTracker: () => Promise<void> }
                ).debugTracker();
              }
            }}
            className="flex w-full items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded-md bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            title="Export debug info to help diagnose issues"
          >
            <Bug className="h-3 w-3" />
            <span>Export Debug Data</span>
          </button>
          <p className="mt-1.5 text-[9px] text-center text-muted-foreground/60">
            Having issues? Export debug info and share with support
          </p>
        </div>
        {/* Discord Button */}
        <div className="flex items-center justify-center pt-1 pb-2 group-data-[collapsible=icon]:hidden">
          <a
            href="https://discord.com/invite/3dFmr5qaJK"
            rel="nofollow noreferrer"
            target="_blank"
            className="flex items-center"
          >
            <img
              src="https://img.shields.io/discord/1298971881776611470?color=7289DA&label=Discord&logo=discord&logoColor=white"
              alt="Discord"
              className="h-5"
            />
          </a>
        </div>
        <div className="px-2 py-2 text-[11px] text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
          Data from{" "}
          <a
            href="https://tarkov.dev"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            tarkov.dev
          </a>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
