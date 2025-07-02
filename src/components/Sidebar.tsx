import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { PanelLeft, PanelRight } from "lucide-react";

interface SidebarProps {
  position: 'left' | 'right';
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  width?: string;
  collapsedWidth?: string;
}

export function Sidebar({
  position = 'left',
  header,
  children,
  className,
  defaultCollapsed = false,
  collapsible = true,
  width = '16rem',
  collapsedWidth = '3rem',
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  const CollapseButton = position === 'left' ? PanelLeft : PanelRight;

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-card border-r border-border transition-all duration-200 overflow-hidden',
        position === 'right' && 'border-l border-r-0',
        className
      )}
      style={{
        width: collapsed ? collapsedWidth : width,
        minWidth: collapsed ? collapsedWidth : width,
      }}

    >
      {header && (
        <div className="p-4 border-b flex items-center justify-between">
          {!collapsed && <div className="font-semibold">{header}</div>}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseButton className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2">
        {children}
      </div>
      
      {collapsible && !header && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseButton className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}

interface SidebarGroupProps {
  children: ReactNode;
  className?: string;
}

export function SidebarGroup({ children, className }: SidebarGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1 py-1", className)}>
      {children}
    </div>
  );
}

interface SidebarItemProps {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SidebarItem({ 
  children, 
  isActive = false, 
  className,
  onClick 
}: SidebarItemProps) {
  return (
    <div
      className={cn(
        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground" 
          : "hover:bg-accent/50 hover:text-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
