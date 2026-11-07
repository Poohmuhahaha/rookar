import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from './env'

const databasePath = env.databaseUrl
if (databasePath !== ':memory:') {
  mkdirSync(dirname(databasePath), { recursive: true })
}

export const db = new Database(databasePath, { create: true })

if (databasePath !== ':memory:') {
  db.exec('PRAGMA journal_mode = WAL;')
}
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'Free',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS businesses (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    type_label TEXT NOT NULL,
    employees TEXT NOT NULL,
    revenue_range TEXT NOT NULL,
    goals_json TEXT NOT NULL DEFAULT '[]',
    skipped INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    type_label TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    quality TEXT NOT NULL DEFAULT 'complete',
    period TEXT NOT NULL,
    file_name TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    industry_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sources_user ON data_sources(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS data_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    occurred_on TEXT,
    amount REAL,
    label TEXT,
    payload_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rows_source ON data_rows(source_id, row_index);
  CREATE INDEX IF NOT EXISTS idx_rows_date ON data_rows(occurred_on);

  CREATE TABLE IF NOT EXISTS import_previews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    columns_json TEXT NOT NULL,
    rows_json TEXT NOT NULL,
    errors_json TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    valid_rows INTEGER NOT NULL,
    duplicate_rows INTEGER NOT NULL,
    error_rows INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS user_agents (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

  CREATE TABLE IF NOT EXISTS macro_cache (
    cache_key TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    saved_at INTEGER NOT NULL
  );
`)

export type DbUser = {
  id: string
  name: string
  email: string
  password_hash: string
  role: 'owner' | 'manager' | 'staff' | 'admin'
  avatar_url: string | null
  plan: 'Free' | 'Pro' | 'Enterprise'
  onboarding_complete: number
  created_at: string
}
