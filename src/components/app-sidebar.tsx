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
  traders: string[]
  hiddenTraders: Set<string>
  onSelectTraderOnly: (trader: string) => void
  onClearTraderFilter: () => void
  maps: string[]
  onSelectMap: (map: string | null) => void
  groupBy: 'trader' | 'map'
  onSetGroupBy: (mode: 'trader' | 'map') => void
  collectorGroupBy: 'collector' | 'hideout-stations'
  onSetCollectorGroupBy: (mode: 'collector' | 'hideout-stations') => void
}

export function AppSidebar({
  viewMode,
  onSetViewMode,
  traders,
  hiddenTraders,
  onSelectTraderOnly,
  onClearTraderFilter,
  maps,
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
              <SidebarMenuSub>
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
                  <SidebarMenuSubButton asChild isActive={groupBy === 'trader'}>
                    <a className="pl-6" onClick={() => { onSetGroupBy('trader'); onSetViewMode('grouped'); }}>
                      <UserCheck />
                      <span>By Trader</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
                <li>
                  <SidebarMenuSubButton asChild isActive={groupBy === 'map'}>
                    <a className="pl-6" onClick={() => { onSetGroupBy('map'); onSetViewMode('grouped'); }}>
                      <MapPin />
                      <span>By Map</span>
                    </a>
                  </SidebarMenuSubButton>
                </li>
              </SidebarMenuSub>

              <SidebarMenuItem>
                <SidebarMenuButton isActive={viewMode === "collector"} onClick={() => onSetViewMode("collector")}>
                  <Package />
                  <span>Items</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <li>
                    <SidebarMenuSubButton asChild isActive={collectorGroupBy === 'collector'}>
                      <a onClick={() => { onSetCollectorGroupBy('collector'); onSetViewMode('collector'); }}>
                        <Package />
                        <span>Collector Items</span>
                      </a>
                    </SidebarMenuSubButton>
                  </li>
                  <li>
                    <SidebarMenuSubButton asChild isActive={collectorGroupBy === 'hideout-stations'}>
                      <a onClick={() => { onSetCollectorGroupBy('hideout-stations'); onSetViewMode('collector'); }}>
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
                  <span>Per Trader</span>
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
                          <a onClick={() => onSelectTraderOnly(t)}>
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
                  <span>Per Map</span>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${perMapOpen ? 'rotate-90' : ''}`} />
                </SidebarMenuButton>
                {perMapOpen && (
                <SidebarMenuSub>
                  <li>
                    <SidebarMenuSubButton asChild>
                      <a onClick={() => onSelectMap(null)}>
                        <Filter />
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
                          <MapPin />
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
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
