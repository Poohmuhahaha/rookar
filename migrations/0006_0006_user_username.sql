-- Migration number: 0006 	 2026-11-22T07:30:00.000Z
ALTER TABLE users ADD COLUMN username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
