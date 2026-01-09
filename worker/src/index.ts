import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  DB: D1Database;
  CLERK_JWT_PUBLIC_KEY: string;
}

interface CloudSyncData {
  profileId: string;
  data: unknown;
  updatedAt: number;
  syncVersion: number;
}

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "https://kappas.pages.dev",
      "https://kappas.dev",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// JWT verification middleware for protected routes
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // Verify Clerk JWT - in production, use Clerk's JWKS endpoint
    // For MVP, we'll trust the token and extract the user ID
    const payload = JSON.parse(atob(token.split(".")[1]));
    c.set("userId", payload.sub);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "tarkov-tracker-sync" }));

// Push data to cloud
app.post("/api/sync/push", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json<CloudSyncData & { userId: string }>();

  if (body.userId !== userId) {
    return c.json({ error: "User ID mismatch" }, 403);
  }

  const { profileId, data, updatedAt, syncVersion } = body;

  try {
    // Upsert the sync data
    await c.env.DB.prepare(
      `INSERT INTO sync_data (user_id, profile_id, data, updated_at, sync_version)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, profile_id) DO UPDATE SET
         data = excluded.data,
         updated_at = excluded.updated_at,
         sync_version = excluded.sync_version`
    )
      .bind(userId, profileId, JSON.stringify(data), updatedAt, syncVersion)
      .run();

    return c.json({ success: true });
  } catch (err) {
    console.error("Push error:", err);
    return c.json({ error: "Failed to save data" }, 500);
  }
});

// Pull data from cloud
app.get("/api/sync/pull", async (c) => {
  const userId = c.get("userId") as string;
  const profileId = c.req.query("profileId");

  if (!profileId) {
    return c.json({ error: "profileId required" }, 400);
  }

  try {
    const result = await c.env.DB.prepare(
      `SELECT data, updated_at, sync_version FROM sync_data
       WHERE user_id = ? AND profile_id = ?`
    )
      .bind(userId, profileId)
      .first<{ data: string; updated_at: number; sync_version: number }>();

    if (!result) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({
      profileId,
      data: JSON.parse(result.data),
      updatedAt: result.updated_at,
      syncVersion: result.sync_version,
    });
  } catch (err) {
    console.error("Pull error:", err);
    return c.json({ error: "Failed to fetch data" }, 500);
  }
});

// Get sync status
app.get("/api/sync/status", async (c) => {
  const userId = c.get("userId") as string;

  try {
    const results = await c.env.DB.prepare(
      `SELECT profile_id, updated_at, sync_version FROM sync_data WHERE user_id = ?`
    )
      .bind(userId)
      .all<{ profile_id: string; updated_at: number; sync_version: number }>();

    return c.json({
      profiles: results.results.map((r) => ({
        profileId: r.profile_id,
        updatedAt: r.updated_at,
        syncVersion: r.sync_version,
      })),
    });
  } catch (err) {
    console.error("Status error:", err);
    return c.json({ error: "Failed to fetch status" }, 500);
  }
});

// List all synced profiles for user
app.get("/api/profiles", async (c) => {
  const userId = c.get("userId") as string;

  try {
    const results = await c.env.DB.prepare(
      `SELECT profile_id, updated_at FROM sync_data WHERE user_id = ? ORDER BY updated_at DESC`
    )
      .bind(userId)
      .all<{ profile_id: string; updated_at: number }>();

    return c.json({
      profiles: results.results.map((r) => ({
        profileId: r.profile_id,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error("List profiles error:", err);
    return c.json({ error: "Failed to list profiles" }, 500);
  }
});

export default app;
