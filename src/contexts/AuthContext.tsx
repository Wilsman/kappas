import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

interface SyncState {
  lastSyncedAt: number | null;
  isSyncing: boolean;
  syncError: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userImageUrl: string | null;
  syncState: SyncState;
  triggerSync: () => Promise<void>;
  setSyncState: React.Dispatch<React.SetStateAction<SyncState>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onSyncTrigger?: () => Promise<void>;
}

export function AuthProvider({ children, onSyncTrigger }: AuthProviderProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncedAt: null,
    isSyncing: false,
    syncError: null,
  });

  const triggerSync = useCallback(async () => {
    if (onSyncTrigger) {
      await onSyncTrigger();
    }
  }, [onSyncTrigger]);

  // Load last sync time from localStorage
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`sync_lastSyncedAt_${userId}`);
      if (stored) {
        setSyncState((prev) => ({
          ...prev,
          lastSyncedAt: parseInt(stored, 10),
        }));
      }
    }
  }, [userId]);

  const value: AuthContextValue = {
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    userId: userId ?? null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    userName: user?.fullName ?? user?.username ?? null,
    userImageUrl: user?.imageUrl ?? null,
    syncState,
    triggerSync,
    setSyncState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
