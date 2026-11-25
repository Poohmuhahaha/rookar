CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

CREATE TABLE IF NOT EXISTS import_preview_rows (
  preview_id TEXT NOT NULL REFERENCES import_previews(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (preview_id, row_index)
);
CREATE INDEX IF NOT EXISTS idx_import_previews_expires ON import_previews(expires_at);
