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
import {
  SelectiveResetDialog,
  type ResetOptions,
} from "@/components/SelectiveResetDialog";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  viewMode:
    | "tree"
    | "grouped"
    | "collector"
    | "flow"
    | "prestiges"
    | "achievements"
    | "storyline"
    | "storyline-map"
    | "hideout-requirements"
    | "current";
  onSetViewMode: (mode: AppSidebarProps["viewMode"]) => void;
  onSetFocus: (mode: "all" | "kappa" | "lightkeeper") => void;
  focusMode: "all" | "kappa" | "lightkeeper";
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
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name?: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onUpdateFaction: (id: string, faction: "USEC" | "BEAR") => void;
  onUpdateEdition: (id: string, edition: string) => void;
  onDeleteProfile: (id: string) => void;
  onResetProfile: (options?: ResetOptions) => void;
  onImportComplete: () => void;
  onImportAsNewProfile: (
    name: string,
    data: import("@/utils/indexedDB").ExportData
  ) => Promise<void>;
  onImportAllProfiles: (
    data: import("@/utils/indexedDB").AllProfilesExportData
  ) => Promise<void>;
}

export function AppSidebar({
  viewMode,
  onSetViewMode,
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
  onSwitchProfile,
  onCreateProfile,
  onRenameProfile,
  onUpdateFaction,
  onUpdateEdition,
  onDeleteProfile,
  onResetProfile,
  onImportComplete,
  onImportAsNewProfile,
  onImportAllProfiles,
  ...props
}: AppSidebarProps) {
  const [perTraderOpen, setPerTraderOpen] = React.useState(false);
  const [exportImportOpen, setExportImportOpen] = React.useState(false);
  const [perMapOpen, setPerMapOpen] = React.useState(false);
  const [nameModalOpen, setNameModalOpen] = React.useState<null | {
    mode: "create" | "rename";
  }>(null);
  const [nameInput, setNameInput] = React.useState("");
  const activeProfile = React.useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [profiles, activeProfileId]
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex flex-col gap-3 px-2 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent/30 text-sidebar-foreground">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
                EFT Tracker
              </span>
            </div>
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
                    Export / Import
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
                        Math.max(1, Number(e.target.value) || 1)
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Currently Working On */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "current"}
                  onClick={() => onSetViewMode("current")}
                >
                  <Target />
                  <span>Currently Working On</span>
                  <span className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
                    NEW
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 1.0 Storyline */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    viewMode === "storyline" || viewMode === "storyline-map"
                  }
                  onClick={() => onSetViewMode("storyline")}
                >
                  <Package />
                  <span>1.0 Storyline</span>
                  <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-400">
                    WIP
                  </span>
                </SidebarMenuButton>
                <SidebarMenuSub className="mt-1">
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={viewMode === "storyline"}
                    >
                      <a
                        className="cursor-pointer"
                        onClick={() => onSetViewMode("storyline")}
                      >
                        <ListTodo />
                        <span>Quest Objectives</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={viewMode === "storyline-map"}
                    >
                      <a
                        className="cursor-pointer"
                        onClick={() => {
                          // Navigate to the Choose Your Ending view specifically
                          if (typeof window !== "undefined") {
                            window.history.pushState(
                              null,
                              "",
                              "/Storyline/Choose-Ending"
                            );
                            window.dispatchEvent(new PopStateEvent("popstate"));
                          }
                        }}
                      >
                        <Map />
                        <span>Decision Map</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {/* Regular Quests */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={
                    viewMode === "grouped" ||
                    viewMode === "tree" ||
                    viewMode === "flow"
                  }
                  onClick={() => onSetViewMode("grouped")}
                >
                  <ListChecks />
                  <span>Quests</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuSub className="mt-1">
                {/* Checklist view */}
                <li>
                  <SidebarMenuSubButton
                    asChild
                    isActive={viewMode === "grouped" && focusMode === "all"}
                  >
                    <a
                      className="cursor-pointer"
                      onClick={() => {
                        onSetViewMode("grouped");
                        onSetFocus("all");
                      }}
                    >
                      <ListTodo />
                      <span>All Tasks</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                {/* Kappa focus (Checklist + Kappa filter) */}
                <li>
                  <SidebarMenuSubButton
                    asChild
                    isActive={viewMode === "grouped" && focusMode === "kappa"}
                  >
                    <a
                      className="cursor-pointer"
                      onClick={() => {
                        onSetViewMode("grouped");
                        onSetFocus("kappa");
                      }}
                    >
                      <ListTodo />
                      <span>Kappa</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                {/* Lightkeeper focus (Checklist + Lightkeeper filter) */}
                <li>
                  <SidebarMenuSubButton
                    asChild
                    isActive={
                      viewMode === "grouped" && focusMode === "lightkeeper"
                    }
                  >
                    <a
                      className="cursor-pointer"
                      onClick={() => {
                        onSetViewMode("grouped");
                        onSetFocus("lightkeeper");
                      }}
                    >
                      <ListTodo />
                      <span>Lightkeeper</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                {/* Grouping controls moved into CheckListView header */}
              </SidebarMenuSub>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "collector"}
                  onClick={() => onSetViewMode("collector")}
                >
                  <Package />
                  <span>Items</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="mt-1">
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={
                        viewMode === "collector" &&
                        collectorGroupBy === "collector"
                      }
                    >
                      <a
                        className="cursor-pointer"
                        onClick={() => {
                          onSetCollectorGroupBy("collector");
                          onSetViewMode("collector");
                        }}
                      >
                        <Package />
                        <span>Collector Items</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={
                        viewMode === "collector" &&
                        collectorGroupBy === "hideout-stations"
                      }
                    >
                      <a
                        className="cursor-pointer"
                        onClick={() => {
                          onSetCollectorGroupBy("hideout-stations");
                          onSetViewMode("collector");
                        }}
                      >
                        <Database />
                        <span>Hideout Stations</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={viewMode === "hideout-requirements"}
                    >
                      <a
                        className="cursor-pointer"
                        onClick={() => onSetViewMode("hideout-requirements")}
                      >
                        <Home />
                        <span>Hideout Requirements</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "prestiges"}
                  onClick={() => onSetViewMode("prestiges")}
                >
                  <Medal />
                  <span>Prestiges</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === "achievements"}
                  onClick={() => onSetViewMode("achievements")}
                >
                  <Medal />
                  <span>Achievements</span>
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
        {/* Discord Button */}
        <div className="flex items-center justify-center group-data-[collapsible=icon]:hidden">
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
