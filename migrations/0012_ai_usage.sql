CREATE TABLE IF NOT EXISTS ai_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, period)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_period ON ai_usage(period);
