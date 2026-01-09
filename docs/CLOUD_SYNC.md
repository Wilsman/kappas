# Cloud Sync Feature

This document describes the authentication and cloud synchronization feature added to the Tarkov Task Tracker.

## Overview

Users can now sign in with their preferred authentication provider (Google, GitHub, etc.) via **Clerk** and sync their progress to the cloud using **Cloudflare D1** as the database backend.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Cloudflare      │────▶│  Cloudflare D1  │
│   (Frontend)    │     │  Worker API      │     │  (Database)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│     Clerk       │
│ (Authentication)│
└─────────────────┘
```

## Files Added/Modified

### New Files

| File | Description |
|------|-------------|
| `src/services/cloudSync.ts` | Cloud sync service with push/pull/auto sync logic |
| `src/contexts/AuthContext.tsx` | React context for auth state and sync triggers |
| `src/components/auth/UserButton.tsx` | User avatar dropdown with sync action |
| `src/components/auth/SyncStatus.tsx` | Displays last sync timestamp |
| `src/components/auth/index.ts` | Barrel export for auth components |
| `worker/src/index.ts` | Cloudflare Worker API (Hono framework) |
| `worker/wrangler.toml` | Worker configuration with D1 binding |
| `worker/package.json` | Worker dependencies |
| `worker/migrations/001_init.sql` | D1 database schema |

### Modified Files

| File | Changes |
|------|---------|
| `src/main.tsx` | Wrapped app with `ClerkProvider` |
| `src/App.tsx` | Added sync state, `handleSync` callback, passed props to sidebar |
| `src/components/app-sidebar.tsx` | Added `UserButton` in footer, sync props |
| `.env.example` | Added Clerk and sync API environment variables |

## How It Works

### Authentication Flow

1. User clicks "Sign in to sync" in the sidebar footer
2. Clerk handles OAuth flow (Google, GitHub, etc.)
3. On success, `useAuth()` hook provides `userId` and `isSignedIn`
4. JWT token is obtained via `Clerk.session.getToken()`

### Sync Flow

1. User clicks "Sync now" in the user dropdown menu
2. `handleSync()` in `App.tsx` is triggered
3. `syncProfile()` from `cloudSync.ts` executes:
   - **Pull**: Fetches cloud data for the current profile
   - **Import**: If cloud data exists, imports it to IndexedDB
   - **Push**: Exports current IndexedDB data and pushes to cloud
4. UI updates with last sync timestamp

### Data Structure

The sync payload uses the existing `ExportData` interface from `indexedDB.ts`:

```typescript
interface ExportData {
  version: number;
  exportedAt: string;
  profileName?: string;
  completedTasks: string[];
  completedCollectorItems: string[];
  completedHideoutItems: string[];
  completedAchievements: string[];
  completedStorylineObjectives: string[];
  completedStorylineMapNodes: string[];
  taskObjectiveItemProgress?: Record<string, number>;
  prestigeProgress: Record<string, unknown>;
  userPreferences: Partial<UserPreferences>;
  workingOnItems?: { ... };
}
```

## Worker API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/sync/push` | Push profile data to cloud |
| `GET` | `/api/sync/pull` | Pull profile data from cloud |
| `GET` | `/api/sync/status` | Get sync status for all profiles |
| `GET` | `/api/profiles` | List all synced profiles |

All `/api/*` endpoints require `Authorization: Bearer <jwt>` header.

## Database Schema

```sql
CREATE TABLE sync_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_version INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, profile_id)
);

CREATE INDEX idx_sync_user ON sync_data(user_id);
CREATE INDEX idx_sync_user_profile ON sync_data(user_id, profile_id);
```

## Environment Variables

### Frontend (`.env.local`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_SYNC_API_URL=https://tarkov-tracker-sync.cultistcircle.workers.dev
```

### Worker (Cloudflare Dashboard or `wrangler secret`)

```bash
CLERK_JWT_PUBLIC_KEY=<your-clerk-jwt-public-key>
```

## Deployment

### Worker

```bash
cd worker
npm install
wrangler d1 execute tarkov-tracker-sync --file=./migrations/001_init.sql --remote
wrangler deploy src/index.ts
```

### Frontend

No changes needed - Clerk is initialized automatically when `VITE_CLERK_PUBLISHABLE_KEY` is set.

## Usage

1. **Sign In**: Click "Sign in to sync" in the sidebar footer
2. **Sync**: After signing in, click your avatar → "Sync now"
3. **Status**: Last sync time shown in user dropdown
4. **Sign Out**: Click avatar → "Sign out"

## Security Notes

- JWT tokens are validated by the Worker before any database operations
- User ID from JWT must match the `userId` in request body
- CORS is configured to allow only specific origins
- No sensitive data is stored in the frontend

## Future Improvements

- [ ] Automatic sync on data changes (debounced)
- [ ] Conflict resolution UI for merge conflicts
- [ ] Sync status indicator in sidebar
- [ ] Multi-device real-time sync via WebSockets
- [ ] Proper Clerk JWT verification using JWKS endpoint
