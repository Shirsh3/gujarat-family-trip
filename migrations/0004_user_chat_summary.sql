-- Per-account AI memory. The messages table is already keyed by username.
CREATE TABLE IF NOT EXISTS trip_chat_user_summary (
  username TEXT PRIMARY KEY,
  summary TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_user_created
  ON trip_chat_messages(username, id DESC);
