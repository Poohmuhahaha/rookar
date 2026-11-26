ALTER TABLE users ADD COLUMN avatar_media_id TEXT;

CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('avatar','chat_image','attachment','plan_image')),
  object_key TEXT NOT NULL UNIQUE,
  thumb_key TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','deleted')),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_media_user_created ON media_files(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_status_created ON media_files(status, created_at);
CREATE INDEX IF NOT EXISTS idx_media_sha ON media_files(user_id, sha256);

CREATE TABLE IF NOT EXISTS media_links (
  media_id TEXT NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('avatar','message','plan','scenario')),
  owner_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (media_id, owner_type, user_id, owner_id)
);
CREATE INDEX IF NOT EXISTS idx_media_links_owner ON media_links(user_id, owner_type, owner_id);
