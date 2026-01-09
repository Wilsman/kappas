-- Create sync_data table for storing user progress
CREATE TABLE IF NOT EXISTS sync_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_version INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, profile_id)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_sync_data_user_id ON sync_data(user_id);

-- Index for user + profile lookups
CREATE INDEX IF NOT EXISTS idx_sync_data_user_profile ON sync_data(user_id, profile_id);
