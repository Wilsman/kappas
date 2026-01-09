import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  className?: string;
}

export function SyncStatus({
  isAuthenticated,
  isSyncing,
  lastSyncedAt,
  syncError,
  className,
}: SyncStatusProps) {
  if (!isAuthenticated) {
    return null;
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Not synced";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : syncError ? (
        <>
          <CloudOff className="h-3 w-3 text-destructive" />
          <span
            className="text-destructive truncate max-w-[120px]"
            title={syncError}
          >
            Sync failed
          </span>
        </>
      ) : (
        <>
          <Cloud className="h-3 w-3 text-green-500" />
          <span>{formatLastSync(lastSyncedAt)}</span>
        </>
      )}
    </div>
  );
}
