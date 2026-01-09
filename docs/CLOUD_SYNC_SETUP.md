# Cloud Sync Setup Guide

This guide explains how to set up authentication and cloud sync for the EFT Tracker.

## Prerequisites

- [Clerk](https://clerk.com) account (free tier works)
- [Cloudflare](https://cloudflare.com) account (free tier works)
- Node.js 18+ and Wrangler CLI

## 1. Clerk Setup

1. Create a new application at [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable the authentication providers you want (Google, Discord, GitHub, etc.)
3. Copy your **Publishable Key** from the API Keys section
4. Add it to your `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

## 2. Cloudflare Worker Setup

### Create the D1 Database

```bash
cd worker
npm install
wrangler d1 create tarkov-tracker-sync
```

Copy the database ID from the output and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tarkov-tracker-sync"
database_id = "your-database-id-here"
```

### Run Database Migrations

```bash
wrangler d1 execute tarkov-tracker-sync --file=./migrations/001_init.sql
```

### Deploy the Worker

```bash
npm run deploy
```

Note the worker URL (e.g., `https://tarkov-tracker-sync.your-subdomain.workers.dev`)

### Update Frontend Environment

Add the worker URL to your `.env.local`:

```env
VITE_SYNC_API_URL=https://tarkov-tracker-sync.your-subdomain.workers.dev
```

## 3. Local Development

### Run the Worker Locally

```bash
cd worker
npm run dev
```

This starts the worker at `http://localhost:8787`

### Run the Frontend

```bash
cd ..
npm run dev
```

## How Sync Works

1. **Sign In**: Users sign in via Clerk (Google, Discord, etc.)
2. **Auto Sync**: When signed in, clicking "Sync now" in the user menu:
   - Pulls any existing cloud data
   - Merges with local data (cloud wins on conflict)
   - Pushes the merged data back to cloud
3. **Data Stored**: All progress data is stored in Cloudflare D1 (SQLite)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/push` | POST | Upload local data to cloud |
| `/api/sync/pull` | GET | Download cloud data |
| `/api/sync/status` | GET | Get sync status for all profiles |
| `/api/profiles` | GET | List all synced profiles |

## Security

- All API endpoints require a valid Clerk JWT token
- User data is isolated by Clerk user ID
- CORS is configured to only allow your domains

## Troubleshooting

### "Sync API URL not configured"

Add `VITE_SYNC_API_URL` to your `.env.local`

### "Not authenticated"

Make sure you're signed in via Clerk

### "Failed to save data"

Check the worker logs: `wrangler tail`
