import * as React from "react"
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
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Profile } from "@/utils/profile"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, UserPlus, Edit3, Trash2 } from "lucide-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  viewMode:
    | "tree"
    | "grouped"
    | "collector"
    | "flow"
    | "prestiges"
    | "achievements"
    | "storyline"
    | "hideout-requirements";
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
  profiles: Profile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name?: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onDeleteProfile: (id: string) => void;
  onResetProfile: () => void;
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
  profiles,
  activeProfileId,
  onSwitchProfile,
  onCreateProfile,
  onRenameProfile,
  onDeleteProfile,
  onResetProfile,
  ...props
}: AppSidebarProps) {
  const [perTraderOpen, setPerTraderOpen] = React.useState(false);
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
        <div className="flex flex-col gap-2 px-2 py-1">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
              EFT Tracker
            </span>
          </div>
          {/* Beta notice */}
          <div className="group-data-[collapsible=icon]:hidden p-2 rounded-md bg-orange-600/10 border border-orange-600/20">
            <div className="font-semibold text-orange-600 mb-1 text-xs">
              ⚠️ BETA
            </div>
            <div className="text-[10px] leading-relaxed text-muted-foreground">
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
          </div>
          {/* Profile selector */}
          <div className="group-data-[collapsible=icon]:hidden">
            <label className="block text-[11px] text-muted-foreground mb-1">
              Character
            </label>
            <div className="flex items-center gap-2">
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
                    variant="outline"
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
              {/* Reset confirmation */}
              <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This resets all completed tasks, items, achievements and
                      prestige for "{activeProfile?.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onResetProfile();
                        setResetOpen(false);
                      }}
                    >
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                  <Button
                    variant="ghost"
                    onClick={() => setNameModalOpen(null)}
                  >
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
                      else if (
                        nameModalOpen?.mode === "rename" &&
                        activeProfile
                      )
                        onRenameProfile(activeProfile.id, trimmed);
                    }}
                  >
                    {nameModalOpen?.mode === "create" ? "Create" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Navigate */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
              <SidebarMenuSub className="relative pl-4">
                {/* Submenu guide line */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-2 top-2 bottom-2 border-l border-border/30"
                />
                {/* Checklist view */}
                <li>
                  <SidebarMenuSubButton
                    asChild
                    isActive={viewMode === "grouped" && focusMode === "all"}
                  >
                    <a
                      className={`${
                        viewMode === "grouped" && focusMode === "all"
                          ? "border-l-2 border-emerald-500 pl-6"
                          : "pl-6"
                      } cursor-pointer`}
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
                      className={`${
                        viewMode === "grouped" && focusMode === "kappa"
                          ? "border-l-2 border-emerald-500 pl-6"
                          : "pl-6"
                      } cursor-pointer`}
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
                      className={`${
                        viewMode === "grouped" && focusMode === "lightkeeper"
                          ? "border-l-2 border-emerald-500 pl-6"
                          : "pl-6"
                      } cursor-pointer`}
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
                <SidebarMenuSub className="relative pl-4">
                  {/* Submenu guide line */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-2 top-2 bottom-2 border-l border-border/30"
                  />
                  <li>
                    <SidebarMenuSubButton
                      asChild
                      isActive={
                        viewMode === "collector" &&
                        collectorGroupBy === "collector"
                      }
                    >
                      <a
                        className={`${
                          viewMode === "collector" &&
                          collectorGroupBy === "collector"
                            ? "border-l-2 border-emerald-500 pl-6"
                            : "pl-6"
                        } cursor-pointer`}
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
                        className={`${
                          viewMode === "collector" &&
                          collectorGroupBy === "hideout-stations"
                            ? "border-l-2 border-emerald-500 pl-6"
                            : "pl-6"
                        } cursor-pointer`}
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
                        className={`${
                          viewMode === "hideout-requirements"
                            ? "border-l-2 border-emerald-500 pl-6"
                            : "pl-6"
                        } cursor-pointer`}
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
          <SidebarGroupLabel>Filters</SidebarGroupLabel>
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

        {/* Collections & Stations */}
        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSetViewMode("storyline")}
                  isActive={viewMode === "storyline"}
                >
                  <Package />
                  <span>1.0 Storyline Quests</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
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
