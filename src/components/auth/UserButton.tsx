import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, Cloud, CloudOff } from "lucide-react";

interface UserButtonProps {
  onSyncClick?: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: number | null;
  syncError?: string | null;
}

export function UserButton({
  onSyncClick,
  isSyncing,
  lastSyncedAt,
  syncError,
}: UserButtonProps) {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign in to sync
        </Button>
      </SignInButton>
    );
  }

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.username?.slice(0, 2).toUpperCase() ||
    "U";

  const formatLastSync = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Never synced";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm truncate max-w-[100px]">
            {user?.fullName || user?.username}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">
            {user?.fullName || user?.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSyncClick}
          disabled={isSyncing}
          className="gap-2"
        >
          {syncError ? (
            <CloudOff className="h-4 w-4 text-destructive" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          <div className="flex flex-col">
            <span>{isSyncing ? "Syncing..." : "Sync now"}</span>
            <span className="text-xs text-muted-foreground">
              {syncError || formatLastSync(lastSyncedAt)}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton>
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
