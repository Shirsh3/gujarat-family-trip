CREATE TABLE IF NOT EXISTS trip_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL DEFAULT 'family',
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL,
  sources_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_created
  ON trip_chat_messages(id DESC);
CREATE TABLE IF NOT EXISTS trip_chat_summary (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  summary TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO trip_chat_summary (id, summary) VALUES (1, '');