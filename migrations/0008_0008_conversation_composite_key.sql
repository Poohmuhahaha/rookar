-- Scope conversation IDs to their owner instead of a global primary key.
CREATE TABLE conversations_new (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);

INSERT OR IGNORE INTO conversations_new (id, user_id, data_json, updated_at)
SELECT id, user_id, data_json, updated_at FROM conversations;

DROP TABLE conversations;
ALTER TABLE conversations_new RENAME TO conversations;
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
