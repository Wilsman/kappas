import * as React from "react"
import {
  ListChecks,
  Package,
  Medal,
  MapPin,
  Filter,
  Database,
  ChevronRight,
  UserCheck,
  ListTodo,
} from "lucide-react"

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  viewMode: "tree" | "grouped" | "collector" | "flow" | "prestiges" | "achievements"
  onSetViewMode: (mode: AppSidebarProps["viewMode"]) => void
  focusMode: 'all' | 'kappa' | 'lightkeeper'
  onSetFocus: (mode: 'all' | 'kappa' | 'lightkeeper') => void
  traders: string[]
  hiddenTraders: Set<string>
  onToggleTraderVisibility: (trader: string) => void
  onClearTraderFilter: () => void
  maps: string[]
  selectedMap: string | null
  onSelectMap: (map: string | null) => void
  groupBy: 'trader' | 'map'
  onSetGroupBy: (mode: 'trader' | 'map') => void
  collectorGroupBy: 'collector' | 'hideout-stations'
  onSetCollectorGroupBy: (mode: 'collector' | 'hideout-stations') => void
}

export function AppSidebar({
  viewMode,
  onSetViewMode,
  focusMode,
  onSetFocus,
  traders,
  hiddenTraders,
  onToggleTraderVisibility,
  onClearTraderFilter,
  maps,
  selectedMap,
  onSelectMap,
  groupBy,
  onSetGroupBy,
  collectorGroupBy,
  onSetCollectorGroupBy,
  ...props
}: AppSidebarProps) {
  const [perTraderOpen, setPerTraderOpen] = React.useState(false)
  const [perMapOpen, setPerMapOpen] = React.useState(false)
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">EFT Tracker</span>
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
                  isActive={viewMode === "grouped" || viewMode === "tree" || viewMode === "flow"}
                  onClick={() => onSetViewMode("grouped")}
                >
                  <ListChecks />
                  <span>Quests</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuSub className="relative pl-4">
                {/* Submenu guide line */}
                <div aria-hidden className="pointer-events-none absolute left-2 top-2 bottom-2 border-l border-border/30" />
                {/* Checklist view */}
                <li>
                  <SidebarMenuSubButton
                    asChild
                    isActive={viewMode === "grouped"}
                  >
                    <a onClick={() => onSetViewMode("grouped")}>
                      <ListTodo />
                      <span>Checklist View</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                {/* Grouping options under Checklist */}
                <li>
                  <SidebarMenuSubButton asChild isActive={viewMode === 'grouped' && groupBy === 'trader'}>
                    <a className={`pl-6 ${viewMode === 'grouped' && groupBy === 'trader' ? 'border-l-2 border-emerald-500' : ''}`} onClick={() => { onSetGroupBy('trader'); onSetViewMode('grouped'); }}>
                      <UserCheck />
                      <span>By Trader</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                <li>
                  <SidebarMenuSubButton asChild isActive={viewMode === 'grouped' && groupBy === 'map'}>
                    <a className={`pl-6 ${viewMode === 'grouped' && groupBy === 'map' ? 'border-l-2 border-emerald-500' : ''}`} onClick={() => { onSetGroupBy('map'); onSetViewMode('grouped'); }}>
                      <MapPin />
                      <span>By Map</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                {/* Focused pages */}
                <li>
                  <SidebarMenuSubButton asChild isActive={viewMode === 'grouped' && focusMode === 'kappa'}>
                    <a className={`pl-6 ${viewMode === 'grouped' && focusMode === 'kappa' ? 'border-l-2 border-emerald-500' : ''}`} onClick={() => { onSetFocus('kappa'); onSetViewMode('grouped'); }}>
                      <ListTodo />
                      <span>Kappa</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                <li>
                  <SidebarMenuSubButton asChild isActive={viewMode === 'grouped' && focusMode === 'lightkeeper'}>
                    <a className={`pl-6 ${viewMode === 'grouped' && focusMode === 'lightkeeper' ? 'border-l-2 border-emerald-500' : ''}`} onClick={() => { onSetFocus('lightkeeper'); onSetViewMode('grouped'); }}>
                      <ListTodo />
                      <span>Light Keeper</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
              </SidebarMenuSub>

              <SidebarMenuItem>
                <SidebarMenuButton isActive={viewMode === "collector"} onClick={() => onSetViewMode("collector")}>
                  <Package />
                  <span>Items</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="relative pl-4">
                  {/* Submenu guide line */}
                  <div aria-hidden className="pointer-events-none absolute left-2 top-2 bottom-2 border-l border-border/30" />
                  <li>
                    <SidebarMenuSubButton asChild isActive={viewMode === 'collector' && collectorGroupBy === 'collector'}>
                      <a className={`${viewMode === 'collector' && collectorGroupBy === 'collector' ? 'border-l-2 border-emerald-500 pl-6' : 'pl-6'}`} onClick={() => { onSetCollectorGroupBy('collector'); onSetViewMode('collector'); }}>
                        <Package />
                        <span>Collector Items</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  <li>
                    <SidebarMenuSubButton asChild isActive={viewMode === 'collector' && collectorGroupBy === 'hideout-stations'}>
                      <a className={`${viewMode === 'collector' && collectorGroupBy === 'hideout-stations' ? 'border-l-2 border-emerald-500 pl-6' : 'pl-6'}`} onClick={() => { onSetCollectorGroupBy('hideout-stations'); onSetViewMode('collector'); }}>
                        <Database />
                        <span>Hideout Stations</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={viewMode === "prestiges"} onClick={() => onSetViewMode("prestiges")}>
                  <Medal />
                  <span>Prestiges</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={viewMode === "achievements"} onClick={() => onSetViewMode("achievements")}>
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
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${perTraderOpen ? 'rotate-90' : ''}`} />
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
                    const visible = !hiddenTraders.has(t)
                    return (
                      <li key={t}>
                        <SidebarMenuSubButton asChild>
                          <a onClick={() => onToggleTraderVisibility(t)}>
                            <span className={`inline-block h-2 w-2 rounded-full ${visible ? "bg-green-500" : "bg-muted"}`} />
                            <span>{t}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </li>
                    )
                  })}
                </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* Per Map */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setPerMapOpen((v) => !v)}>
                  <MapPin />
                  <span>Maps</span>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${perMapOpen ? 'rotate-90' : ''}`} />
                </SidebarMenuButton>
                {perMapOpen && (
                <SidebarMenuSub>
                  <li>
                    <SidebarMenuSubButton asChild>
                      <a onClick={() => onSelectMap(null)}>
                        <span className={`inline-block h-2 w-2 rounded-full ${selectedMap === null ? "bg-green-500" : "bg-muted"}`} />
                        <span>All Maps</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  {maps.map((m) => (
                    <li key={m}>
                      <SidebarMenuSubButton asChild>
                        <a onClick={() => {
                          onSelectMap(m)
                          onSetViewMode("grouped")
                        }}>
                          <span className={`inline-block h-2 w-2 rounded-full ${selectedMap === m ? "bg-green-500" : "bg-muted"}`} />
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
                <SidebarMenuButton onClick={() => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank")}> {/* just a link to https://www.youtube.com/watch?v=dQw4w9WgXcQ */}
                  <Package />
                  <span>1.0 Storyline Quests</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-[14px] text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
          Data from
          {' '}
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
  )
}
